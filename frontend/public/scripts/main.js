// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado, inicializando...');
  initWelcomePage();
  initTabs();
  initFormatTab();
  initValidateTab();
  initSummaryTab();
  initChatWidget();
});

// Página de Boas-vindas
function initWelcomePage() {
  const welcomePage = document.getElementById('welcome-page');
  const btnWelcome = document.getElementById('btn-welcome');

  console.log('Welcome Page:', welcomePage);
  console.log('Btn Welcome:', btnWelcome);

  if (btnWelcome && welcomePage) {
    // Remove qualquer listener anterior para evitar duplicação
    btnWelcome.replaceWith(btnWelcome.cloneNode(true));
    const newBtnWelcome = document.getElementById('btn-welcome');

    newBtnWelcome.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Botão Vamos lá clicado!');

      // Oculta a welcome page com transição
      welcomePage.style.opacity = '0';
      welcomePage.style.transition = 'opacity 0.5s ease';

      setTimeout(() => {
        welcomePage.classList.add('hidden');

        // Rola suavemente até o conteúdo principal
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
          console.log('Rolando para o conteúdo principal');
          mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    });
  } else {
    console.error('Elementos da welcome page não encontrados!');
  }
}

function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(`${tabId}-tab`).classList.add('active');
    });
  });
}

