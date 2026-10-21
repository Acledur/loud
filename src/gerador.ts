import type { Campo, Check, Controle, Escolha, Exame, Grupo, Linha, Opc, Resp } from './tipos';
import { calculosMama } from './mamasCalc';
import { calculosCotovelo } from './exames/cotovelo';

export const PENDENCIA = /\[(PREENCHER|REVISAR)[^\]]*\]/g;
export const contarPendencias = (t: string) => t.match(PENDENCIA)?.length ?? 0;

export const oid = (o: Opc) => o.id ?? o.r;

/** 5 -> "0,5"; 12 -> "1,2"; 100 -> "10,0" (mm para cm, vírgula decimal). */
export function fmtCm(mm: number): string {
  if (!Number.isFinite(mm)) return '[PREENCHER]';
  const cm = mm / 10;
  return (Number.isInteger(mm) ? cm.toFixed(1) : cm.toFixed(2)).replace('.', ',');
}

/** Valores iniciais do formulário: tudo "normal", campos com o valor padrão. */
export function respInicial(ex: Exame): Resp {
  const r: Resp = {};
  const campos = (cs: Campo[] | undefined, pre: string) =>
    cs?.forEach((c) => {
      const p = c.padrao;
      if (c.tipo === 'dims') {
        for (let i = 1; i <= (c.n ?? 3); i++) r[`${pre}.${c.id}.${i}`] = Array.isArray(p) ? p[i - 1] : (p ?? 10);
        return;
      }
      r[`${pre}.${c.id}`] = (p as string | number | undefined) ?? (c.tipo === 'sel' ? c.opcoes![0].r : c.tipo === 'mm' ? 10 : '');
    });
  for (const s of ex.secoes)
    for (const c of s.controles) {
      if (c.tipo === 'check') {
        r[c.id] = !!c.marcado;
        campos(c.campos, c.id);
      } else if (c.tipo === 'escolha') {
        r[c.id] = oid(c.opcoes[0]);
        c.opcoes.forEach((o) => campos(o.campos, c.id));
      }
    }
  return r;
}

const escolhida = (c: Escolha, r: Resp): Opc =>
  c.opcoes.find((o) => oid(o) === r[c.id]) ?? c.opcoes[0];

/** Ids de controles "alterados": check marcado, ou escolha diferente da 1ª opção. */
function alterados(ex: Exame, r: Resp): Set<string> {
  const s = new Set<string>();
  for (const sec of ex.secoes)
    for (const c of sec.controles) {
      if (c.tipo === 'check' && r[c.id] === true) s.add(c.id);
      if (c.tipo === 'escolha' && oid(escolhida(c, r)) !== oid(c.opcoes[0])) s.add(c.id);
      // "idDaEscolha=idDaOpção": permite desativar algo conforme a opção escolhida (inclusive a 1ª)
      if (c.tipo === 'escolha') s.add(`${c.id}=${oid(escolhida(c, r))}`);
    }
  return s;
}

/** Ids (de controles e de seções) desativados por `desativadoPor`: ficam cinza e não escrevem nada. */
export function desativados(ex: Exame, r: Resp): Set<string> {
  const at = alterados(ex, r);
  const off = new Set<string>();
  for (const sec of ex.secoes) {
    const secOff = sec.desativadoPor?.some((x) => at.has(x)) ?? false;
    if (secOff) off.add(sec.id);
    for (const c of sec.controles)
      if ((secOff && !sec.exceto?.includes(c.id)) || c.desativadoPor?.some((x) => at.has(x))) off.add(c.id);
  }
  return off;
}

const num = (x: unknown) => (x === '' || x === undefined ? NaN : Number(String(x).replace(',', '.')));
const um = (n: number) => n.toFixed(1).replace('.', ',');

/** Medidas (mm) de um campo 'dims', ou null se faltar alguma. */
export function medidas(c: Campo, ctlId: string, r: Resp): number[] | null {
  const v: number[] = [];
  for (let i = 1; i <= (c.n ?? 3); i++) {
    const x = num(r[`${ctlId}.${c.id}.${i}`]);
    if (!Number.isFinite(x)) {
      if (c.opc && i > 1) continue;
      return null;
    }
    v.push(x);
  }
  return v;
}

