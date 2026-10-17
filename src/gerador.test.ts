import { describe, expect, it } from 'vitest';
import { contarPendencias, desativados, fmtCm, gerarLaudo, respInicial } from './gerador';
import { abdomeTotal as ex } from './exames/abdomeTotal';
import { prostata } from './exames/prostata';
import { apUrinario } from './exames/apUrinario';
import { tireoide } from './exames/tireoide';
import { transvaginal } from './exames/transvaginal';
import { joelho } from './exames/joelho';
import { abdomeSuperior } from './exames/abdomeSuperior';
import { ombro } from './exames/ombro';
import { mamas } from './exames/mamas';
import { cotovelo } from './exames/cotovelo';
import { partesMoles } from './exames/partesMoles';
import { obstetrico1, obstetrico2 } from './exames/obstetricia';
import { linhasParaHtml } from './rico';

const gerar = (o = {}, rodape = '') => gerarLaudo(ex, { ...respInicial(ex), ...o }, { rodape }).texto;

describe('fmtCm', () => {
  it('converte mm em cm com vírgula', () => {
    expect(fmtCm(5)).toBe('0,5');
    expect(fmtCm(12)).toBe('1,2');
    expect(fmtCm(100)).toBe('10,0');
    expect(fmtCm(NaN)).toBe('[PREENCHER]');
  });
});

describe('exame normal', () => {
  const t = gerar();
  it('gera todos os parágrafos normais, na ordem anatômica', () => {
    const ordem = ['Fígado com', 'Vesícula biliar', 'Não há dilatação das vias', 'Pâncreas', 'Baço', 'Aorta', 'Rins tópicos', 'Bexiga', 'Ausência de líquido'];
    const pos = ordem.map((s) => t.indexOf(s));
    expect(pos.every((p) => p >= 0)).toBe(true);
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });
  it('rins normais trazem as duas frases negativas', () => {
    expect(t).toContain('Não há evidências de imagens calculosas calicinais. Não há dilatação do sistema coletor.');
  });
  it('conclusão normal e sem pendências', () => {
    expect(t).toContain('ID:\nExame sem anormalidades detectáveis pelo método.');
    expect(contarPendencias(t)).toBe(0);
  });
});

describe('alterações', () => {
  it('esteatose + cisto hepático', () => {
    const t = gerar({ 'fig.eco': 'esteatose', 'fig.eco.grau': 'discreta', 'fig.cisto': true, 'fig.cisto.mm': 5, 'fig.cisto.seg': 'segmento II' });
    expect(t).toContain('bordas finas, apresentando discreto aumento difuso da ecogenicidade. Cisto de conteúdo anecogênico');
    expect(t).toContain('medindo 0,5 cm, localizado no segmento II. Veia porta e veias hepáticas sem alterações.');
    expect(t).toContain('Sinais de esteatose hepática discreta (grau I).\nCisto hepático simples.\nRestante do exame sem particularidades.');
    expect(t).not.toContain('ecotextura homogênea. Veia porta');
  });
  it('cálculo renal + dilatação trocam as frases negativas', () => {
    const t = gerar({ 'rins.calc1': true, 'rins.calc1.mm': 5, 'rins.calc1.grupo': 'médio', 'rins.calc1.rim': 'rim direito', 'rins.dilD': 'discreta' });
    expect(t).toContain('Cálculo de 0,5 cm no grupamento calicinal médio do rim direito. Presença de discreta dilatação pielocalicinal à direita.');
    expect(t).not.toContain('Não há evidências de imagens calculosas');
    expect(t).not.toContain('Não há dilatação do sistema coletor');
    expect(t).toContain('Nefrolitíase à direita.\nDilatação do sistema coletor renal à direita.');
  });
  it('cálculo na vesícula remove "sem imagens calculosas"', () => {
    const t = gerar({ 'ves.calc': true });
    expect(t).not.toContain('sem imagens calculosas');
    expect(t).toContain('Colecistopatia calculosa.');
  });
  it('pólipo mantém a descrição normal da vesícula', () => {
    const t = gerar({ 'ves.polipo': true, 'ves.polipo.mm': 4 });
    expect(t).toContain('sem imagens calculosas. Imagem polipoide hiperecogênica aderida à parede da vesícula, medindo 0,4 cm.');
  });
  it('conclusões repetidas aparecem uma vez só', () => {
    const t = gerar({ 'rins.calc1': true, 'rins.calc2': true });
    expect(t.match(/Nefrolitíase à direita\./g)?.length).toBe(1);
  });
});

describe('campos vazios e opções', () => {
  it('medida vazia vira [PREENCHER]', () => {
    const t = gerar({ 'fig.cisto': true, 'fig.cisto.mm': '' });
    expect(t).toContain('[PREENCHER]');
    expect(contarPendencias(t)).toBe(1);
  });
  it('"não citar bexiga" omite o parágrafo', () => {
    expect(gerar({ 'bex.nao': true })).not.toContain('Bexiga');
  });
  it('rodapé entra no final', () => {
    expect(gerar({}, 'Dr. Fulano\nCRM 123').endsWith('Dr. Fulano\nCRM 123')).toBe(true);
  });
});

const gerarP = (o = {}) => gerarLaudo(prostata, { ...respInicial(prostata), ...o }).texto;

describe('casos de referência', () => {
  it('biotipo + hepatopatia incipiente', () => {
    const t = gerar({ 'lim.tipo': 'biotipo (obesidade)', 'fig.eco': 'hepatopatia crônica' });
    expect(t).toContain('Exame parcialmente prejudicado por limitações técnicas inerentes ao biotipo.\nFígado com dimensões normais e ecotextura difusamente heterogênea, com bordas discretamente rombas, conservando contornos regulares. Veia porta');
    expect(t).toContain('Sinais compatíveis com hepatopatia crônica incipiente.');
    expect(contarPendencias(t)).toBe(0);
  });
  it('nefropatia à direita substitui a frase normal dos rins + cálculos bilaterais', () => {
    const t = gerar({ 'rins.nefropatia': true, 'rins.nefropatia.lado': 'do rim direito', 'rins.calcB': true, 'rins.calcB.mm': 4, 'rins.calcB.grupo': 'superior', 'rins.calcB.rim': 'rim esquerdo' });
    expect(t).toContain('parênquima do rim direito. O rim esquerdo conserva dimensões, espessura e ecogenicidade parenquimatosas normais. Imagens calculosas bilaterais, medindo até 0,4 cm, a maior localizada no grupamento calicinal superior do rim esquerdo. Não há dilatação do sistema coletor.');
    expect(t).not.toContain('Rins tópicos com dimensões normais');
    expect(t).toContain('Sinais compatíveis com nefropatia parenquimatosa crônica à direita.\nNefrolitíase bilateral.');
  });
  it('nódulos hepáticos, vesícula com cálculos e cistos renais bilaterais', () => {
    const t = gerar({
      'fig.nodulos': true, 'fig.nodulos.a': 5, 'fig.nodulos.sa': 'segmento II', 'fig.nodulos.b': 7, 'fig.nodulos.sb': 'segmento VII',
      'ves.calcs': true, 'ves.calcs.a': 6, 'ves.calcs.b': 7, 'ves.parede': true, 'ves.parede.mm': 5,
      'rins.cistosB': true, 'rins.cistosB.mm': 6, 'rins.cistosB.terco': 'terço inferior', 'rins.cistosB.rim': 'rim esquerdo',
    });
    expect(t).toContain('Presença de vários nódulos hiperecogênicos de contornos regulares, os maiores medindo 0,5 cm (segmento II) e 0,7 cm (segmento VII). Veia porta');
    expect(t).toContain('apresentando imagens calculosas em seu interior, móveis às mudanças de decúbito, medindo de 0,6 a 0,7 cm. Espessura da parede vesicular = 0,5 cm.');
    expect(t).not.toContain('sem imagens calculosas');
    expect(t).toContain('bilaterais, medindo até 0,6 cm, o maior localizado no terço inferior do rim esquerdo. Não há evidências');
    expect(t).toContain('Nódulos hepáticos (prováveis hemangiomas).\nColecistopatia calculosa.\nCistos renais bilaterais.');
  });
  it('baço aumentado com índice, aorta, volume vesical, resíduo e líquido livre', () => {
    const t = gerar({
      'pancreas': 0, 'panc.tipo': 'parcialmente acessível',
      'baco.tipo': 'aumentado', 'baco.med': true, 'baco.med.med.1': 100, 'baco.med.med.2': 62, 'baco.med.idx': 'citar o índice esplênico',
      'aorta.tipo': 'aorta ateromatosa', 'rins.dilD': 'discreta',
      'volpre.on': true, 'volpre.on.v.1': 80, 'volpre.on.v.2': 70, 'volpre.on.v.3': 55, 'resid.on': true, 'resid.on.v.1': 20, 'resid.on.v.2': 40, 'resid.on.v.3': 6,
      'liq.tipo': 'presente',
    });
    expect(t).toContain('Pâncreas parcialmente visibilizado devido à interposição de alças intestinais.');
    expect(t).toContain('Baço com dimensões aumentadas, contornos regulares e ecotextura homogênea. Mede 10,0 x 6,2 cm em seu maior e menor eixo (índice esplênico uniplanar = 62,0).');
    expect(t).toContain('Aorta com paredes hiperecogênicas e discretamente irregulares, conservando calibre normal.');
    expect(t).toContain('conteúdo anecogênico.\nVolume vesical pré-miccional estimado em 161 ml.\nNota-se pequena quantidade de líquido livre na pelve.\nResíduo vesical pós-miccional desprezível.\n\nID:');
    expect(t).toContain('ID:\nEsplenomegalia.\nAteromatose aórtica.\nDilatação do sistema coletor renal à direita.\nPresença de líquido em pequena quantidade na pelve.\nRestante do exame sem particularidades.');
  });
  it('próstata acima de 30 cm³: aumento prostático, resíduo desprezível', () => {
    const t = gerarP({ 'pros.med.med.1': 45, 'pros.med.med.2': 50, 'pros.med.med.3': 45, 'resid.on.v.1': 20, 'resid.on.v.2': 40, 'resid.on.v.3': 6 });
    expect(t).toBe([
      'ULTRASSONOGRAFIA DE PRÓSTATA', '',
      'Bexiga com boa repleção, paredes finas e regulares, conteúdo anecogênico.',
      'Próstata de contornos regulares, com ecotextura habitual.',
      'Medidas: 4,5 x 5,0 x 4,5 cm. Volume estimado em 53,0 cm³ (normal até 30,0 cm³).',
      'Resíduo vesical pós-miccional desprezível.', '',
      'ID:', 'Aumento prostático.', 'Resíduo vesical pós-miccional desprezível.',
    ].join('\n'));
  });
  it('próstata normal: volume na conclusão, resíduo ausente (padrão)', () => {
    expect(gerarP()).toBe([
      'ULTRASSONOGRAFIA DE PRÓSTATA', '',
      'Bexiga com boa repleção, paredes finas e regulares, conteúdo anecogênico.',
      'Próstata de contornos regulares, com ecotextura habitual.',
      'Medidas: 2,5 x 2,5 x 2,5 cm. Volume estimado em 8,2 cm³ (normal até 30,0 cm³).',
      'Resíduo vesical pós-miccional ausente.', '',
      'ID:', 'Próstata com volume estimado em 8,2 cm³.', 'Resíduo vesical pós-miccional ausente.',
    ].join('\n'));
  });
  it('prostatectomia radical omite descrição e medidas da próstata', () => {
    const t = gerarP({ 'pros.pr': true });
    expect(t).not.toContain('Medidas:');
    expect(t).not.toContain('Próstata de contornos');
    expect(t).toContain('Status pós-prostatectomia radical.');
  });
});

