const fetch = require('node-fetch');

class ArticleValidator {
  constructor() {
    this.semanticScholarUrl = 'https://api.semanticscholar.org/graph/v1/paper/search';
    this.crossrefUrl = 'https://api.crossref.org/works';
    this.doaiUrl = 'https://doi.org/';
  }

  async validateByDOI(doi) {
    try {
      // Tenta Crossref primeiro
      const crossrefResponse = await fetch(`${this.crossrefUrl}/${encodeURIComponent(doi)}`);

      if (crossrefResponse.ok) {
        const data = await crossrefResponse.json();
        if (data.status === 'ok' && data.message) {
          return {
            valid: true,
            source: 'Crossref',
            doi: doi,
            title: data.message.title?.[0] || 'Título não disponível',
            authors: data.message.author?.map(a => `${a.given} ${a.family}`) || [],
            journal: data.message['container-title']?.[0] || 'Não informado',
            publishedDate: data.message.published?.['date-parts']?.[0]?.join('-') ||
                          data.message.created?.['date-parts']?.[0]?.join('-'),
            url: `${this.doaiUrl}${doi}`
          };
        }
      }

      // Tenta Semantic Scholar
      const ssResponse = await fetch(`${this.semanticScholarUrl}?query=${encodeURIComponent(doi)}&fields=title,authors,venue,publicationDate,externalIds`);

      if (ssResponse.ok) {
        const data = await ssResponse.json();
        if (data.data && data.data.length > 0) {
          const paper = data.data[0];
          return {
            valid: true,
            source: 'Semantic Scholar',
            doi: paper.externalIds?.DOI || doi,
            title: paper.title || 'Título não disponível',
            authors: paper.authors?.map(a => a.name) || [],
            journal: paper.venue || 'Não informado',
            publishedDate: paper.publicationDate,
            url: `https://www.semanticscholar.org/paper/${paper.paperId}`
          };
        }
      }

      return {
        valid: false,
        doi: doi,
        error: 'Artigo não encontrado nas bases consultadas'
      };
    } catch (error) {
      return {
        valid: false,
        doi: doi,
        error: `Erro na validação: ${error.message}`
      };
    }
  }

  async validateByTitle(title) {
    let allMatches = [];

    // Tenta Semantic Scholar primeiro
    try {
      const ssResponse = await fetch(
        `${this.semanticScholarUrl}?query=${encodeURIComponent(title)}&fields=title,authors,venue,publicationDate,externalIds,citationCount&limit=10`
      );

      if (ssResponse.ok) {
        const ssData = await ssResponse.json();
        if (ssData.data && ssData.data.length > 0) {
          const ssMatches = ssData.data.map(paper => ({
            valid: true,
            source: 'Semantic Scholar',
            doi: paper.externalIds?.DOI,
            title: paper.title,
            authors: paper.authors?.map(a => a.name) || [],
            journal: paper.venue,
            publishedDate: paper.publicationDate,
            citationCount: paper.citationCount,
            url: `https://www.semanticscholar.org/paper/${paper.paperId}`,
            matchScore: this.calculateMatchScore(title, paper.title)
          }));
          allMatches = allMatches.concat(ssMatches);
        }
      }
    } catch (error) {
      console.log('Erro no Semantic Scholar:', error.message);
    }

    // Tenta Crossref como fallback (melhor para artigos em português)
    try {
      const crossrefResponse = await fetch(
        `${this.crossrefUrl}?query.title=${encodeURIComponent(title)}&rows=10`
      );

      if (crossrefResponse.ok) {
        const crossrefData = await crossrefResponse.json();
        if (crossrefData.message && crossrefData.message.items) {
          const crossrefMatches = crossrefData.message.items.map(item => ({
            valid: true,
            source: 'Crossref',
            doi: item.DOI,
            title: item.title?.[0] || 'Título não disponível',
            authors: item.author?.map(a => `${a.given} ${a.family}`) || [],
            journal: item['container-title']?.[0] || item.publisher || 'Não informado',
            publishedDate: item.published?.['date-parts']?.[0]?.join('-') ||
                          item.created?.['date-parts']?.[0]?.join('-'),
            citationCount: item['is-referenced-by-count'] || 0,
            url: `https://doi.org/${item.DOI}`,
            matchScore: this.calculateMatchScore(title, item.title?.[0] || '')
          }));
          allMatches = allMatches.concat(crossrefMatches);
        }
      }
    } catch (error) {
      console.log('Erro no Crossref:', error.message);
    }

    if (allMatches.length > 0) {
      // Remove duplicados e ordena por relevância
      const unique = allMatches.filter((v, i, a) =>
        a.findIndex(t => t.doi === v.doi) === i
      );
      unique.sort((a, b) => b.matchScore - a.matchScore);

      return {
        found: true,
        matches: unique.slice(0, 10),
        totalResults: unique.length
      };
    }

    return {
      found: false,
      message: 'Nenhum artigo encontrado. Tente buscar em inglês ou verifique a ortografia.'
    };
  }

  calculateMatchScore(searchTitle, foundTitle) {
    const search = searchTitle.toLowerCase();
    const found = foundTitle.toLowerCase();

    // Match exato
    if (search === found) return 100;

    // Contém o título
    if (found.includes(search) || search.includes(found)) return 80;

    // Similaridade de palavras
    const searchWords = new Set(search.split(/\s+/));
    const foundWords = found.split(/\s+/);
    const matches = foundWords.filter(w => searchWords.has(w)).length;

    return Math.round((matches / searchWords.size) * 70);
  }

  extractDOIFromText(text) {
    const doiPattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/gi;
    const matches = text.match(doiPattern);
    return matches || [];
  }

  async validateDocumentContent(content) {
    const dois = this.extractDOIFromText(content);
    const results = [];

    for (const doi of dois) {
      const result = await this.validateByDOI(doi);
      results.push(result);
    }

    return {
      doisFound: dois.length,
      validArticles: results.filter(r => r.valid).length,
      results: results
    };
  }
}

module.exports = { ArticleValidator };
