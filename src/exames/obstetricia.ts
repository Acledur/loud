// ============================================================================
// ULTRASSONOGRAFIA OBSTÉTRICA — 1º trimestre e 2º/3º trimestre (dados).
// Medidas e idade gestacional começam em branco: ficam como [PREENCHER] até digitar.
// A conclusão (ID) cita só a idade gestacional (+ oligoâmnio/polidrâmnio quando o ILA pede).
// ============================================================================
import type { Campo, Exame, Opc, Secao } from '../tipos';
import { chk, esc, fixo, ops, sel } from './abdomeTotal';

const texto = (id: string, rotulo: string): Campo => ({ id, tipo: 'texto', rotulo, padrao: '' });
const NB = '\u00a0\u00a0\u00a0\u00a0\u00a0\u00a0'; // espaços fixos entre DBP e CC
const OBS = [
  'OBS: EM CASO DE RETORNO, FAZER A GENTILEZA DE TRAZER OS EXAMES ANTERIORES.',
  'Este exame não tem a intenção de fazer avaliação morfológica detalhada, a posição fetal, líquido amniótico, espessura do tecido celular subcutâneo e a ecotextura tecidual materna podem restringir a visualização de alterações feto-placentárias.',
];
const um = (id: string, opcoes: Opc[], extra = {}) => esc(id, 'radio', opcoes, extra); // escolha em radio
// "bloco" = escolha com uma só opção, só para exibir campos e emitir uma frase sempre
const bloco = (id: string, campos: Campo[], corpo: string, ordem: number, concl?: string) =>
  um(id, [{ r: 'preencher', campos, corpo, concl }], { ordem });

// ---------------- 1º trimestre ----------------
const IG1 = (quem: string) => `Gestação tópica, com ${quem}, com idade gestacional estimada em torno de {sem} semanas e {dias} dias (variação de +/- 0,5 semana).`;
const embriao = (n: 1 | 2): Secao => {
  const p = `ob1.e${n}`;
  return {
    id: p, titulo: `Embrião ${n}`, ordem: 10 + 10 * n, umaPorLinha: true,
    ...(n === 2 ? { desativadoPor: ['ob1.gest=unica'], ocultaSeOff: true } : {}),
    controles: [
      fixo(`${p}.cab`, `EMBRIÃO 0${n}:`, { ordem: 0, apenasSe: ['ob1.gest=gemelar'] }),
      // saco gestacional: na gestação única a medida já vai na frase do útero
      { ...bloco(`${p}.sg`, [texto('a', 'saco gestacional – medida 1 (cm)'), texto('b', 'medida 2 (cm)'), texto('c', 'medida 3 (cm)')],
        'O saco gestacional mede {a} x {b} x {c} cm.', 5), },
      um(`${p}.vv`, [
        { r: 'vesícula vitelínica de aspecto usual', campos: [texto('mm', 'medida (cm)')], corpo: 'Vesícula vitelínica de aspecto usual, medindo cerca de {mm} cm.' },
        { r: 'vesícula vitelínica não visibilizada', corpo: 'Vesícula vitelínica não visibilizada.' },
      ], { ordem: 10 }),
      { ...bloco(`${p}.emb`, [texto('ccn', 'CCN (cm)'), texto('bcf', 'BCF (bpm)')],
        'Embrião visibilizado com batimentos cardíacos no presente exame. CCN = {ccn} cm. BCF = {bcf} bpm.', 20), desativadoPor: ['ob1.nc', 'ob1.ab'] },
      { ...chk(`${p}.tn`, 'translucência nucal', 'Translucência nucal medindo {tn} cm (normal).', undefined, [texto('tn', 'translucência nucal (cm)')], 30), desativadoPor: ['ob1.nc', 'ob1.ab'] },
      fixo(`${p}.la`, 'Líquido amniótico em quantidade normal.', { ordem: 40, desativadoPor: ['ob1.nc', 'ob1.ab'] }),
    ],
  };
};

