// ============================================================================
// ULTRASSONOGRAFIA DE MAMAS (dados), a partir dos prints do sistema anterior.
// Localização por horário → quadrante e texto dos nódulos: ver src/mamasCalc.ts
// ============================================================================
import type { Campo, Check, Exame, Opc, Secao } from '../tipos';
import { chk, dims, esc, fixo, mm, ops, sel } from './abdomeTotal';

const radio = (id: string, opcoes: Opc[], extra = {}) => esc(id, 'radio', opcoes, extra);

const HORAS = [...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((h) => ops(h === 1 ? 'à 1 hora' : `às ${h} horas`)[0]), ...ops('retroareolar')];
const MAMA: Opc[] = [{ r: 'direita', t: 'direita', c: 'à direita' }, { r: 'esquerda', t: 'esquerda', c: 'à esquerda' }];
const LADO3: Opc[] = [{ r: 'direita', t: 'à direita', c: 'à direita' }, { r: 'esquerda', t: 'à esquerda', c: 'à esquerda' }, { r: 'bilateral', t: 'bilateral', c: 'bilateral' }];
const IMPL: Opc[] = [{ r: 'direito', t: 'direito', c: 'direito' }, { r: 'esquerdo', t: 'esquerdo', c: 'esquerdo' }, { r: 'bilateral', t: 'bilateral', c: 'bilateral' }];
const onde = () => [sel('hora', 'localizado', HORAS), sel('lado', 'mama', MAMA)];

// ---------- Motivo do exame ----------
const MOTIVOS = ['rotina', 'história familiar positiva', 'controle de nódulo', 'mastalgia', 'controle de cisto', 'complementação de mamografia', 'história pregressa de neoplasia de mama'];
const motivo: Secao = {
  id: 'ma.motivo', titulo: 'Motivo do exame', ordem: 1,
  controles: [
    ...MOTIVOS.map((m, i): Check => ({ tipo: 'check', id: `ma.mot${i}`, rotulo: m, item: m })),
    {
      tipo: 'grupo', id: 'ma.motgrp', ordem: 0, itens: MOTIVOS.map((_, i) => `ma.mot${i}`), genero: 'm', juntar: 'e',
      um: 'Indicação clínica: {itens}.', varios: 'Indicação clínica: {itens}.',
    },
  ],
};

// ---------- Exame normal, BI-RADS, composição ----------
// ids que contam como "cisto" e como "nódulo sólido" para a frase automática de ausência de nódulos
const CISTOS = ['ma.cisto1', 'ma.cisto2', 'ma.cisto3', 'ma.cisto4', 'ma.micro', 'ma.multi'];
const NODULOS = ['ma.n1', 'ma.n2', 'ma.n3', 'ma.n4', 'ma.n5', 'ma.n6', 'ma.nodm'];
const geral: Secao = {
  id: 'ma.geral', titulo: 'BI-RADS® e composição da mama', ordem: 5, umaPorLinha: true,
  controles: [
    fixo('ma.morf', 'Mamas de morfologia normal e contornos regulares.\nPele e tecido adiposo subcutâneo de aspecto ecográfico preservado.', { ordem: 0 }),
    // sem marcar nada: a frase vem sozinha e se ajusta ao que foi descrito (cistos e/ou nódulos)
    fixo('ma.sem', 'Não se observam imagens nodulares sólidas ou císticas.', { ordem: 20, suprimidoPor: [...CISTOS, ...NODULOS] }),
    fixo('ma.sem.solidas', 'Não se observam imagens nodulares sólidas.', { ordem: 20, apenasSe: CISTOS, suprimidoPor: NODULOS }),
    fixo('ma.sem.cisticas', 'Não se observam imagens nodulares císticas.', { ordem: 20, apenasSe: NODULOS, suprimidoPor: CISTOS }),
    radio('ma.comp', [
      { r: 'ecotextura de fundo homogênea – fibroglandular', corpo: 'A composição mamária apresenta ecotextura de fundo homogênea com predomínio fibroglandular.' },
      { r: 'ecotextura de fundo homogênea – adiposa', corpo: 'A composição mamária apresenta ecotextura de fundo homogênea com predomínio adiposo.' },
      { r: 'ecotextura de fundo heterogênea (áreas adiposas + áreas fibroglandulares)', corpo: 'A composição mamária apresenta ecotextura de fundo heterogênea, entremeando áreas adiposas com áreas de tecido fibroglandular.' },
      { r: 'ecotextura genérica', corpo: 'Observa-se distribuição habitual do estroma fibroglandular e do tecido adiposo.' },
    ], { ordem: 10, rotulo: 'Composição da mama' }),
    esc('ma.birads', 'select', ops('1', '2', '3', '4A', '4B', '4C', '5', '6', '0'), { ordem: 30, rotulo: 'BI-RADS®' }),
  ],
};

