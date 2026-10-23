// ULTRASSONOGRAFIA PÉLVICA TRANSVAGINAL. O-RADS não é calculado: você escolhe.
import type { Campo, Check, Exame, Opc, Secao } from '../tipos';
import { chk, dims, esc, fixo, mm, ops, sel } from './abdomeTotal';

const texto = (id: string, rotulo: string, padrao: string): Campo => ({ id, tipo: 'texto', rotulo, padrao });
const item = (id: string, rotulo: string, itemTxt: string, concl: string | undefined, campos: Campo[], ordem: number): Check =>
  ({ tipo: 'check', id, rotulo, item: itemTxt, concl, campos, ordem });

const LOCAL_MIOMETRIO = ops(
  'fúndica', 'corporal', 'fúndica anterior', 'fúndica posterior', 'fúndica à direita', 'fúndica à esquerda',
  'corporal posterior', 'corporal anterior', 'corporal à direita', 'corporal à esquerda',
  'ístmica', 'ístmica anterior', 'ístmica posterior',
);
const TIPO_MIOMA = ops('subseroso', 'intramural', 'submucoso');
// t = descrição no corpo; c = conclusão (o lado entra depois)
const cisto = (r: string, t: string, c: string): Opc => ({ r, t, c });
const TIPO_CISTO: Opc[] = [
  cisto('cisto simples', 'imagem cística com conteúdo anecogênico e contornos regulares', 'Cisto de aspecto simples no ovário'),
  cisto('cisto hemorrágico', 'imagem cística de contornos regulares, contendo septações finas em "rendilhado" e líquido com debris', 'Cisto com aspecto compatível com cisto hemorrágico no ovário'),
  cisto('cisto unilocular', 'imagem cística unilocular de contornos regulares e paredes finas, contendo líquido com pequena quantidade de debris ecogênicos', 'Cisto unilocular no ovário'),
  cisto('cisto bilocular', 'imagem cística de conteúdo anecogênico, com contornos regulares e paredes finas, sem componente sólido, dividida em dois compartimentos por uma septação completa', 'Cisto bilocular no ovário'),
  cisto('cisto bilocular com componente sólido', 'imagem cística de paredes finas, contendo componente sólido, dividida em dois compartimentos por uma septação completa', 'Cisto bilocular com componente sólido no ovário'),
  cisto('cisto multilocular', 'imagem cística de contornos regulares contendo septações completas, sem componente sólido', 'Cisto multilocular no ovário'),
  cisto('cisto multilocular com componente sólido', 'imagem cística de contornos regulares contendo septações completas e ao menos um componente sólido', 'Cisto multilocular com componente sólido no ovário'),
  cisto('cisto com componente sólido', 'imagem cística de contornos regulares contendo ao menos um componente sólido', 'Cisto com componente sólido no ovário'),
  cisto('cisto dermoide', 'imagem cística de contornos regulares, contendo material hiperecogênico que determina atenuação acústica posterior', 'Cisto com aspecto compatível com cisto dermoide no ovário'),
  cisto('endometrioma', 'imagem cística de contornos regulares, com conteúdo hipoecogênico homogêneo', 'Cisto com aspecto compatível com endometrioma no ovário'),
  cisto('corpo lúteo', 'imagem cística de contornos discretamente irregulares, com paredes ecogênicas e levemente espessadas, com conteúdo hipoecogênico', 'Cisto com aspecto compatível com corpo lúteo no ovário'),
  cisto('nódulo sólido sem atenuação acústica', 'imagem nodular hipoecogênica de aspecto sólido e contornos irregulares, sem atenuação acústica posterior', 'Nódulo sólido no ovário'),
  cisto('nódulo sólido com atenuação acústica', 'imagem nodular hipoecogênica de aspecto sólido e contornos irregulares, com atenuação acústica posterior', 'Nódulo sólido no ovário'),
];
// 1ª opção = não citar. As demais acrescentam uma frase ao fim do achado.
const ORADS: Opc[] = [
  { r: 'não citar', t: '' },
  ...['0', '1', '2', '3', '4', '5'].map((n) => ({ r: `O-RADS ${n}`, t: ` Classificação O-RADS US ${n}.` })),
];
// "O-RADS final" (único): escreve a classificação e entra na conclusão.
const ORADS_FINAL: Opc[] = ORADS.map((o) => (o.t
  ? { r: o.r, corpo: `Classificação final ${o.r.replace('O-RADS', 'O-RADS US')}.`, concl: `Classificação ${o.r.replace('O-RADS', 'O-RADS US')}.` }
  : o));