describe('cabeçalho, rodapé e formatação', () => {
  const g = gerarLaudo(ex, respInicial(ex), { cabecalho: 'Paciente: Fulano\nMédico solicitante: Dr. X', rodape: 'Dr. Y\nCRM 1' });
  it('cabeçalho à esquerda e em negrito; título centralizado; rodapé à esquerda', () => {
    expect(g.linhas.slice(0, 2)).toEqual([{ t: 'Paciente: Fulano', a: 'left', b: true }, { t: 'Médico solicitante: Dr. X', a: 'left', b: true }]);
    expect(g.linhas.find((l) => l.t.startsWith('ULTRASSONOGRAFIA'))).toEqual({ t: 'ULTRASSONOGRAFIA DO ABDOME TOTAL', a: 'center', b: true });
    expect(g.linhas.find((l) => l.t === 'ID:')).toEqual({ t: 'ID:', a: 'left', b: true });
    expect(g.linhas.slice(-2)).toEqual([{ t: 'Dr. Y', a: 'left', b: true }, { t: 'CRM 1', a: 'left', b: true }]);
  });
  it('sem cabeçalho, o laudo começa pelo título', () => {
    expect(gerar().startsWith('ULTRASSONOGRAFIA DO ABDOME TOTAL\n\n')).toBe(true);
  });
  it('HTML do editor: negrito, alinhamento e destaque de pendência', () => {
    const h = linhasParaHtml([{ t: 'TÍTULO', a: 'center', b: true }, { t: 'x [REVISAR]', a: 'justify' }, { t: '', a: 'left' }]);
    expect(h).toContain('<p align="center" style="text-align:center;margin:0"><b>TÍTULO</b></p>');
    expect(h).toContain('<mark>[REVISAR]</mark>');
    expect(h).toContain('<p align="left" style="text-align:left;margin:0"><br></p>');
  });
});

describe('aparelho urinário', () => {
  const gerarA = (o = {}) => gerarLaudo(apUrinario, { ...respInicial(apUrinario), ...o }).texto;
  const medidas = {
    'rins.medidas': true,
    'rins.medidas.d.1': 90, 'rins.medidas.d.2': 90, 'rins.medidas.d.3': 90, 'rins.medidas.cpd': 'citar espessura', 'rins.medidas.pd': 11,
    'rins.medidas.e.1': 90, 'rins.medidas.e.2': 100, 'rins.medidas.e.3': 80, 'rins.medidas.cpe': 'citar espessura', 'rins.medidas.pe': 12,
  };
  it('com medidas dos rins', () => {
    expect(gerarA(medidas)).toBe([
      'ULTRASSONOGRAFIA DO APARELHO URINÁRIO', '',
      'Rins tópicos com dimensões normais, contornos regulares e ecotextura habitual. Não há evidências de imagens calculosas calicinais. Não há dilatação do sistema coletor.',
      'Dimensões renais:',
      '- rim direito: 9,0 x 9,0 x 9,0 cm.',
      '- espessura do parênquima à direita: 1,1 cm',
      '- rim esquerdo: 9,0 x 10,0 x 8,0 cm.',
      '- espessura do parênquima à esquerda: 1,2 cm',
      'Bexiga com boa repleção, paredes finas e regulares, conteúdo anecogênico.', '',
      'ID:', 'Exame sem anormalidades detectáveis pelo método.',
    ].join('\n'));
  });
  it('T/AP em branco são omitidos; parênquima é opcional', () => {
    const t = gerarA({ ...medidas, 'rins.medidas.d.3': '', 'rins.medidas.cpe': 'sem parênquima' });
    expect(t).toContain('- rim direito: 9,0 x 9,0 cm.');
    expect(t).not.toContain('à esquerda: 1,2');
  });
  it('as medidas dos rins também funcionam no abdome total (no fim do parágrafo dos rins)', () => {
    const t = gerar(medidas);
    expect(t).toContain('sistema coletor.\nDimensões renais:\n- rim direito: 9,0 x 9,0 x 9,0 cm.');
    expect(t).toContain('1,2 cm\nBexiga com boa repleção');
    expect(t).not.toContain('Meatos ureterais');
  });
});

describe('rins: bilateral e padrões', () => {
  it('cálculos nos dois rins viram "Nefrolitíase bilateral."', () => {
    const t = gerar({ 'rins.calc1': true, 'rins.calc2': true, 'rins.calc2.rim': 'rim esquerdo' });
    expect(t).toContain('Nefrolitíase bilateral.');
    expect(t).not.toContain('Nefrolitíase à direita.');
    expect(t).not.toContain('Nefrolitíase à esquerda.');
  });
  it('cistos nos dois rins viram "Cistos renais bilaterais."', () => {
    const t = gerar({ 'rins.cisto1': true, 'rins.cisto2': true, 'rins.cisto2.rim': 'rim esquerdo' });
    expect(t).toContain('Cistos renais bilaterais.');
    expect(t).not.toContain('Cisto renal simples à');
  });
  it('um lado só continua com lateralidade', () => {
    expect(gerar({ 'rins.cisto1': true })).toContain('Cisto renal simples à direita.');
  });
  it('citar medidas dos rins já vem com a espessura do parênquima', () => {
    const t = gerar({ 'rins.medidas': true });
    expect(t).toContain('- espessura do parênquima à direita: 1,1 cm');
    expect(t).toContain('- espessura do parênquima à esquerda: 1,2 cm');
  });
});

// ---------- guardas para TODOS os exames ----------
const TODOS = [ex, abdomeSuperior, apUrinario, prostata, tireoide, transvaginal, joelho, ombro, obstetrico1, obstetrico2, mamas, cotovelo, partesMoles];
const marcaTudo = (e: typeof ex) => {
  const r: Record<string, string | number | boolean> = { ...respInicial(e) };
  for (const s of e.secoes) for (const c of s.controles) if (c.tipo === 'check') {
    r[c.id] = true;
    // "(escolher ...)" é o item em branco: aqui escolhemos o 2º para o teste
    for (const f of c.campos ?? []) if (f.tipo === 'sel' && f.opcoes?.[0].r.startsWith('(escolher')) r[`${c.id}.${f.id}`] = f.opcoes[1].r;
  }
  for (const k in r) if (r[k] === '') r[k] = 'x'; // campos de texto livre
  return r;
};
describe('todos os exames', () => {
  for (const e of TODOS.filter((x) => !x.id.startsWith('obstetrico'))) { // (obstétricos: medidas em branco de propósito; ver abaixo)
    it(`${e.id}: padrão não tem pendências`, () => {
      const t = gerarLaudo(e, respInicial(e)).texto;
      expect(contarPendencias(t)).toBe(0);
      // (a próstata tem ID próprio por volume)
      if (e.id === 'partes-moles') expect(t).toContain('Exame sem anormalidades demonstráveis pelo método.');
      else if (e.id !== 'prostata') expect(t).toContain('Exame sem anormalidades detectáveis pelo método.');
    });
    it(`${e.id}: com todas as caixas marcadas não sobra {token}, "não citar" nem [PREENCHER]`, () => {
      const t = gerarLaudo(e, marcaTudo(e)).texto;
      expect(t).not.toContain('{');
      expect(t).not.toContain('não citar');
      expect(t).not.toContain('[PREENCHER');
    });
  }
});

