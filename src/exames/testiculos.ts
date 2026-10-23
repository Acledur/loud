// ============================================================================
// ULTRASSONOGRAFIA DE BOLSA TESTICULAR (dados). Cada seção traz os controles dos
// dois lados (direito/esquerdo); a conclusão junta "à direita" + "à esquerda" em "bilateral".
// REVISAR: textos de duração do refluxo, localização da criptorquidia e fluxo intratesticular.
// ============================================================================
import type { Controle, Exame, Opc, Secao } from '../tipos';
import { chk, dims, esc, fixo, ops, sel } from './abdomeTotal';

type Lado = { k: 'd' | 'e'; n: string; a: string };
const D: Lado = { k: 'd', n: 'direito', a: 'direita' };
const E: Lado = { k: 'e', n: 'esquerdo', a: 'esquerda' };
const id = (l: Lado, x: string) => `te.${l.k}.${x}`;
const ord = (l: Lado, n: number) => (l.k === 'd' ? n : n + 10); // direito primeiro, depois esquerdo
const alt = (l: Lado) => ['orq', 'eco', 'crip', 'nod'].map((x) => id(l, x)); // alterações que tiram a frase "normal" do testículo
const nt = (t: string, extra: Partial<Opc> = {}): Opc => ({ r: t, t: '', ...extra }); // opção "não citar"
const bil = (...bases: string[]) => bases.map((base) => ({ base, resultado: `${base} bilateral.` }));

const LOC = ops('no canal inguinal', 'no terço proximal do canal inguinal', 'no terço médio do canal inguinal', 'no terço distal do canal inguinal', 'na cavidade abdominal');

const liquido = (l: Lado): Controle[] => [
  esc(id(l, 'liq'), 'radio', [
    { r: 'líquido em quantidade fisiológica' },
    {
      r: 'hidrocele',
      campos: [sel('q', 'quantidade', ops('discreta', 'moderada', 'acentuada')), sel('asp', 'aspecto', ops('de aspecto anecogênico', 'com finos debris em suspensão', 'com finos septos'))],
      corpo: `Acúmulo de líquido {asp} na hemibolsa testicular ${l.a}, em quantidade {q}.`, concl: `Hidrocele à ${l.a}.`,
    },
  ], { ordem: ord(l, 10), rotulo: `Hemibolsa testicular ${l.a.toUpperCase()}` }),
];

const testiculo = (l: Lado): Controle[] => {
  const off = [id(l, 'orq')];
  return [
    {
      ...chk(id(l, 'orq'), `testículo ${l.n}: orquiectomia`, `Ausência do testículo ${l.n}, em paciente submetido a orquiectomia{prot}.`,
        `Status pós-orquiectomia à ${l.a}.`, [sel('prot', 'prótese', [nt('sem prótese'), { r: 'presença de prótese testicular', t: ', notando-se prótese testicular em sua loja' }])], ord(l, 1)),
    },
    { ...chk(id(l, 'crip'), `testículo ${l.n}: criptorquidia`, `Testículo ${l.n} em topografia anômala, situado {loc}.`, `Criptorquidia à ${l.a}.`, [sel('loc', 'localização', LOC)], ord(l, 2)), desativadoPor: off },
    {
      ...esc(id(l, 'eco'), 'radio', [
        { r: 'aspecto homogêneo' },
        { r: 'ecotextura heterogênea, sem lesões focais', corpo: `O testículo ${l.n} tem contornos regulares e ecotextura heterogênea, sem lesões focais.`, concl: `Ecotextura testicular heterogênea à ${l.a}.` },
        { r: 'ecotextura heterogênea + microlitíase', corpo: `O testículo ${l.n} tem contornos regulares, notando-se múltiplas calcificações puntiformes distribuídas pelo parênquima.`, concl: `Sinais de microlitíase testicular à ${l.a}.` },
      ], { ordem: ord(l, 3), rotulo: `Testículo ${l.n}` }),
      desativadoPor: off,
    },
    {
      ...chk(id(l, 'nod'), `testículo ${l.n}: nódulo`,
        `{!${id(l, 'eco')}!Testículo ${l.n} de contornos regulares. }Nota-se um nódulo {tipo} {eco} de {cont} situado {loc} do testículo, medindo {med} cm.{vasc}{irs}`,
        `Imagem nodular no testículo à ${l.a}.`,
        [
          sel('tipo', 'tipo', ops('sólido', 'cístico', 'sólido-cístico')),
          sel('eco', 'ecogenicidade', ops('hipoecogênico', 'hiperecogênico', 'isoecogênico', 'heterogêneo', 'anecogênico')),
          sel('cont', 'contornos', ops('contornos regulares', 'contornos irregulares', 'contornos lobulados')),
          sel('loc', 'localização', ops('no terço superior', 'no terço médio', 'no terço inferior')),
          dims('med', 'o nódulo mede (mm)', 3, 10),
          sel('vasc', 'vascularização', [nt('não citar vascularização'),
            { r: 'periférica e central', t: ' Nota-se vascularização periférica e central ao Doppler.' },
            { r: 'apenas periférica', t: ' Nota-se vascularização apenas periférica ao Doppler.' },
            { r: 'sem vascularização', t: ' Não há vascularização ao Doppler.' }]),
          sel('irs', 'índice de resistividade', [nt('não citar índice de resistividade'), { r: 'citar índice de resistividade', t: ' Índice de resistividade de {ir}.' }]),
          { id: 'ir', tipo: 'texto', rotulo: 'IR', padrao: '0,65' },
        ], ord(l, 4)),
      desativadoPor: off,
    },
  ];
};

