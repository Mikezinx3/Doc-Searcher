# Doc Searcher / ABNT Formatter

Formate documentos acadêmicos nas normas da ABNT e valide artigos científicos automaticamente.

## Funcionalidades

- 📄 **Formatação ABNT automática** - Margens, fontes, espaçamentos e citações
- 🔍 **Validação de artigos** - Verifique se um artigo existe via DOI ou título
- 📚 **Validação de referências** - Extraia e valide DOIs de documentos
- 🎨 **Interface moderna** - Drag-and-drop, download imediato
- 🤖 **Assistente virtual com IA** - Chatbot para tirar dúvidas no canto inferior direito

## Instalação

### Pré-requisitos

- Node.js 18+ 

### Passos

```bash
# Instale as dependências do backend
cd backend
npm install

# (Opcional) Configure a API do Anthropic para o assistente virtual
# Copie o arquivo .env.example para .env e adicione sua chave
cp ../.env.example .env
# Edite .env e adicione: ANTHROPIC_API_KEY=sk-ant-...

# Inicie o servidor
npm start
```

O servidor iniciará em `http://localhost:3000`

### Assistente Virtual com IA

Para usar o assistente virtual com IA (Claude), você precisa de uma API key da Anthropic:
1. Acesse https://console.anthropic.com/
2. Crie uma conta e gere uma API key
3. Adicione no arquivo `.env` na pasta `backend/`

**Sem a API key**, o assistente ainda funcionará com respostas básicas pré-definidas sobre ABNT.

## APIs Utilizadas

- **Semantic Scholar API** - Validação de artigos científicos
- **Crossref API** - Busca de DOI e metadados

## Estrutura do Projeto

```
Doc-Searcher/
├── backend/
│   ├── server.js           # Servidor Express
│   ├── abnt-formatter.js   # Formatação ABNT
│   ├── article-validator.js # Validação de artigos
│   └── package.json
└── frontend/
    └── public/
        ├── index.html      # Página principal
        ├── styles/
        │   └── main.css    # Estilos
        └── scripts/
            └── main.js     # JavaScript do frontend
```

## Uso

### Formatador ABNT
1. Arraste um arquivo .docx
2. Clique em "Formatar em ABNT"
3. Baixe o documento formatado

### Validador de Artigos
- **Por DOI**: Cole o DOI (ex: `10.1000/xyz123`)
- **Por Título**: Digite o título do artigo
- **Por Documento**: Upload de PDF para extrair e validar referências

### Assistente Virtual
- Clique no botão de chat no canto inferior direito
- Digite sua dúvida sobre ABNT ou o site
- Receba respostas instantâneas

## Normas ABNT Implementadas

- NBR 14724 - Estrutura de trabalhos acadêmicos
- NBR 6023 - Referências bibliográficas
- NBR 10520 - Citações

## License

MIT