describe('volume: fator 0,523', () => {
  it('útero e próstata dos prints', () => {
    expect(fmtCm(5)).toBe('0,5');
    const t = gerarLaudo(transvaginal, respInicial(transvaginal)).texto;
    expect(t).toContain('medindo 8,0 x 4,0 x 4,0 cm, com volume de 66,9 cm³.');
    expect(gerarLaudo(transvaginal, { ...respInicial(transvaginal), 'ut.estado.med.1': 100 }).texto).toContain('medindo 10,0 x 4,0 x 4,0 cm, com volume de 83,7 cm³.');
  });
});

describe('tireoide', () => {
  const gt = (o = {}) => gerarLaudo(tireoide, { ...respInicial(tireoide), ...o }).texto;
  it('laudo normal igual ao print', () => {
    expect(gt()).toBe([
      'ULTRASSONOGRAFIA DA TIREOIDE', '',
      'Tireoide tópica, com dimensões normais e contornos regulares. A ecotextura é homogênea, não se observando lesões nodulares.',
      'O lobo direito mede 4,0 x 1,2 x 1,2 cm.',
      'O lobo esquerdo mede 3,0 x 2,2 x 2,2 cm.',
      'O istmo tem espessura de 0,3 cm.',
      'Volume tireoidiano estimado em 11,6 cm³ (normal de 8,0 a 15,0 cm³).',
      'Ausência de linfonodomegalias cervicais.', '',
      'ID:', 'Exame sem anormalidades detectáveis pelo método.',
    ].join('\n'));
  });
  it('laudo alterado igual ao print (2 nódulos, cisto, Doppler, linfonodo)', () => {
    const t = gt({
      'tmed.on.dir.1': 50, 'tmed.on.dir.2': 5, 'tmed.on.dir.3': 15, 'tmed.on.esq.1': 40, 'tmed.on.esq.2': 10, 'tmed.on.esq.3': 8, 'tmed.on.istmo': 4,
      'tireoide.ecotextura': 'alteração textural difusa inespecífica',
      'nodulos.n1': true, 'nodulos.n1.composicao': 'misto (sólido/cístico)', 'nodulos.n1.local': 'terço inferior do lobo esquerdo', 'nodulos.n1.eco': 'isoecogênico',
      'nodulos.n1.calc': 'com calcificações puntiformes', 'nodulos.n1.tirads': '2',
      'nodulos.n2': true, 'nodulos.n2.local': 'terço inferior do lobo esquerdo', 'nodulos.n2.calc': 'com calcificações grosseiras', 'nodulos.n2.vasc': 'periférica e central',
      'nodulos.n2.tirads': '3', 'nodulos.n2.med.1': 12, 'nodulos.n2.med.2': 12, 'nodulos.n2.med.3': 12,
      'tireoide.cistoColoide': true, 'tireoide.cistoColoide.local': 'terço médio do lobo esquerdo',
      'paratireoides.ausencia': true, 'tireoide.dopp': true,
      'linf.isolado': true, 'linf.isolado.sitio': 'sítio nodal IIA', 'linf.isolado.lado': 'esquerda', 'linf.isolado.med.1': 10, 'linf.isolado.med.2': 15, 'linf.isolado.med.3': 12,
    });
    expect(t).toBe([
      'ULTRASSONOGRAFIA DA TIREOIDE', '',
      'Tireoide tópica, com dimensões reduzidas e contornos regulares. A ecotextura é difusamente heterogênea.',
      'São identificados dois nódulos localizados no lobo esquerdo:',
      '- N1: terço inferior, nódulo misto (sólido/cístico) isoecogênico, de contornos regulares, com calcificações puntiformes centrais, medindo 1,0 x 1,0 x 1,0 cm. Classificação TI-RADS: 2.',
      '- N2: terço inferior, nódulo sólido hipoecogênico, de contornos regulares, com calcificações grosseiras, medindo 1,2 x 1,2 x 1,2 cm. Ao Doppler a vascularização é periférica e central. Classificação TI-RADS: 3.',
      'Nota-se também cisto de 0,4 cm, com conteúdo anecogênico e contornos regulares, situado no terço médio do lobo esquerdo.',
      'Não foram identificados nódulos na topografia das glândulas paratireoides.',
      'A avaliação do restante do parênquima tireoidiano com Doppler não demonstra áreas de fluxo anômalo.',
      'O lobo direito mede 5,0 x 0,5 x 1,5 cm.',
      'O lobo esquerdo mede 4,0 x 1,0 x 0,8 cm.',
      'O istmo tem espessura de 0,4 cm.',
      'Volume tireoidiano estimado em 4,6 cm³ (normal de 8,0 a 15,0 cm³).',
      'No sítio nodal IIA à esquerda nota-se um linfonodo hipoecogênico de contornos regulares, medindo 1,0 x 1,5 x 1,2 cm.', '',
      'ID:',
      'Sinais ecográficos inespecíficos de tireoidopatia difusa.',
      'Nódulos tireoidianos à esquerda.',
      'Provável cisto coloide à esquerda.',
      'Linfonodomegalia cervical à esquerda.',
      'Restante do exame sem particularidades.',
    ].join('\n'));
  });
  it('localização em branco vira [PREENCHER]; Doppler só quando escolhido; nódulo único', () => {
    expect(gt({ 'nodulos.n1': true })).toContain('[PREENCHER: localização]');
    expect(gt()).not.toContain('Doppler');
    const t = gt({ 'nodulos.n1': true, 'nodulos.n1.local': 'istmo' });
    expect(t).toContain('É identificado um nódulo localizado no istmo:');
    expect(t).toContain('Nódulo tireoidiano no istmo.');
  });
  it('referência de volume por sexo', () => {
    expect(gt()).toContain('(normal de 8,0 a 15,0 cm³)');
    expect(gt({ 'tireoide.sexo': 'Masculino' })).toContain('(normal de 10,0 a 18,0 cm³)');
  });
  it('tireoidectomia total retira a frase normal da tireoide', () => {
    const t = gt({ 'tireoide.tireoidectomia': true });
    expect(t).not.toContain('Tireoide tópica');
    expect(t).toContain('Status pós-tireoidectomia total.');
  });
});

describe('transvaginal', () => {
  const gv = (o = {}) => gerarLaudo(transvaginal, { ...respInicial(transvaginal), ...o }).texto;
  it('laudo normal igual ao print', () => {
    expect(gv()).toBe([
      'ULTRASSONOGRAFIA PÉLVICA TRANSVAGINAL', '',
      'Útero em anteversoflexão, com dimensões normais, medindo 8,0 x 4,0 x 4,0 cm, com volume de 66,9 cm³. Apresenta contornos regulares e ecotextura miometrial homogênea.',
      'Endométrio regular, homogêneo, com espessura de 0,4 cm.',
      'Ovário direito com contornos regulares, medindo 2,0 x 2,0 x 2,0 cm, com volume de 4,2 cm³. O parênquima tem ecotextura homogênea.',
      'Ovário esquerdo com contornos regulares, medindo 2,0 x 2,0 x 2,0 cm, com volume de 4,2 cm³. O parênquima tem ecotextura homogênea.',
      'Ausência de líquido livre na cavidade pélvica.', '',
      'ID:', 'Exame sem anormalidades detectáveis pelo método.',
    ].join('\n'));
  });
  it('laudo alterado igual ao print (nódulos, endométrio, D.I.U., cistos, ovário não caracterizado)', () => {
    const t = gv({
      'ut.estado.med.1': 100,
      'ut.mioma1': true, 'ut.mioma1.med.1': 15, 'ut.mioma1.med.2': 15,
      'ut.mioma2': true, 'ut.mioma2.med.1': 12, 'ut.mioma2.med.2': 12, 'ut.mioma2.tipo': 'intramural', 'ut.mioma2.local': 'corporal posterior',
      'endo.asp': 'heterogêneo', 'endo.asp.cist': 'com áreas císticas',
      'endo.diu': true, 'endo.diu.fundo': 15, 'endo.diu.mucosa': 4,
      'ovdireito.cisto1': true, 'ovdireito.cisto1.mm': 25, 'ovdireito.cisto1.tipo': 'cisto hemorrágico',
      'ovdireito.cisto2': true,
      'ovesquerdo.estado': 'não caracterizado',
    });
    expect(t).toBe([
      'ULTRASSONOGRAFIA PÉLVICA TRANSVAGINAL', '',
      'Útero em anteversoflexão, com dimensões normais, medindo 10,0 x 4,0 x 4,0 cm, com volume de 83,7 cm³. Apresenta contornos lobulados e ecotextura heterogênea à custa de dois nódulos miometriais hipoecogênicos situados na parede fúndica (subseroso com 1,5 x 1,5 cm) e na parede corporal posterior (intramural com 1,2 x 1,2 cm).',
      'Endométrio com espessura de 0,4 cm, de aspecto heterogêneo, apresentando pequenas imagens císticas anecogênicas de permeio.',
      'D. I. U. na cavidade uterina, com 0,4 cm de mucosa livre e distando 1,5 cm da serosa fúndica.',
      'Ovário direito com contornos regulares, medindo 2,0 x 2,0 x 2,0 cm, com volume de 4,2 cm³. Presença de duas imagens assim caracterizadas:',
      '- imagem cística de contornos regulares, contendo septações finas em "rendilhado" e líquido com debris, medindo 2,5 cm.',
      '- imagem cística com conteúdo anecogênico e contornos regulares, medindo 1,0 cm.',
      'Ovário esquerdo não caracterizado. Região anexial esquerda sem evidências de massas ou coleções.',
      'Ausência de líquido livre na cavidade pélvica.', '',
      'ID:',
      'Útero com nódulos miometriais (prováveis miomas).',
      'Endométrio heterogêneo com imagens císticas.',
      'D. I. U. na cavidade uterina.',
      'Cisto de aspecto simples no ovário direito.',
      'Cisto com aspecto compatível com cisto hemorrágico no ovário direito.',
      'Restante do exame sem particularidades.',
    ].join('\n'));
  });
  it('um nódulo e um cisto (formas no singular)', () => {
    expect(gv({ 'ut.mioma1': true })).toContain('Apresenta contornos regulares e ecotextura miometrial heterogênea, notando-se nódulo hipoecogênico na parede fúndica (subseroso com 1,0 x 1,0 cm).');
    expect(gv({ 'ovdireito.cisto1': true })).toContain('Presença de imagem cística com conteúdo anecogênico e contornos regulares, medindo 1,0 cm.');
  });
  it('cisto com Doppler e O-RADS escolhido', () => {
    const t = gv({ 'ovdireito.cisto1': true, 'ovdireito.cisto1.doppler': 'com vascularização interna', 'ovdireito.cisto1.orads': 'O-RADS 3' });
    expect(t).toContain('medindo 1,0 cm. Ao Doppler, há vascularização interna, com índice de resistência de 0,60. Classificação O-RADS US 3.');
    expect(t).toContain('Cisto de aspecto simples no ovário direito. Classificação O-RADS US 3.');
  });
  it('achados sempre geram conclusão (o ID não pode dizer "normal")', () => {
    for (const k of ['ut.miometrio.hetero', 'ut.mioma1', 'ut.histerectomia.total', 'endo.lamina', 'endo.cervicite', 'endo.cistos.retent', 'anexos.liquido', 'ovdireito.cisto1']) {
      expect(gv({ [k]: true })).not.toContain('Exame sem anormalidades');
    }
  });
});