/** Fator do elipsoide (0,523). */
export const FATOR_ELIPSOIDE = 0.523;
/** Volume de elipsoide em ml: a·b·c·0,523 (mm³ → ml divide por 1000). */
export const volumeMl = (v: number[]) => (v[0] * v[1] * v[2] * FATOR_ELIPSOIDE) / 1000;

// ---------- cálculos nomeados: {=nome} ----------
const dim3 = (r: Resp, pre: string): number[] | null => {
  const v = [1, 2, 3].map((i) => num(r[`${pre}.${i}`]));
  return v.every(Number.isFinite) ? v : null;
};
/** Volume da tireoide (cm³) = lobos a·b·c·0,523 + istmo (1,0 cm³ fixo). Controle usado: 'tmed.on'. */
const VOL_ISTMO_CM3 = 1.0;
function volTireoide(r: Resp): number | null {
  const d = dim3(r, 'tmed.on.dir');
  const e = dim3(r, 'tmed.on.esq');
  if (r['tmed.on'] !== true || !d || !e) return null;
  const lobo = (v: number[]) => (v[0] * v[1] * v[2] * FATOR_ELIPSOIDE) / 1000;
  return lobo(d) + lobo(e) + (r['tmed.on.ist'] === 'espessura' ? VOL_ISTMO_CM3 : 0);
}
const REF_VOL_TIREOIDE: Record<string, [number, number] | undefined> = { Feminino: [8, 15], Masculino: [10, 18] };
/** Resíduo pós-miccional pelo volume (ml): <1 ausente; até 40 desprezível; até 100 moderado; acima, acentuado. */
function residuo(r: Resp): string {
  const m = dim3(r, 'resid.on.v');
  if (!m) return '[PREENCHER]';
  const v = volumeMl(m);
  if (v < 1) return 'ausente';
  if (v <= 40) return 'desprezível';
  return `${v <= 100 ? 'moderado' : 'acentuado'}, estimado em ${Math.round(v)} ml`;
}
const LIMITE_UTERO_CM3 = 100; // útero: normal abaixo de 100 cm³
const LIMITE_OVARIO_CM3 = 9;  // ovário: normal até 9 cm³
const volDe = (r: Resp, pre: string) => { const m = dim3(r, pre); return m ? volumeMl(m) : null; };

// Manguito rotador (ombro): tendões normais numa frase só; conclusões iguais juntas.
const MANGUITO = [{ k: 'sup', nome: 'supraespinhal' }, { k: 'inf', nome: 'infraespinhal' }, { k: 'sub', nome: 'subescapular' }];
const listaDo = (ns: string[]) => { const t = ns.map((n) => `do ${n}`); return t.length > 1 ? `${t.slice(0, -1).join(', ')} e ${t[t.length - 1]}` : t[0]; };
const tipoOm = (r: Resp, k: string) => String(r[`om.${k}.tipo`] ?? 'aspecto normal');
const normalOm = (r: Resp, k: string) => tipoOm(r, k) === 'aspecto normal' && r[`om.${k}.calc`] !== true;
/** Final da conclusão do tendão (null = normal / sem conclusão agrupável). */
function sufixoOm(r: Resp, k: string): string | null {
  const t = tipoOm(r, k);
  if (t === 'tendinopatia sem rotura') {
    const c = String(r[`om.${k}.tipo.calc`] ?? '');
    return c.startsWith('com pequenas') ? ' com calcificações' : c.startsWith('com calcificação') ? ' com calcificação' : '';
  }
  if (t === 'fissuras intrassubstanciais') return ', com fissuras intrassubstanciais, sem transfixação';
  if (t === 'rotura parcial medindo') return ', com sinais de rotura parcial';
  if (t === 'rotura completa') return ', com sinais de rotura completa';
  return null;
}