// ---------- Implantes ----------
const implantes: Secao = {
  id: 'ma.impl', titulo: 'Implantes', ordem: 40,
  controles: [
    { ...chk('ma.impl.ok', 'implantes sem anormalidades', '{lado} de contornos regulares e conteúdo anecogênico.', 'Implantes sem evidências de rotura.',
      [sel('lado', 'lado', [{ r: 'bilaterais', t: 'Implantes bilaterais' }, { r: 'à direita', t: 'Implante à direita' }, { r: 'à esquerda', t: 'Implante à esquerda' }]),
        sel('pos', 'tipo', [{ r: 'não citar tipo', t: '' }, { r: 'retroglandular', t: ' retroglandulares' }, { r: 'retropeitoral', t: ' retropeitorais' }])], 0),
      desativadoPor: ['ma.impl.dob', 'ma.impl.ri', 'ma.impl.re', 'ma.impl.het'] },
    chk('ma.impl.dob', 'dobras do elastômero', 'Dobras do elastômero do implante {lado}.', 'Dobras do elastômero do implante {lado|c}.', [sel('lado', 'lado', IMPL)], 10),
    chk('ma.impl.ri', 'rotura intracapsular', 'Sinais de rotura intracapsular do implante {lado}.', 'Sinais de rotura intracapsular do implante {lado|c}.', [sel('lado', 'lado', IMPL)], 20),
    chk('ma.impl.re', 'rotura extracapsular', 'Sinais de rotura extracapsular do implante {lado}.', 'Sinais de rotura extracapsular do implante {lado|c}.', [sel('lado', 'lado', IMPL)], 30),
    chk('ma.impl.het', 'conteúdo heterogêneo', 'Implante {lado} com conteúdo heterogêneo.', 'Implante {lado|c} com conteúdo heterogêneo.', [sel('lado', 'lado', IMPL)], 40),
  ],
};

// ---------- Cirurgias ----------
const RECON: Opc[] = [
  { r: 'sem reconstrução', t: '', c: '' },
  { r: 'reconstrução com retalho miocutâneo', t: ', com reconstrução por retalho miocutâneo', c: ', com reconstrução por retalho miocutâneo' },
  { r: 'reconstrução com implante', t: ', com reconstrução por implante', c: ', com reconstrução por implante' },
  { r: 'reconstrução com expansor', t: ', com expansor tecidual', c: ', com expansor tecidual' },
];
const cirurgias: Secao = {
  id: 'ma.cir', titulo: 'Cirurgias', ordem: 8,
  controles: [
    chk('ma.cir.mast', 'mastectomia', 'Sinais de mastectomia {lado}{recon}.', 'Status pós-mastectomia {lado|c}{recon|c}.', [sel('lado', 'lado', LADO3), sel('recon', 'reconstrução', RECON)], 0),
    chk('ma.cir.quad', 'quadrantectomia', 'Sinais de quadrantectomia {lado}.', 'Status pós-quadrantectomia {lado|c}.', [sel('lado', 'lado', LADO3)], 10),
    chk('ma.cir.plast', 'mamoplastia', 'Sinais de mamoplastia.', 'Status pós-mamoplastia.', undefined, 20),
  ],
};

// ---------- Cistos ----------
const CONT: Opc[] = [{ r: 'anecogênico' }, { r: 'espesso' }];
const cisto = (n: number): Check =>
  chk(`ma.cisto${n}`, `cisto de conteúdo`, '', undefined, [sel('cont', '', CONT), mm('mm', 'medindo (mm)', 4), ...onde()], n * 10);
const cistos: Secao = {
  id: 'ma.cistos', titulo: 'Cistos', ordem: 20,
  bilateral: [{ base: 'Cisto simples', resultado: 'Cistos simples bilaterais.' }, { base: 'Cisto de conteúdo espesso', resultado: 'Cistos de conteúdo espesso bilaterais.' }],
  controles: [
    ...[1, 2, 3, 4].map(cisto),
    fixo('ma.cistxt', '{=mcist}', { ordem: 5, concl: '{=mcistconcl}' }),
    chk('ma.micro', 'agrupamento de microcistos', 'Agrupamento de microcistos anecogênicos, medindo até {mm|cm} cm, localizado {=mloc:ma.micro}.', 'Microcistos agrupados {lado|c}.',
      [mm('mm', 'medindo (mm)', 4), ...onde()], 50),
    chk('ma.multi', 'múltiplos cistos simples',
      'São identificados vários cistos anecogênicos de contornos regulares e paredes finas, {dist}, medindo até {mm|cm} cm, o maior deles localizado {=mloc:ma.multi}.', 'Cistos simples {dist|c}.',
      [sel('dist', 'distribuição', [{ r: 'bilaterais', t: 'bilaterais', c: 'bilaterais' }, { r: 'à direita', t: 'na mama direita', c: 'à direita' }, { r: 'à esquerda', t: 'na mama esquerda', c: 'à esquerda' }]),
        mm('mm', 'de até (mm), o maior deles', 10), ...onde()], 60),
  ],
};

