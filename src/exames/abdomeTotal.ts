// ============================================================================
// ULTRASSONOGRAFIA DE ABDOME TOTAL (dados)
//
// Para editar frases, mexa só neste arquivo. Regras rápidas:
//  - {campo}      -> valor do campo      {campo|cm} -> mm convertido em cm (5 -> 0,5)
//  - {campo|c}    -> texto de conclusão da opção escolhida
//  - A 1ª opção de cada escolha é o padrão (normal).
//  - ordem        -> posição da frase dentro do parágrafo do órgão
// ============================================================================
import type { Campo, Check, Controle, Escolha, Exame, Fixo, Opc, Secao } from '../tipos';

export const mm = (id: string, rotulo: string, padrao = 10): Campo => ({ id, tipo: 'mm', rotulo, padrao });
export const sel = (id: string, rotulo: string, opcoes: Opc[]): Campo => ({ id, tipo: 'sel', rotulo, opcoes });
export const dims = (id: string, rotulo: string, n: 2 | 3, padrao: number | number[] = 10, opc = false): Campo => ({ id, tipo: 'dims', rotulo, n, padrao, opc });
export const ops = (...rs: string[]): Opc[] => rs.map((r) => ({ r }));
export const chk = (id: string, rotulo: string, corpo: string, concl?: string, campos?: Campo[], ordem?: number): Check =>
  ({ tipo: 'check', id, rotulo, corpo, concl, campos, ordem });
export const fixo = (id: string, corpo: string, extra: Partial<Fixo> = {}): Fixo => ({ tipo: 'fixo', id, corpo, ...extra });
export const esc = (id: string, ui: 'radio' | 'select', opcoes: Opc[], extra: Partial<Escolha> = {}): Escolha =>
  ({ tipo: 'escolha', id, ui, opcoes, ...extra });

const SEG = ['I', 'II', 'III', 'IVa', 'IVb', 'V', 'VI', 'VII', 'VIII'].map((n) => `segmento ${n}`);
const TERCO = ops('terço superior', 'terço médio', 'terço inferior');
const RIM: Opc[] = [{ r: 'rim direito', c: 'à direita' }, { r: 'rim esquerdo', c: 'à esquerda' }];
const GRUPOS: Opc[] = [
  { r: 'superior', t: 'grupamento calicinal superior' },
  { r: 'médio', t: 'grupamento calicinal médio' },
  { r: 'inferior', t: 'grupamento calicinal inferior' },
];
const ECO: Opc[] = [{ r: 'hiperecogênico (hemangioma)', t: 'hiperecogênico', c: 'hiperecogênico, compatível com hemangioma' }, ...ops('hipoecogênico', 'isoecogênico')];
const CONTORNOS = ops('regulares', 'irregulares', 'lobulados');
const BEIRA = 'Exame realizado à beira do leito em paciente internado, com restrições de posicionamento e cooperação que limitam parcialmente a acurácia do método.';
const COLECAO: Opc[] = [{ r: 'sem coleção', t: '' }, { r: 'com coleção', t: ' e coleção líquida adjacente' }];

const dil = (lado: string): Opc[] => [
  { r: 'ausente' },
  ...['discreta', 'moderada', 'acentuada'].map((g) => ({
    r: g,
    corpo: `Presença de ${g} dilatação pielocalicinal à ${lado}.`,
    concl: `Dilatação do sistema coletor renal à ${lado}.`,
  })),
];

/** Item de um Grupo: não escreve sozinho; o Grupo junta os itens marcados numa frase só. */
const item = (id: string, rotulo: string, itemTxt: string, campos: Campo[], ordem: number): Check =>
  ({ tipo: 'check', id, rotulo, item: itemTxt, campos, ordem });

// cálculos calicinais 1-3: um só = frase simples; vários = "Presença de dois cálculos ... nas seguintes topografias:" + lista
const calculosRenais: Check[] = [1, 2, 3].map((n): Check => ({
  tipo: 'check', id: `rins.calc${n}`, rotulo: `cálculo ${n}`, ordem: 30 + n,
  item: 'Cálculo de {mm|cm} cm no {grupo} do {rim}.', concl: 'Nefrolitíase {rim|c}.',
  campos: [mm('mm', 'tamanho', 5), sel('grupo', 'grupo calicinal', GRUPOS), sel('rim', 'rim', RIM)],
}));

const cistosRenais: Controle[] = [1, 2, 3].map((n) =>
  chk(`rins.cisto${n}`, `cisto ${n}`, 'Cisto de conteúdo anecogênico, com paredes finas e contornos regulares, medindo {mm|cm} cm, no {terco} do {rim}.',
    'Cisto renal simples {rim|c}.',
    [mm('mm', 'tamanho'), sel('terco', 'terço', TERCO), sel('rim', 'rim', RIM)], 20 + n));