export const obstetrico1: Exame = {
  id: 'obstetrico1',
  titulo: 'Obstétrica 1º trimestre',
  tituloLaudo: 'ULTRASSONOGRAFIA OBSTÉTRICA',
  semRestante: true,
  obs: OBS,
  secoes: [
    {
      id: 'ob1.gest', titulo: 'Gestação, bexiga, útero e colo', ordem: 10, umaPorLinha: true, controles: [
        fixo('ob1.bexiga', 'Bexiga com mínima repleção.', { ordem: 0 }),
        um('ob1.gest', [
          { id: 'unica', r: 'única', corpo: 'Útero gravídico, apresentando saco gestacional tópico, com forma e contornos normais.' },
          { id: 'gemelar', r: 'gemelar (dois embriões)', corpo: 'Útero gravídico, com forma e contornos normais.' },
        ], { ordem: 10, rotulo: 'Tipo de gestação' }),
        { ...bloco('ob1.ig', [texto('sem', 'IG – semanas'), texto('dias', 'IG – dias')], '', 15,
          'Gestação tópica, com {?ob1.gest=gemelar?dois embriões vivos}{!ob1.gest=gemelar!embrião único e vivo}, com idade gestacional estimada em torno de {sem} semanas e {dias} dias (variação de +/- 0,5 semana).'),
          desativadoPor: ['ob1.nc', 'ob1.ab'] },
        // sem embrião caracterizado: o saco e a vesícula ainda podem ser medidos (box Embrião 1); sem CCN, BCF e IG
        { ...chk('ob1.nc', 'embrião não caracterizado', '', 'Saco gestacional tópico, com embrião não caracterizado. À critério clínico, controle ultrassonográfico em 14 dias pode trazer mais informações.', undefined, 25), desativadoPor: ['ob1.ab', 'ob1.gest=gemelar'] },
        { ...chk('ob1.ab', 'aborto (evolução desfavorável)', 'Formação ecogênica no interior do saco gestacional, medindo {mm} cm no maior eixo, sugerindo eco embrionário. Movimentos embrionários e batimentos cardíacos ausentes.',
          'Saco gestacional tópico com formação ecogênica no seu interior sugerindo eco embrionário, porém sem caracterização de batimentos cardíacos ou movimentos. A critério clínico, controle ultrassonográfico em 7 dias ou dosagem seriada de beta-hCG podem trazer mais informações.',
          [texto('mm', 'eco embrionário – maior eixo (cm)')], 30), desativadoPor: ['ob1.nc', 'ob1.gest=gemelar'] },
        fixo('ob1.colo', 'Colo uterino sem alterações.', { ordem: 20 }),
      ],
    },
    embriao(1),
    embriao(2),
  ],
};

// ---------------- 2º/3º trimestre ----------------
const dop = (id: string, nome: string) => [texto(`${id}_ip`, `${nome} – IP`), texto(`${id}_ir`, `${nome} – IR`)];
const linhaDop = (id: string, nome: string) =>
  `${nome}: com padrão espectral habitual. Índice de pulsatilidade (IP) de {${id}_ip}. Índice de resistência (IR) de {${id}_ir}.`;