// Líquido amniótico (obstetrícia): ILA em cm, referência 8–24. Em branco = quantidade adequada, sem citar valor.
const ILA_MIN = 8, ILA_MAX = 24;
const ilaVal = (r: Resp, a = '') => ({ raw: String(r[a] ?? '').trim(), v: num(r[a]) });

const CALCULOS: Record<string, (r: Resp, arg?: string) => string> = {
  ...calculosMama,
  ...calculosCotovelo,
  ila: (r, a) => {
    const { raw, v } = ilaVal(r, a);
    if (!raw) return 'Líquido amniótico em quantidade adequada para a atual fase gestacional.';
    if (!Number.isFinite(v)) return '[PREENCHER]';
    const q = v < ILA_MIN ? 'reduzida para a idade gestacional' : v > ILA_MAX ? 'aumentada para a atual idade gestacional' : 'adequada para a atual fase gestacional';
    return `Líquido amniótico em quantidade ${q} (ILA: ${raw.replace('.', ',')} cm, VR: ${ILA_MIN}-${ILA_MAX}).`;
  },
  ilaconcl: (r, a) => { const { v } = ilaVal(r, a); return !Number.isFinite(v) ? '' : v < ILA_MIN ? 'Oligoâmnio.' : v > ILA_MAX ? 'Polidrâmnio.' : ''; },
  // relação umbilical/cerebral média = IP da art. umbilical ÷ IP da cerebral média
  rum: (r) => {
    const a = num(r['ob2.dop.au_ip']), c = num(r['ob2.dop.acm_ip']);
    return Number.isFinite(a) && Number.isFinite(c) && c > 0 ? (a / c).toFixed(2).replace('.', ',') : '[PREENCHER]';
  },
  dopconcl: (r) => {
    const acm = r['ob2.dop.acm_alt'] !== 'normal' && r['ob2.dop.acm_alt'] !== undefined, au = r['ob2.dop.au_alt'] !== 'normal' && r['ob2.dop.au_alt'] !== undefined, ut = r['ob2.dop.ut_alt'] !== 'normal' && r['ob2.dop.ut_alt'] !== undefined;
    const f: string[] = [];
    if (acm && au) f.push('Alterações nos índices de resistência das artérias cerebrais médias (reduzidos) e umbilicais (aumentados). O conjunto de achados podem estar relacionados à centralização hemodinâmica e algum grau de hipoxemia fetal.');
    else if (acm) f.push('As artérias cerebrais médias apresentam índices de resistência reduzidos, podendo estar relacionadas com centralização hemodinâmica fetal e algum grau de hipoxemia fetal.');
    else if (au) f.push('Artérias umbilicais apresentam índices de resistência aumentados, compatível com aumento da resistência arterial placentária.');
    if (ut) f.push('A análise espectral das artérias uterinas apresentou índices de resistência aumentados para a atual fase gestacional, achado que pode estar relacionado com risco aumentado de pré-eclâmpsia/restrição do crescimento intrauterino.');
    return f.length ? f.join('\n') : 'Estudo Doppler das artérias cerebral média, umbilical e uterinas com padrão espectral habitual.';
  },
  // glândulas salivares normais numa frase só (ex.: "Glândulas submandibulares e parótida esquerda de dimensões normais...")
  // Doppler de carótidas: complexo médio-intimal (cm) e HD automático quando > 0,1 cm
  imt: (r) => {
    const d = String(r['car.imt.d'] ?? '').trim() || '[PREENCHER]', e = String(r['car.imt.e'] ?? '').trim() || '[PREENCHER]';
    return d === e ? `Complexo médio-intimal direito e esquerdo medem ${d} cm cada (normal até 0,08 cm).` : `Complexo médio-intimal direito mede ${d} cm e esquerdo mede ${e} cm (normal até 0,08 cm).`;
  },
  imtc: (r, a) => (Number(String(r[`car.imt.${a}`] ?? '').replace(',', '.')) > 0.1 ? `Espessamento médio-intimal da artéria carótida comum ${a === 'd' ? 'direita' : 'esquerda'}.` : ''),
  salnorm: (r) => {
    const todos: string[] = [], parc: string[] = [];
    for (const [k, pl, sg] of [['par', 'parótidas', 'parótida'], ['sub', 'submandibulares', 'submandibular'], ['sbl', 'sublinguais', 'sublingual']]) {
      const o = String(r[`sal.${k}`]);
      if (o === 'n') { todos.push(pl); continue; }
      const l = String(o === 'sia' ? r[`sal.${k}.lsi`] : r[`sal.${k}.lado`]);
      if (l === 'direita') parc.push(`${sg} esquerda`); else if (l === 'esquerda') parc.push(`${sg} direita`);
    }
    const it = [...todos, ...parc];
    if (!it.length) return '';
    const lista = it.length > 1 ? `${it.slice(0, -1).join(', ')} e ${it[it.length - 1]}` : it[0];
    return `${todos.length || it.length > 1 ? 'Glândulas' : 'Glândula'} ${lista} de dimensões normais, contornos regulares e ecotextura característica.`;
  },
  tendnorm: (r, a) => {
    const n = MANGUITO.filter((t) => normalOm(r, t.k));
    if (!n.length || n[0].k !== a) return '';
    return `${n.length > 1 ? 'Tendões' : 'Tendão'} ${listaDo(n.map((t) => t.nome))} com ecotextura e espessura preservadas e contornos normais.`;
  },
  tendconcl: (r, a) => {
    const s = sufixoOm(r, a ?? '');
    if (s === null) return '';
    const g = MANGUITO.filter((t) => sufixoOm(r, t.k) === s);
    return g[0].k === a ? `Tendinopatia ${listaDo(g.map((t) => t.nome))}${s}.` : '';
  },
  residuo: (r) => residuo(r),
  dimutero: (r) => { const v = volDe(r, 'ut.estado.med'); return v === null ? '[PREENCHER]' : v < LIMITE_UTERO_CM3 ? 'normais' : 'aumentadas'; },
  concutero: (r) => { const v = volDe(r, 'ut.estado.med'); return v !== null && v >= LIMITE_UTERO_CM3 ? 'Útero com volume aumentado.' : ''; },
  ovaumentado: (r, a = '') => { const v = volDe(r, `${a}.estado.med`); return v !== null && v > LIMITE_OVARIO_CM3 ? ' aumentado' : ''; },
  ovconcl: (r, a = '') => { const v = volDe(r, `${a}.estado.med`); return v !== null && v > LIMITE_OVARIO_CM3 ? `Ovário ${a.replace('ov', '')} com volume aumentado.` : ''; },
  voltireoide: (r) => { const v = volTireoide(r); return v === null ? '[PREENCHER]' : um(v); },
  refvol: (r) => { const f = REF_VOL_TIREOIDE[String(r['tireoide.sexo'])]; return f ? `${um(f[0])} a ${um(f[1])}` : '[PREENCHER]'; },
  dimtireoide: (r) => {
    const v = volTireoide(r);
    const f = REF_VOL_TIREOIDE[String(r['tireoide.sexo'])];
    if (v === null) return '[PREENCHER: dimensões]';
    if (!f) return '[PREENCHER]';
    return v < f[0] ? 'reduzidas' : v > f[1] ? 'aumentadas' : 'normais';
  },
};