describe('joelho (seletor de lado)', () => {
  const gj = (o = {}) => gerarLaudo(joelho, { ...respInicial(joelho), ...o }).texto;
  it('padrão: joelho direito, só o lado escolhido aparece; colaterais numa frase só', () => {
    const t = gj();
    expect(t).toContain('ULTRASSONOGRAFIA DO JOELHO DIREITO');
    expect(t).toContain('Ausência de derrame articular.');
    expect(t).toContain('Ligamentos colateral tibial e fibular com ecotextura, espessura e contornos preservados.');
    expect(t).not.toContain('Ligamento colateral tibial com');
    expect(t).not.toContain('menisco');
    expect(t).not.toContain('joelho esquerdo');
  });
  it('um colateral alterado: o outro volta a ter frase própria', () => {
    const t = gj({ 'd.lct.tipo': 'lesão com afilamento (lesão parcial)' });
    expect(t).toContain('Ligamento colateral fibular com ecotextura, espessura e contornos preservados.');
    expect(t).not.toContain('Ligamentos colateral');
  });
  it('esquerdo: título e frases do lado esquerdo', () => {
    const t = gj({ 'jo.lado': 'esquerdo', 'e.derrame.tipo': 'presente', 'e.derrame.tipo.grau': 'moderado' });
    expect(t).toContain('ULTRASSONOGRAFIA DO JOELHO ESQUERDO');
    expect(t).toContain('Derrame articular, em quantidade moderado.');
    expect(t).toContain('Derrame articular.');
    expect(t).not.toContain('joelho direito');
  });
  it('derrame com espessamento sinovial e osteoartrose', () => {
    const t = gj({ 'd.derrame.tipo': 'presente', 'd.derrame.tipo.grau': 'moderado', 'd.derrame.tipo.esp': 'sim', 'd.artrose.on': true });
    expect(t).toContain('Derrame articular, em quantidade moderado, associado a espessamento sinovial.');
    expect(t).toContain('Derrame articular, associado a espessamento sinovial.');
    expect(t).toContain('Irregularidades corticais associadas a osteófitos marginais, nas articulações fêmur-tibial e fêmur-fibular.');
    expect(t).toContain('Sinais de gonartrose.');
  });
  it('títulos das caixas sem o lado', () => {
    for (const x of joelho.secoes) expect(x.titulo).not.toContain('JOELHO');
  });
});

describe('ombro', () => {
  const go = (o = {}) => gerarLaudo(ombro, { ...respInicial(ombro), ...o }).texto;
  it('normal: frase única dos 3 tendões e ID sem anormalidades (print 1)', () => {
    const t = go();
    expect(t).toContain('ULTRASSONOGRAFIA DO OMBRO DIREITO');
    expect(t).toContain('Tendões do supraespinhal, do infraespinhal e do subescapular com ecotextura e espessura preservadas e contornos normais.');
    expect(t).toContain('Tendão da cabeça longa do bíceps braquial com ecotextura e espessura preservadas e contornos normais. Ausência de líquido na bainha.');
    expect(t).toContain('Ausência de líquido na bolsa subacromial-subdeltoidea.');
    expect(t).toContain('Articulação acromioclavicular de aspecto preservado.');
    expect(t).toContain('Exame sem anormalidades detectáveis pelo método.');
  });
  it('lado esquerdo muda só o título', () => {
    expect(go({ 'om.lado': 'esquerdo' })).toContain('ULTRASSONOGRAFIA DO OMBRO ESQUERDO');
  });
  it('achados alterados (print 2)', () => {
    const t = go({
      'om.sup.tipo': 'tendinopatia sem rotura',
      'om.inf.tipo': 'rotura completa', 'om.inf.tipo.int': 12,
      'om.bic.liq': true,
      'om.bolsa.tipo': 'líquido', 'om.bolsa.tipo.qtd': 'moderada',
      'om.ac.tipo': 'osteoartrose',
    });
    expect(t).toContain('Tendão do supraespinhal espessado, com alteração ecotextural, sem evidências de rotura.');
    expect(t).toContain('Tendão do infraespinhal hipoecogênico, heterogêneo, observando-se sinais de rotura completa com 1,2 cm de intervalo.');
    expect(t).toContain('Tendão do subescapular com ecotextura e espessura preservadas e contornos normais.');
    expect(t).not.toContain('Tendões do');
    expect(t).toContain('Presença de líquido na bainha.');
    expect(t).not.toContain('Ausência de líquido na bainha');
    expect(t).toContain('Presença de líquido em moderada quantidade na bolsa subacromial-subdeltoidea.');
    expect(t).toContain('Presença de osteófitos marginais e irregularidades corticais na articulação acromioclavicular.');
    expect(t).toContain('ID:\nTendinopatia do supraespinhal.\nTendinopatia do infraespinhal, com sinais de rotura completa.\nLíquido na bainha do tendão da cabeça longa do bíceps braquial.\nSinais de bursite subacromial-subdeltoidea.\nSinais de osteoartrose acromioclavicular.\nRestante do exame sem anormalidades detectáveis pelo método.');
  });
  it('um tendão alterado: os outros dois numa frase só, na frase e na conclusão', () => {
    const t = go({ 'om.sup.tipo': 'tendinopatia sem rotura' });
    expect(t).toContain('Tendão do supraespinhal espessado, com alteração ecotextural, sem evidências de rotura.\nTendões do infraespinhal e do subescapular com ecotextura e espessura preservadas e contornos normais.');
  });
  it('dois alterados iguais: conclusão unida; o terceiro normal sozinho', () => {
    const t = go({ 'om.sup.tipo': 'tendinopatia sem rotura', 'om.inf.tipo': 'tendinopatia sem rotura' });
    expect(t).toContain('Tendinopatia do supraespinhal e do infraespinhal.');
    expect(t).toContain('Tendão do subescapular com ecotextura');
  });
  it('fissuras intrassubstanciais', () => {
    const t = go({ 'om.inf.tipo': 'fissuras intrassubstanciais' });
    expect(t).toContain('Espessamento e hipoecogenicidade do tendão do infraespinhal, com algumas fissuras intrassubstanciais, sem transfixação.');
    expect(t).toContain('Tendinopatia do infraespinhal, com fissuras intrassubstanciais, sem transfixação.');
  });
  it('rotura parcial tem só 2 medidas', () => {
    expect(go({ 'om.sub.tipo': 'rotura parcial medindo', 'om.sub.tipo.tp': 'articular' })).toContain('sinais de rotura parcial articular medindo 1,0 x 1,0 cm.');
  });
});

describe('resíduo pós-miccional automático', () => {
  const ga = (o = {}) => gerarLaudo(ex, { ...respInicial(ex), 'resid.on': true, ...o }).texto;
  const v = (a: number, b: number, c: number) => ({ 'resid.on.v.1': a, 'resid.on.v.2': b, 'resid.on.v.3': c });
  it('ausente / desprezível / moderado / acentuado pelo volume', () => {
    expect(ga(v(0, 0, 0))).toContain('Resíduo vesical pós-miccional ausente.');
    expect(ga(v(20, 40, 6))).toContain('Resíduo vesical pós-miccional desprezível.');
    expect(ga(v(80, 40, 30))).toContain('Resíduo vesical pós-miccional moderado, estimado em 50 ml.');
    expect(ga(v(100, 60, 60))).toContain('Resíduo vesical pós-miccional acentuado, estimado em 188 ml.');
  });
  it('no abdome só entra no ID quando passa de 40 ml', () => {
    expect(ga(v(20, 40, 6))).toContain('Exame sem anormalidades');
    expect(ga(v(80, 40, 30))).toContain('ID:\nResíduo vesical pós-miccional moderado, estimado em 50 ml.');
  });
});