// vesícula com cálculo(s): a opção "colecistite aguda?" troca a frase inteira
const calcVesicula = (id: string, rotulo: string, normal: string, aguda: string, campos: Campo[], ordem: number): Check =>
  chk(id, rotulo, '{aguda}', '{aguda|c}', [...campos, sel('aguda', 'colecistite aguda?', [
    { r: 'não', t: normal, c: 'Colecistopatia calculosa.' },
    { r: 'sim', t: aguda, c: 'Colecistite aguda calculosa.' },
  ])], ordem);
const VESIC = 'Vesícula biliar com forma e dimensões normais, paredes finas e regulares, apresentando';
const VESIC_AGUDA = 'Vesícula biliar distendida, com paredes espessadas, apresentando';

const secoes: Secao[] = [
  {
    id: 'lim', titulo: 'Limitações técnicas', ordem: 0,
    controles: [esc('lim.tipo', 'radio', [
      { r: 'nenhuma' },
      { r: 'meteorismo intestinal', corpo: 'Exame limitado parcialmente por distensão gasosa intestinal.' },
      { r: 'biotipo (obesidade)', corpo: 'Exame parcialmente prejudicado por limitações técnicas inerentes ao biotipo.' },
      { r: 'meteorismo + biotipo', corpo: 'Exame parcialmente prejudicado por distensão gasosa intestinal e limitações técnicas inerentes ao biotipo.' },
      { r: 'à beira do leito', corpo: BEIRA },
      { r: 'à beira do leito + meteorismo', corpo: `${BEIRA} Ressalta-se também limitação técnica decorrente da distensão gasosa intestinal presente.` },
      { r: 'à beira do leito + obesidade', corpo: `${BEIRA} Ressalta-se também limitação técnica inerente ao biotipo.` },
    ])],
  },
  {
    id: 'fig', titulo: 'Fígado', ordem: 10,
    controles: [
      esc('fig.dim', 'select', [
        { r: 'normais', t: 'normais' },
        { r: 'aumentadas', t: 'aumentadas', concl: 'Hepatomegalia.' },
      ], { rotulo: 'Dimensões', variavel: 'dim' }),
      esc('fig.eco', 'radio', [
        { r: 'homogêneo', corpo: 'Fígado com dimensões {dim}, contornos regulares, bordas finas e ecotextura homogênea.' },
        { r: 'esteatose',
          campos: [sel('grau', 'grau', [
            { r: 'grau não especificado', t: ', apresentando aumento difuso da ecogenicidade que determina atenuação posterior do feixe acústico', c: 'Sinais de esteatose hepática' },
            { r: 'discreta', t: ', apresentando discreto aumento difuso da ecogenicidade', c: 'Sinais de esteatose hepática discreta (grau I)' },
            { r: 'moderada', t: ', apresentando aumento difuso da ecogenicidade que determina atenuação posterior do feixe acústico', c: 'Sinais de esteatose hepática moderada (grau II)' },
            { r: 'acentuada', t: ', apresentando acentuado aumento da ecogenicidade do parênquima que determina atenuação posterior do feixe acústico, limitando a detecção de lesões focais', c: 'Sinais de esteatose hepática acentuada (grau III)' },
            { r: 'esteatose/depósito', t: '. Infiltrado parenquimatoso hepático difuso, que embora pouco específico, pode corresponder a esteatose leve (grau I) ou de forma menos frequente, doenças de depósito', c: 'Infiltrado parenquimatoso hepático difuso, que embora pouco específico, pode corresponder a esteatose leve (grau I) ou de forma menos frequente, doenças de depósito' },
          ])],
          corpo: 'Fígado com dimensões {dim}, contornos regulares e bordas finas{grau}.',
          concl: '{grau|c}.' },
        { r: 'hepatopatia crônica',
          campos: [sel('fase', 'fase', [
            { r: 'incipiente', c: 'incipiente', t: 'Fígado com dimensões {dim} e ecotextura difusamente heterogênea, com bordas discretamente rombas, conservando contornos regulares.' },
            { r: 'avançada', c: 'avançada', t: 'Fígado com dimensões {dim}, contornos serrilhados, bordas rombas e ecotextura difusamente heterogênea.' },
          ])],
          corpo: '{fase}',
          concl: 'Sinais compatíveis com hepatopatia crônica {fase|c}.' },
      ], { ordem: 10 }),
      chk('fig.cisto', 'cisto simples',
        'Cisto de conteúdo anecogênico, com paredes finas e contornos regulares, medindo {mm|cm} cm, localizado no {seg}.',
        'Cisto hepático simples.', [mm('mm', 'tamanho', 5), sel('seg', 'segmento', ops(...SEG))], 20),
      chk('fig.cistos', 'vários cistos',
        'Cistos de conteúdo anecogênico, com paredes finas e contornos regulares, medindo até {mm|cm} cm, o maior localizado no {seg}.',
        'Cistos hepáticos simples.', [mm('mm', 'maior', 5), sel('seg', 'segmento', ops(...SEG))], 21),
      chk('fig.nodulo', 'nódulo',
        'Nódulo {eco}, de contornos {contornos}, medindo {a|cm} x {b|cm} cm, localizado no {seg}.',
        'Nódulo hepático {eco|c}.',
        [sel('eco', 'ecogenicidade', ECO), sel('contornos', 'contornos', CONTORNOS), mm('a', 'medida 1'), mm('b', 'medida 2'), sel('seg', 'segmento', ops(...SEG))], 22),
      chk('fig.nodulos', 'nódulos (vários)',
        '{qtd} {tipo} de contornos regulares{qtd|c} {a|cm} cm ({sa}) e {b|cm} cm ({sb}).',
        'Nódulos hepáticos{tipo|c}.',
        [sel('tipo', 'tipo', [
           { r: 'hiperecogênicos (hemangiomas)', t: 'hiperecogênicos', c: ' (prováveis hemangiomas)' },
           { r: 'hipoecogênicos', t: 'hipoecogênicos', c: '' }]),
         sel('qtd', 'quantidade', [
           { r: 'os dois maiores', t: 'Presença de vários nódulos', c: ', os maiores medindo' },
           { r: 'dois no total', t: 'Presença de dois nódulos', c: ' medindo' }]),
         mm('a', 'medida 1', 5), sel('sa', 'segmento', ops(...SEG)), mm('b', 'medida 2', 7), sel('sb', 'segmento', ops(...SEG))], 22),
      chk('fig.calc', 'calcificação grosseira',
        'Nota-se uma calcificação grosseira de {mm|cm} cm localizada no {seg}.', 'Calcificação hepática.',
        [mm('mm', 'tamanho', 4), sel('seg', 'segmento', ops(...SEG))], 23),
      fixo('fig.vasos', 'Veia porta e veias hepáticas sem alterações.', { ordem: 900 }),
    ],
  },
  {
    id: 'ves', titulo: 'Vesícula biliar', ordem: 20,
    controles: [
      fixo('ves.normal', 'Vesícula biliar com forma e dimensões normais, paredes finas e regulares, apresentando conteúdo anecogênico sem imagens calculosas.',
        { ordem: 10, suprimidoPor: ['ves.calc', 'ves.calcs', 'ves.calc2', 'ves.vazia', 'ves.ausente'] }),
      calcVesicula('ves.calc', 'cálculo único',
        `${VESIC} uma imagem calculosa em seu interior, móvel às mudanças de decúbito, medindo {mm|cm} cm.`,
        `${VESIC_AGUDA} uma imagem calculosa fixa no infundíbulo, medindo {mm|cm} cm.`, [mm('mm', 'tamanho', 7)], 10),
      calcVesicula('ves.calc2', 'dois cálculos',
        `${VESIC} duas imagens calculosas em seu interior, móveis às mudanças de decúbito, medindo {a|cm} e {b|cm} cm.`,
        `${VESIC_AGUDA} duas imagens calculosas em seu interior, medindo {a|cm} e {b|cm} cm.`, [mm('a', 'primeiro', 7), mm('b', 'segundo', 10)], 10),
      calcVesicula('ves.calcs', 'múltiplos cálculos',
        `${VESIC} imagens calculosas em seu interior, móveis às mudanças de decúbito, medindo de {a|cm} a {b|cm} cm.`,
        `${VESIC_AGUDA} múltiplas imagens calculosas em seu interior, medindo de {a|cm} a {b|cm} cm.`, [mm('a', 'de', 6), mm('b', 'a', 7)], 10),
      chk('ves.vazia', 'vesícula vazia', 'Vesícula biliar vazia, sem condições satisfatórias para análise.', undefined, undefined, 10),
      chk('ves.parede', 'citar espessura da parede', 'Espessura da parede vesicular = {mm|cm} cm.', undefined, [mm('mm', 'espessura', 5)], 15),
      chk('ves.colesterolose', 'colesterolose', 'Há focos hiperecogênicos puntiformes fixos na parede vesicular, determinando reverberação posterior do feixe acústico.', 'Colesterolose da vesícula biliar.', undefined, 16),
      chk('ves.polipo', 'pólipo único',
        'Imagem polipoide hiperecogênica aderida à parede da vesícula, medindo {mm|cm} cm.',
        'Imagem compatível com pólipo na vesícula biliar.', [mm('mm', 'tamanho', 4)], 30),
      chk('ves.polipos', 'múltiplos pólipos',
        'Imagens polipoides hiperecogênicas aderidas às paredes da vesícula, medindo de {a|cm} a {b|cm} cm.',
        'Imagens compatíveis com pólipos na vesícula biliar.', [mm('a', 'de', 3), mm('b', 'a', 4)], 31),
      chk('ves.ausente', 'vesícula ausente', 'Vesícula biliar não caracterizada (status pós-cirúrgico).', 'Colecistectomia.', undefined, 10),
    ],
  },
  {
    id: 'vb', titulo: 'Vias biliares', ordem: 30,
    controles: [
      esc('vb.col', 'radio', [
        { r: 'colédoco normal' },
        { r: 'colédoco ectasiado', campos: [mm('mm', 'calibre', 8)],
          corpo: 'Colédoco ectasiado, com calibre de {mm|cm} cm.', concl: 'Ectasia do colédoco.' },
      ], { ordem: 10 }),
      chk('vb.calibre', 'citar calibre do colédoco', 'Colédoco com calibre de {mm|cm} cm.', undefined, [mm('mm', 'calibre', 6)], 15),
      chk('vb.intra', 'dilatação de vias biliares intra-hepáticas', 'Observa-se dilatação de vias biliares intra-hepáticas.',
        'Dilatação das vias biliares intra-hepáticas.', undefined, 20),
      fixo('vb.normal', 'Não há dilatação das vias biliares intra ou extra-hepáticas.', { ordem: 30, suprimidoPor: ['vb.col', 'vb.intra'] }),
    ],
  },
  {
    id: 'panc', titulo: 'Pâncreas', ordem: 40,
    controles: [
      esc('panc.tipo', 'radio', [
        { r: 'normal', corpo: 'Pâncreas de dimensões normais, contornos regulares e ecotextura homogênea. Não há dilatação do ducto pancreático.' },
        { r: 'parcialmente acessível', corpo: 'Pâncreas parcialmente visibilizado devido à interposição de alças intestinais.' },
        { r: 'inacessível', corpo: 'Pâncreas inacessível devido à interposição gasosa de alças intestinais.' },
        { r: 'sinais de pancreatite aguda', corpo: 'Pâncreas de aspecto heterogêneo, com espessura aumentada e ecogenicidade reduzida do parênquima.', concl: 'Sinais de pancreatite aguda.' },
      ], { ordem: 10 }),
      item('panc.cab', 'cabeça (espessura)', '{mm|cm} cm (cabeça)', [mm('mm', 'espessura')], 20),
      item('panc.corpo', 'corpo (espessura)', '{mm|cm} cm (corpo)', [mm('mm', 'espessura')], 21),
      item('panc.cauda', 'cauda (espessura)', '{mm|cm} cm (cauda)', [mm('mm', 'espessura')], 22),
      {
        tipo: 'grupo', id: 'panc.med', ordem: 20, itens: ['panc.cab', 'panc.corpo', 'panc.cauda'], genero: 'f', juntar: 'e',
        um: 'A espessura pancreática foi mensurada em {itens}.', varios: 'A espessura pancreática foi mensurada em {itens}.',
      },
    ],
  },
  {
    id: 'baco', titulo: 'Baço', ordem: 50,
    controles: [
      esc('baco.tipo', 'radio', [
        { r: 'tamanho normal', corpo: 'Baço com dimensões normais, contornos regulares e ecotextura homogênea.' },
        { r: 'aumentado', campos: [sel('eco', 'ecotextura', ops('ecotextura homogênea', 'ecotextura heterogênea'))],
          corpo: 'Baço com dimensões aumentadas, contornos regulares e {eco}.', concl: 'Esplenomegalia.' },
        { r: 'ausente', corpo: 'Baço não caracterizado (esplenectomia).', concl: 'Ausência do baço.' },
      ], { ordem: 10 }),
      chk('baco.med', 'citar dimensões', 'Mede {med} cm em seu maior e menor eixo{idx}.', undefined,
        [dims('med', 'maior x menor eixo', 2, 80),
         sel('idx', 'índice', [{ r: 'sem índice', t: '' }, { r: 'citar o índice esplênico', t: ' (índice esplênico uniplanar = {med|ind})' }])], 11),
      chk('baco.acess', 'baço acessório', 'Presença de baço acessório (variação anatômica) medindo {a|cm} x {b|cm} cm.',
        'Baço acessório.', [mm('a', 'medida 1', 20), mm('b', 'medida 2', 10)], 20),
      chk('baco.calc', 'calcificação esplênica', 'Nota-se calcificação parenquimatosa medindo {mm|cm} cm, de provável natureza sequelar.', 'Calcificação esplênica.', [mm('mm', 'tamanho', 4)], 21),
    ],
  },
  {
    id: 'aorta', titulo: 'Aorta / retroperitônio', ordem: 60,
    controles: [
      esc('aorta.tipo', 'radio', [
        { r: 'aorta normal', corpo: 'Aorta com calibre e trajeto preservados.' },
        { r: 'aorta ateromatosa', corpo: 'Aorta com paredes hiperecogênicas e discretamente irregulares, conservando calibre normal.', concl: 'Ateromatose aórtica.' },
        { r: 'ateromatosa e ectasiada', campos: [mm('calt', 'calibre transverso máximo', 25)],
          corpo: 'Aorta com paredes hiperecogênicas e irregulares, com calibre transverso máximo de {calt|cm} cm nos segmentos acessíveis.', concl: 'Aorta ateromatosa e ectasiada.' },
        { r: 'aneurisma',
          campos: [sel('tipo', 'tipo', ops('fusiforme', 'sacular')), sel('seg', 'segmento', ops('infrarrenal', 'justarrenal', 'suprarrenal')),
                   mm('cal', 'calibre máximo', 31), mm('ext', 'extensão', 40),
                   sel('trombo', 'trombo', [{ r: 'sem trombo parietal', t: '' }, { r: 'com trombo parietal', t: ', com trombo parietal' }])],
          corpo: 'Aorta com paredes irregulares, apresentando dilatação aneurismática {tipo} {seg} com calibre máximo de {cal|cm} cm e extensão de {ext|cm} cm{trombo}.',
          concl: 'Aneurisma {tipo} da aorta {seg}.' },
        { r: 'inacessível', corpo: 'Aorta inacessível por interposição gasosa de alças intestinais.' },
      ], { ordem: 10 }),
      chk('aorta.calibre', 'citar calibre', 'O diâmetro máximo da aorta é de {mm|cm} cm.', undefined, [mm('mm', 'calibre', 16)], 20),
      chk('aorta.doppler', 'citar fluxo normal ao Doppler', '{vps}', undefined, [
        sel('vps', 'velocidade', [
          { r: 'sem VPS', t: 'A avaliação da aorta com Doppler demonstra fluxo de padrão trifásico normal e velocidades preservadas.' },
          { r: 'com VPS', t: 'A avaliação da aorta com Doppler demonstra fluxo de padrão trifásico normal e velocidade preservada (VPS = {v} cm/s).' },
        ]),
        { id: 'v', tipo: 'texto', rotulo: 'VPS (cm/s)' },
      ], 30),
    ],
  },
  {
    id: 'alcas', titulo: 'Alças intestinais', ordem: 65,
    controles: [
      chk('alcas.apend', 'apendicite', 'Imagem tubuliforme em fundo cego na fossa ilíaca direita, não compressível, com {mm|cm} cm de diâmetro, associada a aumento da ecogenicidade da gordura adjacente{colecao}.',
        'Sinais de apendicite aguda.', [mm('mm', 'calibre', 7), sel('colecao', 'coleção', COLECAO)]),
      chk('alcas.divert', 'diverticulite', 'Presença de imagem diverticular com espessamento parietal em topografia do {seg}, associada a aumento da ecogenicidade da gordura adjacente{colecao}.',
        'Sinais de diverticulite aguda.', [sel('seg', 'segmento', ops('sigmoide', 'cólon descendente', 'cólon ascendente')), sel('colecao', 'coleção', COLECAO)]),
      chk('alcas.fid', 'FID livre', 'Fossa ilíaca direita sem coleções ou sinais de processo inflamatório agudo.'),
    ],
  },
  {
    id: 'rins', titulo: 'Rins e ureteres', ordem: 70,
    bilateral: [
      { base: 'Cisto renal simples', resultado: 'Cistos renais bilaterais.' },
    ],
    controles: [
      esc('rins.tipo', 'radio', [
        { r: 'aspecto normal' },
        { r: 'ausência do rim direito', corpo: 'Rim direito não caracterizado. Rim esquerdo tópico, com dimensões normais, contornos regulares e ecotextura habitual.',
          concl: 'Ausência do rim direito.' },
        { r: 'ausência do rim esquerdo', corpo: 'Rim esquerdo não caracterizado. Rim direito tópico, com dimensões normais, contornos regulares e ecotextura habitual.',
          concl: 'Ausência do rim esquerdo.' },
      ], { ordem: 9 }),
      fixo('rins.base', 'Rins tópicos com dimensões normais, contornos regulares e ecotextura habitual.', { ordem: 10, suprimidoPor: ['rins.tipo', 'rins.nefropatia'] }),
      chk('rins.nefropatia', 'afilamento parenquimatoso e alteração ecotextural', '{lado}',
        'Sinais compatíveis com nefropatia parenquimatosa crônica {lado|c}.',
        [sel('lado', 'lado', [
          { r: 'bilateral', c: 'bilateral', t: 'Rins tópicos, com dimensões normais e contornos regulares, notando-se redução da espessura e aumento da ecogenicidade do parênquima bilateralmente.' },
          { r: 'do rim direito', c: 'à direita', t: 'Rins tópicos, notando-se redução da espessura e aumento da ecogenicidade do parênquima do rim direito. O rim esquerdo conserva dimensões, espessura e ecogenicidade parenquimatosas normais.' },
          { r: 'do rim esquerdo', c: 'à esquerda', t: 'Rins tópicos, notando-se redução da espessura e aumento da ecogenicidade do parênquima do rim esquerdo. O rim direito conserva dimensões, espessura e ecogenicidade parenquimatosas normais.' }])], 12),
      // Medidas dos rins (L x T x AP em mm; deixe T/AP em branco para omitir). Sai por último, em linhas separadas.
      { ...chk('rins.medidas', 'incluir medidas dos rins',
        '\nDimensões renais:\n- rim direito: {d} cm.{cpd}\n- rim esquerdo: {e} cm.{cpe}', undefined,
        [dims('d', 'rim direito L x T x AP', 3, 90, true),
         sel('cpd', 'parênquima direito', [{ r: 'citar espessura', t: '\n- espessura do parênquima à direita: {pd|cm} cm' }, { r: 'sem parênquima', t: '' }]),
         mm('pd', 'espessura dir.', 11),
         dims('e', 'rim esquerdo L x T x AP', 3, 90, true),
         sel('cpe', 'parênquima esquerdo', [{ r: 'citar espessura', t: '\n- espessura do parênquima à esquerda: {pe|cm} cm' }, { r: 'sem parênquima', t: '' }]),
         mm('pe', 'espessura esq.', 12)], 60), fimDe: 'rins2' },
      ...cistosRenais,
      chk('rins.cistosB', 'cistos vários bilaterais',
        'Cistos de conteúdo anecogênico, com paredes finas e contornos regulares, bilaterais, medindo até {mm|cm} cm, o maior localizado no {terco} do {rim}.',
        'Cistos renais bilaterais.', [mm('mm', 'maior', 6), sel('terco', 'terço', TERCO), sel('rim', 'rim', RIM)], 24),
      chk('rins.nodulo', 'nódulo sólido', '{eco}', '{eco|c}',
        [sel('eco', 'ecogenicidade', [
          { r: 'hiperecogênico (angiomiolipoma)', t: 'Formação nodular sólida cortical, localizada no {terco} do {rim}, de contornos regulares e bem definidos, hiperecogênica e homogênea, medindo {a|cm} x {b|cm} cm.', c: 'Nódulo renal sugestivo de angiomiolipoma.' },
          ...['hipoecogênico', 'isoecogênico'].map((e) => ({ r: e, t: `Nódulo sólido ${e}, de contornos {contornos}, medindo {a|cm} x {b|cm} cm, no {terco} do {rim}.`, c: 'Nódulo sólido renal {rim|c}.' })),
        ]), sel('contornos', 'contornos (se não for angiomiolipoma)', CONTORNOS), mm('a', 'medida 1'), mm('b', 'medida 2'), sel('terco', 'terço', TERCO), sel('rim', 'rim', RIM)], 25),
    ],
  },
  {
    id: 'rins2', titulo: 'Rins e ureteres pt2', ordem: 71, continua: true,
    bilateral: [
      { base: 'Nefrolitíase', resultado: 'Nefrolitíase bilateral.' },
      { base: 'Dilatação do sistema coletor renal', resultado: 'Dilatação do sistema coletor renal bilateral.' },
    ],
    controles: [
      ...calculosRenais,
      {
        tipo: 'grupo', id: 'rins.calcgrp', ordem: 30, itens: ['rins.calc1', 'rins.calc2', 'rins.calc3'], genero: 'm', juntar: 'lista',
        um: '{itens}',
        varios: 'Presença de {n} cálculos calicinais {lado}, nas seguintes topografias:\n{itens}',
        unico: [{ token: 'lado', campo: 'rim', usar: 'c' }],
      },
      chk('rins.calcB', 'cálculos vários bilaterais',
        'Imagens calculosas bilaterais, medindo até {mm|cm} cm, a maior localizada no {grupo} do {rim}.', 'Nefrolitíase bilateral.',
        [mm('mm', 'maior', 4), sel('grupo', 'grupo calicinal', GRUPOS), sel('rim', 'rim', RIM)], 34),
      chk('rins.micro', 'microcálculos bilaterais X calcificações vasculares',
        'Nos seios renais são observados focos hiperecogênicos puntiformes sem sombra acústica definida, podendo corresponder a microcálculos calicinais ou calcificações vasculares.',
        'Microcálculos calicinais ou calcificações vasculares.', undefined, 36),
      chk('rins.lim', 'Limitação do método para cálculos', '\nObs.: Cálculos renais menores que 0,4 cm podem não ser identificados devido a limitação inerente do método ecográfico.\n', undefined, undefined, 37),
      fixo('rins.semcalc', 'Não há evidências de imagens calculosas calicinais.', { ordem: 40, suprimidoPor: ['rins.calc1', 'rins.calc2', 'rins.calc3', 'rins.calcB', 'rins.micro'] }),
      esc('rins.dilD', 'select', dil('direita'), { rotulo: 'Dilatação pielocalicinal, direita', ordem: 50 }),
      esc('rins.dilE', 'select', dil('esquerda'), { rotulo: 'Dilatação pielocalicinal, esquerda', ordem: 51 }),
      fixo('rins.semdil', 'Não há dilatação do sistema coletor.', { ordem: 55, suprimidoPor: ['rins.dilD', 'rins.dilE'] }),
      chk('rins.ureter', 'cálculo ureteral', 'Cálculo ureteral de {mm|cm} cm, {local} {lado}.', 'Cálculo ureteral {lado}.',
        [mm('mm', 'tamanho', 6), sel('local', 'local', ops('no terço proximal do ureter', 'no terço médio do ureter', 'no terço distal do ureter')),
         sel('lado', 'lado', ops('à direita', 'à esquerda'))], 56),
      chk('rins.duploj', 'cateter duplo J', '{lado}', 'Cateter duplo J {lado|c}.', [
        sel('lado', 'lado', [
          { r: 'à direita', c: 'à direita', t: 'Presença de cateter "duplo J" à direita, detectável na forma de ecos lineares na pelve renal e no lúmen vesical, junto ao meato ureteral.' },
          { r: 'à esquerda', c: 'à esquerda', t: 'Presença de cateter "duplo J" à esquerda, detectável na forma de ecos lineares na pelve renal e no lúmen vesical, junto ao meato ureteral.' },
          { r: 'bilateral', c: 'bilateral', t: 'Presença de cateter "duplo J" bilateralmente, detectável na forma de ecos lineares nas pelves renais e no lúmen vesical, junto aos meatos ureterais.' },
        ]),
      ], 59),
    ],
  },
  {
    id: 'bex', titulo: 'Bexiga', ordem: 80, omitirSe: 'bex.nao',
    controles: [
      esc('bex.tipo', 'radio', [
        { r: 'normal', corpo: 'Bexiga com boa repleção, paredes finas e regulares, conteúdo anecogênico.' },
        { r: 'difusamente trabeculada (de esforço)', corpo: 'Bexiga com boa repleção, de conteúdo anecogênico, apresentando paredes difusamente espessadas e trabeculadas.',
          concl: 'Bexiga de esforço.' },
        { r: 'contendo cálculo', campos: [mm('mm', 'tamanho', 10), sel('paredes', 'paredes', ops('finas e regulares', 'espessadas', 'trabeculadas'))],
          corpo: 'Bexiga com boa repleção, com paredes {paredes}, notando-se no lúmen vesical imagem hiperecogênica com sombra acústica posterior, móvel com as mudanças de decúbito, medindo {mm|cm} cm.',
          concl: 'Cálculo vesical.' },
        { r: 'lesão vegetante', campos: [mm('a', 'medida 1'), mm('b', 'medida 2'),
            sel('fixa', 'situada', ops('na parede posterior', 'na parede anterior', 'na parede lateral direita', 'na parede lateral esquerda', 'na parede superior', 'na parede inferior', 'no trígono'))],
          corpo: 'Bexiga com boa repleção, notando-se lesão polipoide de superfície irregular medindo {a|cm} x {b|cm} cm, fixa {fixa}.', concl: 'Lesão vegetante vesical.' },
        { r: 'repleção insuficiente', corpo: 'Bexiga com repleção insuficiente para análise.' },
      ], { ordem: 10 }),
      chk('bex.divert', 'divertículo', 'Presença de formação diverticular na parede {local} da bexiga, medindo cerca de {med} cm.', 'Formação diverticular vesical.',
        [dims('med', 'medidas (mm)', 2, 10), sel('local', 'localização (parede)', ops('lateral direita', 'lateral esquerda', 'posterior', 'posterior à direita', 'posterior à esquerda', 'anterior', 'superior', 'inferior'))], 15),
      chk('bex.foley', 'presença de sonda de Foley', 'Presença de sonda com balão visível no lúmen vesical.', undefined, undefined, 20),
      chk('bex.nao', 'não citar bexiga', ''),
    ],
  },
  {
    id: 'liq', titulo: 'Líquido livre', ordem: 90,
    controles: [
      esc('liq.tipo', 'select', [
        { r: 'ausente', corpo: 'Ausência de líquido livre.' },
        { r: 'presente',
          campos: [sel('qtd', 'quantidade', ops('pequena quantidade', 'moderada quantidade', 'grande quantidade')),
                   sel('local', 'local', [{ r: 'na pelve' }, { r: 'na cavidade abdominal' }])],
          corpo: 'Nota-se {qtd} de líquido livre {local}.', concl: 'Presença de líquido em {qtd} {local}.' },
      ]),
    ],
  },
];