export const obstetrico2: Exame = {
  id: 'obstetrico2',
  titulo: 'Obstétrica 2º/3º trimestre',
  tituloLaudo: 'ULTRASSONOGRAFIA OBSTÉTRICA',
  tituloVar: { ctl: 'ob2.dop', opcoes: { true: 'ULTRASSONOGRAFIA OBSTÉTRICA COM DOPPLER' } },
  semRestante: true,
  obs: OBS,
  secoes: [
    {
      id: 'ob2.ig', titulo: 'Idade gestacional (vai para a conclusão)', ordem: 5, controles: [
        bloco('ob2.ig', [texto('sem', 'semanas'), texto('dias', 'dias'),
          sel('var', 'variação (+/-)', [{ r: '1,0', t: '1,0 semana' }, { r: '1,5', t: '1,5 semana' }, { r: '2,0', t: '2,0 semanas' }])],
        '', 0, 'Gestação tópica, com feto único e vivo, com idade gestacional estimada em torno de {sem} semanas e {dias} dias (variação de +/- {var}).'),
      ],
    },
    {
      id: 'ob2.feto', titulo: 'Situação fetal e vitalidade', umaPorLinha: true, ordem: 10, controles: [
        bloco('ob2.apres', [
          sel('sit', 'situação', ops('longitudinal', 'transversa', 'oblíqua')),
          sel('apr', 'apresentação', ops('cefálica', 'pélvica', 'córmica')),
          sel('dorso', 'dorso', ops('à esquerda', 'à direita', 'anterior', 'posterior')),
        ], 'Gestação tópica, com feto único, em situação {sit}, apresentação {apr}, com dorso {dorso} durante a realização do exame.', 0),
        bloco('ob2.bcf', [texto('bcf', 'BCF (bpm)')], 'BCF presentes e rítmicos (BCF = {bcf} bpm). Movimentação fetal visível.', 10),
        fixo('ob2.cordao', 'Cordão umbilical de aspecto habitual.', { ordem: 20 }),
      ],
    },
    {
      id: 'ob2.bio', titulo: 'Biometria fetal', ordem: 20, controles: [
        bloco('ob2.bio', [texto('dbp', 'DBP (cm)'), texto('cc', 'CC (cm)'), texto('ca', 'CA (cm)'), texto('cf', 'CF (cm)'), texto('peso', 'peso aproximado (g)')],
          `Biometria fetal:\nDBP: {dbp} cm${NB}CC: {cc} cm\nCA: {ca} cm\nCF: {cf} cm\nPeso aproximado: {peso} g (+/- 15%).`, 0),
      ],
    },
    {
      id: 'ob2.plac', titulo: 'Placenta e líquido amniótico', umaPorLinha: true, ordem: 30, controles: [
        bloco('ob2.placenta', [
          sel('local', 'localização', ops('corporal posterior', 'corporal anterior', 'fúndica', 'corporal lateral direita', 'corporal lateral esquerda')),
          sel('eco', 'ecotextura', ops('homogênea', 'heterogênea')),
          sel('grau', 'grau de maturidade', ops('0', 'I', 'II', 'III')),
          sel('esp', 'espessura', ops('normal', 'aumentada', 'reduzida')),
        ], 'Placenta de localização {local}, {eco} grau {grau} de maturidade, com espessura {esp}.', 0),
        fixo('ob2.descol', 'Ausência de imagens sugestivas de descolamento.', { ordem: 10 }),
        // ILA em branco = "quantidade adequada" sem citar valor; preenchido: VR 8-24 (ver gerador.ts)
        bloco('ob2.la', [texto('ila', 'ILA (cm) – opcional')], '{=ila:ob2.la.ila}', 20, '{=ilaconcl:ob2.la.ila}'),
      ],
    },
    {
      id: 'ob2.dopsec', titulo: 'Doppler obstétrico', ordem: 40, controles: [
        chk('ob2.dop', 'incluir estudo Doppler-duplex color',
          `\n¶\nAO ESTUDO DOPPLER-DUPLEX COLOR, EVIDENCIAMOS:\n¶\n${linhaDop('acm', 'Artéria cerebral média')}\n${linhaDop('au', 'Artéria umbilical')}\n${linhaDop('utd', 'Artéria uterina direita')}\n${linhaDop('ute', 'Artéria uterina esquerda')}\nRelação art. umbilical/art. cerebral média = {=rum} (normal < 1).\n`,
          '{=dopconcl}',
          [...dop('acm', 'A. cerebral média'), ...dop('au', 'A. umbilical'), ...dop('utd', 'A. uterina direita'), ...dop('ute', 'A. uterina esquerda'),
            sel('acm_alt', 'Cerebral média (ACM)', ops('normal', 'ACM alterada')), sel('au_alt', 'Umbilical', ops('normal', 'Artéria umbilical alterada')), sel('ut_alt', 'Uterinas', ops('normal', 'uterinas alteradas'))], 0),
      ],
    },
  ],
};