const DOPPLER_CISTO: Opc[] = [
  { r: 'não citar', t: '' },
  { r: 'sem vascularização interna detectável', t: ' Ao Doppler, não há vascularização interna detectável.' },
  { r: 'com vascularização interna', t: ' Ao Doppler, há vascularização interna, com índice de resistência de {ir}.' },
];
const DIMS_UTERO = dims('med', 'medidas uterinas (mm)', 3, [80, 40, 40]);
const MIOMAS = [1, 2, 3, 4].map((n) => `ut.mioma${n}`);
const SE_MIOMA = [...MIOMAS, 'ut.multimiomas'].join(',');
const SEM_UTERO = ['ut.histerectomia.parcial', 'ut.histerectomia.total']; // desligam útero e endométrio
const SEM_APRESENTA = ['ut.estado', 'ut.miometrio.hetero', 'ut.adenomiose', ...MIOMAS, 'ut.multimiomas'];
const ASPECTO_ENDO: Opc[] = [{ r: 'não citar o aspecto', t: '' }, ...['hiperecogênico', 'hipoecogênico', 'isoecogênico'].map((a) => ({ r: a, t: `, de aspecto ${a}` }))];

const cistoOvariano = (lado: 'direito' | 'esquerdo', n: 1 | 2) => item(
  `ov${lado}.cisto${n}`, `cisto ${n}`,
  '{tipo}, medindo {mm|cm} cm.{doppler}{orads}',
  `{tipo|c} ${lado}.{orads}`,
  [mm('mm', 'maior diâmetro', 10), sel('tipo', 'aspecto', TIPO_CISTO), sel('doppler', 'Doppler', DOPPLER_CISTO),
   texto('ir', 'I.R. (se houver fluxo)', '0,60'), sel('orads', 'O-RADS', ORADS)],
  30 + n,
);

const ovario = (lado: 'direito' | 'esquerdo'): Secao => {
  const id = `ov${lado}`;
  const ladoF = lado === 'direito' ? 'direita' : 'esquerda';
  const cistos = [`${id}.cisto1`, `${id}.cisto2`];
  const medidas = `Ovário ${lado} com contornos regulares, medindo {med} cm, com volume{=ovaumentado:${id}} de {med|vol} cm³.`;
  return {
    id, titulo: `Ovário ${lado}`, ordem: lado === 'direito' ? 50 : 60,
    controles: [
      esc(`${id}.estado`, 'radio', [
        { r: 'normal', corpo: medidas, concl: `{=ovconcl:${id}}`, campos: [dims('med', 'medidas (mm)', 3, 20)] },
        { r: 'padrão multifolicular', corpo: `${medidas} Possui vários cistos de aspecto simples, medindo até {max|cm} cm, devendo corresponder a folículos.`,
          concl: `Ovário ${lado} com padrão multifolicular.`, campos: [dims('med', 'medidas (mm)', 3, 20), mm('max', 'folículos até (mm)', 15)] },
        { r: 'padrão policístico', corpo: `${medidas} Apresenta estroma hiperecogênico, alargado, e múltiplas imagens císticas anecogênicas com distribuição predominantemente periférica.`,
          concl: `Ovário ${lado} com padrão morfológico policístico.`, campos: [dims('med', 'medidas (mm)', 3, 20)] },
        { r: 'não caracterizado', corpo: `{=ovnc:${id}}` },
      ], { rotulo: 'Aspecto do ovário', ordem: 10 }),
      fixo(`${id}.parenquima`, 'O parênquima tem ecotextura homogênea.', { ordem: 15, suprimidoPor: [`${id}.estado`, ...cistos] }),
      cistoOvariano(lado, 1),
      cistoOvariano(lado, 2),
      {
        tipo: 'grupo', id: `${id}.cistos`, ordem: 30, itens: cistos,
        genero: 'f', juntar: 'lista', ordenarConcl: 'tipo',
        um: 'Presença de {itens}',
        varios: 'Presença de {n} imagens assim caracterizadas:\n{itens}',
      },
    ],
  };
};

