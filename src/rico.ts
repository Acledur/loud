import type { Linha } from './tipos';

const escHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Linhas do laudo -> HTML do editor. Pendências entre colchetes ganham destaque. */
export function linhasParaHtml(ls: Linha[]): string {
  return ls
    .map((l) => {
      const t = escHtml(l.t).replace(/\[(?:PREENCHER|REVISAR)[^\]]*\]/g, '<mark>$&</mark>');
      return `<p align="${l.a}" style="text-align:${l.a};margin:0">${l.t ? (l.b ? `<b>${t}</b>` : t) : '<br>'}</p>`;
    })
    .join('');
}

const alinhamento = (b: Element) => {
  const ta = getComputedStyle(b).textAlign;
  return ta === 'center' || ta === 'right' || ta === 'justify' ? ta : 'left';
};

/**
 * HTML para colar no Word. Lê o alinhamento REAL de cada parágrafo do editor (inclusive o que você mudou
 * com os botões) e grava no formato que o Word usa (classe MsoNormal + atributo align + estilo).
 */
export function htmlParaCopia(el: HTMLElement): string {
  const blocos = Array.from(el.children).map((b) => {
    const a = alinhamento(b);
    const interno = b.innerHTML.replace(/<\/?mark[^>]*>/g, '');
    return `<p class="MsoNormal" align="${a}" style="margin:0cm;text-align:${a};font-family:'Times New Roman',serif;font-size:12pt">${interno}</p>`;
  });
  return blocos.length ? blocos.join('') : el.innerHTML.replace(/<\/?mark[^>]*>/g, '');
}

// ---------- RTF (abre direto no Word, com alinhamento, negrito e itálico) ----------
const rtfTxt = (s: string) => {
  let o = '';
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    const ch = s[i];
    if (ch === '\\' || ch === '{' || ch === '}') o += '\\' + ch;
    else if (c < 128) o += ch;
    else o += `\\u${c > 32767 ? c - 65536 : c}?`;
  }
  return o;
};

const TW_LARGURA = 9072; // 16 cm (A4 com margens de 2,5 cm)
const TW_ALTURA_MAX = 2200; // ~3,9 cm

/** PNG (data URI) -> grupo \pict do RTF, cabendo em 16 x 3,9 cm. Vazio se não for PNG. */
function pictRtf(uri: string): string {
  const bin = atob(uri.slice(uri.indexOf(',') + 1));
  if (bin.slice(1, 4) !== 'PNG') return '';
  const u32 = (i: number) => ((bin.charCodeAt(i) << 24) | (bin.charCodeAt(i + 1) << 16) | (bin.charCodeAt(i + 2) << 8) | bin.charCodeAt(i + 3)) >>> 0;
  const w = u32(16), h = u32(20);
  const gw = Math.round(Math.min(TW_LARGURA, (TW_ALTURA_MAX * w) / h));
  const gh = Math.round((gw * h) / w);
  let hex = '';
  for (let i = 0; i < bin.length; i++) hex += bin.charCodeAt(i).toString(16).padStart(2, '0');
  return `{\\pict\\pngblip\\picw${w}\\pich${h}\\picwgoal${gw}\\pichgoal${gh}\n${hex}}`;
}

/** Converte o conteúdo do editor em um arquivo RTF. Imagens (PNG) entram no cabeçalho/rodapé de cada página. */
export function htmlParaRtf(el: HTMLElement, imgs: { cab?: string; rod?: string } = {}): string {
  const cab = imgs.cab ? pictRtf(imgs.cab) : '';
  const rod = imgs.rod ? pictRtf(imgs.rod) : '';
  const pagina = cab || rod
    ? `\\paperw11906\\paperh16838\\margl1417\\margr1417\\margt${cab ? 2750 : 1417}\\margb${rod ? 2750 : 1417}\\headery340\\footery340 `
      + (cab ? `{\\header\\pard\\qc ${cab}\\par}` : '') + (rod ? `{\\footer\\pard\\qc ${rod}\\par}` : '')
    : '';
  const al: Record<string, string> = { center: '\\qc', right: '\\qr', justify: '\\qj', left: '\\ql' };
  const paragrafos = Array.from(el.children).map((p) => {
    let out = '';
    if (p.textContent) {
      const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      for (let n = w.nextNode(); n; n = w.nextNode()) {
        if (n.nodeType === 1) { if ((n as Element).tagName === 'BR') out += '\\line '; continue; }
        const cs = getComputedStyle((n as Text).parentElement!);
        const negrito = Number(cs.fontWeight) >= 600 || cs.fontWeight === 'bold';
        out += `{${negrito ? '\\b ' : ''}${cs.fontStyle === 'italic' ? '\\i ' : ''}${rtfTxt(n.textContent ?? '')}}`;
      }
    }
    return `\\pard${al[alinhamento(p)]}\\sa0 ${out}\\par`;
  });
  return `{\\rtf1\\ansi\\ansicpg1252\\deff0{\\fonttbl{\\f0 Times New Roman;}}${pagina}\\f0\\fs24 ${paragrafos.join('\n')}}`;
}
