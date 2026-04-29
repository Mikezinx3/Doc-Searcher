const express = require('express');
const cors = require('cors');
const multer = require('multer');
const mammoth = require('mammoth');
const { Packer } = require('docx');
const pdfParse = require('pdf-parse');
const { ABNTFormatter } = require('./abnt-formatter');
const { ArticleValidator } = require('./article-validator');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do multer para upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Aceita .docx e .pdf
    if (file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.originalname.toLowerCase().endsWith('.docx') ||
        file.mimetype === 'application/pdf' ||
        file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos .docx e .pdf são permitidos'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

const formatter = new ABNTFormatter();
const validator = new ArticleValidator();

// ============================================
// API ROUTES - Must come BEFORE static files
// ============================================

// Rota de upload e formatação
app.post('/api/format', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Extrai o conteúdo do .docx
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const rawText = result.value;

    // Formata em ABNT
    const doc = formatter.format(rawText);
    const buffer = await Packer.toBuffer(doc);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ABNT_${req.file.originalname}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Erro na formatação:', error);
    res.status(500).json({ error: 'Erro ao formatar documento: ' + error.message });
  }
});

// Rota de validação por DOI
app.post('/api/validate/doi', async (req, res) => {
  try {
    const { doi } = req.body;

    if (!doi) {
      return res.status(400).json({ error: 'DOI é obrigatório' });
    }

    const result = await validator.validateByDOI(doi);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro na validação: ' + error.message });
  }
});

// Rota de validação por título
app.post('/api/validate/title', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Título é obrigatório' });
    }

    const result = await validator.validateByTitle(title);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Erro na validação: ' + error.message });
  }
});

// Rota de validação de documento PDF
app.post('/api/validate/document', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    // Verifica se é PDF
    if (!req.file.originalname.toLowerCase().endsWith('.pdf')) {
      return res.status(400).json({ error: 'Apenas arquivos PDF são permitidos nesta rota' });
    }

    // Extrai texto do PDF
    const data = await pdfParse(req.file.buffer);
    const text = data.text;

    console.log('Texto extraído do PDF:', text.substring(0, 200));

    // Extrai DOIs do texto
    const doiRegex = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/gi;
    const doisFound = text.match(doiRegex) || [];
    const uniqueDois = [...new Set(doisFound)];

    console.log('DOIs encontrados:', uniqueDois);

    // Valida cada DOI encontrado
    const results = [];
    let validArticles = 0;

    for (const doi of uniqueDois.slice(0, 10)) { // Limite de 10 DOIs
      try {
        const validation = await validator.validateByDOI(doi);
        if (validation.valid) {
          validArticles++;
        }
        results.push({
          doi,
          valid: validation.valid,
          title: validation.title,
          error: validation.error
        });
      } catch (err) {
        results.push({
          doi,
          valid: false,
          error: err.message
        });
      }
    }

    res.json({
      totalDois: uniqueDois.length,
      doisFound: uniqueDois.length,
      validArticles,
      results
    });
  } catch (error) {
    console.error('Erro na validação do PDF:', error);
    res.status(500).json({ error: 'Erro na validação: ' + error.message });
  }
});

// Rota para extrair referências do documento
app.post('/api/extract-references', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;

    // Extrai possíveis referências (linhas que parecem citações)
    const lines = text.split('\n');
    const references = lines.filter(line => {
      // Padrões comuns de referências ABNT
      return (
        (line.includes('.') && line.includes(',')) ||
        (line.match(/\d{4}/) && line.length > 20) ||
        (line.includes('Disponível em:') || line.includes('Acesso em:'))
      );
    }).slice(0, 50); // Limite de 50 referências

    res.json({
      totalReferences: references.length,
      references: references
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro na extração: ' + error.message });
  }
});

// ============================================
// STATIC FILES - Must come AFTER API routes
// ============================================

const frontendPath = path.join(__dirname, '../frontend/public');
app.use(express.static(frontendPath));

// Serve o frontend para todas as outras rotas
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