/** Biblioteca: seções reutilizáveis por vários exames. */
export const S: Record<string, Secao> = Object.fromEntries(secoes.map((x) => [x.id, x]));
/** Mesma seção com outra posição no laudo. */
export const com = (x: Secao, ordem: number): Secao => ({ ...x, ordem });

/** Controles do volume vesical, dentro do box Bexiga: pré-miccional + resíduo pós-miccional (cada um em sua linha).
 *  O resíduo é classificado (ausente / desprezível / moderado / acentuado) a partir do volume. */
const controlesVolume = (comConcl: boolean, marcado: boolean, residFimDe = 'fim'): Controle[] => [
  chk('volpre.on', 'citar volume pré-miccional', '\nVolume vesical pré-miccional estimado em {v|ml} ml.', undefined, [dims('v', 'medidas', 3, 80)], 100),
  { ...chk('resid.on', 'citar resíduo pós-miccional', '\nResíduo vesical pós-miccional {=residuo}.',
      comConcl ? 'Resíduo vesical pós-miccional {=residuo}.' : undefined, [dims('v', 'medidas (mm)', 3, 0)], 110), marcado, fimDe: residFimDe },
  // nos exames sem conclusão fixa do resíduo, ele entra no ID só quando passa de 40 ml
  ...(comConcl ? [] : [fixo('resid.alto', '', { ordem: 190, concl: 'Resíduo vesical pós-miccional {=residuo}.', vol: { ctl: 'resid.on', campo: 'v', op: '>' as const, limite: 40 } })]),
];

