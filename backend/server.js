const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mammoth = require("mammoth");
const { Packer } = require("docx");
const pdf = require("pdf-parse");
const { ABNTFormatter } = require("./abnt-formatter");
const { ArticleValidator } = require("./article-validator");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

// Inicialização do App
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const formatter = new ABNTFormatter();
const validator = new ArticleValidator();

// --- FUNÇÃO AUXILIAR GEMINI ---
async function summarizeWithGemini(text) {
  const model = genAI.getGenerativeModel({
    model: "gemini-3.1-flash-lite-preview",
  });
  const prompt = `Você é um analista acadêmico. Analise o texto e retorne APENAS um JSON:
  {
    "resumo": {
      "objetivos": "...",
      "metodologia": "...",
      "resultados": "...",
      "conclusao": "..."
    },
    "citacoes": ["citação 1", "citação 2"]
  }
  Texto: ${text.slice(0, 40000)}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const jsonStr = response
    .text()
    .replace(/```json|```/g, "")
    .trim();
  return JSON.parse(jsonStr);
}

// ============================================
// ROTAS DE VALIDAÇÃO (RESTAURADAS)
// ============================================

app.post("/api/validate/doi", async (req, res) => {
  try {
    const { doi } = req.body;
    if (!doi) return res.status(400).json({ error: "DOI é obrigatório" });
    const result = await validator.validateByDOI(doi);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/validate/title", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Título é obrigatório" });
    const result = await validator.validateByTitle(title);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post(
  "/api/validate/document",
  upload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: "Nenhum arquivo" });
      const data = await pdf(req.file.buffer);
      const text = data.text;
      const doiRegex = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
      const uniqueDois = [...new Set(text.match(doiRegex) || [])];

      const results = await Promise.all(
        uniqueDois.slice(0, 10).map(async (doi) => {
          try {
            return await validator.validateByDOI(doi);
          } catch {
            return { doi, valid: false };
          }
        }),
      );

      res.json({ totalDois: uniqueDois.length, results });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// ============================================
// ROTA DE RESUMO COM GEMINI (ATUALIZADA)
// ============================================

app.post("/api/summarize", upload.single("article"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Arquivo ausente" });

    let text = "";
    if (req.file.originalname.toLowerCase().endsWith(".pdf")) {
      const data = await pdf(req.file.buffer);
      text = data.text;
    } else {
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      text = result.value;
    }

    if (process.env.GEMINI_API_KEY) {
      const geminiResult = await summarizeWithGemini(text);
      return res.json({
        success: true,
        fileName: req.file.originalname,
        ...geminiResult,
      });
    }

    res.status(500).json({ error: "API Key não configurada" });
  } catch (error) {
    res.status(500).json({ error: "Erro no resumo: " + error.message });
  }
});

// ============================================
// ROTA DE FORMATAÇÃO E ESTATÍSTICOS
// ============================================

app.post("/api/format", upload.single("document"), async (req, res) => {
  try {
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const doc = formatter.format(result.value);
    const buffer = await Packer.toBuffer(doc);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="ABNT_${req.file.originalname}"`,
    );
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ROTA DO ASSISTENTE VIRTUAL (CHAT IA)
// ============================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Mensagem vazia" });

    // Usa o modelo Flash Lite que você já definiu no summarize
    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    // Configuração de "personalidade" do Chat
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [
            {
              text: "Você é o Doc Searcher AI, um assistente amigável especializado em normas ABNT e pesquisa acadêmica. Ajude os alunos com dúvidas sobre citações, DOIs e estrutura de trabalhos.",
            },
          ],
        },
        {
          role: "model",
          parts: [
            {
              text: "Olá! Sou o Doc Searcher AI. Estou pronto para ajudar você com sua jornada acadêmica! 📚",
            },
          ],
        },
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;

    return res.json({
      success: true,
      response: response.text(),
    });
  } catch (error) {
    console.error("Erro no chat:", error);
    // Resposta de fallback caso a IA falhe
    res.json({
      success: true,
      response:
        "No momento estou estudando novos artigos e tive um pequeno erro de conexão. Mas posso te ajudar com dúvidas gerais de ABNT! O que você precisa?",
    });
  }
});

// Servir Frontend
const frontendPath = path.join(__dirname, "../frontend/public");
app.use(express.static(frontendPath));
app.get("*", (req, res) => res.sendFile(path.join(frontendPath, "index.html")));

app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
