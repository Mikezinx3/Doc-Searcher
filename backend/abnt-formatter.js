const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, convertInchesToTwip } = require("docx");

class ABNTFormatter {
  constructor() {
    // Margens ABNT: 3cm superior e esquerda, 2cm inferior e direita
    this.margins = {
      top: 1701,    // 3 cm em twips (1 cm ≈ 567 twips)
      bottom: 1134, // 2 cm em twips
      left: 1701,   // 3 cm em twips
      right: 1134   // 2 cm em twips
    };
  }

  format(content) {
    const paragraphs = this.parseContent(content);
    const formattedParagraphs = paragraphs.map(para => this.formatParagraph(para));

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: this.margins
          }
        },
        children: formattedParagraphs
      }]
    });

    return doc;
  }

  parseContent(content) {
    // Divide por linhas e remove vazias
    const lines = content.split('\n').filter(line => line.trim());
    const paragraphs = [];
    let currentPara = '';
    let isHeader = true;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      
      // Cabeçalho inicial (Universidade, Aluno, Título)
      if (isHeader && i < 5 && !/^(resumo|introdução)/i.test(trimmed)) {
        paragraphs.push({ text: trimmed, type: 'header' });
        continue;
      }
      
      isHeader = false;

      // Detecta títulos de seções
      if (this.isHeading(trimmed)) {
        if (currentPara) {
          paragraphs.push({ text: currentPara.trim(), type: 'paragraph' });
          currentPara = '';
        }
        paragraphs.push({ text: trimmed, type: 'heading' });
      } else {
        // Se a linha for curta e não terminar em ponto, pode ser um subtítulo ou parte do cabeçalho
        if (trimmed.length < 60 && !trimmed.endsWith('.') && !currentPara) {
            paragraphs.push({ text: trimmed, type: 'subheading' });
        } else {
            currentPara += (currentPara ? ' ' : '') + trimmed;
        }
      }
    }

    if (currentPara) {
      paragraphs.push({ text: currentPara.trim(), type: 'paragraph' });
    }

    return paragraphs;
  }

  isHeading(text) {
    // Seções primárias: 1 INTRODUÇÃO, RESUMO, etc.
    const primaryHeading = /^(resumo|abstract|introdução|conclusão|referências)$/i;
    const numberedHeading = /^\d+(\.\d+)*\s+[A-Z\s]+$/; // 1 INTRODUÇÃO
    
    return primaryHeading.test(text) || numberedHeading.test(text);
  }

  formatParagraph(para) {
    const { text, type } = para;

    const defaultRunProps = {
      font: "Arial",
      size: 24, // 12pt
      color: "000000"
    };

    switch (type) {
      case 'header':
        // Cabeçalho: Centralizado, Negrito, Espaçamento Simples
        return new Paragraph({
          children: [new TextRun({ ...defaultRunProps, bold: true })],
          text: text,
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 120, line: 240 }
        });

      case 'heading':
        // Seção Primária: Esquerda, Negrito, Caixa Alta, Espaçamento 1.5
        return new Paragraph({
          children: [new TextRun({ ...defaultRunProps, bold: true, text: text.toUpperCase() })],
          alignment: AlignmentType.LEFT,
          spacing: { before: 480, after: 240, line: 360 }
        });

      case 'subheading':
        // Subseções: Esquerda, Negrito, Espaçamento 1.5
        return new Paragraph({
          children: [new TextRun({ ...defaultRunProps, bold: true })],
          text: text,
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 120, line: 360 }
        });

      case 'paragraph':
      default:
        // Parágrafo Normal: Justificado, Recuo 1.25cm, Espaçamento 1.5
        return new Paragraph({
          children: [new TextRun({ ...defaultRunProps, text: text })],
          alignment: AlignmentType.JUSTIFIED,
          indent: {
            firstLine: 709 // 1.25cm em twips (1.25 * 567 ≈ 709)
          },
          spacing: { before: 0, after: 0, line: 360 }
        });
    }
  }
}

module.exports = { ABNTFormatter };
