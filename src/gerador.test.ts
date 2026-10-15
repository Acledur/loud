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
    expect(t).toContain('conteúdo anecogênico.\nVolume vesical pré-miccional estimado em 161 ml.\nResíduo vesical pós-miccional desprezível.\nNota-se pequena quantidade de líquido livre na pelve.');
    expect(t).toContain('ID:\nEsplenomegalia.\nAteromatose aórtica.\nDilatação do sistema coletor renal à direita.\nPresença de líquido em pequena quantidade na pelve.\nRestante do exame sem particularidades.');
  });
  it('próstata acima de 30 cm³: aumento prostático, resíduo desprezível', () => {
    const t = gerarP({ 'pros.med.med.1': 45, 'pros.med.med.2': 50, 'pros.med.med.3': 45, 'resid.on.v.1': 20, 'resid.on.v.2': 40, 'resid.on.v.3': 6 });
    expect(t).toBe([
      'ULTRASSONOGRAFIA DE PRÓSTATA', '',
      'Bexiga com boa repleção, paredes finas e regulares, conteúdo anecogênico.',
      'Próstata de contornos regulares, com ecotextura habitual.',
      'Medidas: 4,5 x 5,0 x 4,5 cm. Volume estimado em 53,0 cm³ (normal até 30,0 cm³).',
      'Vesículas seminais com dimensões normais. Ângulos vesicosseminais simétricos.',
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
      'Vesículas seminais com dimensões normais. Ângulos vesicosseminais simétricos.',
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
  it('cabeçalho à esquerda e em negrito; título centralizado; rodapé à direita', () => {
    expect(g.linhas.slice(0, 2)).toEqual([{ t: 'Paciente: Fulano', a: 'left', b: true }, { t: 'Médico solicitante: Dr. X', a: 'left', b: true }]);
    expect(g.linhas.find((l) => l.t.startsWith('ULTRASSONOGRAFIA'))).toEqual({ t: 'ULTRASSONOGRAFIA DO ABDOME TOTAL', a: 'center', b: true });
    expect(g.linhas.find((l) => l.t === 'ID:')).toEqual({ t: 'ID:', a: 'left', b: true });
    expect(g.linhas.slice(-2)).toEqual([{ t: 'Dr. Y', a: 'right', b: true }, { t: 'CRM 1', a: 'right', b: true }]);
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
const TODOS = [ex, abdomeSuperior, apUrinario, prostata, tireoide, transvaginal, joelho, ombro];
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
  for (const e of TODOS) {
    it(`${e.id}: padrão não tem pendências`, () => {
      const t = gerarLaudo(e, respInicial(e)).texto;
      expect(contarPendencias(t)).toBe(0);
      // (a próstata tem ID próprio por volume)
      if (e.id !== 'prostata') expect(t).toContain('Exame sem anormalidades detectáveis pelo método.');
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
      'D. I. U. na cavidade uterina, distando 1,5 cm da serosa fúndica e com 0,4 cm de mucosa livre.',
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
    expect(t).toContain('Ausência de derrame articular no joelho direito.');
    expect(t).toContain('Ligamentos colateral tibial e fibular do joelho direito com ecotextura, espessura e contornos preservados.');
    expect(t).not.toContain('Ligamento colateral tibial do joelho');
    expect(t).not.toContain('menisco');
    expect(t).not.toContain('joelho esquerdo');
  });
  it('um colateral alterado: o outro volta a ter frase própria', () => {
    const t = gj({ 'd.lct.tipo': 'lesão com afilamento (lesão parcial)' });
    expect(t).toContain('Ligamento colateral fibular do joelho direito com ecotextura, espessura e contornos preservados.');
    expect(t).not.toContain('Ligamentos colateral');
  });
  it('esquerdo: título e frases do lado esquerdo', () => {
    const t = gj({ 'jo.lado': 'esquerdo', 'e.derrame.tipo': 'presente', 'e.derrame.tipo.grau': 'moderado' });
    expect(t).toContain('ULTRASSONOGRAFIA DO JOELHO ESQUERDO');
    expect(t).toContain('Derrame articular no joelho esquerdo, em quantidade moderado.');
    expect(t).toContain('Derrame articular no joelho esquerdo.');
    expect(t).not.toContain('joelho direito');
  });
  it('derrame com espessamento sinovial e osteoartrose', () => {
    const t = gj({ 'd.derrame.tipo': 'presente', 'd.derrame.tipo.grau': 'moderado', 'd.derrame.tipo.esp': 'sim', 'd.artrose.on': true });
    expect(t).toContain('Derrame articular no joelho direito, em quantidade moderado, associado a espessamento sinovial.');
    expect(t).toContain('Derrame articular no joelho direito, associado a espessamento sinovial.');
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
  it('duplo J, Doppler renal e aorta', () => {
    expect(gerar({ 'rins.duploj': true, 'rins.duploj.lado': 'bilateral' })).toContain('Presença de cateter "duplo J" bilateralmente');
    expect(gerar({ 'rins.dopp': true, 'rins.dopp.vd': '110', 'rins.dopp.ve': '120' })).toContain('velocidades sistólicas de 110 cm/s à direita e 120 cm/s à esquerda.');
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
  it('próstata: transretal substitui a frase de contornos', () => {
    const t = gerarP({ 'tr.on': true });
    expect(t).toContain('Próstata de contornos regulares, apresentando glândula interna de ecotextura característica. A zona periférica é homogênea, sem lesões focais detectáveis.');
    expect(t).not.toContain('com ecotextura habitual');
    const n = gerarP({ 'tr.on': true, 'tr.nod': true, 'tr.nod.bx': 'biópsia com 12 fragmentos' });
    expect(n).toContain('Na zona periférica observa-se um nódulo hipoecogênico situado no terço médio à direita, medindo 1,0 x 1,0 x 1,0 cm. Realizada biópsia com 12 fragmentos, sem intercorrências dignas de nota.');
    expect(n).not.toContain('zona periférica é homogênea');
    expect(gerarP({ 'pros.pr': true })).not.toContain('Vesículas seminais');
  });
  it('tireoide: hemitireoidectomia, PAAF, Doppler com artérias', () => {
    const gt2 = (o = {}) => gerarLaudo(tireoide, { ...respInicial(tireoide), ...o }).texto;
    expect(gt2({ 'tireoide.hemitireoidectomia': true })).toContain('Lobo direito ausente (status pós cirúrgico). Lobo esquerdo tópico, com contornos regulares.');
    expect(gt2({ 'tireoide.paaf': true })).toContain('Foi efetuada punção aspirativa com agulha fina da alteração observada');
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