export const transvaginal: Exame = {
  id: 'transvaginal',
  titulo: 'Transvaginal',
  tituloLaudo: 'ULTRASSONOGRAFIA PÉLVICA TRANSVAGINAL',
  secoes: [
    {
      id: 'utero', titulo: 'Útero', ordem: 10, desativadoPor: SEM_UTERO, exceto: SEM_UTERO,
      controles: [
        esc('ut.posicao', 'select', ops('anteversoflexão', 'retroversoflexão', 'medioversoflexão'), { rotulo: 'Posição uterina', variavel: 'posicao_utero' }),
        esc('ut.estado', 'radio', [
          { r: 'dimensões habituais', corpo: 'Útero em {posicao_utero}, com dimensões {=dimutero}, medindo {med} cm, com volume de {med|vol} cm³.', concl: '{=concutero}', campos: [DIMS_UTERO] },
          { r: 'contornos lobulados', corpo: 'Útero em {posicao_utero}, medindo {med} cm, com volume de {med|vol} cm³, apresentando contornos lobulados.', concl: 'Útero com contornos lobulados.', campos: [DIMS_UTERO] },
          { r: 'ecotextura heterogênea', corpo: 'Útero em {posicao_utero}, medindo {med} cm, com volume de {med|vol} cm³ e ecotextura miometrial heterogênea.', concl: 'Útero com ecotextura miometrial heterogênea.', campos: [DIMS_UTERO] },
        ], { rotulo: 'Aspecto uterino', ordem: 10 }),
        fixo('ut.apresenta', 'Apresenta contornos regulares e ecotextura miometrial homogênea.', { ordem: 11, suprimidoPor: SEM_APRESENTA }),
        chk('ut.relacao', 'citar relação corpo/colo', 'Relação corpo/colo mensurada em {rel}.', undefined, [texto('rel', 'relação corpo/colo', '1,50')], 20),
        chk('ut.miometrio.hetero', 'miométrio heterogêneo, sem nódulos', 'Apresenta contornos regulares e ecotextura miometrial heterogênea, sem nódulos visíveis.', 'Miométrio heterogêneo.', undefined, 30),
        chk('ut.adenomiose', 'sinais sugestivos de adenomiose',
          `{?${SE_MIOMA}?Nota-se também}{!${SE_MIOMA}!Apresenta contornos regulares e ecotextura miometrial difusamente heterogênea, notando-se} indefinição da zona juncional e diminutas imagens císticas periendometriais, mais evidentes na parede {parede}.`,
          'Aspecto miometrial sugestivo de adenomiose.', [sel('parede', 'mais evidentes na parede', LOCAL_MIOMETRIO)], 31),
        ...[1, 2, 3, 4].map((n) => item(`ut.mioma${n}`, `nódulo miometrial ${n}`, 'na parede {local} ({tipo} com {med} cm)', undefined,
          [sel('local', 'localização', LOCAL_MIOMETRIO), sel('tipo', 'tipo', TIPO_MIOMA), dims('med', 'medidas (mm)', 2, 10)], 40 + n)),
        {
          tipo: 'grupo', id: 'ut.miomas', ordem: 40, itens: MIOMAS, genero: 'm', juntar: 'e',
          um: 'Apresenta contornos regulares e ecotextura miometrial heterogênea, notando-se nódulo hipoecogênico {itens}.',
          varios: 'Apresenta contornos lobulados e ecotextura heterogênea à custa de {n} nódulos miometriais hipoecogênicos situados {itens}.',
          conclUm: 'Útero com nódulo miometrial (provável mioma).',
          conclVarios: 'Útero com nódulos miometriais (prováveis miomas).',
        },
        chk('ut.multimiomas', 'múltiplos nódulos miometriais', 'Apresenta contornos lobulados e ecotextura heterogênea à custa de vários nódulos miometriais hipoecogênicos, o maior deles situado na parede {local} ({tipo} com {med} cm).', 'Útero com nódulos miometriais (prováveis miomas).',
          [dims('med', 'medidas do maior (mm)', 2, 10), sel('local', 'localização', LOCAL_MIOMETRIO), sel('tipo', 'tipo', TIPO_MIOMA)], 45),
        chk('ut.doppler', 'incluir Doppler das artérias uterinas', 'A avaliação Dopplerfluxométrica das artérias uterinas demonstra curvas espectrais preservadas e índices normais.', undefined, undefined, 99),
        chk('ut.histerectomia.parcial', 'histerectomia parcial', 'Sinais de histerectomia parcial. Remanescente uterino com aspecto habitual medindo {med} cm.', 'Sinais de histerectomia parcial.', [dims('med', 'medidas (mm)', 3, 40)], 110),
        chk('ut.histerectomia.total', 'histerectomia total', 'Útero não caracterizado (status pós cirúrgico).', 'Sinais de histerectomia.', undefined, 111),
      ],
    },
    {
      id: 'endo', titulo: 'Endométrio, cavidade uterina e endocérvice', ordem: 20, desativadoPor: SEM_UTERO, umaPorLinha: true,
      controles: [
        // espessura e aspecto na mesma frase; a espessura vem marcada
        esc('endo.asp', 'radio', [
          { r: 'regular e homogêneo', corpo: 'Endométrio regular, homogêneo{asp}{esp}.',
            campos: [mm('mm', 'espessura (mm)', 4), sel('asp', 'aspecto', ASPECTO_ENDO),
              sel('esp', 'espessura', [{ r: 'citar espessura', t: ', com espessura de {mm|cm} cm' }, { r: 'não citar espessura', t: ', com espessura normal' }])] },
          { r: 'heterogêneo', corpo: 'Endométrio{esp} de aspecto heterogêneo{cist}.', concl: 'Endométrio heterogêneo{cist|c}.',
            campos: [mm('mm', 'espessura (mm)', 4), sel('esp', 'espessura', [{ r: 'citar espessura', t: ' com espessura de {mm|cm} cm,' }, { r: 'não citar espessura', t: '' }]),
              sel('cist', 'áreas císticas', [{ r: 'sem áreas císticas', t: '', c: '' }, { r: 'com áreas císticas', t: ', apresentando pequenas imagens císticas anecogênicas de permeio', c: ' com imagens císticas' }])] },
          { r: 'não identificado', corpo: 'Endométrio não individualizado.', concl: 'Endométrio não individualizado.' },
        ], { rotulo: 'Endométrio', ordem: 10 }),
        chk('endo.lamina', 'coleção líquida na cavidade uterina', 'Nota-se pequena coleção anecogênica laminar na cavidade uterina.', 'Lâmina líquida na cavidade uterina.', undefined, 40),
        chk('endo.polipo', 'pólipo endometrial', 'Presença de imagem noduliforme hiperecogênica no endométrio, em região {local}, medindo {med} cm.', 'Imagem sugestiva de pólipo endometrial.', [sel('local', 'localização', ops('fúndica', 'corporal', 'ístmica')), dims('med', 'medidas (mm)', 2, 4)], 50),
        chk('endo.polipo.cervical', 'pólipo endocervical', 'Presença de imagem polipoide hiperecogênica fixa no canal endocervical, medindo {med} cm, delimitada por fina lâmina de líquido anecogênico.', 'Imagem sugestiva de pólipo endocervical.', [dims('med', 'medidas (mm)', 2, 4)], 60),
        chk('endo.cervicite', 'espessamento da endocérvice (cervicite)', 'Nota-se espessamento difuso do revestimento mucoso endocervical.', 'Espessamento da endocérvice.', undefined, 70),
        chk('endo.cistos.retent', 'cistos de retenção no colo', 'Presença de cistos de retenção no colo uterino, de contornos regulares e conteúdo {aspecto}, o maior medindo {mm|cm} cm.', 'Cistos de retenção no colo uterino.', [mm('mm', 'maior cisto (mm)', 7), sel('aspecto', 'aspecto', ops('anecogênico', 'espesso'))], 80),
        // D.I.U.: linha própria no laudo (o \n inicial quebra a linha)
        chk('endo.diu.simples', 'D.I.U. bem posicionado (não citar medidas)', '\nD.I.U. bem posicionado.', 'D. I. U. na cavidade uterina.', undefined, 90),
        chk('endo.diu', 'D.I.U. com medidas', '\nD. I. U. na cavidade uterina, com {mucosa|cm} cm de mucosa livre e distando {fundo|cm} cm da serosa fúndica.', 'D. I. U. na cavidade uterina.', [mm('mucosa', 'mucosa livre (mm)', 4), mm('fundo', 'distância da serosa (mm)', 15)], 91),
      ],
    },
    ovario('direito'),
    ovario('esquerdo'),
    {
      id: 'anexos', titulo: 'Região anexial', ordem: 70,
      controles: [
        chk('anexos.paraovariano', 'cisto paraovariano', 'Formação cística anecogênica de paredes finas e contornos regulares situada adjacente ao ovário {lado}, medindo {med} cm, e que se desloca de forma independente do ovário à compressão com o transdutor.{orads}', 'Cisto paraovariano.', [sel('lado', 'lado', ops('direito', 'esquerdo')), dims('med', 'medidas (mm)', 3, 20), sel('orads', 'O-RADS', ORADS)], 10),
        chk('anexos.inclusao', 'cisto de inclusão peritoneal', 'Formação cística de paredes finas e contornos regulares, contendo septações finas e líquido anecogênico, situada na região anexial {lado}, medindo {med} cm. Esta formação contorna estruturas pélvicas adjacentes, mas sem exercer efeito de massa.{orads}', 'Cisto de inclusão peritoneal.', [sel('lado', 'lado', ops('direita', 'esquerda')), dims('med', 'medidas (mm)', 3, 20), sel('orads', 'O-RADS', ORADS)], 20),
        chk('anexos.hidrossalpinge.dir', 'hidrossalpinge à direita', 'Na região anexial direita foi identificada uma imagem tubular serpiginosa de conteúdo anecogênico e paredes finas, medindo {med} cm.{orads}', 'Achado sugestivo de hidrossalpinge à direita.', [dims('med', 'medidas (mm)', 3, 30), sel('orads', 'O-RADS', ORADS)], 30),
        chk('anexos.hidrossalpinge.esq', 'hidrossalpinge à esquerda', 'Na região anexial esquerda foi identificada uma imagem tubular serpiginosa de conteúdo anecogênico e paredes finas, medindo {med} cm.{orads}', 'Achado sugestivo de hidrossalpinge à esquerda.', [dims('med', 'medidas (mm)', 3, 30), sel('orads', 'O-RADS', ORADS)], 40),
        esc('anexos.orads', 'select', ORADS_FINAL, { rotulo: 'O-RADS final', ordem: 70 }),
        chk('anexos.dop', 'Doppler das artérias ovarianas', 'A avaliação Dopplerfluxométrica das artérias ovarianas demonstra curvas espectrais preservadas e índices normais.', undefined, undefined, 79),
        chk('anexos.liquido', 'líquido livre na cavidade pélvica', 'Líquido livre na cavidade pélvica.', 'Líquido livre na cavidade pélvica.', undefined, 90),
        fixo('anexos.sem_liquido', 'Ausência de líquido livre na cavidade pélvica.', { ordem: 91, suprimidoPor: ['anexos.liquido'] }),
      ],
    },
  ],
};
