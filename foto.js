// =============================================================
//  Leitura de foto da caixa do medicamento
//  1) Com chave Gemini (Ajustes): IA lê a embalagem e conta caixas
//  2) Sem chave: reconhecimento de texto (Tesseract.js) no navegador
// =============================================================
import { encontrarTermo } from './classes.js';

const MESES = { jan:1, fev:2, mar:3, abr:4, mai:5, jun:6, jul:7, ago:8, set:9, out:10, nov:11, dez:12,
                feb:2, apr:4, may:5, aug:8, sep:9, oct:10, dec:12 };

/** Reduz a imagem e (opcionalmente) aumenta o contraste. Retorna um canvas. */
function prepararImagem(file, max = 1600, contraste = false) {
  return new Promise((ok, falha) => {
    const img = new Image();
    img.onload = () => {
      const esc = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * esc); c.height = Math.round(img.height * esc);
      const ctx = c.getContext('2d');
      ctx.drawImage(img, 0, 0, c.width, c.height);
      if (contraste) {
        const d = ctx.getImageData(0, 0, c.width, c.height);
        for (let i = 0; i < d.data.length; i += 4) {
          const g = 0.3 * d.data[i] + 0.59 * d.data[i + 1] + 0.11 * d.data[i + 2];
          const v = Math.max(0, Math.min(255, (g - 128) * 1.6 + 128));
          d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
        }
        ctx.putImageData(d, 0, 0);
      }
      URL.revokeObjectURL(img.src);
      ok(c);
    };
    img.onerror = () => falha(new Error('Não consegui abrir a imagem.'));
    img.src = URL.createObjectURL(file);
  });
}

const pad = n => String(n).padStart(2, '0');
const fimDoMes = (a, m) => `${a}-${pad(m)}-${pad(new Date(a, m, 0).getDate())}`;
const anoCompleto = a => (a < 100 ? 2000 + a : a);

/** Converte vários formatos de data de embalagem em YYYY-MM-DD */
function lerData(txt) {
  let m;
  if ((m = txt.match(/(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/))) {
    const [d, me, a] = [+m[1], +m[2], anoCompleto(+m[3])];
    if (me >= 1 && me <= 12 && d >= 1 && d <= 31) return `${a}-${pad(me)}-${pad(d)}`;
  }
  if ((m = txt.match(/(\d{1,2})[\/.\-\s](\d{4}|\d{2})\b/))) {
    const [me, a] = [+m[1], anoCompleto(+m[2])];
    if (me >= 1 && me <= 12) return fimDoMes(a, me);
  }
  if ((m = txt.toLowerCase().match(/(jan|fev|feb|mar|abr|apr|mai|may|jun|jul|ago|aug|set|sep|out|oct|nov|dez|dec)[a-z]*[\/.\-\s]*(\d{4}|\d{2})\b/))) {
    return fimDoMes(anoCompleto(+m[2]), MESES[m[1]]);
  }
  return null;
}

/** Extrai dados do texto bruto lido pelo OCR */
export function interpretarTexto(texto) {
  const t = texto.replace(/\r/g, '');
  const r = { nome: '', dose: '', quantidade: null, unidade: '', validade: '', lote: '' };

  const achado = encontrarTermo(t);
  if (achado) r.nome = achado.termo.replace(/\b\w/g, c => c.toUpperCase());

  const dose = t.match(/(\d+(?:[.,]\d+)?)\s?(mg|mcg|µg|ug|g|ml|ui)\b(\s?\/\s?(\d+\s?)?(ml|g|dose))?/i);
  if (dose) r.dose = dose[0].replace(/\s+/g, ' ').replace(/ug\b/i, 'mcg').trim();

  const qtd = t.match(/(\d{1,4})\s*(comprimidos?|comp\b|compr|c[aá]psulas?|caps\b|dr[aá]geas?|ampolas?|frascos?|envelopes?|sach[eê]s?|adesivos?)/i);
  if (qtd) {
    r.quantidade = +qtd[1];
    const u = qtd[2].toLowerCase();
    r.unidade = u.startsWith('comp') || u.startsWith('dr') ? 'comprimidos'
      : u.startsWith('c') ? 'cápsulas' : u.startsWith('amp') ? 'ampolas'
      : u.startsWith('fr') ? 'frascos' : 'unidades';
  }

  // Validade: primeiro procura perto de "VAL"/"VENC"; senão pega a data mais distante no texto
  const linhas = t.split('\n');
  for (const l of linhas) {
    const idx = l.search(/\b(val|venc|exp)/i);
    if (idx >= 0) { const d = lerData(l.slice(idx)); if (d) { r.validade = d; break; } }
  }
  if (!r.validade) {
    const datas = linhas.map(lerData).filter(Boolean).sort();
    if (datas.length) r.validade = datas[datas.length - 1];
  }

  const lote = t.match(/\b(?:lote|lot|l\s?[:.])\s*[:.\-]?\s*([A-Z0-9][A-Z0-9\-\/]{2,})/i);
  if (lote) r.lote = lote[1].toUpperCase();

  return r;
}

function carregarTesseract() {
  if (window.Tesseract) return Promise.resolve();
  return new Promise((ok, falha) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload = ok;
    s.onerror = () => falha(new Error('Sem internet para carregar o leitor de texto.'));
    document.head.appendChild(s);
  });
}

