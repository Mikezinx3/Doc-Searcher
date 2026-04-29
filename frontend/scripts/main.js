// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado, inicializando...');
  initWelcomePage();
  initTabs();
  initFormatTab();
  initValidateTab();
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
