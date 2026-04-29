# ABNT Formatter

Formate documentos acadêmicos nas normas da ABNT e valide artigos científicos automaticamente.

## Funcionalidades

- 📄 **Formatação ABNT automática** - Margens, fontes, espaçamentos e citações
- 🔍 **Validação de artigos** - Verifique se um artigo existe via DOI ou título
- 📚 **Validação de referências** - Extraia e valide DOIs de documentos
- 🎨 **Interface moderna** - Drag-and-drop, download imediato

## Instalação

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Passos

```bash
# Instale as dependências do backend
cd backend
npm install

# Inicie o servidor
npm start
```

O servidor iniciará em `http://localhost:3000`

## APIs Utilizadas

- **Semantic Scholar API** - Validação de artigos científicos
- **Crossref API** - Busca de DOI e metadados

## Estrutura do Projeto

```
abnt-formatter/
├── backend/
│   ├── server.js           # Servidor Express
│   ├── abnt-formatter.js   # Formatação ABNT
│   ├── article-validator.js # Validação de artigos
│   └── package.json
└── frontend/
    ├── public/
    │   └── index.html      # Página principal
    ├── styles/
    │   └── main.css        # Estilos
    └── scripts/
        └── main.js         # JavaScript do frontend
```

## Uso

### Formatador ABNT
1. Arraste um arquivo .docx
2. Clique em "Formatar em ABNT"
3. Baixe o documento formatado

### Validador de Artigos
- **Por DOI**: Cole o DOI (ex: `10.1000/xyz123`)
- **Por Título**: Digite o título do artigo
- **Por Documento**: Upload para extrair e validar referências

## Normas ABNT Implementadas

- NBR 14724 - Estrutura de trabalhos acadêmicos
- NBR 6023 - Referências bibliográficas
- NBR 10520 - Citações

## License

MIT