/** Bexiga com o volume vesical (pré + resíduo) dentro do mesmo box. residFimDe: 'fim' = última frase do laudo (e da conclusão). */
export const bexVol = (ordem: number, comConcl: boolean, marcado: boolean, residFimDe = 'fim'): Secao =>
  ({ ...S.bex, ordem, controles: [...S.bex.controles, ...controlesVolume(comConcl, marcado, residFimDe)] });


// com "prostatectomia radical" ou "não citar próstata" marcados, o resto do box fica desativado
const OMITE = ['pros.pr', 'pros.nao'];

/** Box Próstata (também usado em abdome total + próstata e no aparelho urinário). */
export const secoesProstata = (semProstata = false): Secao[] => [
  {
    id: 'pros', titulo: 'Próstata', ordem: 20,
    controles: [
      esc('pros.cont', 'select', [
        { r: 'contornos regulares', corpo: 'Próstata de contornos regulares, com ecotextura habitual.' },
        { r: 'contornos irregulares', corpo: 'Próstata de contornos irregulares, com ecotextura habitual.' },
      ], { rotulo: 'Contornos', desativadoPor: OMITE }),
      { ...chk('pros.protr', 'citar protrusão prostática intravesical', 'Protrusão prostática intravesical: {mm|cm} cm{grau}.',
        'Protrusão prostática intravesical.',
        [mm('mm', 'tamanho', 4), sel('grau', 'grau', [{ r: 'sem graduação', t: '' }, { r: 'grau I', t: ' (grau I)' }, { r: 'grau II', t: ' (grau II)' }, { r: 'grau III', t: ' (grau III)' }])], 20), desativadoPor: OMITE },
      // logo depois da frase de contornos/ecotextura da próstata
      { ...chk('pros.rtu', 'ressecção transuretral da próstata (R.T.U.)', 'Há sinais de manipulação cirúrgica por via uretral (alargamento do colo vesical).', 'Sinais de manipulação cirúrgica da próstata (ressecção transuretral).', undefined, 5), desativadoPor: OMITE },
      { ...chk('pros.pr', 'prostatectomia radical', 'Próstata e vesículas seminais não identificadas (status pós cirúrgico).', 'Status pós-prostatectomia radical.', undefined, 0), desativadoPor: ['pros.nao'] },
      { ...chk('pros.nao', 'não citar próstata', '', undefined, undefined, 0), desativadoPor: ['pros.pr'], marcado: semProstata },
      { ...chk('pros.med', 'citar medidas e volume', '\nMedidas: {med} cm. Volume estimado em {med|vol} cm³ (normal até 30,0 cm³).',
          undefined, [dims('med', 'medidas', 3, 25)], 30), marcado: !semProstata, desativadoPor: OMITE },
      // Até 30 cm³ cita o volume na conclusão; acima disso, "Aumento prostático."
      fixo('pros.volN', '', { ordem: 90, desativadoPor: OMITE, concl: 'Próstata com volume estimado em {med|vol} cm³.', vol: { ctl: 'pros.med', campo: 'med', op: '<=', limite: 30 } }),
      fixo('pros.volA', '', { ordem: 91, desativadoPor: OMITE, concl: 'Aumento prostático.', vol: { ctl: 'pros.med', campo: 'med', op: '>', limite: 30 } }),
    ],
  },
];

export const abdomeTotal: Exame = {
  id: 'abdome-total',
  titulo: 'Abdome total',
  tituloLaudo: 'ULTRASSONOGRAFIA DO ABDOME TOTAL',
  // citando a próstata ("não citar próstata" desmarcado), o título muda
  tituloVar: { ctl: 'pros.nao', opcoes: { false: 'ULTRASSONOGRAFIA DO ABDOME TOTAL E PRÓSTATA', undefined: 'ULTRASSONOGRAFIA DO ABDOME TOTAL E PRÓSTATA' } },
  secoes: secoes.flatMap((x) => (x.id === 'bex' ? [bexVol(80, false, false), ...secoesProstata(true).map((y) => ({ ...y, ordem: 85 }))] : [x])),
};