const fluxo = (l: Lado): Controle[] => [
  {
    ...chk(id(l, 'flux'), `testículo ${l.n}: fluxo intratesticular ao Doppler`, `A avaliação com Doppler demonstra vascularização {fl} no testículo ${l.n}.`, '{fl|c}', [
      sel('fl', 'fluxo', [
        { r: 'normal', t: 'normal', c: '' },
        { r: 'reduzido', t: 'reduzida', c: `Redução do fluxo vascular intratesticular à ${l.a}.` },
        { r: 'ausente', t: 'ausente', c: `Ausência de fluxo vascular intratesticular à ${l.a}.` },
        { r: 'aumentado', t: 'aumentada', c: `Aumento do fluxo vascular intratesticular à ${l.a}.` },
      ]),
    ], ord(l, 10)),
    desativadoPor: [id(l, 'orq')],
  },
];

const medidas = (l: Lado): Controle[] => [
  {
    ...chk(id(l, 'med'), `testículo ${l.n}: medidas e volume`, `O testículo ${l.n} apresenta dimensões {dm}, medindo: {med} cm. Volume = {med|vol} cm³.`, undefined, [
      dims('med', 'mede (mm)', 3, [40, 25, 20]),
      sel('dm', 'dimensões', ops('normais', 'aumentadas', 'reduzidas')),
    ], ord(l, 10)),
    marcado: true, desativadoPor: [id(l, 'orq')],
  },
];

const plexo = (l: Lado): Controle[] => [
  esc(id(l, 'plx'), 'radio', [
    { r: 'plexo pampiniforme normal' },
    {
      r: 'veias ectasiadas',
      campos: [sel('cal', 'calibre', [nt('não citar calibre máximo'), { r: 'citar calibre máximo', t: ', com calibre máximo de {mx} mm' }]), { id: 'mx', tipo: 'texto', rotulo: 'calibre máximo (mm)', padrao: '4,0' }],
      corpo: `{=tplx:${l.k}}`, concl: `Sinais de varicocele à ${l.a}.`,
    },
    {
      r: 'veias ectasiadas + refluxo ao Doppler',
      campos: [sel('dur', 'duração do refluxo', [nt('não citar duração do refluxo'), { r: 'mantido durante todo o esforço', t: ', mantido durante todo o esforço' }, { r: 'de curta duração', t: ', de curta duração' }])],
      corpo: `Observa-se ectasia e tortuosidade das veias do plexo pampiniforme à ${l.a}, com refluxo significativo às manobras respiratórias{dur}.`,
      concl: `Sinais de varicocele à ${l.a}, com refluxo ao Doppler.`,
    },
  ], { ordem: ord(l, 10), rotulo: `Plexo pampiniforme ${l.a}` }),
  { ...chk(id(l, 'sref'), `plexo ${l.a}: citar ausência de refluxo ao Doppler`, `Não se observa refluxo ao Doppler no plexo pampiniforme ${l.a}.`, undefined, undefined, ord(l, 11)), desativadoPor: [id(l, 'plx')] },
];