describe('próstata: limite de 30 cm³', () => {
  const gp2 = (a: number, b: number, c: number) => gerarP({ 'pros.med.med.1': a, 'pros.med.med.2': b, 'pros.med.med.3': c });
  it('até 30 cita o volume na conclusão; acima, aumento prostático', () => {
    const t1 = gp2(40, 40, 35); // 29,3 cm³
    expect(t1).toContain('Próstata com volume estimado em 29,3 cm³.');
    expect(t1).not.toContain('Aumento prostático');
    const t2 = gp2(40, 40, 40); // 33,5 cm³
    expect(t2).toContain('Aumento prostático.');
    expect(t2).not.toContain('Próstata com volume estimado');
  });
  it('título', () => {
    expect(gerarP().startsWith('ULTRASSONOGRAFIA DE PRÓSTATA\n')).toBe(true);
  });
});

describe('dilatação do sistema coletor', () => {
  it('dos dois lados vira bilateral; de um lado só mantém a lateralidade', () => {
    const t = gerar({ 'rins.dilD': 'discreta', 'rins.dilE': 'moderada' });
    expect(t).toContain('Dilatação do sistema coletor renal bilateral.');
    expect(t).not.toContain('renal à direita.');
    expect(gerar({ 'rins.dilD': 'discreta' })).toContain('Dilatação do sistema coletor renal à direita.');
  });
});

describe('campos desativados', () => {
  it('tireoidectomia total desativa as medidas da tireoide', () => {
    const r = { ...respInicial(tireoide), 'tireoide.tireoidectomia': true };
    const t = gerarLaudo(tireoide, r).texto;
    expect(t).not.toContain('O lobo direito mede');
    expect(t).not.toContain('Volume tireoidiano');
    expect(desativados(tireoide, r).has('tmed.on')).toBe(true);
    expect(desativados(tireoide, respInicial(tireoide)).has('tmed.on')).toBe(false);
  });
  it('histerectomia desativa útero e endométrio (mas não as próprias caixas)', () => {
    const r = { ...respInicial(transvaginal), 'ut.histerectomia.total': true, 'ut.mioma1': true };
    const t = gerarLaudo(transvaginal, r).texto;
    expect(t).not.toContain('Útero em');
    expect(t).not.toContain('Endométrio');
    expect(t).not.toContain('nódulo miometrial');
    expect(t).toContain('Status pós-histerectomia total.');
    const off = desativados(transvaginal, r);
    expect(off.has('ut.estado')).toBe(true);
    expect(off.has('endo')).toBe(true);
    expect(off.has('ut.histerectomia.total')).toBe(false);
  });
});

describe('limites de volume do útero e do ovário', () => {
  const gv2 = (o = {}) => gerarLaudo(transvaginal, { ...respInicial(transvaginal), ...o }).texto;
  it('útero: normal abaixo de 100 cm³; acima, aumentado (corpo e conclusão)', () => {
    const t = gv2({ 'ut.estado.med.1': 100, 'ut.estado.med.2': 60, 'ut.estado.med.3': 60 }); // 188,3 cm³
    expect(t).toContain('com dimensões aumentadas, medindo 10,0 x 6,0 x 6,0 cm, com volume de 188,3 cm³.');
    expect(t).toContain('Útero com volume aumentado.');
    expect(gv2()).toContain('com dimensões normais');
  });
  it('ovário: normal até 9 cm³; acima, aumentado (corpo e conclusão)', () => {
    const t = gv2({ 'ovdireito.estado.med.1': 30, 'ovdireito.estado.med.2': 30, 'ovdireito.estado.med.3': 30 }); // 14,1 cm³
    expect(t).toContain('Ovário direito com contornos regulares, medindo 3,0 x 3,0 x 3,0 cm, com volume aumentado de 14,1 cm³.');
    expect(t).toContain('Ovário direito com volume aumentado.');
    expect(gv2()).not.toContain('aumentado');
  });
});

describe('frases de referência incorporadas', () => {
  it('esteatose sem grau, hepatopatia avançada e limitações combinadas', () => {
    expect(gerar({ 'fig.eco': 'esteatose' })).toContain('bordas finas, apresentando aumento difuso da ecogenicidade que determina atenuação posterior do feixe acústico.');
    expect(gerar({ 'fig.eco': 'hepatopatia crônica', 'fig.eco.fase': 'avançada' })).toContain('Fígado com dimensões normais, contornos serrilhados, bordas rombas e ecotextura difusamente heterogênea.');
    expect(gerar({ 'lim.tipo': 'meteorismo + biotipo' })).toContain('Exame parcialmente prejudicado por distensão gasosa intestinal e limitações técnicas inerentes ao biotipo.');
  });
  it('vesícula: colecistite aguda troca a frase; vazia e ausente substituem a normal', () => {
    const t = gerar({ 'ves.calc': true, 'ves.calc.aguda': 'sim' });
    expect(t).toContain('Vesícula biliar distendida, com paredes espessadas, apresentando uma imagem calculosa fixa no infundíbulo, medindo 0,7 cm.');
    expect(t).toContain('Colecistite aguda calculosa.');
    expect(gerar({ 'ves.calc2': true })).toContain('apresentando duas imagens calculosas em seu interior, móveis às mudanças de decúbito, medindo 0,7 e 1,0 cm.');
    expect(gerar({ 'ves.ausente': true })).not.toContain('sem imagens calculosas');
    expect(gerar({ 'ves.vazia': true })).toContain('Vesícula biliar vazia, sem condições satisfatórias para análise.');
  });
  it('pâncreas: espessuras juntas numa frase', () => {
    expect(gerar({ 'panc.cab': true, 'panc.corpo': true })).toContain('A espessura pancreática foi mensurada em 1,0 cm (cabeça) e 1,0 cm (corpo).');
  });
  it('cálculos calicinais: vários viram lista; um só fica simples', () => {
    const t = gerar({ 'rins.calc1': true, 'rins.calc2': true, 'rins.calc2.rim': 'rim esquerdo' });
    expect(t).toContain('Presença de dois cálculos calicinais à direita e à esquerda, nas seguintes topografias:\n- Cálculo de 0,5 cm no grupamento calicinal superior do rim direito.\n- Cálculo de 0,5 cm no grupamento calicinal superior do rim esquerdo.\nNão há dilatação do sistema coletor.');
    expect(gerar({ 'rins.calc1': true })).toContain('Cálculo de 0,5 cm no grupamento calicinal superior do rim direito.');
  });
  it('duplo J e aorta', () => {
    expect(gerar({ 'rins.duploj': true, 'rins.duploj.lado': 'bilateral' })).toContain('Presença de cateter "duplo J" bilateralmente');
    expect(gerar({ 'aorta.tipo': 'ateromatosa e ectasiada' })).toContain('calibre transverso máximo de 2,5 cm nos segmentos acessíveis.');
  });
  it('bexiga: cálculo com paredes e lesão vegetante', () => {
    expect(gerar({ 'bex.tipo': 'contendo cálculo' })).toContain('Bexiga com boa repleção, com paredes finas e regulares, notando-se no lúmen vesical imagem hiperecogênica');
    expect(gerar({ 'bex.tipo': 'lesão vegetante' })).toContain('medindo 1,0 x 1,0 cm, fixa na parede posterior.');
    expect(gerar({ 'bex.tipo': 'lesão vegetante', 'bex.tipo.fixa': 'na parede superior' })).toContain('fixa na parede superior.');
  });
  it('bexiga: divertículo com duas medidas e localização', () => {
    const t = gerar({ 'bex.divert': true, 'bex.divert.local': 'posterior à direita', 'bex.divert.med.1': 25, 'bex.divert.med.2': 18 });
    expect(t).toContain('Presença de formação diverticular na parede posterior à direita da bexiga, medindo cerca de 2,5 x 1,8 cm.');
    expect(t).toContain('Formação diverticular vesical.');
  });
  it('vesícula ausente: conclusão Colecistectomia.', () => {
    const t = gerar({ 'ves.ausente': true });
    expect(t).toContain('Vesícula biliar não caracterizada (status pós-cirúrgico).');
    expect(t).toContain('ID:\nColecistectomia.');
  });
  it('útero medioversoflexão, pólipo por região e sem I.R./I.P. das ovarianas', () => {
    const gv = (o = {}) => gerarLaudo(transvaginal, { ...respInicial(transvaginal), ...o }).texto;
    expect(gv({ 'ut.posicao': 'medioversoflexão' })).toContain('Útero em medioversoflexão');
    expect(gv({ 'endo.polipo': true, 'endo.polipo.local': 'ístmica' })).toContain('no endométrio, em região ístmica');
    expect(gv({ 'anexos.dop': true })).toContain('artérias ovarianas');
    const ids = transvaginal.secoes.flatMap((x) => x.controles.map((c) => c.id));
    expect(ids.some((i) => i.startsWith('anexos.dop.'))).toBe(false);
  });
  it('próstata: RTU depois da frase de contornos, com ID próprio', () => {
    const t = gerarP({ 'pros.rtu': true });
    expect(t).toContain('Próstata de contornos regulares, com ecotextura habitual. Há sinais de manipulação cirúrgica por via uretral (alargamento do colo vesical).');
    expect(t).toContain('Sinais de manipulação cirúrgica da próstata (ressecção transuretral).');
  });
  it('abdome superior: só fígado, vesícula, vias biliares, pâncreas, baço e aorta', () => {
    const t = gerarLaudo(abdomeSuperior, respInicial(abdomeSuperior)).texto;
    expect(t).toContain('ULTRASSONOGRAFIA DO ABDOME SUPERIOR');
    for (const f of ['Fígado com', 'Vesícula biliar', 'Não há dilatação das vias', 'Pâncreas', 'Baço', 'Aorta']) expect(t).toContain(f);
    for (const f of ['Rins', 'Bexiga', 'líquido livre']) expect(t).not.toContain(f);
  });
  it('tireoide: hemitireoidectomia, Doppler com artérias', () => {
    const gt2 = (o = {}) => gerarLaudo(tireoide, { ...respInicial(tireoide), ...o }).texto;
    expect(gt2({ 'tireoide.hemitireoidectomia': true })).toContain('Lobo direito ausente (status pós cirúrgico). Lobo esquerdo tópico, com contornos regulares.');
    const d = gt2({ 'tireoide.dopp': true, 'tireoide.dopp.tipo': 'Hiperfluxo difuso', 'tireoide.dopp.art': 'velocidades aumentadas' });
    expect(d).toContain('demonstra sinais de hiperfluxo difuso. As artérias tireoidianas apresentam aumento das velocidades de pico sistólico.');
    expect(gt2({ 'tireoide.ecotextura': 'alteração textural difusa inespecífica' })).toContain('A ecotextura é difusamente heterogênea, não se observando nódulos.');
  });
  it('transvaginal: adenomiose com e sem nódulos; cisto de tipo dermoide', () => {
    const gv3 = (o = {}) => gerarLaudo(transvaginal, { ...respInicial(transvaginal), ...o }).texto;
    expect(gv3({ 'ut.adenomiose': true })).toContain('Apresenta contornos regulares e ecotextura miometrial difusamente heterogênea, notando-se indefinição da zona juncional');
    expect(gv3({ 'ut.adenomiose': true, 'ut.mioma1': true })).toContain('Nota-se também indefinição da zona juncional');
    expect(gv3({ 'ovdireito.cisto1': true, 'ovdireito.cisto1.tipo': 'cisto dermoide' })).toContain('Cisto com aspecto compatível com cisto dermoide no ovário direito.');
    expect(gv3({ 'endo.asp.esp': 'não citar espessura' })).toContain('Endométrio regular, homogêneo, com espessura normal.');
  });
});