/** Controles "alterados" do laudo em geração (usado pelos marcadores condicionais). */
let ATIVOS = new Set<string>();

function expande(tpl: string, campos: Campo[], ctlId: string, r: Resp, vars: Record<string, string>): string {
  const pre = tpl
    .replace(/\{=(\w+)(?::([\w.]+))?\}/g, (_, n: string, a?: string) => CALCULOS[n]?.(r, a) ?? '[PREENCHER]')
    // {?id1,id2?texto}: texto só se algum destes controles estiver alterado
    .replace(/\{\?([\w.,=]+)\?([^{}]*)\}/g, (_, ids: string, t: string) => (ids.split(',').some((x) => ATIVOS.has(x)) ? t : ''))
    // {!id1,id2!texto}: texto só se NENHUM destes controles estiver alterado
    .replace(/\{!([\w.,=]+)!([^{}]*)\}/g, (_, ids: string, t: string) => (ids.split(',').some((x) => ATIVOS.has(x)) ? '' : t));
  return pre.replace(/\{(\w+)(?:\|(\w+))?\}/g, (_, nome: string, fmt?: string) => {
    if (nome in vars) return vars[nome];
    const c = campos.find((x) => x.id === nome);
    if (c?.tipo === 'dims') {
      const m = medidas(c, ctlId, r);
      if (!m) return '[PREENCHER]';
      if (fmt === 'vol') return um(volumeMl(m));                 // 53,0
      if (fmt === 'ml') return String(Math.round(volumeMl(m)));  // 161
      if (fmt === 'ind') return um((m[0] * m[1]) / 100);         // índice uniplanar (cm x cm)
      return m.map(fmtCm).join(' x ');                           // 4,5 x 5,0 x 4,5
    }
    const v = r[`${ctlId}.${nome}`];
    if (!c || v === undefined || v === '') return '[PREENCHER]';
    if (c.tipo === 'mm') return fmt === 'cm' ? fmtCm(Number(String(v).replace(',', '.'))) : String(v);
    if (c.tipo === 'sel') {
      const o = (c.opcoes ?? []).find((x) => x.r === v);
      return fmt === 'c' ? (o?.c ?? o?.t ?? o?.r ?? String(v)) : (o?.t ?? o?.r ?? String(v));
    }
    return String(v);
  });
}

