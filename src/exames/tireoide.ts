// ULTRASSONOGRAFIA DA TIREOIDE (dados). Medidas são digitadas em mm.
import type { Check, Exame, Opc, Secao } from '../tipos';
import { chk, dims, esc, fixo, mm, ops, sel } from './abdomeTotal';

const LADO = ops('direita', 'esquerda');
const LADO_LINF: Opc[] = [{ r: '(escolher lado)', t: '[PREENCHER: lado]' }, ...LADO];

// Localização: começa em branco; o 1º item força a escolha ([PREENCHER] no laudo).
// t = texto no corpo, c = lado na conclusão, g = lobo no cabeçalho da lista de nódulos.
const posicoes = (modo: 'nodulo' | 'cisto'): Opc[] => [
  { r: '(escolher localização)', t: '[PREENCHER: localização]', c: '[PREENCHER: lado]', g: '[PREENCHER: lobo]' },
  ...(['direito', 'esquerdo'] as const).flatMap((lobo) => (['superior', 'médio', 'inferior'] as const).map((terco) => ({
    r: `terço ${terco} do lobo ${lobo}`,
    t: modo === 'nodulo' ? `terço ${terco}` : `terço ${terco} do lobo ${lobo}`,
    c: lobo === 'direito' ? 'à direita' : 'à esquerda',
    g: `no lobo ${lobo}`,
  }))),
  { r: 'istmo', t: 'istmo', c: 'no istmo', g: 'no istmo' },
];

const ECO = ops('hipoecogênico', 'isoecogênico', 'hiperecogênico', 'anecogênico');
const ECO_LINF = ops('hipoecogênico', 'isoecogênico', 'hiperecogênico', 'cístico');
const CONTORNOS = ops('regulares', 'irregulares', 'lobulados');
const COMPOSICAO = ops('sólido', 'misto (sólido/cístico)', 'cístico', 'espongiforme');
const SITIOS = ops('sítio nodal IA', 'sítio nodal IB', 'sítio nodal IIA', 'sítio nodal IIB', 'sítio nodal III', 'sítio nodal IV', 'sítio nodal VA', 'sítio nodal VB', 'sítio nodal VI');

// Opções "opcionais": a 1ª (não citar) não escreve nada; as outras acrescentam uma frase.
const opcional = (rs: string[], frase: (r: string) => string): Opc[] =>
  [{ r: 'não citar', t: '' }, ...rs.map((r) => ({ r, t: frase(r) }))];
const VASC = opcional(['periférica e central', 'periférica', 'central'], (r) => ` Ao Doppler a vascularização é ${r}.`);
const IR = opcional(['0,60', '0,65', '0,70', '0,75'], (r) => ` Índice de resistividade de ${r}.`);
const TIRADS = opcional(['1', '2', '3', '4', '5'], (r) => ` Classificação TI-RADS: ${r}.`);
const CALC_NODULO: Opc[] = [
  { r: 'não citar', t: '' },
  { r: 'sem calcificações', t: ', sem calcificações' },
  { r: 'com calcificações puntiformes', t: ', com calcificações puntiformes centrais' },
  { r: 'com calcificações grosseiras', t: ', com calcificações grosseiras' },
];
const CALC_LINF: Opc[] = [
  { r: 'não citar', t: '' },
  { r: 'sem calcificações', t: ' Não há calcificações.' },
  { r: 'com calcificações puntiformes', t: ' Presença de calcificações puntiformes.' },
  { r: 'com calcificações grosseiras', t: ' Presença de calcificações grosseiras.' },
];
const ASPECTO: Opc[] = [
  { r: 'não citar', t: '' },
  { r: 'mais alto do que largo', t: ', com orientação vertical (mais alto do que largo)' },
  { r: 'mais largo do que alto', t: ', com orientação horizontal (mais largo do que alto)' },
];
const paaf = (n: number): Opc[] => [
  { r: 'não sugerir PAAF', t: '' },
  { r: 'sugerir PAAF', t: ` Sugere-se avaliação complementar do nódulo N${n} com punção aspirativa (PAAF).` },
];