const epididimo = (l: Lado): Controle[] => [
  esc(id(l, 'epi'), 'radio', [
    { r: 'ecotextura homogênea' },
    { r: 'ecotextura heterogênea, sem outros achados', corpo: `Epidídimo ${l.n} com contornos regulares e ecotextura heterogênea, sem outros achados.`, concl: `Ecotextura heterogênea do epidídimo à ${l.a}.` },
    {
      r: 'epididimite (aumentado e heterogêneo)',
      campos: [sel('hv', 'hipervascularização', [nt('não citar hipervascularização ao Doppler'), { r: 'citar hipervascularização ao Doppler', t: ', com hipervascularização ao Doppler' }])],
      corpo: `Epidídimo ${l.n} com dimensões aumentadas e ecotextura difusamente heterogênea{hv}.`, concl: `Achados compatíveis com epidídimite à ${l.a}.`,
    },
    {
      r: 'cisto na cabeça, medindo',
      campos: [dims('med', 'medidas (mm)', 2, [10, 4], true)],
      corpo: `{=tepi:${l.k}}`, concl: `Cisto de epidídimo à ${l.a}.`,
    },
  ], { ordem: ord(l, 10), rotulo: `Epidídimo ${l.n}` }),
];

// frases "normais": ambos os lados normais = 1 frase; se só um lado está alterado, o outro ganha frase própria
const normais = (idN: string, ambos: string, lado: (l: Lado) => string, suprim: (l: Lado) => string[], ordem: number): Controle[] => [
  fixo(`${idN}.ambos`, ambos, { ordem: 0, suprimidoPor: [...suprim(D), ...suprim(E)] }),
  fixo(`${idN}.d`, lado(D), { ordem: ord(D, ordem), suprimidoPor: suprim(D), apenasSe: suprim(E) }),
  fixo(`${idN}.e`, lado(E), { ordem: ord(E, ordem), suprimidoPor: suprim(E), apenasSe: suprim(D) }),
];

const secao = (idS: string, titulo: string, ordem: number, gen: (l: Lado) => Controle[], extra: Partial<Secao> = {}, fixos: Controle[] = []): Secao =>
  ({ id: idS, titulo, ordem, controles: [...fixos, ...gen(D), ...gen(E)], ...extra });

export const testiculos: Exame = {
  id: 'testiculos',
  titulo: 'Bolsa testicular',
  tituloLaudo: 'ULTRASSONOGRAFIA DA BOLSA TESTICULAR',
  tituloDop: { ctls: [id(D, 'flux'), id(E, 'flux')], titulo: 'ULTRASSONOGRAFIA DA BOLSA TESTICULAR COM DOPPLER' },
  secoes: [
    secao('te.liq', 'Líquido (hemibolsas)', 10, liquido, { umaPorLinha: true, bilateral: bil('Hidrocele') },
      [fixo('te.liq.n', 'Líquido em quantidade fisiológica na bolsa testicular.', { ordem: 0, suprimidoPor: [id(D, 'liq'), id(E, 'liq')] })]),
    secao('te.dim', 'Dimensões dos testículos', 40, medidas, { umaPorLinha: true }),
    secao('te.tes', 'Testículos', 20, testiculo, {
      umaPorLinha: true,
      bilateral: bil('Status pós-orquiectomia', 'Criptorquidia', 'Ecotextura testicular heterogênea', 'Sinais de microlitíase testicular').concat(
        [{ base: 'Imagem nodular no testículo', resultado: 'Imagens nodulares testiculares bilaterais.' }]),
    }, normais('te.tes', 'Testículos de contornos regulares e ecotextura homogênea.',
      (l) => `Testículo ${l.n} de contornos regulares e ecotextura homogênea.`, alt, 3)),
    secao('te.dop', 'Fluxo intratesticular (Doppler)', 30, fluxo, {
      umaPorLinha: true,
      bilateral: bil('Redução do fluxo vascular intratesticular', 'Ausência de fluxo vascular intratesticular', 'Aumento do fluxo vascular intratesticular'),
    }),
    secao('te.plx', 'Plexo pampiniforme', 50, plexo, { umaPorLinha: true, bilateral: bil('Sinais de varicocele') },
      normais('te.plx', 'Não há dilatação das veias do plexo pampiniforme bilateralmente.',
        (l) => `Não há dilatação das veias do plexo pampiniforme à ${l.a}.`, (l) => [id(l, 'plx')], 10)),
    secao('te.epi', 'Epidídimos', 60, epididimo, {
      bilateral: [
        { base: 'Ecotextura heterogênea do epidídimo', resultado: 'Ecotextura heterogênea dos epidídimos.' },
        { base: 'Achados compatíveis com epidídimite', resultado: 'Achados compatíveis com epidídimite bilateral.' },
        { base: 'Cisto de epidídimo', resultado: 'Cistos de epidídimo bilaterais.' },
      ],
    }, normais('te.epi', 'Epidídimos com contornos regulares e ecotextura homogênea.',
      (l) => `Epidídimo ${l.n} com contornos regulares e ecotextura homogênea.`, (l) => [id(l, 'epi')], 10)),
  ],
};
