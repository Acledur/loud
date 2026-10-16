// Cálculos do exame de mamas: localização por horário (→ quadrante) e texto/ID dos nódulos sólidos
// (agrupados por mama). Usados nos textos por {=nome:arg}; registrados em CALCULOS (gerador.ts).
import type { Resp } from './tipos';

const cm = (mm: unknown) => (Number(mm) / 10).toFixed(1).replace('.', ',');
const med = (r: Resp, p: string) => [1, 2, 3].map((i) => cm(r[`${p}.med.${i}`])).join(' x ');
const real = (v: unknown) => { const s = String(v ?? ''); return s && !s.startsWith('não citar') ? s : ''; };

/** Quadrante a partir do horário (mostrador visto de frente; lateral = 9h na mama direita e 3h na esquerda). */
function quadrante(hora: number, lado: string): string {
  const dir = lado === 'direita';
  if (hora === 12) return 'na junção dos quadrantes superiores';
  if (hora === 6) return 'na junção dos quadrantes inferiores';
  if (hora === 3) return `na junção dos quadrantes ${dir ? 'mediais' : 'laterais'}`;
  if (hora === 9) return `na junção dos quadrantes ${dir ? 'laterais' : 'mediais'}`;
  const sup = hora <= 2 || hora >= 10;
  const dir3 = hora <= 5; // 1–5h: lado do "3"; 7–11h: lado do "9"
  const lateral = dir3 ? !dir : dir;
  return `no quadrante ${sup ? 'supero' : 'infero'}${lateral ? 'lateral' : 'medial'}`;
}

function local(r: Resp, p: string, comMama: boolean): string {
  const hTxt = String(r[`${p}.hora`] ?? '');
  const h = Number(hTxt.match(/\d+/)?.[0]);
  const lado = String(r[`${p}.lado`] ?? 'direita');
  if (hTxt === 'retroareolar') return `na região retroareolar${comMama ? ` da mama ${lado}` : ''}`;
  if (!Number.isFinite(h)) return '[PREENCHER]';
  return `${quadrante(h, lado)}${comMama ? ` da mama ${lado}` : ''} ${hTxt}`;
}

type Nod = { lado: string; loc: string; desc: string; med: string; extra: string };
function nodulos(r: Resp): Nod[] {
  const out: Nod[] = [];
  for (let i = 1; i <= 6; i++) {
    const p = `ma.n${i}`;
    if (r[p] !== true) continue;
    const partes = [`${real(r[`${p}.eco`])} ${real(r[`${p}.forma`])}`.trim(), real(r[`${p}.orient`]), real(r[`${p}.acus`])].filter(Boolean);
    let extra = '';
    if (String(r[`${p}.sit`]).startsWith('citar')) extra += ` Encontra-se a ${cm(r[`${p}.mam`])} cm do mamilo e a ${cm(r[`${p}.pele`])} cm da pele.`;
    const ps = String(r[`${p}.pseudo`] ?? '');
    if (ps.includes('ilhota')) extra += ' Suas características ultrassonográficas permitem diagnóstico diferencial com ilhota de tecido adiposo.';
    else if (ps.includes('cisto')) extra += ' Suas características ultrassonográficas permitem diagnóstico diferencial com cisto de conteúdo espesso.';
    out.push({ lado: String(r[`${p}.lado`] ?? 'direita'), loc: local(r, p, false), desc: partes.join(', '), med: med(r, p), extra });
  }
  return out;
}

const NUM = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis'];

export const calculosMama: Record<string, (r: Resp, arg?: string) => string> = {
  mloc: (r, a) => local(r, a ?? '', true),   // "no quadrante inferolateral da mama esquerda às 4 horas"
  mlocn: (r, a) => local(r, a ?? '', false), // "no quadrante inferolateral às 4 horas"
  mnod: (r) => {
    const n = nodulos(r);
    if (!n.length) return '';
    if (n.length === 1) {
      const x = n[0];
      return `Presença de nódulo sólido na mama ${x.lado}, ${x.loc}, ${x.desc}, medindo ${x.med} cm.${x.extra}`;
    }
    const linhas = [`Presença de ${NUM[n.length]} nódulos sólidos nas seguintes topografias:`];
    for (const lado of ['direita', 'esquerda']) {
      const l = n.filter((x) => x.lado === lado);
      if (!l.length) continue;
      linhas.push(`Mama ${lado}:`, ...l.map((x) => `- ${x.loc}, nódulo ${x.desc}, medindo ${x.med} cm.${x.extra}`));
    }
    return linhas.join('\n');
  },
  mnodconcl: (r) => {
    const n = nodulos(r);
    if (!n.length) return '';
    const lados = [...new Set(n.map((x) => x.lado))];
    if (lados.length > 1) return 'Nódulos bilaterais.';
    return n.length === 1 ? `Nódulo na mama ${lados[0]}.` : `Nódulos na mama ${lados[0]}.`;
  },
};
