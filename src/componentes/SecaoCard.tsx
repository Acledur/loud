import type { Campo, Controle, Resp, Secao } from '../tipos';
import { medidas, oid, volumeMl } from '../gerador';

export type Setter = (k: string, v: string | number | boolean) => void;

function CampoUI({ c, pre, resp, set }: { c: Campo; pre: string; resp: Resp; set: Setter }) {
  const k = `${pre}.${c.id}`;
  const v = String(resp[k] ?? '');
  if (c.tipo === 'dims') {
    const n = c.n ?? 3;
    const m = medidas(c, pre, resp);
    return (
      <label className="campo">
        <span>{c.rotulo}</span>
        {Array.from({ length: n }, (_, i) => (
          <input key={i} type="number" min={0} step="any" value={String(resp[`${k}.${i + 1}`] ?? '')}
            onChange={(e) => set(`${k}.${i + 1}`, e.target.value)} />
        ))}
        <em>mm</em>
        {m && n === 3 && !c.opc && <em>≈ {volumeMl(m).toFixed(1).replace('.', ',')} ml</em>}
      </label>
    );
  }
  return (
    <label className="campo">
      <span>{c.rotulo}</span>
      {c.tipo === 'sel' ? (
        <select value={v} onChange={(e) => set(k, e.target.value)}>
          {(c.opcoes ?? []).map((o) => (
            <option key={o.r} value={o.r}>{o.r}</option>
          ))}
        </select>
      ) : (
        <>
          <input
            type={c.tipo === 'mm' ? 'number' : 'text'}
            min={c.tipo === 'mm' ? 0 : undefined}
            step="any"
            value={v}
            onChange={(e) => set(k, e.target.value)}
          />
          {c.tipo === 'mm' && <em>mm</em>}
        </>
      )}
    </label>
  );
}

function Campos({ campos, pre, resp, set }: { campos?: Campo[]; pre: string; resp: Resp; set: Setter }) {
  if (!campos?.length) return null;
  return (
    <div className="campos">
      {campos.map((c) => <CampoUI key={c.id} c={c} pre={pre} resp={resp} set={set} />)}
    </div>
  );
}

function ControleUI({ c, resp, set }: { c: Controle; resp: Resp; set: Setter }) {
  if (c.tipo === 'fixo' || c.tipo === 'grupo') return null;

  if (c.tipo === 'check') {
    const on = resp[c.id] === true;
    return (
      <div className="ctl">
        <label className="op">
          <input type="checkbox" checked={on} onChange={(e) => set(c.id, e.target.checked)} />
          {c.rotulo}
        </label>
        {on && <Campos campos={c.campos} pre={c.id} resp={resp} set={set} />}
      </div>
    );
  }

  const atual = c.opcoes.find((o) => oid(o) === resp[c.id]) ?? c.opcoes[0];

  if (c.ui === 'select')
    return (
      <div className="ctl">
        <label className="campo">
          {c.rotulo && <span>{c.rotulo}</span>}
          <select value={oid(atual)} onChange={(e) => set(c.id, e.target.value)}>
            {c.opcoes.map((o) => <option key={oid(o)} value={oid(o)}>{o.r}</option>)}
          </select>
        </label>
        <Campos campos={atual.campos} pre={c.id} resp={resp} set={set} />
      </div>
    );

  return (
    <div className="ctl">
      {c.rotulo && <b className="sub">{c.rotulo}</b>}
      {c.opcoes.map((o) => (
        <div key={oid(o)}>
          <label className="op">
            <input type="radio" name={c.id} checked={oid(o) === oid(atual)} onChange={() => set(c.id, oid(o))} />
            {o.r}
          </label>
          {oid(o) === oid(atual) && <Campos campos={o.campos} pre={c.id} resp={resp} set={set} />}
        </div>
      ))}
    </div>
  );
}

type Props = { secao: Secao; resp: Resp; set: Setter; normal: () => void; off: Set<string> };

export default function SecaoCard({ secao, resp, set, normal, off }: Props) {
  return (
    <section className="card" id={`sec-${secao.id}`}>
      <header>
        <h2>{secao.titulo}</h2>
        <button type="button" className="link" onClick={normal} title="Voltar esta seção ao normal">limpar</button>
      </header>
      {secao.controles.map((c) =>
        c.tipo === 'fixo' || c.tipo === 'grupo' ? null : (
          // controles desativados por outro ficam cinza e não aceitam cliques
          <fieldset key={c.id} className="cf" disabled={off.has(c.id)}>
            <ControleUI c={c} resp={resp} set={set} />
          </fieldset>
        ),
      )}
    </section>
  );
}
