// ============================================================================
// ULTRASSONOGRAFIA DO COTOVELO (dados). Exame de um cotovelo só: o seletor "Lado examinado"
// muda o título (DIREITO / ESQUERDO). Tendões normais/tendinopatias aparecem em pares
// (extensores+flexores, bíceps+tríceps) numa frase só — ver calculosCotovelo (usado por gerador.ts).
// "Líquido peritendíneo" e "bolsa olecraneana" ficaram de fora (pedido do médico).
// ============================================================================
import type { Campo, Exame, Opc, Resp, Secao } from '../tipos';
import { chk, dims, esc as escBase, fixo, mm, sel } from './abdomeTotal';

const texto = (id: string, rotulo: string, padrao: string): Campo => ({ id, tipo: 'texto', rotulo, padrao });
const esc = (id: string, opcoes: Opc[], extra: { ordem?: number; rotulo?: string } = {}) => escBase(id, 'radio', opcoes, extra);
const NORMAL = 'com ecotextura e espessura preservadas e contornos normais';
const SEM_ROTURA = 'com alteração ecotextural, mas sem evidências de rotura';

type K = 'ext' | 'flex' | 'bic' | 'tri';
const T: { k: K; titulo: string; normal: string; alt: string }[] = [
  { k: 'ext', titulo: 'Tendão comum dos extensores do antebraço', normal: 'Tendão comum dos extensores do antebraço', alt: 'Tendão comum dos extensores' },
  { k: 'flex', titulo: 'Tendão comum dos flexores do antebraço', normal: 'Tendão comum dos flexores do antebraço', alt: 'Tendão comum dos flexores' },
  { k: 'bic', titulo: 'Tendão do bíceps braquial', normal: 'Tendão do bíceps braquial', alt: 'Tendão do bíceps braquial' },
  { k: 'tri', titulo: 'Tendão do tríceps braquial', normal: 'Tendão do tríceps braquial', alt: 'Tendão do tríceps braquial' },
];
const PAR: Record<K, K> = { ext: 'flex', flex: 'ext', bic: 'tri', tri: 'bic' };
const NORMAL_PAR: Record<string, string> = { ext: 'Tendão comum dos extensores do antebraço e comum dos flexores do antebraço', bic: 'Tendão do bíceps braquial e do tríceps braquial' };
const ALT_PAR: Record<string, string> = { ext: 'Tendão comum dos extensores e comum dos flexores espessados', bic: 'Tendão do bíceps braquial e do tríceps braquial espessados' };
const FLAG: Record<K, string> = { ext: 'calc', flex: 'calc', bic: 'calc', tri: 'ent' }; // caixa extra do "aspecto normal"

const tipo = (r: Resp, k: K) => String(r[`co.${k}.tipo`] ?? 'normal');
const normal = (r: Resp, k: K) => tipo(r, k) === 'normal' && r[`co.${k}.${FLAG[k]}`] !== true;
const cm = (v: unknown) => (Number(v) / 10).toFixed(1).replace('.', ',');
/** Calcificação citada na tendinopatia do bíceps (texto extra); '' = não citar. */
const calcBic = (r: Resp, k: K) => {
  if (k !== 'bic') return '';
  const c = String(r['co.bic.tipo.calc'] ?? '');
  return c.startsWith('com pequenas') ? ' Notam-se pequenas calcificações junto à inserção.' : c.startsWith('com calcificação') ? ` Nota-se calcificação junto à inserção, medindo ${cm(r['co.bic.tipo.cal'])} cm.` : '';
};
const simples = (r: Resp, k: K) => tipo(r, k) === 'tend' && !calcBic(r, k); // tendinopatia sem nada a mais (pode juntar com o par)

export const calculosCotovelo: Record<string, (r: Resp, arg?: string) => string> = {
  // tendão normal: par normal numa frase só (na posição do 1º); se o par está alterado, cada normal tem a sua
  cotnorm: (r, a) => {
    const k = a as K;
    if (!normal(r, k)) return '';
    if (normal(r, PAR[k])) return NORMAL_PAR[k] ? `${NORMAL_PAR[k]} ${NORMAL}.` : '';
    return `${T.find((t) => t.k === k)!.normal} ${NORMAL}.`;
  },
  // tendinopatia sem rotura: par com a mesma situação numa frase só
  cottend: (r, a) => {
    const k = a as K;
    if (simples(r, k) && simples(r, PAR[k])) return ALT_PAR[k] ? `${ALT_PAR[k]}, ${SEM_ROTURA}.` : '';
    return `${T.find((t) => t.k === k)!.alt} espessado, ${SEM_ROTURA}.${calcBic(r, k)}`;
  },
};