function initFormatTab() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileInfo = document.getElementById('file-info');
  const fileName = document.getElementById('file-name');
  const fileSize = document.getElementById('file-size');
  const removeFileBtn = document.getElementById('remove-file');
  const formatBtn = document.getElementById('format-btn');
  const formatStatus = document.getElementById('format-status');

  let currentFile = null;

  if (!dropZone || !fileInput) return;

  // Click na drop zone abre o seletor de arquivos
  dropZone.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFile(files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      showToast('Por favor, selecione um arquivo .docx', 'error');
      return;
    }
    currentFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    dropZone.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    formatBtn.disabled = false;
    formatStatus.classList.add('hidden');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (removeFileBtn) {
    removeFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentFile = null;
      fileInput.value = '';
      fileInfo.classList.add('hidden');
      dropZone.classList.remove('hidden');
      formatBtn.disabled = true;
      formatStatus.classList.add('hidden');
    });
  }

  if (formatBtn) {
    formatBtn.addEventListener('click', async () => {
      if (!currentFile) return;

      const formData = new FormData();
      formData.append('document', currentFile);

      formatBtn.disabled = true;
      formatBtn.innerHTML = '<span class="spinner"></span> Formatando...';
      formatStatus.classList.add('hidden');

      try {
        const response = await fetch('/api/format', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao formatar');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ABNT_${currentFile.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('Documento formatado com sucesso!', 'success');
        showStatus('Documento formatado com sucesso! Baixe o arquivo acima.', 'success');
      } catch (error) {
        showStatus(error.message, 'error');
        showToast('Erro ao formatar documento', 'error');
      } finally {
        formatBtn.disabled = false;
        formatBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 11 12 14 22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          Formatar em ABNT
        `;
      }
    });
  }

  function showStatus(message, type) {
    if (!formatStatus) return;
    formatStatus.textContent = message;
    formatStatus.className = `status-message ${type}`;
    formatStatus.classList.remove('hidden');
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}

function initValidateTab() {
  const doiInput = document.getElementById('doi-input');
  const validateDoiBtn = document.getElementById('validate-doi-btn');
  const titleInput = document.getElementById('title-input');
  const validateTitleBtn = document.getElementById('validate-title-btn');
  const validateDropZone = document.getElementById('validate-drop-zone');
  const validateFileInput = document.getElementById('validate-file-input');
  const validateDocBtn = document.getElementById('validate-doc-btn');
  const validationResults = document.getElementById('validation-results');
  const validateFileLink = document.getElementById('validate-file-link');
  const validateDropText = document.getElementById('validate-drop-text');

  let validateFile = null;

  // DOI Validation
  if (validateDoiBtn && doiInput) {
    validateDoiBtn.addEventListener('click', async () => {
      const doi = doiInput.value.trim();
      if (!doi) {
        showToast('Por favor, digite um DOI', 'error');
        return;
      }
      await validateDOI(doi);
    });

    doiInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') validateDoiBtn.click();
    });
  }

  // Title Validation
  if (validateTitleBtn && titleInput) {
    validateTitleBtn.addEventListener('click', async () => {
      const title = titleInput.value.trim();
      if (!title) {
        showToast('Por favor, digite um título', 'error');
        return;
      }
      await validateTitle(title);
    });

    titleInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') validateTitleBtn.click();
    });
  }

  // Document Validation - PDF
  if (validateDropZone && validateFileInput && validateDocBtn) {
    // Clique na zona de upload - CORREÇÃO
    validateDropZone.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      validateFileInput.click();
    });

    // Clique no link "clique para selecionar" - CORREÇÃO
    if (validateFileLink) {
      validateFileLink.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Força o clique no input de arquivo
        setTimeout(() => validateFileInput.click(), 0);
      });
    }

    validateDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      validateDropZone.classList.add('drag-over');
    });

    validateDropZone.addEventListener('dragleave', () => {
      validateDropZone.classList.remove('drag-over');
    });

    validateDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      validateDropZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) handleValidateFile(files[0]);
    });

    validateFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleValidateFile(e.target.files[0]);
    });

    validateDocBtn.addEventListener('click', async () => {
      if (!validateFile) return;
      await validateDocument(validateFile);
    });
  }

  // CORREÇÃO: Agora aceita PDF
  function handleValidateFile(file) {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      showToast('Por favor, selecione um arquivo PDF', 'error');
      return;
    }
    validateFile = file;
    if (validateDropText) {
      validateDropText.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 12px;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--success);">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <strong>${file.name}</strong>
        </div>
        <small>${formatFileSize(file.size)}</small>
      `;
    }
    validateDocBtn.disabled = false;
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function validateDOI(doi) {
    validationResults.classList.add('hidden');
    validateDoiBtn.disabled = true;
    validateDoiBtn.innerHTML = '<span class="spinner"></span>';

    try {
      const response = await fetch('/api/validate/doi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doi })
      });

      const result = await response.json();

      if (result.valid) {
        validationResults.innerHTML = `
          <div class="result-card">
            <h5>✅ Artigo Validado</h5>
            <p><strong>Título:</strong> ${escapeHtml(result.title)}</p>
            <p><strong>Autores:</strong> ${result.authors?.join(', ') || 'Não informado'}</p>
            <p><strong>Periódico:</strong> ${escapeHtml(result.journal)}</p>
            <p><strong>Data:</strong> ${result.publishedDate || 'Não informada'}</p>
            <p><strong>Fonte:</strong> ${result.source}</p>
            <p><strong>Link:</strong> <a href="${result.url}" target="_blank">${result.url}</a></p>
          </div>
        `;
      } else {
        validationResults.innerHTML = `
          <div class="result-card invalid">
            <h5>❌ Artigo não encontrado</h5>
            <p>${escapeHtml(result.error || 'DOI não encontrado nas bases consultadas')}</p>
          </div>
        `;
      }
    } catch (error) {
      validationResults.innerHTML = `
        <div class="result-card invalid">
          <h5>❌ Erro na validação</h5>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;
    } finally {
      validateDoiBtn.disabled = false;
      validateDoiBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Validar
      `;
      validationResults.classList.remove('hidden');
    }
  }

  async function validateTitle(title) {
    validationResults.classList.add('hidden');
    validateTitleBtn.disabled = true;
    validateTitleBtn.innerHTML = '<span class="spinner"></span>';

    try {
      const response = await fetch('/api/validate/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      });

      const result = await response.json();

      if (result.found && result.matches) {
        validationResults.innerHTML = `
          <div class="result-card">
            <h5>✅ ${result.matches.length} artigo(s) encontrado(s)</h5>
            ${result.matches.map(match => `
              <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--gray-200)">
                <p><strong>Título:</strong> ${escapeHtml(match.title)}
                  ${match.matchScore >= 70 ? `<span class="match-score">${match.matchScore}% match</span>` : ''}</p>
                <p><strong>Autores:</strong> ${match.authors?.slice(0, 3).join(', ')}${match.authors?.length > 3 ? ' et al.' : ''}</p>
                <p><strong>Periódico:</strong> ${escapeHtml(match.journal || 'Não informado')}</p>
                <p><strong>Citações:</strong> ${match.citationCount || 0}</p>
                <p><strong>Link:</strong> <a href="${match.url}" target="_blank">Ver artigo</a></p>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        validationResults.innerHTML = `
          <div class="result-card invalid">
            <h5>❌ Nenhum artigo encontrado</h5>
            <p>${escapeHtml(result.message || 'Tente buscar por DOI')}</p>
          </div>
        `;
      }
    } catch (error) {
      validationResults.innerHTML = `
        <div class="result-card invalid">
          <h5>❌ Erro na busca</h5>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;
    } finally {
      validateTitleBtn.disabled = false;
      validateTitleBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Buscar
      `;
      validationResults.classList.remove('hidden');
    }
  }

  async function validateDocument(file) {
    const formData = new FormData();
    formData.append('document', file);

    validateDocBtn.disabled = true;
    validateDocBtn.innerHTML = '<span class="spinner"></span> Validando...';
    validationResults.classList.add('hidden');

    try {
      const response = await fetch('/api/validate/document', {
        method: 'POST',
        body: formData
      });

      // Verifica se a resposta é JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('O servidor retornou uma resposta inválida. Tente novamente.');
      }

      const result = await response.json();

      if (result.doisFound > 0) {
        validationResults.innerHTML = `
          <div class="result-card">
            <h5>📊 Resumo da Validação</h5>
            <p><strong>DOIs encontrados:</strong> ${result.doisFound}</p>
            <p><strong>Artigos válidos:</strong> ${result.validArticles}</p>
            ${result.results.map(r => `
              <div style="margin-top: 12px; padding: 12px; background: ${r.valid ? '#d1fae5' : '#fee2e2'}; border-radius: 8px;">
                <p><strong>DOI:</strong> ${r.doi}</p>
                ${r.valid ? `<p><strong>Título:</strong> ${escapeHtml(r.title)}</p>` : `<p style="color: var(--error)">${escapeHtml(r.error)}</p>`}
              </div>
            `).join('')}
          </div>
        `;
      } else {
        validationResults.innerHTML = `
          <div class="result-card">
            <h5>📄 Nenhum DOI encontrado</h5>
            <p>O documento não contém DOIs no formato padrão.</p>
          </div>
        `;
      }
    } catch (error) {
      console.error('Erro na validação:', error);
      validationResults.innerHTML = `
        <div class="result-card invalid">
          <h5>❌ Erro na validação</h5>
          <p>${escapeHtml(error.message)}</p>
          <p style="margin-top: 8px; font-size: 0.85rem; color: var(--gray-500);">
            Dica: Certifique-se de que o PDF contém DOIs e que o servidor está rodando corretamente.
          </p>
        </div>
      `;
    } finally {
      validateDocBtn.disabled = false;
      validateDocBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        Validar Referências
      `;
      validationResults.classList.remove('hidden');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}

// =====================
// CHAT WIDGET
// =====================
function initChatWidget() {
  const chatButton = document.getElementById('chatButton');
  const chatContainer = document.getElementById('chatContainer');
  const chatClose = document.getElementById('chatClose');
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const chatSend = document.getElementById('chatSend');

  if (!chatButton || !chatContainer) return;

  let chatHistory = [];
  let isOpen = false;

  // Abrir/fechar chat
  chatButton.addEventListener('click', () => {
    isOpen = !isOpen;
    chatContainer.classList.toggle('open');
    chatButton.classList.toggle('active');
    chatButton.textContent = isOpen ? '✕' : '💬';
    if (isOpen) {
      setTimeout(() => chatInput.focus(), 300);
    }
  });

  chatClose.addEventListener('click', () => {
    isOpen = false;
    chatContainer.classList.remove('open');
    chatButton.classList.remove('active');
    chatButton.textContent = '💬';
  });

  // Enviar mensagem
  async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    // Adicionar mensagem do usuário
    addMessage(message, 'user');
    chatInput.value = '';
    chatSend.disabled = true;

    // Mostrar typing indicator
    showTyping();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          history: chatHistory
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.success) {
        addMessage(data.response, 'ai');
        chatHistory.push({ role: 'user', content: message });
        chatHistory.push({ role: 'assistant', content: data.response });
      } else {
        addMessage('Desculpe, ocorreu um erro. Tente novamente.', 'ai');
      }
    } catch (error) {
      hideTyping();
      // Fallback local
      const fallbackResponse = gerarRespostaFallback(message);
      addMessage(fallbackResponse, 'ai');
    }

    chatSend.disabled = false;
    chatInput.focus();
  }

  function addMessage(content, type) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${type}`;
    msgDiv.innerHTML = `<div class="chat-message-content">${content.replace(/\n/g, '<br>')}</div>`;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function showTyping() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-typing';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
      <div class="chat-typing-dot"></div>
      <div class="chat-typing-dot"></div>
      <div class="chat-typing-dot"></div>
    `;
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function hideTyping() {
    const typing = document.getElementById('typingIndicator');
    if (typing) typing.remove();
  }

  // Respostas fallback (quando API não está disponível)
  function gerarRespostaFallback(mensagem) {
    const msg = mensagem.toLowerCase();

    if (msg.includes('abnt') && (msg.includes('format') || msg.includes('norma'))) {
      return "Para formatar seu documento nas normas ABNT:\n\n1. Arraste seu arquivo .docx na área de upload\n2. Clique em 'Formatar em ABNT'\n3. Aguarde o processamento\n4. Baixe o documento formatado\n\nO sistema aplicará automaticamente: margens 3cm/2cm, fonte Arial 12, espaçamento 1.5 e recuo de 1.25cm.";
    }

    if (msg.includes('doi') || msg.includes('validar')) {
      return "Para validar um artigo:\n\n1. Vá na aba 'Validar Artigo'\n2. Cole o DOI (ex: 10.1000/xyz123) OU digite o título\n3. Clique em 'Validar' ou 'Buscar'\n\nO sistema consultará Semantic Scholar e Crossref.";
    }

    if (msg.includes('margem') || msg.includes('margens')) {
      return "As margens nas normas ABNT são:\n• Superior: 3cm\n• Esquerda: 3cm\n• Inferior: 2cm\n• Direita: 2cm";
    }

    if (msg.includes('fonte')) {
      return "A fonte recomendada pela ABNT é Arial, tamanho 12 para o corpo do texto. Citações longas (>3 linhas) usam tamanho 10.";
    }

    if (msg.includes('citaç') || msg.includes('citacao')) {
      return "Citações com mais de 3 linhas devem ter:\n• Recuo de 4cm da margem esquerda\n• Fonte tamanho 10\n• Espaçamento simples\n• Sem aspas";
    }

    if (msg.includes('refer')) {
      return "As referências devem seguir a NBR 6023:\n• Alinhamento à esquerda\n• Espaçamento simples\n• Espaço de 6pt entre referências\n• Ordem alfabética";
    }

    if (msg.includes('olá') || msg.includes('oi') || msg.includes('ola') || msg.includes('bom dia') || msg.includes('boa tarde')) {
      return "Olá! 👋 Sou o assistente virtual do Doc Searcher. Como posso ajudar você hoje? Posso tirar dúvidas sobre formatação ABNT, validação de artigos ou como usar o site.";
    }

    if (msg.includes('obrigad') || msg.includes('valeu')) {
      return "Por nada! Estou aqui para ajudar. Se tiver mais dúvidas, é só perguntar!";
    }

    if (msg.includes('pdf')) {
      return "Na aba 'Validar Artigo', você pode fazer upload de um PDF para extrair e validar todas as referências automaticamente. O sistema identifica os DOIs e verifica cada artigo nas bases acadêmicas.";
    }

    if (msg.includes('preço') || msg.includes('custo') || msg.includes('gratis') || msg.includes('gratuito')) {
      return "O Doc Searcher é 100% gratuito para uso! Você pode formatar documentos e validar artigos sem custo algum.";
    }

    return "Desculpe, não entendi completamente. Posso ajudar com:\n• Formatação ABNT de documentos\n• Validação de artigos por DOI ou título\n• Dúvidas sobre normas ABNT (margens, fonte, citações, referências)\n\nComo posso ajudar?";
  }

  chatSend.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
  });

  // Toast de boas-vindas após 2 segundos
  setTimeout(() => {
    showToast('💡 Precisa de ajuda? Clique no chat no canto inferior direito!', 'info');
  }, 2000);
}

// =====================
// SUMMARY TAB LOGIC
// =====================
function initSummaryTab() {
  const summaryDropZone = document.getElementById('summary-drop-zone');
  const summaryFileInput = document.getElementById('summary-file-input');
  const summaryFileInfo = document.getElementById('summary-file-info');
  const summaryFileName = document.getElementById('summary-file-name');
  const summaryFileSize = document.getElementById('summary-file-size');
  const summaryRemoveFileBtn = document.getElementById('summary-remove-file');
  const summarizeBtn = document.getElementById('summarize-btn');
  const summaryResults = document.getElementById('summary-results');

  let currentSummaryFile = null;

  if (!summaryDropZone || !summaryFileInput) return;

  summaryDropZone.addEventListener('click', () => summaryFileInput.click());

  summaryDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    summaryDropZone.classList.add('drag-over');
  });

  summaryDropZone.addEventListener('dragleave', () => {
    summaryDropZone.classList.remove('drag-over');
  });

  summaryDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    summaryDropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) handleSummaryFile(e.dataTransfer.files[0]);
  });

  summaryFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) handleSummaryFile(e.target.files[0]);
  });

  function handleSummaryFile(file) {
    const ext = file.name.toLowerCase().split('.').pop();
    if (ext !== 'pdf' && ext !== 'docx') {
      showToast('Por favor, selecione um arquivo PDF ou DOCX', 'error');
      return;
    }
    currentSummaryFile = file;
    summaryFileName.textContent = file.name;
    summaryFileSize.textContent = formatFileSize(file.size);
    summaryDropZone.classList.add('hidden');
    summaryFileInfo.classList.remove('hidden');
    summarizeBtn.disabled = false;
    summaryResults.classList.add('hidden');
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  if (summaryRemoveFileBtn) {
    summaryRemoveFileBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentSummaryFile = null;
      summaryFileInput.value = '';
      summaryFileInfo.classList.add('hidden');
      summaryDropZone.classList.remove('hidden');
      summarizeBtn.disabled = true;
      summaryResults.classList.add('hidden');
    });
  }

  if (summarizeBtn) {
    summarizeBtn.addEventListener('click', async () => {
      if (!currentSummaryFile) return;

      const formData = new FormData();
      formData.append('article', currentSummaryFile);

      summarizeBtn.disabled = true;
      summarizeBtn.innerHTML = '<span class="spinner"></span> Processando Artigo...';
      summaryResults.classList.add('hidden');

      try {
        const response = await fetch('/api/summarize', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Erro ao processar resumo');
        }

        const data = await response.json();
        displaySummaryResults(data);
        showToast('Resumo gerado com sucesso!', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      } finally {
        summarizeBtn.disabled = false;
        summarizeBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
          </svg>
          Gerar Resumo com IA
        `;
      }
    });
  }

  function displaySummaryResults(data) {
    const { resumo, citacoes } = data;
    
    summaryResults.innerHTML = `
      <div class="result-card" style="border-left-color: var(--primary); margin-bottom: 32px;">
        <h4 style="color: var(--primary-dark); margin-bottom: 16px;">📄 Análise do Artigo: ${data.fileName}</h4>
        
        <div class="summary-section">
          <h5>🎯 Objetivos</h5>
          <p>${resumo.objetivos}</p>
        </div>
        
        <div class="summary-section">
          <h5>🔬 Metodologia</h5>
          <p>${resumo.metodologia}</p>
        </div>
        
        <div class="summary-section">
          <h5>📊 Resultados</h5>
          <p>${resumo.resultados}</p>
        </div>
        
        <div class="summary-section">
          <h5>✅ Conclusão</h5>
          <p>${resumo.conclusao}</p>
        </div>

        ${citacoes && citacoes.length > 0 ? `
          <div class="summary-section" style="border-left-color: var(--secondary);">
            <h5>💬 Citações Importantes</h5>
            <div class="citations-list">
              ${citacoes.map(cit => `<div class="citation-item">${cit}</div>`).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    summaryResults.classList.remove('hidden');
    summaryResults.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }
}
