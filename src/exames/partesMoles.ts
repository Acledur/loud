// ============================================================================
// ULTRASSONOGRAFIA DE PARTES MOLES (parede abdominal) - dados.
// Frases normais somem quando algo as contradiz (suprimidoPor). ID normal próprio (idNormal).
// ============================================================================
import type { Campo, Exame, Opc, Secao } from '../tipos';
import { chk, dims, esc, fixo, mm, sel } from './abdomeTotal';

const texto = (id: string, rotulo: string, padrao = ''): Campo => ({ id, tipo: 'texto', rotulo, padrao });

// alterações que contradizem as frases normais
const SUBCUT = ['pm.cisto', 'pm.lipoma', 'pm.seroma', 'pm.abscesso'];
const HERNIAS = ['pm.hum', 'pm.hep'];

const NIVEL: Opc[] = ['epigástrio', 'mesogástrio', 'hipogástrio'].map((r) => ({ r }));
const CONTEUDO: Opc[] = [{ r: 'tecido adiposo' }, { r: 'tecido adiposo e alças intestinais' }];
const REGIAO_HERNIA: Opc[] = [
  { r: 'epigástrica', c: 'Hérnia epigástrica.' },
  { r: 'mesogástrica', c: 'Hérnia da linha média na região mesogástrica.' },
  { r: 'hipogástrica', c: 'Hérnia da linha média na região hipogástrica.' },
];
const ECO: Opc[] = [
  { r: 'isoecogênico (lipoma)', t: 'isoecogênica ao tecido adiposo', c: 'Formação nodular em partes superficiais, sugestivo de lipoma ou suas variantes histológicas.' },
  { r: 'hipoecogênico', t: 'hipoecogênica em relação ao tecido adiposo', c: 'Formação nodular em partes superficiais.' },
  { r: 'hiperecogênico', t: 'hiperecogênica em relação ao tecido adiposo', c: 'Formação nodular em partes superficiais.' },
  { r: 'calcificado', t: 'calcificada', c: 'Formação nodular calcificada em partes superficiais.' },
];
const CONTORNOS: Opc[] = ['regulares', 'lobulados', 'irregulares'].map((r) => ({ r }));
const DIST: Opc[] = [
  { r: 'citar distância máxima', t: ', com distância transversa máxima de {mm|cm} cm entre as bordas mediais' },
  { r: 'não citar distância', t: '' },
];

