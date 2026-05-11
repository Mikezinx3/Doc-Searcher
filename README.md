# Doc Searcher - ABNT Formatter

Sistema de busca, validação de artigos científicos e formatação automática em normas ABNT.

## Estrutura do Projeto

- `backend/`: Servidor Node.js/Express com lógica de formatação e validação.
- `frontend/public/`: Interface do usuário (HTML/CSS/JS).

## Como Executar

1. Entre na pasta do backend:
   ```bash
   cd backend
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure o arquivo `.env` com sua chave do Gemini:
   ```
   GEMINI_API_KEY=sua_chave_aqui
   ```

4. Inicie o servidor:
   ```bash
   npm start
   ```

5. Acesse: `http://localhost:3000`

## Funcionalidades

- **Formatação ABNT**: Converte documentos para as normas NBR 14724.
- **Validação de Artigos**: Busca por DOI ou Título em bases científicas.
- **Resumo com IA**: Gera resumos automáticos usando Google Gemini.
- **Assistente Virtual**: Chat integrado para tirar dúvidas acadêmicas.
