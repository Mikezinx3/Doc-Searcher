// Aguarda o carregamento do DOM
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM carregado, inicializando...");
  initWelcomePage();
  initTabs();
  initFormatTab();
  initValidateTab();
});

// Página de Boas-vindas
function initWelcomePage() {
  const welcomePage = document.getElementById("welcome-page");
  const btnWelcome = document.getElementById("btn-welcome");

  if (btnWelcome && welcomePage) {
    btnWelcome.replaceWith(btnWelcome.cloneNode(true));
    const newBtnWelcome = document.getElementById("btn-welcome");

    newBtnWelcome.addEventListener("click", (e) => {
      e.preventDefault();
      welcomePage.style.opacity = "0";
      welcomePage.style.transition = "opacity 0.5s ease";

      setTimeout(() => {
        welcomePage.classList.add("hidden");
        const mainContent = document.querySelector(".main-content");
        if (mainContent) {
          mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 500);
    });
  }
}

// Gestão de Abas
function initTabs() {
  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.add("hidden"));
      tab.classList.add("active");
      document.getElementById(target).classList.remove("hidden");
    });
  });
}

// --- ABA DE FORMATAÇÃO (CORRIGIDA) ---
function initFormatTab() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");

  if (!dropZone || !fileInput) return;

  // Ao clicar na zona, abre o seletor (se não for o próprio input)
  dropZone.addEventListener("click", (e) => {
    if (e.target !== fileInput) {
      fileInput.click();
    }
  });

  // Drag and Drop
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      // Adiciona aqui a tua função de processamento se necessário
    }
  });
}

// --- ABA DE VALIDAÇÃO (CORRIGIDA) ---
function initValidateTab() {
  const validateDropZone = document.getElementById("validate-drop-zone");
  const validateFileInput = document.getElementById("validate-file-input");
  const validateFileLink = document.getElementById("validate-file-link");

  if (!validateDropZone || !validateFileInput) return;

  // Evento de clique na zona de validação
  validateDropZone.addEventListener("click", (e) => {
    // Se o clique não foi no input, força o clique no input
    if (e.target !== validateFileInput) {
      validateFileInput.click();
    }
  });

  // Drag over/leave para efeito visual
  validateDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    validateDropZone.classList.add("drag-over");
  });

  validateDropZone.addEventListener("dragleave", () => {
    validateDropZone.classList.remove("drag-over");
  });

  // Drop de ficheiros
  validateDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    validateDropZone.classList.remove("drag-over");
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      validateFileInput.files = files;
      // Dispara o processamento
      if (typeof handleValidateFile === "function")
        handleValidateFile(files[0]);
    }
  });

  // Evento quando o ficheiro é selecionado via pasta
  validateFileInput.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      if (typeof handleValidateFile === "function")
        handleValidateFile(e.target.files[0]);
    }
  });
}
