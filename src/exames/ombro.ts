// ============================================================================
// ULTRASSONOGRAFIA DO OMBRO (dados). Exame de um ombro só: o seletor "Lado examinado"
// no topo muda o título do laudo (DIREITO / ESQUERDO); as frases são as mesmas.
// Revise as frases marcadas com "REVISAR" no LEIAME antes de usar em produção.
// ============================================================================
import type { Exame, Opc, Secao } from '../tipos';
import { chk, dims, esc as escBase, fixo, mm, ops, sel } from './abdomeTotal';

// escolha em radio (a 1ª opção é o padrão)
const esc = (id: string, opcoes: Opc[], extra: { ordem?: number; rotulo?: string } = {}) => escBase(id, 'radio', opcoes, extra);

const TENDOES = [
  { k: 'sup', nome: 'supraespinhal', tit: 'Tendão do supraespinhal' },
  { k: 'inf', nome: 'infraespinhal', tit: 'Tendão do infraespinhal' },
  { k: 'sub', nome: 'subescapular', tit: 'Tendão do subescapular' },
];
const NORMAL = 'com ecotextura e espessura preservadas e contornos normais';
const ID = (k: string, x: string) => `om.${k}.${x}`;

// Retração do coto na rotura completa
const retracao = (): Opc[] => [
  { r: 'sem retração', t: '', c: '' },
  { r: 'com retração', t: ', com retração de {ret|cm} cm', c: ', com retração' },
];
const campoRet = () => [mm('int', 'intervalo (mm)', 10), sel('retr', 'retração', retracao()), mm('ret', 'retração de (mm)', 10)];
const TIPO_PARCIAL: Opc[] = [
  { r: 'não citar tipo', t: '' },
  { r: 'bursal', t: ' bursal' },
  { r: 'articular', t: ' articular' },
  { r: 'intersticial', t: ' intersticial' },
];
const CALC: Opc[] = [
  { r: 'não citar calcificações', t: '', c: '' },
  { r: 'com pequenas calcificações junto à inserção', t: ' Notam-se pequenas calcificações junto à inserção.', c: ' com calcificações' },
  { r: 'com calcificação medindo', t: ' Nota-se calcificação junto à inserção, medindo {cal|cm} cm.', c: ' com calcificação' },
];

const secaoTendao = (t: typeof TENDOES[number], i: number): Secao => {
  const { k, nome, tit } = t;
  const alt = 'hipoecogênico, heterogêneo, observando-se sinais de';
  const concl = `{=tendconcl:${k}}`; // agrupa conclusões iguais (ver gerador.ts)
  return {
    id: `om.${k}`, titulo: `Tendão do ${nome}`, ordem: 10 * (i + 1),
    controles: [
      esc(ID(k, 'tipo'), [
        { r: 'aspecto normal' },
        { r: 'tendinopatia sem rotura', campos: [sel('calc', 'calcificações', CALC), mm('cal', 'tamanho da calcificação (mm)', 5)],
          corpo: `${tit} espessado, com alteração ecotextural, sem evidências de rotura.{calc}`, concl },
        { r: 'fissuras intrassubstanciais',
          corpo: `Espessamento e hipoecogenicidade do tendão do ${nome}, com algumas fissuras intrassubstanciais, sem transfixação.`, concl },
        { r: 'rotura parcial medindo', campos: [dims('med', 'medidas (mm)', 2, 10), sel('tp', 'tipo', TIPO_PARCIAL)],
          corpo: `${tit} ${alt} rotura parcial{tp} medindo {med} cm.`, concl },
        { r: 'rotura completa', campos: campoRet(),
          corpo: `${tit} ${alt} rotura completa com {int|cm} cm de intervalo{retr}.`, concl },
      ], { ordem: 10 }),
      // tendões normais: uma frase só (ex.: "Tendões do infraespinhal e do subescapular com ..."), no lugar do 1º normal
      fixo(ID(k, 'norm'), `{=tendnorm:${k}}`, { ordem: 10 }),
      { ...chk(ID(k, 'calc'), 'pequenas calcificações junto à inserção',
        `${tit} ${NORMAL}, notando-se pequenas calcificações junto à inserção.`,
        `Pequenas calcificações junto à inserção do tendão do ${nome}.`, undefined, 11), desativadoPor: [ID(k, 'tipo')] },
    ],
  };
};