describe('obstétrica', () => {
  const g1 = (o = {}) => gerarLaudo(obstetrico1, { ...respInicial(obstetrico1), ...o }).texto;
  const g2 = (o = {}) => gerarLaudo(obstetrico2, { ...respInicial(obstetrico2), ...o }).texto;
  it('1º trimestre: campos em branco viram [PREENCHER]; TN fica de fora', () => {
    const t = g1();
    expect(t).toContain('ULTRASSONOGRAFIA OBSTÉTRICA');
    expect(t).toContain('Bexiga com mínima repleção.');
    expect(t).toContain('O saco gestacional mede [PREENCHER] x [PREENCHER] x [PREENCHER] cm.');
    expect(t).toContain('Colo uterino sem alterações.');
    expect(t).toContain('Líquido amniótico em quantidade normal.');
    expect(t).not.toContain('Translucência');
    expect(t).not.toContain('EMBRIÃO');
    expect(t).toContain('ID:\nGestação tópica, com embrião único e vivo, com idade gestacional estimada em torno de [PREENCHER] semanas e [PREENCHER] dias (variação de +/- 0,5 semana).');
    expect(t).toContain('OBS: EM CASO DE RETORNO');
  });
  it('1º trimestre preenchido, com translucência nucal', () => {
    const t = g1({ 'ob1.e1.sg.a': '2,8', 'ob1.e1.sg.b': '2,9', 'ob1.e1.sg.c': '1,3', 'ob1.ig.sem': '7', 'ob1.ig.dias': '3',
      'ob1.e1.vv.mm': '0,38', 'ob1.e1.emb.ccn': '1,28', 'ob1.e1.emb.bcf': '158', 'ob1.e1.tn': true, 'ob1.e1.tn.tn': '0,15' });
    expect(t).toContain('O saco gestacional mede 2,8 x 2,9 x 1,3 cm.');
    expect(t).toContain('Vesícula vitelínica de aspecto usual, medindo cerca de 0,38 cm.');
    expect(t).toContain('Embrião visibilizado com batimentos cardíacos no presente exame. CCN = 1,28 cm. BCF = 158 bpm.');
    expect(t).toContain('Translucência nucal medindo 0,15 cm (normal).');
    expect(t).toContain('em torno de 7 semanas e 3 dias (variação de +/- 0,5 semana).');
    expect(contarPendencias(t)).toBe(0);
  });
  it('1º trimestre gemelar: dois embriões, cada um com seu saco', () => {
    const t = g1({ 'ob1.gest': 'gemelar', 'ob1.e1.sg.a': '2,8', 'ob1.e2.sg.a': '2,0' });
    expect(t).toContain('Útero gravídico, com forma e contornos normais.\nColo uterino sem alterações.\nEMBRIÃO 01:\nO saco gestacional mede 2,8 x');
    expect(t).toContain('EMBRIÃO 02:\nO saco gestacional mede 2,0 x');
    expect(t).toContain('Gestação tópica, com dois embriões vivos, com idade gestacional');
    expect(t).not.toContain('apresentando saco gestacional tópico');
  });
  it('2º/3º trimestre: modelo, ILA em branco e sem Doppler', () => {
    const t = g2({ 'ob2.ig.sem': '32', 'ob2.ig.dias': '1' });
    expect(t).toContain('Gestação tópica, com feto único, em situação longitudinal, apresentação cefálica, com dorso à esquerda durante a realização do exame.');
    expect(t).toContain('Placenta de localização corporal posterior, homogênea grau 0 de maturidade, com espessura normal.');
    expect(t).toContain('Ausência de imagens sugestivas de descolamento.');
    expect(t).toContain('Líquido amniótico em quantidade adequada para a atual fase gestacional.');
    expect(t).not.toContain('DOPPLER');
    expect(t).toContain('ID:\nGestação tópica, com feto único e vivo, com idade gestacional estimada em torno de 32 semanas e 1 dias (variação de +/- 1,0 semana).\n\nOBS');
  });
  it('ILA: referência 8–24, oligoâmnio e polidrâmnio', () => {
    const il = (v: string) => g2({ 'ob2.ig.sem': '30', 'ob2.ig.dias': '0', 'ob2.la.ila': v });
    expect(il('10,69')).toContain('Líquido amniótico em quantidade adequada para a atual fase gestacional (ILA: 10,69 cm, VR: 8-24).');
    expect(il('10,69')).not.toContain('Oligo');
    expect(il('7,5')).toContain('Líquido amniótico em quantidade reduzida para a idade gestacional (ILA: 7,5 cm, VR: 8-24).');
    expect(il('7,5')).toContain('(variação de +/- 1,0 semana).\nOligoâmnio.');
    expect(il('25')).toContain('Líquido amniótico em quantidade aumentada para a atual idade gestacional (ILA: 25 cm, VR: 8-24).');
    expect(il('25')).toContain('Polidrâmnio.');
    expect(il('8')).not.toContain('reduzida');
    expect(il('24')).not.toContain('aumentada');
  });
  it('Doppler só aparece se selecionado, com relação calculada', () => {
    const t = g2({ 'ob2.dop': true, 'ob2.dop.acm_ip': '1,50', 'ob2.dop.acm_ir': '0,80', 'ob2.dop.au_ip': '1,02', 'ob2.dop.au_ir': '0,60',
      'ob2.dop.utd_ip': '0,9', 'ob2.dop.utd_ir': '0,5', 'ob2.dop.ute_ip': '0,8', 'ob2.dop.ute_ir': '0,5', 'ob2.ig.sem': '34', 'ob2.ig.dias': '2' });
    expect(t).toContain('AO ESTUDO DOPPLER-DUPLEX COLOR, EVIDENCIAMOS:');
    expect(t).toContain('Artéria cerebral média: com padrão espectral habitual. Índice de pulsatilidade (IP) de 1,50. Índice de resistência (IR) de 0,80.');
    expect(t).toContain('Relação art. umbilical/art. cerebral média = 0,68 (normal < 1).');
    expect(t.split('AO ESTUDO')[1]).not.toContain('[PREENCHER');
    expect(g2()).not.toContain('Relação');
  });
});

