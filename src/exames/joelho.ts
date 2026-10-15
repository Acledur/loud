// ============================================================================
// ULTRASSONOGRAFIA DOS JOELHOS — definição de exame para o projeto Laudos US
// Revise as frases e opções clínicas antes de utilizar em produção.
// A primeira opção de cada escolha é o padrão; medidas são digitadas em mm.
// ============================================================================
import type { Campo, Check, Exame, Fixo, Opc, Secao } from '../tipos';

const mm = (id: string, rotulo: string, padrao = 10): Campo => ({ id, tipo: 'mm', rotulo, padrao });
const sel = (id: string, rotulo: string, opcoes: Opc[]): Campo => ({ id, tipo: 'sel', rotulo, opcoes });
const ops = (...rs: string[]): Opc[] => rs.map((r) => ({ r }));
const chk = (id: string, rotulo: string, corpo: string, concl?: string, campos?: Campo[], ordem?: number): Check =>
  ({ tipo: 'check', id, rotulo, corpo, concl, campos, ordem });
const fixo = (id: string, corpo: string, extra: Partial<Fixo> = {}): Fixo => ({ tipo: 'fixo', id, corpo, ...extra });
const esc = (id: string, opcoes: Opc[], extra: { ordem?: number; rotulo?: string } = {}) =>
  ({ tipo: 'escolha' as const, id, ui: 'radio' as const, opcoes, ...extra });

const lados = [
  { id: 'd', nome: 'direito', titulo: 'JOELHO DIREITO', ordem: 10 },
  { id: 'e', nome: 'esquerdo', titulo: 'JOELHO ESQUERDO', ordem: 100 },
];