// Achados que contradizem "não se observando lesões nodulares" / pedem "restante do parênquima".
const NOD = [...[1, 2, 3, 4, 5, 6].map((n) => `nodulos.n${n}`), 'nodulos.multiplos'];
const ACHADOS = [...NOD, 'tireoide.cistosColoides', 'tireoide.cistoColoide'];
const SE_NOD = NOD.join(',');
const SE_ACHADOS = ACHADOS.join(',');

const nodulo = (n: number): Check => ({
  tipo: 'check', id: `nodulos.n${n}`, rotulo: `Descrever Nódulo ${n}`, ordem: n,
  item: `N${n}: {local}, nódulo {composicao} {eco}, de contornos {contornos}{aspecto}{calc}, medindo {med} cm.{vasc}{tirads}{paaf}`,
  campos: [
    dims('med', 'medidas (mm)', 3, 10),
    sel('composicao', 'composição', COMPOSICAO),
    sel('local', 'localização', posicoes('nodulo')),
    sel('eco', 'ecogenicidade', ECO),
    sel('contornos', 'contornos', CONTORNOS),
    sel('aspecto', 'aspecto', ASPECTO),
    sel('calc', 'calcificações', CALC_NODULO),
    sel('vasc', 'vascularização', VASC),
    sel('tirads', 'TI-RADS', TIRADS),
    sel('paaf', 'PAAF', paaf(n)),
  ],
});