describe('mamas', () => {
  const gm = (o = {}) => gerarLaudo(mamas, { ...respInicial(mamas), ...o }).texto;
  it('normal igual ao print 1', () => {
    expect(gm()).toContain('ULTRASSONOGRAFIA DE MAMAS\n\nMamas de morfologia normal e contornos regulares.\nPele e tecido adiposo subcutâneo de aspecto ecográfico preservado.\nA composição mamária apresenta ecotextura de fundo homogênea com predomínio fibroglandular.\nNão se observam imagens nodulares sólidas ou císticas.\nAusência de linfonodomegalias axilares.\n\nID:\nExame sem anormalidades detectáveis pelo método.\nClassificação ACR BI-RADS: 1');
  });
  it('alterado igual ao print 2', () => {
    const t = gm({
      'ma.comp': 'ecotextura de fundo heterogênea (áreas adiposas + áreas fibroglandulares)', 'ma.birads': '3',
      'ma.impl.ok': true, 'ma.ect.tipo': 'ae', 'ma.ax.tipo': 'linfonodos normais', 'ma.obs.lim': true,
      'ma.multi': true, 'ma.multi.dist': 'bilaterais', 'ma.multi.mm': 3, 'ma.multi.hora': 'às 4 horas', 'ma.multi.lado': 'esquerda',
      'ma.n1': true, 'ma.n1.med.1': 12, 'ma.n1.med.2': 13, 'ma.n1.med.3': 14, 'ma.n1.hora': 'às 7 horas', 'ma.n1.lado': 'direita', 'ma.n1.forma': 'oval, circunscrito',
      'ma.n2': true, 'ma.n2.med.1': 15, 'ma.n2.med.2': 16, 'ma.n2.med.3': 17, 'ma.n2.sit': 'citar distância ao mamilo e à pele', 'ma.n2.mam': 11, 'ma.n2.pele': 8,
      'ma.n2.hora': 'às 7 horas', 'ma.n2.lado': 'esquerda', 'ma.n2.forma': 'oval, indistinto', 'ma.n2.pseudo': 'possível pseudonódulo (ilhota adiposa)',
    });
    expect(t).toContain('A composição mamária apresenta ecotextura de fundo heterogênea, entremeando áreas adiposas com áreas de tecido fibroglandular.');
    expect(t).toContain('São identificados vários cistos anecogênicos de contornos regulares e paredes finas, bilaterais, medindo até 0,3 cm, o maior deles localizado no quadrante inferolateral da mama esquerda às 4 horas.');
    expect(t).toContain('Presença de dois nódulos sólidos nas seguintes topografias:\nMama direita:\n- no quadrante inferolateral às 7 horas, nódulo hipoecogênico oval, circunscrito, medindo 1,2 x 1,3 x 1,4 cm.\nMama esquerda:\n- no quadrante inferomedial às 7 horas, nódulo hipoecogênico oval, indistinto, medindo 1,5 x 1,6 x 1,7 cm. Encontra-se a 1,1 cm do mamilo e a 0,8 cm da pele. Suas características ultrassonográficas permitem diagnóstico diferencial com ilhota de tecido adiposo.');
    expect(t).toContain('Implantes bilaterais de contornos regulares e conteúdo anecogênico.');
    expect(t).toContain('Presença de algumas ectasias ductais retroareolares à esquerda com contornos regulares e conteúdo anecogênico.');
    expect(t).toContain('Presença de linfonodos axilares de aspecto habitual.');
    expect(t).toContain('ID:\nCistos simples bilaterais.\nNódulos bilaterais.\nImplantes sem evidências de rotura.\nEctasias ductais à esquerda.\nRestante do exame sem anormalidades detectáveis pelo método.\nClassificação ACR BI-RADS: 3');
  });
  it('quadrantes por horário (mama direita e esquerda)', () => {
    const q = (h: string, lado: string) => gm({ 'ma.cisto1': true, 'ma.cisto1.hora': h, 'ma.cisto1.lado': lado });
    expect(q('às 10 horas', 'direita')).toContain('no quadrante superolateral da mama direita às 10 horas');
    expect(q('às 10 horas', 'esquerda')).toContain('no quadrante superomedial da mama esquerda às 10 horas');
    expect(q('às 12 horas', 'direita')).toContain('na junção dos quadrantes superiores da mama direita às 12 horas');
    expect(q('às 3 horas', 'esquerda')).toContain('na junção dos quadrantes laterais da mama esquerda às 3 horas');
  });
  it('cistos simples nas duas mamas viram uma linha no ID; um nódulo só', () => {
    const t = gm({ 'ma.cisto1': true, 'ma.cisto2': true, 'ma.cisto2.lado': 'esquerda',
      'ma.n1': true, 'ma.n1.lado': 'esquerda', 'ma.n1.hora': 'às 2 horas', 'ma.n1.acus': 'com atenuação acústica posterior' });
    expect(t).toContain('Cistos simples bilaterais.');
    expect(t).toContain('Presença de nódulo sólido na mama esquerda, no quadrante superolateral às 2 horas, hipoecogênico oval, circunscrito, com atenuação acústica posterior, medindo 1,0 x 1,0 x 1,0 cm.');
    expect(t).toContain('Nódulo na mama esquerda.');
  });
});

describe('cotovelo', () => {
  const gc = (o = {}) => gerarLaudo(cotovelo, { ...respInicial(cotovelo), ...o }).texto;
  it('normal igual ao print 1 (sem líquido peritendíneo)', () => {
    const t = gc();
    expect(t).toContain('ULTRASSONOGRAFIA DO COTOVELO DIREITO');
    expect(t).toContain('Tendão comum dos extensores do antebraço e comum dos flexores do antebraço com ecotextura e espessura preservadas e contornos normais.\nTendão do bíceps braquial e do tríceps braquial com ecotextura e espessura preservadas e contornos normais.\nNervo ulnar de espessura, contornos e ecotextura normais.\nAusência de derrame articular.');
    expect(t).toContain('ID:\nExame sem anormalidades detectáveis pelo método.');
    expect(gc({ 'co.lado': 'esquerdo' })).toContain('COTOVELO ESQUERDO');
  });
  it('alterado igual ao print 2', () => {
    const t = gc({ 'co.ext.tipo': 'tend', 'co.flex.tipo': 'tend', 'co.derrame.tipo': 'pres' });
    expect(t).toContain('Tendão comum dos extensores e comum dos flexores espessados, com alteração ecotextural, mas sem evidências de rotura.\nTendão do bíceps braquial e do tríceps braquial com ecotextura');
    expect(t).toContain('Presença de líquido intra-articular.');
    expect(t).toContain("ID:\nTendinopatia dos extensores (epicondilite lateral).\nTendinopatia dos flexores (epicondilite medial).\nDerrame articular.\nRestante do exame sem anormalidades detectáveis pelo método.");
  });
  it('só um tendão do par alterado: o outro volta a ter frase própria', () => {
    const t = gc({ 'co.bic.tipo': 'completa', 'co.bic.tipo.int': 12 });
    expect(t).toContain('Tendão do bíceps braquial com sinais de rotura completa, com 1,2 cm de intervalo.');
    expect(t).toContain('Tendão do tríceps braquial com ecotextura e espessura preservadas e contornos normais.');
    expect(t).not.toContain('Tendão do bíceps braquial e do tríceps');
  });
  it('rotura parcial com 2 medidas, entesófito e nervo ulnar', () => {
    const t = gc({ 'co.ext.tipo': 'parcial', 'co.tri.ent': true, 'co.tri.ent.mm': 4, 'co.nervo.tipo': 'aum', 'co.nervo.tipo.area': 'citar área seccional', 'co.nervo.tipo.ass': '12', 'co.nervo.sub': true });
    expect(t).toContain('rotura parcial medindo 1,0 x 1,0 cm.');
    expect(t).toContain('notando-se entesófito medindo 0,4 cm junto à inserção.');
    expect(t).toContain('Nervo ulnar com espessura aumentada, com área seccional de 12 mm².');
    expect(t).toContain('Subluxação do nervo ulnar durante a flexão do cotovelo.');
  });
});

describe('partes moles', () => {
  const gp = (o = {}) => gerarLaudo(partesMoles, { ...respInicial(partesMoles), ...o }).texto;
  it('normal', () => {
    const t = gp();
    expect(t).toContain('Pele e tecido subcutâneo sem anormalidades detectáveis.\nAusência de nódulos, massas ou coleções.\nPlanos musculares de aspecto preservado.');
    expect(t).toContain('ID:\nExame sem anormalidades demonstráveis pelo método.');
  });
  it('seletores de ausência', () => {
    const t = gp({ 'pm.ausHer': true, 'pm.ausDia': true });
    expect(t).toContain('Ausência de herniações na região examinada.');
    expect(t).toContain('Não há diástase do músculo reto abdominal.');
    const h = gp({ 'pm.ausHer': true, 'pm.hum': true });
    expect(h).not.toContain('Ausência de herniações');
    expect(h).not.toContain('Planos musculares');
  });
  it('hérnia umbilical, epigástrica e diástase', () => {
    const t = gp({ 'pm.hum': true, 'pm.hep': true, 'pm.dia': true, 'pm.dia.nivel': 'mesogástrio' });
    expect(t).toContain('Na cicatriz umbilical observa-se um saco herniário contendo tecido adiposo, com variação de volume às manobras compressivas e respiratórias, medindo 1,0 x 1,0 cm, com colo de 1,0 cm.');
    expect(t).toContain('Na região epigástrica, em topografia mediana, observa-se um saco herniário contendo tecido adiposo, medindo 2,0 x 2,0 cm, com colo de 1,0 cm.');
    expect(t).toContain('ao nível do mesogástrio, com distância transversa máxima de 0,3 cm entre as bordas mediais.');
    expect(t).toContain('Pele e tecido subcutâneo sem anormalidades detectáveis.');
    expect(t).not.toContain('Planos musculares');
  });
  it('lipoma e cisto', () => {
    const t = gp({ 'pm.lipoma': true, 'pm.lipoma.reg': 'dorsal', 'pm.lipoma.cont': 'lobulados' });
    expect(t).toContain('Na alteração palpável da região dorsal, caracteriza-se nos planos do subcutâneo, formação nodular sólida, de contornos lobulados, isoecogênica ao tecido adiposo, medindo 1,0 x 1,0 x 1,0 cm (L x AP x T), distando 0,5 cm da pele.');
    expect(t).toContain('Formação nodular em partes superficiais, sugestivo de lipoma ou suas variantes histológicas.');
    expect(t).not.toContain('Ausência de nódulos');
    const c = gp({ 'pm.cisto': true, 'pm.cisto.reg': 'dorsal' });
    expect(c).toContain('que mede 1,0 x 1,0 x 1,0 cm, na região dorsal. A hipótese de cisto epidermóide deve ser considerada.');
    expect(c).toContain('Achados sugestivos de cisto epidermóide.\nRestante do exame sem particularidades.');
  });
  it('seroma, abscesso e tela', () => {
    expect(gp({ 'pm.seroma': 'pequenas' })).toContain('Achados ultrassonográficos sugestivo de seroma na região supra-púbica.');
    expect(gp({ 'pm.seroma': 'cistica' })).toContain('medindo 1,0 x 1,0 x 1,0 cm e volume estimado de 0,5 cm³, localizada na linha paramediana');
    expect(gp({ 'pm.abscesso': true, 'pm.abscesso.reg': 'região periumbilical' })).toContain('Formação cístico-espessa na região periumbilical, sugestivo de abscesso.');
    expect(gp({ 'pm.tela': true })).toContain('Telas/implantes cirúrgicos localizados na parede abdominal.');
  });
});