const secoes: Secao[] = [
  {
    id: 'pmn', titulo: 'Aspecto geral', ordem: 10, umaPorLinha: true,
    controles: [
      fixo('pm.n1', 'Pele e tecido subcutâneo sem anormalidades detectáveis.', { ordem: 0, suprimidoPor: SUBCUT }),
      fixo('pm.n2', 'Ausência de nódulos, massas ou coleções.', { ordem: 10, suprimidoPor: SUBCUT }),
      fixo('pm.n3', 'Planos musculares de aspecto preservado.', { ordem: 20, suprimidoPor: ['pm.dia', ...HERNIAS] }),
      { ...chk('pm.ausHer', 'citar ausência de herniações', 'Ausência de herniações na região examinada.', undefined, undefined, 30), desativadoPor: HERNIAS },
      { ...chk('pm.ausDia', 'citar ausência de diástase do músculo reto abdominal', 'Não há diástase do músculo reto abdominal.', undefined, undefined, 40), desativadoPor: ['pm.dia'] },
    ],
  },
  {
    id: 'pmhum', titulo: 'Hérnia umbilical', ordem: 20,
    controles: [
      chk('pm.hum', 'saco herniário na cicatriz umbilical medindo',
        'Na cicatriz umbilical observa-se um saco herniário contendo {cont}, com variação de volume às manobras compressivas e respiratórias, medindo {med} cm, com colo de {colo|cm} cm.',
        'Hérnia umbilical.',
        [dims('med', 'medidas (mm)', 2, 10), mm('colo', 'colo (mm)', 10), sel('cont', 'conteúdo', CONTEUDO)]),
    ],
  },
  {
    id: 'pmhep', titulo: 'Hérnia epigástrica (linha média)', ordem: 30,
    controles: [
      chk('pm.hep', 'saco herniário mediano medindo',
        'Na região {reg}, em topografia mediana, observa-se um saco herniário contendo {cont}, medindo {med} cm, com colo de {colo|cm} cm.',
        '{reg|c}',
        [dims('med', 'medidas (mm)', 2, 20), mm('colo', 'colo (mm)', 10), sel('reg', 'região', REGIAO_HERNIA), sel('cont', 'conteúdo', CONTEUDO)]),
    ],
  },
  {
    id: 'pmdia', titulo: 'Diástase do músculo reto abdominal', ordem: 40,
    controles: [
      chk('pm.dia', 'presente, ao nível do',
        'Nota-se afastamento patológico dos ventres do músculo reto abdominal ao nível do {nivel}{dist}.',
        'Diástase do músculo reto abdominal.',
        [sel('nivel', 'nível', NIVEL), sel('dist', 'distância entre as bordas mediais', DIST), mm('mm', 'distância máxima (mm)', 3)]),
    ],
  },
  {
    id: 'pmtela', titulo: 'Tela cirúrgica (pós-tratamento de hérnia)', ordem: 50,
    controles: [
      chk('pm.tela', 'telas/implantes cirúrgicos',
        'Estruturas lineares hiperecogênicas, produtoras de sombras acústicas posteriores, localizadas nas regiões epigástrica e supraumbilical, devendo corresponder a telas/implantes cirúrgicos.',
        'Telas/implantes cirúrgicos localizados na parede abdominal.'),
    ],
  },
  {
    id: 'pmcisto', titulo: 'Cisto epidermóide', ordem: 60,
    controles: [
      chk('pm.cisto', 'formação nodular hipoecogênica (cisto epidermóide) medindo',
        'Formação nodular hipoecogênica e heterogênea, sem vascularização significativa ao estudo complementar com Doppler colorido, que mede {med} cm, na região {reg}. A hipótese de cisto epidermóide deve ser considerada.',
        'Achados sugestivos de cisto epidermóide.',
        [dims('med', 'medidas (mm)', 3, 10), texto('reg', 'região')]),
    ],
  },
  {
    id: 'pmlip', titulo: 'Nódulo subcutâneo / lipoma', ordem: 70,
    controles: [
      chk('pm.lipoma', 'nódulo na gordura subcutânea',
        'Na alteração palpável da região {reg}, caracteriza-se nos planos do subcutâneo, formação nodular sólida, de contornos {cont}, {eco}, medindo {med} cm (L x AP x T), distando {dist|cm} cm da pele.',
        '{eco|c}',
        [texto('reg', 'região'), sel('cont', 'contornos', CONTORNOS), sel('eco', 'ecogenicidade', ECO), dims('med', 'medidas (mm)', 3, 10), mm('dist', 'distância da pele (mm)', 5)]),
    ],
  },
  {
    id: 'pmsero', titulo: 'Seroma', ordem: 80,
    controles: [
      esc('pm.seroma', 'radio', [
        { r: 'ausente' },
        {
          id: 'pequenas', r: 'pequenas coleções alongadas (região cicatricial)',
          campos: [texto('sub', 'subcutâneo', 'supra-púbico'), texto('regp', 'região (ID)', 'supra-púbica')],
          corpo: 'Caracteriza-se aumento da espessura e ecogenicidade do tecido subcutâneo {sub}, em correspondência com a região cicatricial, evidenciando-se pequenas coleções alongadas anecóicas em adjacência, sugestivo de seroma. Não há evidências de coleções nas regiões estudadas passíveis de punção.',
          concl: 'Achados ultrassonográficos sugestivo de seroma na região {regp}.',
        },
        {
          id: 'cistica', r: 'formação cística heterogênea, septada (coleção)',
          campos: [dims('med', 'medidas (mm)', 3, 10), texto('loc', 'localização', 'na linha paramediana à esquerda, na altura da cicatriz umbilical, anterior ao músculo reto abdominal ipsilateral'), texto('regc', 'região (ID)', 'paramediana esquerda')],
          corpo: 'Caracteriza-se aumento da espessura e ecogenicidade do tecido subcutâneo, com aumento do fluxo vascular ao estudo complementar Doppler, associado a formação cística heterogênea, com septos de permeio, reforço acústico posterior, medindo {med} cm e volume estimado de {med|vol} cm³, localizada {loc}, compatível com coleção, que dentre as possibilidades pode corresponder a seroma.',
          concl: 'Achados ultrassonográficos sugestivo de seroma na região {regc}.',
        },
      ]),
    ],
  },
  {
    id: 'pmabs', titulo: 'Abscesso', ordem: 90,
    controles: [
      chk('pm.abscesso', 'formação cística de conteúdo espesso (abscesso) medindo',
        'Subcutâneo apresentando formação cística, de contornos irregulares, com traves e moderados debris de permeio, sugerindo conteúdo cístico-espesso, medindo aproximadamente {med} cm, e volume estimado em {med|vol} cm³. Caracteriza-se ainda, aumento da espessura da pele e borramento dos planos adiposos adjacentes à lesão descrita, sugerindo processo inflamatório/infeccioso.',
        'Formação cístico-espessa na {reg}, sugestivo de abscesso.',
        [dims('med', 'medidas (mm)', 3, 10), texto('reg', 'região')]),
    ],
  },
];

export const partesMoles: Exame = {
  id: 'partes-moles',
  titulo: 'Partes moles',
  tituloLaudo: 'ULTRASSONOGRAFIA DE PARTES MOLES',
  idNormal: 'Exame sem anormalidades demonstráveis pelo método.',
  secoes,
};