/** Troca os {tokens}. Duas passadas: o texto de uma opção pode conter outros {tokens}. */
function sub(tpl: string, campos: Campo[], ctlId: string, r: Resp, vars: Record<string, string>): string {
  const a = expande(tpl, campos, ctlId, r, vars);
  return a.includes('{') ? expande(a, campos, ctlId, r, vars) : a;
}

type Frag = { ordem: number; txt: string; concl: string[] };

function fragmento(c: Exclude<Controle, Grupo>, ordem: number, r: Resp, at: Set<string>, vars: Record<string, string>, porCtl: Record<string, Campo[]>): Frag | null {
  if (c.tipo === 'fixo') {
    if (c.suprimidoPor?.some((x) => at.has(x))) return null;
    if (c.apenasSe && !c.apenasSe.some((x) => at.has(x))) return null;
    let campos: Campo[] = [];
    let ctl = '';
    if (c.vol) {
      if (!at.has(c.vol.ctl)) return null;
      campos = porCtl[c.vol.ctl] ?? [];
      ctl = c.vol.ctl;
      const campo = campos.find((x) => x.id === c.vol!.campo);
      const m = campo ? medidas(campo, ctl, r) : null;
      if (!m) return null;
      const v = volumeMl(m);
      if (c.vol.op === '>' ? !(v > c.vol.limite) : !(v <= c.vol.limite)) return null;
    }
    return {
      ordem,
      txt: c.corpo ? sub(c.corpo, campos, ctl, r, vars) : '',
      concl: c.concl ? [sub(c.concl, campos, ctl, r, vars)] : [],
    };
  }
  if (c.tipo === 'check') {
    if (r[c.id] !== true) return null;
    const cs = c.campos ?? [];
    return {
      ordem,
      txt: c.corpo ? sub(c.corpo, cs, c.id, r, vars) : '',
      concl: c.concl ? [sub(c.concl, cs, c.id, r, vars)] : [],
    };
  }
  const o = escolhida(c, r);
  const cs = o.campos ?? [];
  return {
    ordem,
    txt: o.corpo ? sub(o.corpo, cs, c.id, r, vars) : '',
    concl: o.concl ? [sub(o.concl, cs, c.id, r, vars)] : [],
  };
}