// ---------- Ectasias ductais ----------
const ect = (r: string, lado: string, cont: string, id: string): Opc => ({
  r, corpo: `Presença de algumas ectasias ductais retroareolares ${lado} com contornos regulares e conteúdo ${cont}.`, concl: `Ectasias ductais ${lado}.`, id,
});
const ectasias: Secao = {
  id: 'ma.ect', titulo: 'Ectasias ductais', ordem: 50,
  controles: [radio('ma.ect.tipo', [
    { r: 'ausentes' },
    ect('presentes, de conteúdo anecogênico à DIREITA', 'à direita', 'anecogênico', 'ad'),
    ect('presentes, de conteúdo anecogênico à ESQUERDA', 'à esquerda', 'anecogênico', 'ae'),
    ect('presentes, de conteúdo anecogênico, bilaterais', 'bilaterais', 'anecogênico', 'ab'),
    ect('presentes, de conteúdo espesso à DIREITA', 'à direita', 'espesso', 'ed'),
    ect('presentes, de conteúdo espesso, à ESQUERDA', 'à esquerda', 'espesso', 'ee'),
    ect('presentes, de conteúdo espesso, bilaterais', 'bilaterais', 'espesso', 'eb'),
  ])],
};

// ---------- Ginecomastia ----------
const gineco: Secao = {
  id: 'ma.gin', titulo: 'Ginecomastia (mama masculina)', ordem: 55,
  controles: [radio('ma.gin.tipo', [
    { r: 'não citar' },
    { r: 'ausente', corpo: 'Ausência de tecido glandular retroareolar (ginecomastia).' },
    { r: 'presente, BILATERAL', corpo: 'Presença de tecido glandular retroareolar bilateral, compatível com ginecomastia.', concl: 'Ginecomastia bilateral.' },
    { r: 'presente, à DIREITA', corpo: 'Presença de tecido glandular retroareolar à direita, compatível com ginecomastia.', concl: 'Ginecomastia à direita.' },
    { r: 'presente, à ESQUERDA', corpo: 'Presença de tecido glandular retroareolar à esquerda, compatível com ginecomastia.', concl: 'Ginecomastia à esquerda.' },
    { r: 'pseudoginecomastia (tecido adiposo retroareolar)', corpo: 'Presença de tecido adiposo retroareolar, sem tecido glandular, compatível com pseudoginecomastia.', concl: 'Pseudoginecomastia.' },
  ])],
};

// ---------- Nódulos sólidos (texto e ID montados por mamasCalc.ts) ----------
const nodulo = (n: number): Check => {
  const campos: Campo[] = [
    dims('med', 'mede (mm)', 3, 10),
    sel('sit', 'distância', [{ r: 'não citar distância ao mamilo e à pele' }, { r: 'citar distância ao mamilo e à pele' }]),
    mm('mam', 'mm do mamilo', 10), mm('pele', 'mm da pele', 10),
    ...onde(),
    sel('eco', 'ecogenicidade', ops('hipoecogênico', 'isoecogênico', 'hiperecogênico', 'heterogêneo')),
    sel('forma', 'forma e margens', ops('oval, circunscrito', 'oval, indistinto', 'redondo, circunscrito', 'irregular, indistinto', 'irregular, espiculado', 'lobulado, circunscrito')),
    sel('orient', 'orientação espacial', [{ r: 'não citar orientação' }, { r: 'de orientação paralela à pele' }, { r: 'de orientação não paralela à pele' }]),
    sel('acus', 'efeito acústico', [{ r: 'não citar efeito acústico' }, { r: 'sem efeito acústico posterior' }, { r: 'com reforço acústico posterior' }, { r: 'com atenuação acústica posterior' }]),
    sel('pseudo', 'pseudonódulo', [{ r: 'não citar pseudonódulo' }, { r: 'possível pseudonódulo (ilhota adiposa)' }, { r: 'possível pseudonódulo (cisto de conteúdo espesso)' }]),
  ];
  return chk(`ma.n${n}`, `descrever nódulo sólido ${n}`, '', undefined, campos, n);
};
const nodulos: Secao = {
  id: 'ma.nod', titulo: 'Nódulos', ordem: 30,
  controles: [
    ...[1, 2, 3, 4, 5, 6].map(nodulo),
    fixo('ma.nodtxt', '{=mnod}', { ordem: 10, concl: '{=mnodconcl}' }),
    chk('ma.nodm', 'descrever múltiplos nódulos sólidos',
      'Presença de múltiplos nódulos sólidos {eco}, {forma}, bilaterais, medindo até {d|cm} cm à direita e {e|cm} cm à esquerda{orient}{acus}.', 'Múltiplos nódulos sólidos bilaterais.',
      [mm('d', 'medindo até (mm) à direita', 10), mm('e', 'mm à esquerda', 10),
        sel('eco', 'ecogenicidade', ops('hipoecogênicos', 'isoecogênicos', 'hiperecogênicos')),
        sel('forma', 'forma e margens', ops('ovais, circunscritos', 'ovais, indistintos', 'irregulares')),
        sel('orient', 'orientação espacial', [{ r: 'não citar orientação', t: '' }, { r: 'paralela à pele', t: ', de orientação paralela à pele' }, { r: 'não paralela à pele', t: ', de orientação não paralela à pele' }]),
        sel('acus', 'efeito acústico', [{ r: 'não citar efeito acústico', t: '' }, { r: 'atenuação', t: ', com atenuação acústica posterior' }, { r: 'reforço', t: ', com reforço acústico posterior' }])], 20),
  ],
};