function criarSecoes(lado: typeof lados[number]): Secao[] {
  const { id: p, nome, ordem: base } = lado;
  return [
    { id: `${p}.derrame`, titulo: 'Derrame articular', ordem: base + 0, controles: [
      esc(`${p}.derrame.tipo`, [
        { r: 'ausente', corpo: `Ausência de derrame articular no joelho ${nome}.` },
        { r: 'presente', campos: [sel('grau', 'quantidade', ops('pequeno', 'moderado', 'volumoso')),
          sel('esp', 'espessamento sinovial', [{ r: 'não', t: '', c: '' }, { r: 'sim', t: ', associado a espessamento sinovial', c: ', associado a espessamento sinovial' }])],
        corpo: `Derrame articular no joelho ${nome}, em quantidade {grau}{esp}.`, concl: `Derrame articular no joelho ${nome}{esp|c}.` },
      ]),
    ]},
    { id: `${p}.lct`, titulo: 'Ligamento colateral tibial / medial', ordem: base + 1, controles: [
      esc(`${p}.lct.tipo`, [
        { r: 'aspecto normal' },
        { r: 'lesão com afilamento (lesão parcial)', corpo: `Ligamento colateral tibial do joelho ${nome} afilado, compatível com lesão parcial/estiramento.`, concl: `Sinais de lesão parcial/estiramento do ligamento colateral tibial do joelho ${nome}.` },
        { r: 'lesão com espessamento (lesão parcial/estiramento)', corpo: `Ligamento colateral tibial do joelho ${nome} espessado e com alteração ecotextural, compatível com lesão parcial/estiramento.`, concl: `Sinais de lesão parcial/estiramento do ligamento colateral tibial do joelho ${nome}.` },
      ]),
      fixo(`${p}.lc.juntos`, `Ligamentos colateral tibial e fibular do joelho ${nome} com ecotextura, espessura e contornos preservados.`, { ordem: 5, suprimidoPor: [`${p}.lct.tipo`, `${p}.lcf.tipo`] }),
      fixo(`${p}.lct.norm`, `Ligamento colateral tibial do joelho ${nome} com ecotextura, espessura e contornos preservados.`, { ordem: 10, suprimidoPor: [`${p}.lct.tipo`], apenasSe: [`${p}.lcf.tipo`] }),
    ]},
    { id: `${p}.lcf`, titulo: 'Ligamento colateral fibular / lateral', ordem: base + 2, controles: [
      esc(`${p}.lcf.tipo`, [
        { r: 'aspecto normal' },
        { r: 'lesão com afilamento (lesão parcial)', corpo: `Ligamento colateral fibular do joelho ${nome} afilado, compatível com lesão parcial/estiramento.`, concl: `Sinais de lesão parcial/estiramento do ligamento colateral fibular do joelho ${nome}.` },
        { r: 'lesão com espessamento (lesão parcial/estiramento)', corpo: `Ligamento colateral fibular do joelho ${nome} espessado e com alteração ecotextural, compatível com lesão parcial/estiramento.`, concl: `Sinais de lesão parcial/estiramento do ligamento colateral fibular do joelho ${nome}.` },
      ]),
      fixo(`${p}.lcf.norm`, `Ligamento colateral fibular do joelho ${nome} com ecotextura, espessura e contornos preservados.`, { ordem: 10, suprimidoPor: [`${p}.lcf.tipo`], apenasSe: [`${p}.lct.tipo`] }),
    ]},
    { id: `${p}.pata-ganso`, titulo: 'Tendões da pata de ganso', ordem: base + 3, controles: [
      esc(`${p}.pata-ganso.tipo`, [
        { r: 'não citar' },
        { r: 'aspecto normal', corpo: `Tendões da pata de ganso (sartório, grácil e semitendinoso) no joelho ${nome} com ecotextura e espessura preservadas.` },
        { r: 'tendinopatia', corpo: `Espessamento e alteração ecotextural dos tendões da pata de ganso (sartório, grácil e semitendinoso) no joelho ${nome}, compatíveis com tendinopatia.`, concl: `Tendinopatia da pata de ganso no joelho ${nome}.` },
        { r: 'líquido na bolsa sinovial (bursite da pata de ganso)', corpo: `Líquido na bolsa sinovial da pata de ganso no joelho ${nome}.`, concl: `Bursite da pata de ganso no joelho ${nome}.` },
      ]),
    ]},
    { id: `${p}.quadriceps`, titulo: 'Tendão do quadríceps femoral', ordem: base + 4, controles: [
      esc(`${p}.quadriceps.tipo`, [
        { r: 'aspecto normal', corpo: `Tendão do quadríceps femoral do joelho ${nome} com ecotextura e espessura preservadas e contornos normais.` },
        { r: 'tendinopatia sem rotura', corpo: `Tendão do quadríceps femoral do joelho ${nome} espessado e com alteração ecotextural, sem evidências de rotura.`, concl: `Tendinopatia do quadríceps femoral no joelho ${nome}.` },
        { r: 'lesão parcial medindo', campos: [mm('a', 'medida 1'), mm('b', 'medida 2'), mm('c', 'medida 3')], corpo: `Lesão parcial do tendão do quadríceps femoral do joelho ${nome}, medindo {a|cm} x {b|cm} x {c|cm} cm.`, concl: `Lesão parcial do tendão do quadríceps femoral no joelho ${nome}.` },
      ]),
      chk(`${p}.quadriceps.entesofito`, 'presença de entesófito', `Entesófito na inserção do tendão do quadríceps femoral do joelho ${nome}, medindo {mm|cm} cm.`, `Entesopatia na inserção do tendão do quadríceps femoral no joelho ${nome}.`, [mm('mm', 'medida', 10)], 20),
    ]},
    { id: `${p}.biceps`, titulo: 'Tendão do bíceps femoral', ordem: base + 5, controles: [
      esc(`${p}.biceps.tipo`, [
        { r: 'aspecto normal', corpo: `Tendão do bíceps femoral do joelho ${nome} com ecotextura e espessura preservadas e contornos normais.` },
        { r: 'tendinopatia sem rotura', corpo: `Tendão do bíceps femoral do joelho ${nome} espessado e com alteração ecotextural, sem evidências de rotura.`, concl: `Tendinopatia do bíceps femoral no joelho ${nome}.` },
        { r: 'lesão parcial medindo', campos: [mm('a', 'medida 1'), mm('b', 'medida 2'), mm('c', 'medida 3')], corpo: `Lesão parcial do tendão do bíceps femoral do joelho ${nome}, medindo {a|cm} x {b|cm} x {c|cm} cm.`, concl: `Lesão parcial do tendão do bíceps femoral no joelho ${nome}.` },
      ]),
    ]},
    { id: `${p}.patelar`, titulo: 'Tendão patelar', ordem: base + 6, controles: [
      esc(`${p}.patelar.tipo`, [
        { r: 'aspecto normal', corpo: `Tendão patelar do joelho ${nome} com ecotextura e espessura preservadas e contornos normais.` },
        { r: 'tendinopatia sem rotura', corpo: `Tendão patelar do joelho ${nome} espessado e com alteração ecotextural, sem evidências de rotura.`, concl: `Tendinopatia do tendão patelar no joelho ${nome}.` },
        { r: 'lesão parcial medindo', campos: [mm('a', 'medida 1'), mm('b', 'medida 2'), mm('c', 'medida 3')], corpo: `Lesão parcial do tendão patelar do joelho ${nome}, medindo {a|cm} x {b|cm} x {c|cm} cm.`, concl: `Lesão parcial do tendão patelar no joelho ${nome}.` },
        { r: 'aspecto pós-cirúrgico', corpo: `Aspecto pós-cirúrgico do tendão patelar do joelho ${nome}.`, concl: `Aspecto pós-cirúrgico do tendão patelar no joelho ${nome}.` },
      ]),
      chk(`${p}.patelar.entesofito`, 'presença de entesófito', `Entesófito na inserção {local} do tendão patelar do joelho ${nome}, medindo {mm|cm} cm.`, `Entesopatia do tendão patelar no joelho ${nome}.`, [sel('local', 'localização', ops('proximal', 'distal')), mm('mm', 'medida', 10)], 20),
    ]},
    { id: `${p}.artrose`, titulo: 'Osteoartrose', ordem: base + 7, controles: [
      chk(`${p}.artrose.on`, 'presente', 'Irregularidades corticais associadas a osteófitos marginais, nas articulações fêmur-tibial e fêmur-fibular.', 'Sinais de gonartrose.'),
    ]},
    { id: `${p}.cistos`, titulo: 'Cistos', ordem: base + 8, controles: [
      chk(`${p}.cisto-baker`, 'cisto de Baker', `Cisto de Baker no joelho ${nome}, medindo {a|cm} x {b|cm} x {c|cm} cm, com {paredes}, {conteudo} e {contornos}.`, `Cisto de Baker no joelho ${nome}.`, [mm('a', 'medida 1', 10), mm('b', 'medida 2', 10), mm('c', 'medida 3', 10), sel('paredes', 'paredes', ops('paredes finas', 'paredes espessadas')), sel('conteudo', 'conteúdo', ops('conteúdo líquido', 'conteúdo líquido com debris')), sel('contornos', 'contornos', ops('contornos regulares', 'contornos lobulados'))], 10),
      chk(`${p}.cisto-parameniscal`, 'cisto parameniscal', `Cisto parameniscal no joelho ${nome}, medindo {a|cm} x {b|cm} x {c|cm} cm, junto ao {corno} do menisco {menisco}.`, `Cisto parameniscal no joelho ${nome}.`, [mm('a', 'medida 1', 10), mm('b', 'medida 2', 10), mm('c', 'medida 3', 10), sel('corno', 'localização', ops('corno anterior', 'corpo', 'corno posterior')), sel('menisco', 'menisco', ops('lateral', 'medial'))], 20),
    ]},
    { id: `${p}.outros`, titulo: 'Outros achados', ordem: base + 9, controles: [
      chk(`${p}.fossa-livre`, 'fossa poplítea livre', `Fossa poplítea do joelho ${nome} livre.`, undefined, undefined, 10),
      chk(`${p}.outro`, 'outro achado (descrever)', `Outro achado no joelho ${nome}: {texto}.`, undefined, [{ id: 'texto', tipo: 'texto', rotulo: 'Descrição' }], 20),
    ]},
  ];
}

// Seletor no topo: o exame é de um joelho só. O lado não escolhido fica desativado e some da tela.
const seletor: Secao = {
  id: 'jo.ladosec', titulo: 'Lado examinado', ordem: -1,
  controles: [esc('jo.lado', [{ r: 'direito' }, { r: 'esquerdo' }])],
};
const secoes: Secao[] = [
  seletor,
  ...lados.flatMap(criarSecoes).map((x): Secao => ({
    ...x,
    ocultaSeOff: true,
    desativadoPor: [x.id.startsWith('d.') ? 'jo.lado=esquerdo' : 'jo.lado=direito'],
  })),
];

export const joelho: Exame = {
  id: 'joelho',
  titulo: 'Joelhos',
  tituloLaudo: 'ULTRASSONOGRAFIA DO JOELHO',
  tituloVar: { ctl: 'jo.lado', opcoes: { direito: 'ULTRASSONOGRAFIA DO JOELHO DIREITO', esquerdo: 'ULTRASSONOGRAFIA DO JOELHO ESQUERDO' } },
  secoes,
};