const NUMEROS = {
  m: ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito'],
  f: ['', 'uma', 'duas', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito'],
};

function fragGrupo(g: Grupo, ordem: number, r: Resp, vars: Record<string, string>, checks: Record<string, Check>, off: Set<string>): Frag | null {
  const ativos = g.itens.map((id) => checks[id]).filter((c): c is Check => !!c && r[c.id] === true && !off.has(c.id));
  const n = ativos.length;
  if (!n) return null;
  const txts = ativos.map((c) => sub(c.item ?? '', c.campos ?? [], c.id, r, vars));
  const lista = n === 1 ? txts[0]
    : g.juntar === 'lista' ? txts.map((t) => `- ${t}`).join('\n')
    : `${txts.slice(0, -1).join(', ')} e ${txts[n - 1]}`;
  const opcao = (c: Check, campo: string) => c.campos?.find((x) => x.id === campo)?.opcoes?.find((o) => o.r === r[`${c.id}.${campo}`]);
  const unicos: Record<string, string> = {};
  for (const u of g.unico ?? []) {
    const vals = ativos.map((c) => { const o = opcao(c, u.campo); return o ? (o[u.usar] ?? o.r) : ''; }).filter(Boolean);
    unicos[u.token] = [...new Set(vals)].join(' e ');
  }
  const aplica = (tpl: string) => tpl
    .replace('{n}', () => NUMEROS[g.genero][n] ?? String(n))
    .replace('{itens}', () => lista)
    .replace(/\{(\w+)\}/g, (m, k: string) => (k in unicos ? unicos[k] : m));
  // lista: a frase seguinte da seção começa em linha nova
  const txt = aplica(n === 1 ? g.um : g.varios) + (n > 1 && g.juntar === 'lista' ? '\n' : '');
  const tc = n === 1 ? g.conclUm : g.conclVarios;
  let concl: string[];
  if (tc) concl = [aplica(tc)];
  else {
    const idx = (c: Check) => (g.ordenarConcl ? Math.max(0, (c.campos?.find((x) => x.id === g.ordenarConcl)?.opcoes ?? []).findIndex((o) => o.r === r[`${c.id}.${g.ordenarConcl}`])) : 0);
    concl = ativos.map((c) => ({ c, i: idx(c) })).sort((a, b) => a.i - b.i)
      .map(({ c }) => (c.concl ? sub(c.concl, c.campos ?? [], c.id, r, vars) : ''));
  }
  return { ordem, txt, concl };
}

export function gerarLaudo(ex: Exame, r: Resp, opts: { cabecalho?: string; rodape?: string } = {}) {
  const off = desativados(ex, r);
  const at = alterados(ex, r);
  off.forEach((id) => at.delete(id));
  ATIVOS = at;
  const paragrafos: string[] = [];
  const concl: string[] = [];
  const porCtl: Record<string, Campo[]> = {};
  const checks: Record<string, Check> = {};
  const emGrupo = new Set<string>();
  const adiados: Record<string, Frag[]> = {};
  for (const sec of ex.secoes)
    for (const c of sec.controles) {
      if (c.tipo === 'check') { porCtl[c.id] = c.campos ?? []; checks[c.id] = c; }
      if (c.tipo === 'grupo') c.itens.forEach((id) => emGrupo.add(id));
    }

  for (const sec of [...ex.secoes].sort((a, b) => a.ordem - b.ordem)) {
    if (([] as string[]).concat(sec.omitirSe ?? []).some((x) => at.has(x))) continue;

    const vars: Record<string, string> = {};
    for (const c of sec.controles)
      if (c.tipo === 'escolha' && c.variavel) {
        const o = escolhida(c, r);
        vars[c.variavel] = o.t ?? o.r;
      }

    const frags: Frag[] = [];
    sec.controles.forEach((c, i) => {
      const ordem = c.ordem ?? i * 10;
      if (off.has(c.id)) return;
      if (c.tipo === 'check' && emGrupo.has(c.id)) return;
      if (c.tipo === 'grupo') {
        const g = fragGrupo(c, ordem, r, vars, checks, off);
        if (g) frags.push(g);
        return;
      }
      if (c.tipo === 'escolha' && c.variavel) {
        const o = escolhida(c, r);
        if (o.concl) frags.push({ ordem, txt: '', concl: [o.concl] });
        return;
      }
      const f = fragmento(c, ordem, r, at, vars, porCtl);
      const dest = c.tipo === 'check' ? c.fimDe : undefined;
      if (f) (dest ? (adiados[dest] ??= []) : frags).push(f);
    });
    frags.push(...(adiados[sec.id] ?? []));
    frags.sort((a, b) => a.ordem - b.ordem);

    const p = frags.map((f) => f.txt).filter(Boolean).join(sec.umaPorLinha ? '\n' : ' ');
    // \n dentro de uma frase = quebra de linha (ex.: lista "Dimensões renais:")
    const lin = p.split('\n').map((x) => x.trim()).filter(Boolean);
    const k = sec.continua && paragrafos.length ? lin.findIndex((x) => !x.startsWith('Obs.:')) : -1;
    if (k >= 0) paragrafos[paragrafos.length - 1] += ' ' + lin.splice(k, 1)[0];
    paragrafos.push(...lin);
    let cs = frags.flatMap((f) => f.concl).filter(Boolean);
    for (const b of sec.bilateral ?? []) {
      const d = `${b.base} à direita.`;
      const e = `${b.base} à esquerda.`;
      if (cs.includes(d) && cs.includes(e)) {
        const i = Math.min(cs.indexOf(d), cs.indexOf(e));
        cs = cs.filter((x) => x !== d && x !== e);
        cs.splice(i, 0, b.resultado);
      }
    }
    concl.push(...cs);
  }
  // textos com fimDe: 'fim' (ex.: resíduo pós-miccional) saem por último, no laudo e na conclusão
  const fimF = (adiados['fim'] ?? []).sort((a, b) => a.ordem - b.ordem);
  paragrafos.push(...fimF.map((f) => f.txt).join(' ').split('\n').map((x) => x.trim()).filter(Boolean));
  concl.push(...fimF.flatMap((f) => f.concl).filter(Boolean));

  const unicas = [...new Set(concl)];
  const id = unicas.length ? [...unicas, ...(ex.semRestante ? [] : [ex.restante ?? 'Restante do exame sem particularidades.'])] : [ex.idNormal ?? 'Exame sem anormalidades detectáveis pelo método.'];
  const lista = (t?: string) => (t ?? '').split('\n').map((x) => x.trim()).filter(Boolean);
  const cab = lista(opts.cabecalho);
  const rod = lista(opts.rodape);
  const vazia: Linha = { t: '', a: 'left' };
  const linhas: Linha[] = [];
  cab.forEach((t) => linhas.push({ t, a: 'left', b: true }));            // cabeçalho: esquerda, negrito
  if (cab.length) linhas.push(vazia, vazia);
  const titulo = ex.tituloVar ? (ex.tituloVar.opcoes[String(r[ex.tituloVar.ctl])] ?? ex.tituloLaudo) : ex.tituloLaudo;
  linhas.push({ t: titulo, a: 'center', b: true }, vazia);        // título: centralizado, negrito
  // parágrafos que começam com "Obs.:" saem logo acima do ID, com linha em branco antes e depois
  paragrafos.filter((t) => !t.startsWith('Obs.:')).forEach((t) => linhas.push({ t: t === '¶' ? '' : t, a: 'justify' })); // '¶' = linha em branco
  const obsMetodo = paragrafos.filter((t) => t.startsWith('Obs.:'));
  if (obsMetodo.length) linhas.push(vazia, ...obsMetodo.map((t): Linha => ({ t, a: 'justify' })));
  linhas.push(vazia, { t: 'ID:', a: 'left', b: true });                   // "ID:" em negrito
  const fim = (ex.fim ?? []).map((t) => t.replace(/\{=val:([\w.]+)\}/g, (_, k: string) => String(r[k] ?? '')));
  [...id, ...fim].forEach((t) => linhas.push({ t, a: 'justify' }));
  if (ex.obs?.length) linhas.push(vazia, ...ex.obs.map((t): Linha => ({ t, a: 'justify' })));
  if (rod.length) linhas.push(vazia, vazia, vazia, vazia, vazia, ...rod.map((t): Linha => ({ t, a: 'left', b: true }))); // rodapé: esquerda, negrito
  return { texto: linhas.map((l) => l.t).join('\n'), linhas, paragrafos, conclusoes: id };
}