async function lerComOCR(file, progresso) {
  await carregarTesseract();
  const canvas = await prepararImagem(file, 1800, true);
  const { data } = await window.Tesseract.recognize(canvas, 'por', {
    logger: m => { if (m.status === 'recognizing text') progresso(m.progress); }
  });
  return { ...interpretarTexto(data.text), fonte: 'texto', textoBruto: data.text };
}

async function lerComGemini(file, chave, modelo, progresso) {
  progresso(0.2);
  const canvas = await prepararImagem(file, 1600, false);
  const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  const prompt = `Você recebe a foto de uma ou mais embalagens de medicamento (amostra grátis) de uma farmácia no Brasil.
Responda APENAS um JSON com estes campos:
{"nome": nome do princípio ativo ou marca (string),
 "dosagem": ex "50 mg" (string, vazio se não souber),
 "unidades_por_embalagem": número de comprimidos/cápsulas/etc por caixa (número ou null),
 "unidade": "comprimidos" | "cápsulas" | "frascos" | "ampolas" | "bisnagas" | "unidades",
 "embalagens_na_foto": quantas caixas/frascos iguais aparecem na foto (número),
 "validade": data de validade no formato AAAA-MM-DD (se só houver mês/ano use o último dia do mês; vazio se não aparecer),
 "lote": string (vazio se não aparecer)}`;
  progresso(0.4);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent?key=${encodeURIComponent(chave)}`;
  const resp = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: 'image/jpeg', data: base64 } }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0 }
    })
  });
  if (!resp.ok) {
    const erro = await resp.json().catch(() => ({}));
    throw new Error('Gemini: ' + (erro.error?.message || resp.status));
  }
  progresso(0.9);
  const json = await resp.json();
  const txt = json.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '{}';
  const g = JSON.parse(txt.replace(/^```json|```$/g, '').trim());

  const caixas = Math.max(1, +g.embalagens_na_foto || 1);
  const porCaixa = +g.unidades_por_embalagem || null;
  return {
    nome: g.nome || '', dose: g.dosagem || '',
    quantidade: porCaixa ? porCaixa * caixas : caixas,
    unidade: porCaixa ? (g.unidade || 'comprimidos') : 'caixas',
    validade: /^\d{4}-\d{2}-\d{2}$/.test(g.validade || '') ? g.validade : '',
    lote: g.lote || '', caixas, porCaixa, fonte: 'ia'
  };
}

/** Função principal: escolhe IA (se houver chave) ou OCR. */
export async function lerFoto(file, { chaveGemini, modelo }, progresso = () => {}) {
  if (chaveGemini) {
    try { return await lerComGemini(file, chaveGemini, modelo || 'gemini-2.5-flash', progresso); }
    catch (e) { console.warn('Falha no Gemini, usando OCR:', e); progresso(0); }
  }
  return lerComOCR(file, progresso);
}