describe('ajustes recentes', () => {
  const G = (e: Parameters<typeof respInicial>[0], o = {}) => gerarLaudo(e, { ...respInicial(e), ...o }).texto;
  it('mamas: frase de ausência de nódulos se ajusta sozinha', () => {
    expect(G(mamas)).toContain('Não se observam imagens nodulares sólidas ou císticas.');
    const c = G(mamas, { 'ma.cisto1': true });
    expect(c).toContain('Não se observam imagens nodulares sólidas.');
    expect(c).not.toContain('sólidas ou císticas');
    const n = G(mamas, { 'ma.n1': true, 'ma.n1.hora': 'retroareolar' });
    expect(n).toContain('Não se observam imagens nodulares císticas.');
    expect(n).toContain('na região retroareolar');
    expect(G(mamas, { 'ma.cisto1': true, 'ma.n1': true })).not.toContain('Não se observam imagens nodulares');
  });
  it('mamas: cisto retroareolar', () => {
    expect(G(mamas, { 'ma.cisto1': true, 'ma.cisto1.hora': 'retroareolar', 'ma.cisto1.lado': 'esquerda' })).toContain('localizado na região retroareolar da mama esquerda.');
  });
  it('obstétrico 1º tri: bexiga fixa e embrião não caracterizado', () => {
    const t = G(obstetrico1, { 'ob1.nc': true, 'ob1.e1.sg.a': '1,0', 'ob1.e1.sg.b': '1,1', 'ob1.e1.sg.c': '0,9' });
    expect(t).toContain('Bexiga com mínima repleção.');
    expect(t).toContain('O saco gestacional mede 1,0 x 1,1 x 0,9 cm.');
    expect(t).not.toContain('CCN');
    expect(t).not.toContain('Líquido amniótico');
    expect(t).toContain('Saco gestacional tópico, com embrião não caracterizado. À critério clínico, controle ultrassonográfico em 14 dias pode trazer mais informações.');
    expect(t).not.toContain('idade gestacional estimada');
  });
  it('obstétrico 1º tri: aborto (evolução desfavorável)', () => {
    const t = G(obstetrico1, { 'ob1.ab': true, 'ob1.ab.mm': '1,28' });
    expect(t).toContain('medindo 1,28 cm no maior eixo');
    expect(t).toContain('beta-hCG');
    expect(t).not.toContain('CCN');
  });
  it('obstétrico 2º/3º tri: Doppler entra na conclusão', () => {
    expect(G(obstetrico2, { 'ob2.dop': true }).split('ID:')[1]).toContain('Estudo Doppler');
    expect(G(obstetrico2).split('ID:')[1]).not.toContain('Doppler');
  });
  it('joelho: quadríceps e patelar normais juntos', () => {
    expect(G(joelho)).toContain('Tendões do quadríceps femoral e patelar com ecotextura e espessura preservadas e contornos normais.');
    const t = G(joelho, { 'd.quadriceps.tipo': 'tendinopatia sem rotura' });
    expect(t).toContain('Tendão patelar com ecotextura');
    expect(t).not.toContain('Tendões do quadríceps');
  });
  it('transvaginal: sem status hormonal; ovário não caracterizado por último', () => {
    const ops = transvaginal.secoes.find((x) => x.id === 'ovdireito')!.controles;
    expect(ops.some((c) => c.id === 'ovdireito.status')).toBe(false);
    const est = ops.find((c) => c.id === 'ovdireito.estado') as { opcoes: { r: string }[] };
    expect(est.opcoes[est.opcoes.length - 1].r).toBe('não caracterizado');
  });
  it('tireoide: sem IR, Tomimori e PAAF realizada nos nódulos', () => {
    const t = G(tireoide, { 'nodulos.n1': true });
    expect(t).not.toContain('resistividade');
    expect(t).not.toContain('Tomimori');
    expect(tireoide.secoes.flatMap((x) => x.controles).some((c) => c.id === 'tireoide.paaf')).toBe(false);
  });
  it('volume vesical: pré e pós no mesmo box', () => {
    const sec = ex.secoes.find((x) => x.id === 'bex')!;
    expect(sec.controles.map((c) => c.id)).toEqual(expect.arrayContaining(['volpre.on', 'resid.on']));
  });
});

describe('ajustes (próstata, rins, fígado, mamas)', () => {
  const G = (e: typeof prostata, o = {}) => gerarLaudo(e, { ...respInicial(e), ...o }).texto;
  it('próstata: volume vesical (pré + pós) e prostatectomia no box Próstata', () => {
    const t = G(prostata, { 'volpre.on': true, 'volpre.on.v.1': 80, 'volpre.on.v.2': 50, 'volpre.on.v.3': 50 });
    expect(t).toContain('Volume vesical pré-miccional estimado em');
    expect(t).toContain('Resíduo vesical pós-miccional');
    const pr = G(prostata, { 'pros.pr': true, 'pros.rtu': true });
    expect(pr).toContain('Status pós-prostatectomia radical.');
    expect(pr).not.toContain('Próstata de contornos');
    expect(pr).not.toContain('R.T.U.');
  });
  it('título muda ao citar a próstata (abdome total e aparelho urinário)', () => {
    expect(G(ex as typeof prostata)).toContain('ULTRASSONOGRAFIA DO ABDOME TOTAL\n');
    expect(G(ex as typeof prostata, { 'pros.nao': false })).toContain('ULTRASSONOGRAFIA DO ABDOME TOTAL E PRÓSTATA');
    expect(G(apUrinario as typeof prostata, { 'pros.nao': false })).toContain('ULTRASSONOGRAFIA DO APARELHO URINÁRIO E PRÓSTATA');
  });
  it('abdome total: box próstata com "não citar" pré-selecionado', () => {
    expect(G(ex as typeof prostata)).not.toContain('róstata');
    expect(G(ex as typeof prostata, { 'pros.nao': false })).toContain('Próstata de contornos regulares');
  });
  it('próstata: não citar próstata (e padrão no aparelho urinário)', () => {
    const n = G(prostata, { 'pros.nao': true });
    expect(n).not.toContain('Próstata');
    expect(n).not.toContain('Medidas:');
    const u = gerarLaudo(apUrinario, respInicial(apUrinario)).texto;
    expect(u).not.toContain('róstata');
    expect(gerarLaudo(apUrinario, { ...respInicial(apUrinario), 'pros.nao': false }).texto).toContain('Próstata de contornos regulares');
  });
  it('rins: angiomiolipoma, limitação do método acima do ID, sem Doppler', () => {
    const t = G(ex, { 'rins.nodulo': true, 'rins.lim': true });
    expect(t).toContain('Formação nodular sólida cortical, localizada no');
    expect(t).toContain('Nódulo renal sugestivo de angiomiolipoma.');
    expect(t).toContain('ecográfico.\n\nID:');
    expect(t).toContain('\n\nObs.: Cálculos renais menores que 0,4 cm');
    expect(ex.secoes.flatMap((x) => x.controles).some((c) => c.id === 'rins.dopp')).toBe(false);
  });
  it('fígado esteatose/depósito e FID livre', () => {
    const t = G(ex, { 'fig.eco': 'esteatose', 'fig.eco.grau': 'esteatose/depósito', 'alcas.fid': true });
    expect(t).toContain('bordas finas. Infiltrado parenquimatoso hepático difuso, que embora pouco específico, pode corresponder a esteatose leve (grau I) ou de forma menos frequente, doenças de depósito.');
    expect(t.split('ID:')[1]).toContain('Infiltrado parenquimatoso hepático difuso');
    expect(t).toContain('Fossa ilíaca direita sem coleções ou sinais de processo inflamatório agudo.');
  });
  it('mamas: ecotextura genérica, Doppler normal, sem planos musculares', () => {
    const t = G(mamas as typeof prostata, { 'ma.comp': 'ecotextura genérica', 'ma.obs.dop': true });
    expect(t).toContain('Observa-se distribuição habitual do estroma fibroglandular e do tecido adiposo.');
    expect(t).toContain('vascularização normal do parênquima mamário bilateralmente.');
    expect(t).not.toContain('Planos musculares');
  });
});