const secaoTendao = (t: (typeof T)[number], i: number): Secao => {
  const { k, titulo, alt } = t;
  const p = `co.${k}`;
  const epi = k === 'ext' ? " (i.e. 'epicondilite lateral')" : k === 'flex' ? " (i.e. 'epicondilite medial')" : '';
  const tendConcl = k === 'ext' ? 'Tendinopatia dos extensores (epicondilite lateral).' : k === 'flex' ? 'Tendinopatia dos flexores (epicondilite medial).'
    : `Tendinopatia do ${k === 'bic' ? 'bíceps' : 'tríceps'} braquial.`;
  const nome = k === 'ext' ? 'dos extensores' : k === 'flex' ? 'dos flexores' : k === 'bic' ? 'do bíceps braquial' : 'do tríceps braquial';
  const opcoes: Opc[] = [
    { id: 'normal', r: 'aspecto normal' },
    { id: 'tend', r: `tendinopatia sem rotura${epi}`, corpo: `{=cottend:${k}}`, concl: tendConcl,
      ...(k === 'bic' ? { campos: [
        sel('calc', 'calcificações', [{ r: 'não citar calcificações' }, { r: 'com pequenas calcificações junto à inserção' }, { r: 'com calcificação medindo' }]),
        mm('cal', 'calcificação medindo (mm)', 10)] } : {}) },
    { id: 'parcial', r: 'rotura parcial medindo', campos: [dims('med', 'medidas (mm)', 2, 10)],
      corpo: `${alt} hipoecogênico, heterogêneo, observando-se sinais de rotura parcial medindo {med} cm.`, concl: `Tendinopatia ${nome}, com sinais de rotura parcial.` },
  ];
  if (k === 'bic') {
    opcoes.push({ id: 'completa', r: 'rotura completa',
      campos: [mm('int', 'intervalo (mm)', 10), sel('retr', 'retração', [{ r: 'sem retração do coto', t: '' }, { r: 'com retração do coto', t: ', com retração do coto' }])],
      corpo: 'Tendão do bíceps braquial com sinais de rotura completa, com {int|cm} cm de intervalo{retr}.', concl: 'Rotura completa do tendão do bíceps braquial.' });
  }
  const extra = k === 'tri'
    ? { ...chk(`${p}.ent`, 'entesófito medindo', `${t.normal} ${NORMAL}, notando-se entesófito medindo {mm|cm} cm junto à inserção.`, 'Entesófito junto à inserção do tendão do tríceps braquial.', [mm('mm', 'entesófito medindo (mm)', 10)], 11), desativadoPor: [`${p}.tipo`] }
    : { ...chk(`${p}.calc`, 'pequenas calcificações junto à inserção', `${t.normal} ${NORMAL}, notando-se pequenas calcificações junto à inserção.`, `Pequenas calcificações junto à inserção ${nome}.`, undefined, 11), desativadoPor: [`${p}.tipo`] };
  return {
    id: p, titulo, ordem: 10 * (i + 1),
    controles: [esc(`${p}.tipo`, opcoes, { ordem: 10 }), fixo(`${p}.norm`, `{=cotnorm:${k}}`, { ordem: 10 }), extra],
  };
};

const nervo: Secao = {
  id: 'co.nervo', titulo: 'Nervo ulnar', ordem: 50,
  controles: [
    esc('co.nervo.tipo', [
      { id: 'normal', r: 'espessura normal', corpo: 'Nervo ulnar de espessura, contornos e ecotextura normais.' },
      { id: 'aum', r: 'espessura aumentada', campos: [
        sel('area', 'área seccional', [{ r: 'não citar área seccional', t: '' }, { r: 'citar área seccional', t: ', com área seccional de {ass} mm²' }]),
        texto('ass', 'área seccional (mm²)', '9')],
      corpo: 'Nervo ulnar com espessura aumentada{area}.', concl: 'Espessamento do nervo ulnar.' },
    ], { ordem: 10 }),
    chk('co.nervo.sub', 'sofre subluxação durante manobra de flexão do cotovelo', 'O nervo ulnar sofre subluxação durante a manobra de flexão do cotovelo.', 'Subluxação do nervo ulnar durante a flexão do cotovelo.', undefined, 20),
    chk('co.nervo.lux', 'sofre luxação durante manobra de flexão do cotovelo', 'O nervo ulnar sofre luxação durante a manobra de flexão do cotovelo.', 'Luxação do nervo ulnar durante a flexão do cotovelo.', undefined, 30),
  ],
};

const derrame: Secao = {
  id: 'co.derrame', titulo: 'Derrame articular', ordem: 60,
  controles: [esc('co.derrame.tipo', [
    { id: 'aus', r: 'ausente', corpo: 'Ausência de derrame articular.' },
    { id: 'pres', r: 'presente', corpo: 'Presença de líquido intra-articular.', concl: 'Derrame articular.' },
  ], { ordem: 10 })],
};

export const cotovelo: Exame = {
  id: 'cotovelo',
  titulo: 'Cotovelos',
  tituloLaudo: 'ULTRASSONOGRAFIA DO COTOVELO',
  tituloVar: { ctl: 'co.lado', opcoes: { direito: 'ULTRASSONOGRAFIA DO COTOVELO DIREITO', esquerdo: 'ULTRASSONOGRAFIA DO COTOVELO ESQUERDO' } },
  restante: 'Restante do exame sem anormalidades detectáveis pelo método.',
  secoes: [
    { id: 'co.ladosec', titulo: 'Lado examinado', ordem: -1, controles: [esc('co.lado', [{ r: 'direito' }, { r: 'esquerdo' }])] },
    ...T.map(secaoTendao),
    nervo,
    derrame,
  ],
};