const BICEPS = 'Tendão da cabeça longa do bíceps braquial';
const biceps: Secao = {
  id: 'om.bic', titulo: 'Tendão da cabeça longa do bíceps', ordem: 40,
  controles: [
    esc('om.bic.tipo', [
      { r: 'aspecto normal', corpo: `${BICEPS} ${NORMAL}.` },
      { r: 'tendinopatia sem rotura', corpo: `${BICEPS} espessado, com alteração ecotextural, sem evidências de rotura.`, concl: 'Tendinopatia da cabeça longa do bíceps braquial.' },
      { r: 'rotura parcial medindo', campos: [dims('med', 'medidas (mm)', 2, 10)],
        corpo: `${BICEPS} com sinais de rotura parcial medindo {med} cm.`, concl: 'Rotura parcial do tendão da cabeça longa do bíceps braquial.' },
      { r: 'rotura completa', campos: campoRet(),
        corpo: `${BICEPS} com sinais de rotura completa, com {int|cm} cm de intervalo{retr}.`, concl: 'Rotura completa do tendão da cabeça longa do bíceps braquial.' },
      { r: 'rotura longitudinal', corpo: `${BICEPS} com sinais de rotura longitudinal.`, concl: 'Rotura longitudinal do tendão da cabeça longa do bíceps braquial.' },
      { r: 'luxação', campos: [sel('lado', 'sentido', [{ r: 'medial', t: 'medial' }, { r: 'lateral', t: 'lateral' }])],
        corpo: `Luxação {lado} do tendão da cabeça longa do bíceps braquial, deslocado do sulco intertubercular.`, concl: 'Luxação {lado} do tendão da cabeça longa do bíceps braquial.' },
    ], { ordem: 10 }),
    // líquido peritendíneo é independente do aspecto do tendão
    chk('om.bic.liq', 'líquido peritendíneo', 'Presença de líquido na bainha{esp}.',
      'Líquido na bainha do tendão da cabeça longa do bíceps braquial{esp|c}.',
      [sel('esp', 'sinóvia', [{ r: 'sem espessamento sinovial', t: '', c: '' }, { r: 'com espessamento sinovial', t: ', com espessamento sinovial', c: ', com espessamento sinovial' }])], 20),
    fixo('om.bic.semliq', 'Ausência de líquido na bainha.', { ordem: 20, suprimidoPor: ['om.bic.liq'] }),
  ],
};

const bolsa: Secao = {
  id: 'om.bolsa', titulo: 'Bolsa subacromial-subdeltoidea', ordem: 50,
  controles: [
    esc('om.bolsa.tipo', [
      { r: 'sem líquido', corpo: 'Ausência de líquido na bolsa subacromial-subdeltoidea.' },
      { r: 'líquido', campos: [sel('qtd', 'quantidade', ops('pequena', 'moderada', 'grande')),
          sel('esp', 'sinóvia', [{ r: 'sem espessamento da sinóvia', t: '' }, { r: 'com espessamento da sinóvia', t: ', com espessamento da sinóvia' }])],
        corpo: 'Presença de líquido em {qtd} quantidade na bolsa subacromial-subdeltoidea{esp}.', concl: 'Sinais de bursite subacromial-subdeltoidea.' },
    ], { ordem: 10 }),
  ],
};

const acromio: Secao = {
  id: 'om.ac', titulo: 'Articulação acromioclavicular', ordem: 60,
  controles: [
    esc('om.ac.tipo', [
      { r: 'normal', corpo: 'Articulação acromioclavicular de aspecto preservado.' },
      { r: 'osteoartrose', campos: [sel('esp', 'cápsula', [{ r: 'sem espessamento capsulossinovial', t: '' }, { r: 'com espessamento capsulossinovial', t: ', com espessamento capsulossinovial' }])],
        corpo: 'Presença de osteófitos marginais e irregularidades corticais na articulação acromioclavicular{esp}.', concl: 'Sinais de osteoartrose acromioclavicular.' },
    ], { ordem: 10 }),
  ],
};

export const ombro: Exame = {
  id: 'ombro',
  titulo: 'Ombros',
  tituloLaudo: 'ULTRASSONOGRAFIA DO OMBRO',
  tituloVar: { ctl: 'om.lado', opcoes: { direito: 'ULTRASSONOGRAFIA DO OMBRO DIREITO', esquerdo: 'ULTRASSONOGRAFIA DO OMBRO ESQUERDO' } },
  restante: 'Restante do exame sem anormalidades detectáveis pelo método.',
  secoes: [
    { id: 'om.ladosec', titulo: 'Lado examinado', ordem: -1, controles: [esc('om.lado', [{ r: 'direito' }, { r: 'esquerdo' }])] },
    ...TENDOES.map(secaoTendao),
    biceps,
    bolsa,
    acromio,
  ],
};