const secoes: Secao[] = [
  {
    id: 'tireoide', titulo: 'Tireoide', ordem: 10,
    controles: [
      esc('tireoide.sexo', 'radio', ops('Feminino', 'Masculino'), { rotulo: 'Sexo' }),
      esc('tireoide.ecotextura', 'radio', [
        { r: 'parênquima com ecotextura normal' },
        { r: 'alteração textural difusa inespecífica', corpo: `A ecotextura é difusamente heterogênea{!${SE_ACHADOS}!, não se observando nódulos}.`, concl: 'Sinais ecográficos inespecíficos de tireoidopatia difusa.' },
        { r: 'alteração textural tipo tireoidite', corpo: 'A ecotextura é difusamente heterogênea, com múltiplas áreas hipoecogênicas mal delimitadas confluentes, sem configuração nodular.', concl: 'Aspecto ecográfico sugestivo de tireoidite.' },
      ], { rotulo: 'Ecotextura do parênquima', ordem: 11 }),
      // "dimensões reduzidas/normais/aumentadas" vem do volume e do sexo (ver CALCULOS no motor)
      fixo('tireoide.t1', 'Tireoide tópica, com dimensões {=dimtireoide} e contornos regulares.',
        { ordem: 10, suprimidoPor: ['tireoide.tireoidectomia', 'tireoide.hemitireoidectomia'] }),
      fixo('tireoide.eco', `{!${SE_ACHADOS}!A ecotextura é homogênea, não se observando lesões nodulares.}{?${SE_ACHADOS}?O restante do parênquima tireoidiano apresenta ecotextura homogênea.}`,
        { ordem: 11, suprimidoPor: ['tireoide.ecotextura', 'tireoide.tireoidectomia', 'tireoide.hemitireoidectomia'] }),
      chk('tireoide.tireoidectomia', 'tireoidectomia total', 'Tireoide não caracterizada (status pós-cirúrgico). Não há evidências sonográficas de lesões focais no leito tireoidiano.', 'Status pós-tireoidectomia total.', undefined, 5),
      chk('tireoide.hemitireoidectomia', 'hemitireoidectomia', '{lado}', 'Status pós-hemitireoidectomia {lado|c}.', [
        sel('lado', 'lado', [
          { r: 'direita', c: 'direita', t: 'Lobo direito ausente (status pós cirúrgico). Lobo esquerdo tópico, com contornos {cont}.' },
          { r: 'esquerda', c: 'esquerda', t: 'Lobo esquerdo ausente (status pós cirúrgico). Lobo direito tópico, com contornos {cont}.' },
        ]),
        sel('cont', 'contornos do lobo restante', ops('regulares', 'lobulados')),
      ], 6),
    ],
  },
  {
    id: 'nodulos', titulo: 'Nódulos', ordem: 20,
    controles: [
      ...[1, 2, 3, 4, 5, 6].map(nodulo),
      {
        tipo: 'grupo', id: 'nodulos.grupo', ordem: 10,
        itens: [1, 2, 3, 4, 5, 6].map((n) => `nodulos.n${n}`),
        genero: 'm', juntar: 'lista',
        um: 'É identificado um nódulo localizado {lobo}:\n- {itens}',
        varios: 'São identificados {n} nódulos localizados {lobo}:\n{itens}',
        unico: [{ token: 'lobo', campo: 'local', usar: 'g' }, { token: 'lado', campo: 'local', usar: 'c' }],
        conclUm: 'Nódulo tireoidiano {lado}.',
        conclVarios: 'Nódulos tireoidianos {lado}.',
      },
      chk('nodulos.multiplos', 'Descrever Múltiplos Nódulos',
        'Múltiplos nódulos tireoidianos, medindo até {dir} mm à direita e até {esq} mm à esquerda, de aspecto {composicao}, {eco} e contornos {contornos}.{vasc}',
        'Bócio multinodular.',
        [
          mm('dir', 'maior diâmetro à direita'),
          mm('esq', 'maior diâmetro à esquerda'),
          sel('composicao', 'composição', ops('sólidos', 'mistos (sólidos/císticos)', 'císticos', 'espongiformes')),
          sel('eco', 'ecogenicidade', ops('hipoecogênicos', 'isoecogênicos', 'hiperecogênicos', 'anecogênicos')),
          sel('contornos', 'contornos', CONTORNOS),
          sel('vasc', 'vascularização', VASC),
        ], 40),
      esc('tireoide.tiradsFinal', 'select', [
        { r: 'não citar' },
        ...['1', '2', '3', '4', '5'].map((n) => ({ r: `TI-RADS ${n}`, corpo: `Classificação final com base no "Thyroid Imaging Reporting & Data System" (TI-RADS): ${n}.` })),
      ], { rotulo: 'TI-RADS final', ordem: 60 }),
    ],
  },
  {
    id: 'cistos', titulo: 'Cistos coloides', ordem: 25,
    controles: [
      chk('tireoide.cistosColoides', 'cistos coloides esparsos de até', 'Pequenos cistos coloides esparsos, medindo até {mm|cm} cm, o maior situado no {local}.',
        'Cistos coloides tireoidianos.', [mm('mm', 'maior diâmetro', 4), sel('local', 'situado no', posicoes('cisto'))], 10),
      chk('tireoide.cistoColoide', 'cisto coloide de', `Nota-se{?${SE_NOD}? também} cisto de {mm|cm} cm, com conteúdo anecogênico e contornos regulares, situado no {local}.`,
        'Provável cisto coloide {local|c}.', [mm('mm', 'diâmetro', 4), sel('local', 'localização', posicoes('cisto'))], 20),
    ],
  },
  {
    id: 'paratireoides', titulo: 'Paratireoides', ordem: 30,
    controles: [
      chk('paratireoides.ausencia', 'citar ausência de nódulos na topografia das paratireoides', 'Não foram identificados nódulos na topografia das glândulas paratireoides.', undefined, [], 10),
    ],
  },
  {
    id: 'doppler', titulo: 'Doppler do parênquima', ordem: 32,
    controles: [
      chk('tireoide.dopp', 'Descrever Doppler do parênquima', '{tipo}{art}', '{tipo|c}', [
        sel('tipo', 'Doppler', [
          { r: 'Doppler normal', c: '', t: `A avaliação do {?${SE_NOD}?restante do }parênquima tireoidiano com Doppler não demonstra áreas de fluxo anômalo.` },
          { r: 'Hiperfluxo difuso', t: 'A avaliação do parênquima tireoidiano com Doppler demonstra sinais de hiperfluxo difuso.', c: 'Aumento difuso da vascularização tireoidiana.' },
          { r: 'Hipofluxo difuso', t: 'A avaliação do parênquima tireoidiano com Doppler demonstra hipovascularização difusa.', c: 'Redução difusa da vascularização tireoidiana.' },
        ]),
        sel('art', 'artérias tireoidianas', [
          { r: 'não citar artérias', t: '' },
          { r: 'velocidades normais', t: ' As artérias tireoidianas apresentam curvas espectrais e velocidades sistólicas dentro da normalidade.' },
          { r: 'velocidades aumentadas', t: ' As artérias tireoidianas apresentam aumento das velocidades de pico sistólico.' },
        ]),
      ], 10),
    ],
  },
  {
    id: 'medidas', titulo: 'Medidas e volume', ordem: 35,
    controles: [
      {
        ...chk('tmed.on', 'Medidas da tireoide',
          '\nO lobo direito mede {dir} cm.\nO lobo esquerdo mede {esq} cm.\n{ist}\nVolume tireoidiano estimado em {=voltireoide} cm³ (normal de {=refvol} cm³).',
          undefined,
          [
            dims('dir', 'lobo direito (mm)', 3, [40, 12, 12]),
            dims('esq', 'lobo esquerdo (mm)', 3, [30, 22, 22]),
            mm('istmo', 'espessura do istmo (mm)', 3),
            sel('ist', 'istmo', [
              { r: 'espessura', t: 'O istmo tem espessura de {istmo|cm} cm.' },
              { r: 'filiforme, não mensurável', t: 'O istmo é filiforme, não mensurável.' },
            ]),
          ], 10),
        marcado: true,
        desativadoPor: ['tireoide.tireoidectomia'],
      },
    ],
  },
  {
    id: 'linfonodos', titulo: 'Linfonodomegalias', ordem: 40,
    controles: [
      fixo('linf.normal', 'Ausência de linfonodomegalias cervicais.', { ordem: 0, suprimidoPor: ['linf.isolado', 'linf.multiplos'] }),
      chk('linf.isolado', 'Descrever Linfonodomegalia isolada',
        'No {sitio} à {lado} nota-se um linfonodo {eco} de contornos {contornos}, medindo {med} cm.{vasc}{calc}{ir}',
        'Linfonodomegalia cervical à {lado}.',
        [dims('med', 'medidas (mm)', 3, 10), sel('sitio', 'sítio nodal', SITIOS), sel('lado', 'lado', LADO_LINF), sel('eco', 'ecogenicidade', ECO_LINF),
         sel('contornos', 'contornos', CONTORNOS), sel('vasc', 'vascularização', VASC), sel('calc', 'calcificações', CALC_LINF), sel('ir', 'índice de resistividade', IR)], 10),
      chk('linf.multiplos', 'Descrever Múltiplos Linfonodos',
        'Linfonodos aumentados, medindo até {dirA} x {dirB} mm à direita, no {sitioDir}, e até {esqA} x {esqB} mm à esquerda, no {sitioEsq}. Aspecto {eco}, com contornos {contornos}.{vasc}{calc}{ir}',
        'Linfonodomegalias cervicais.',
        [mm('dirA', 'medida 1 à direita'), mm('dirB', 'medida 2 à direita'), sel('sitioDir', 'sítio nodal à direita', SITIOS),
         mm('esqA', 'medida 1 à esquerda'), mm('esqB', 'medida 2 à esquerda'), sel('sitioEsq', 'sítio nodal à esquerda', SITIOS),
         sel('eco', 'ecogenicidade', ops('hipoecogênicos', 'isoecogênicos', 'hiperecogênicos', 'císticos')), sel('contornos', 'contornos', CONTORNOS),
         sel('vasc', 'vascularização', VASC), sel('calc', 'calcificações', CALC_LINF), sel('ir', 'índice de resistividade', IR)], 20),
    ],
  },
];

export const tireoide: Exame = {
  id: 'tireoide',
  titulo: 'Tireoide',
  tituloLaudo: 'ULTRASSONOGRAFIA DA TIREOIDE',
  secoes,
};