// ---------- Axilas, observações ----------
const ASP: Opc[] = [
  { r: 'cortical espessada, hilo preservado', t: 'com cortical espessada e hilo gorduroso preservado' },
  { r: 'cortical espessada, hilo apagado', t: 'com cortical espessada e hilo gorduroso apagado' },
  { r: 'arredondado, sem hilo', t: 'de aspecto arredondado, hipoecogênico, sem hilo gorduroso identificável' },
  { r: 'ovalado, hilo preservado', t: 'de aspecto ovalado e hilo gorduroso preservado' },
];
const axilas: Secao = {
  id: 'ma.ax', titulo: 'Axilas', ordem: 70,
  controles: [radio('ma.ax.tipo', [
    { r: 'ausência de linfonodomegalias', corpo: 'Ausência de linfonodomegalias axilares.' },
    { r: 'linfonodos normais', corpo: 'Presença de linfonodos axilares de aspecto habitual.' },
    { r: 'linfonodomegalia isolada', campos: [sel('lado', 'lado', MAMA.map((o) => ({ ...o, t: o.c }))), sel('asp', 'aspecto', ASP), dims('med', 'medindo (mm)', 3, [25, 20, 15])],
      corpo: 'Linfonodomegalia axilar {lado}, {asp}, medindo {med} cm.', concl: 'Linfonodomegalia axilar {lado|c}.' },
    { r: 'linfonodomegalias bilaterais, a maior situada', campos: [sel('lado', 'a maior situada', MAMA.map((o) => ({ ...o, t: o.c }))), sel('asp', 'aspecto', ASP), dims('med', 'medindo a maior (mm)', 3, [25, 20, 15])],
      corpo: 'Linfonodomegalias axilares bilaterais, a maior situada {lado}, {asp}, medindo {med} cm.', concl: 'Linfonodomegalias axilares bilaterais.' },
    { r: 'não citar axilas' },
  ])],
};
const obs: Secao = {
  id: 'ma.obs', titulo: 'Observações opcionais', ordem: 80, umaPorLinha: true,
  controles: [
    chk('ma.obs.lim', 'ressaltar limitação do método quando efetuado isoladamente', 'Ressalta-se a limitação do método ultrassonográfico quando efetuado isoladamente, sendo recomendada a correlação com mamografia.'),
    chk('ma.obs.dop', 'citar Doppler normal', 'A avaliação com Doppler demonstra vascularização normal do parênquima mamário bilateralmente.'),
    chk('ma.obs.mmg', 'mamografia não disponível para exame dirigido', 'Mamografia não disponível para correlação com o presente exame dirigido.'),
    chk('ma.obs.queixa', 'ausência de achados ultrassonográficos na área da queixa clínica', 'Ausência de achados ultrassonográficos na área da queixa clínica.'),
    chk('ma.obs.cic', 'ausência de achados subjacentes à cicatriz na mama', 'Ausência de achados ultrassonográficos subjacentes à cicatriz na mama {lado}.', undefined, [sel('lado', 'mama', MAMA)]),
  ],
};

export const mamas: Exame = {
  id: 'mamas',
  titulo: 'Mamas',
  tituloLaudo: 'ULTRASSONOGRAFIA DAS MAMAS',
  restante: 'Restante do exame sem anormalidades detectáveis pelo método.',
  fim: ['Classificação ACR BI-RADS: {=val:ma.birads}'],
  secoes: [motivo, geral, implantes, cirurgias, cistos, ectasias, gineco, nodulos, axilas, obs],
};
