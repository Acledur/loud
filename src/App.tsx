import { useEffect, useMemo, useRef, useState } from 'react';
import { abdomeTotal } from './exames/abdomeTotal';
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
import { contarPendencias, desativados, gerarLaudo, respInicial } from './gerador';
import { htmlParaCopia, htmlParaRtf, linhasParaHtml } from './rico';
import type { Resp } from './tipos';
import SecaoCard from './componentes/SecaoCard';
import SeletorImagem from './componentes/SeletorImagem';
import { IMG_CAB_PADRAO, IMG_ROD_PADRAO } from './imagens';

// Único dado salvo no navegador: o rodapé (nome/CRM). Nada de paciente é gravado.
const CHAVE = 'laudos-us:rodape';
const lerRodape = () => { try { return localStorage.getItem(CHAVE) ?? ''; } catch { return ''; } };
// Imagens do cabeçalho/rodapé (logo da clínica, não é dado de paciente): sem chave = padrão; '-' = sem imagem.
const CHAVE_CAB = 'laudos-us:img-cab';
const CHAVE_ROD = 'laudos-us:img-rod';
const lerImg = (k: string, padrao: string) => { try { const v = localStorage.getItem(k); return v === null ? padrao : v === '-' ? '' : v; } catch { return padrao; } };
const gravarImg = (k: string, v: string, padrao: string) => { try { if (v === padrao) localStorage.removeItem(k); else localStorage.setItem(k, v || '-'); } catch { /* ignora */ } };

const EXAMES = [abdomeTotal, abdomeSuperior, apUrinario, prostata, tireoide, mamas, transvaginal, obstetrico1, obstetrico2, joelho, ombro, cotovelo, partesMoles]; // novos exames entram aqui
const FMT: [string, string, string][] = [
  ['bold', 'N', 'Negrito'], ['italic', 'I', 'Itálico'],
  ['justifyLeft', 'Esq.', 'Alinhar à esquerda'], ['justifyCenter', 'Centro', 'Centralizar'],
  ['justifyRight', 'Dir.', 'Alinhar à direita'], ['justifyFull', 'Just.', 'Justificar'],
];
// dd/mm/aaaa montado à mão (não depende de idioma/Intl do navegador)
const hojeBR = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
};
const cab0 = () => ({ pac: '', nasc: '', data: hojeBR(), med: '' });

export default function App() {
  const [exame, setExame] = useState(EXAMES[0]);
  const [resp, setResp] = useState<Resp>(() => respInicial(EXAMES[0]));
  const [editado, setEditado] = useState(false);
  const [rodape, setRodape] = useState(lerRodape);
  const [imgCab, setImgCab] = useState(() => lerImg(CHAVE_CAB, IMG_CAB_PADRAO));
  const [imgRod, setImgRod] = useState(() => lerImg(CHAVE_ROD, IMG_ROD_PADRAO));
  const [cab, setCab] = useState(cab0); // a data já vem preenchida com o dia de hoje
  const [aviso, setAviso] = useState('');
  const [pend, setPend] = useState(0);
  const ed = useRef<HTMLDivElement>(null);

  const dataExame = cab.data;
  const cabecalho = [
    cab.pac && `NOME: ${cab.pac}`,
    cab.nasc && `DATA DE NASCIMENTO: ${cab.nasc}`,
    cab.med && `MÉDICO SOLICITANTE: ${cab.med}`,
    dataExame && `DATA DO EXAME: ${dataExame}`,
  ].filter(Boolean).join('\n');

  const off = useMemo(() => desativados(exame, resp), [exame, resp]);
  const html = useMemo(
    () => linhasParaHtml(gerarLaudo(exame, resp, { cabecalho, rodape }).linhas),
    [exame, resp, cabecalho, rodape],
  );
  const lerPend = () => setPend(contarPendencias(ed.current?.innerText ?? ''));

  // Enquanto você não editar à mão, o editor acompanha o formulário.
  useEffect(() => {
    if (!editado && ed.current) { ed.current.innerHTML = html; lerPend(); }
  }, [html, editado]);
  useEffect(() => { document.execCommand('defaultParagraphSeparator', false, 'p'); }, []);
  useEffect(() => { try { localStorage.setItem(CHAVE, rodape); } catch { /* ignora */ } }, [rodape]);
  useEffect(() => gravarImg(CHAVE_CAB, imgCab, IMG_CAB_PADRAO), [imgCab]);
  useEffect(() => gravarImg(CHAVE_ROD, imgRod, IMG_ROD_PADRAO), [imgRod]);
  useEffect(() => {
    if (!editado) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [editado]);

  const set = (k: string, v: string | number | boolean) => setResp((p) => ({ ...p, [k]: v }));
  const normalSecao = (id: string) => {
    const s = exame.secoes.find((x) => x.id === id)!;
    setResp((p) => ({ ...p, ...respInicial({ ...exame, secoes: [s] }) }));
  };
  const tudoNormal = () => {
    if (editado && !confirm('Isto descarta as edições manuais do laudo. Continuar?')) return;
    setResp(respInicial(exame));
    setEditado(false);
    setCab(cab0());
  };
  const trocarExame = (id: string) => {
    if (editado && !confirm('Trocar de exame descarta as edições manuais. Continuar?')) return;
    const novo = EXAMES.find((e) => e.id === id)!;
    setExame(novo);
    setResp(respInicial(novo));
    setEditado(false);
  };
  const cmd = (c: string) => {
    ed.current?.focus();
    document.execCommand(c);
    setEditado(true);
    lerPend();
  };

  function copiar() {
    if (pend > 0 && !confirm(`O laudo ainda tem ${pend} pendência(s) entre colchetes. Copiar mesmo assim?`)) return;
    const el = ed.current!;
    const html = htmlParaCopia(el); // alinhamento lido de cada parágrafo
    const txt = el.innerText;
    const fim = (m: string) => { setAviso(m); setTimeout(() => setAviso(''), 2500); };
    // 1) via evento "copy": entrega HTML + texto puro, funciona mesmo onde a API de clipboard é restrita
    let ok = false;
    const h = (e: ClipboardEvent) => {
      e.clipboardData?.setData('text/html', html);
      e.clipboardData?.setData('text/plain', txt);
      e.preventDefault();
    };
    try {
      const r = document.createRange();
      r.selectNodeContents(el);
      const s = window.getSelection();
      s?.removeAllRanges();
      s?.addRange(r);
      document.addEventListener('copy', h);
      ok = document.execCommand('copy');
    } catch { /* tenta pela API */ }
    document.removeEventListener('copy', h);
    window.getSelection()?.removeAllRanges();
    if (ok) return fim('Laudo copiado');
    // 2) API de clipboard
    try {
      navigator.clipboard
        .write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([txt], { type: 'text/plain' }) })])
        .then(() => fim('Laudo copiado'), () => fim('Selecione o texto e use Ctrl+C'));
    } catch { fim('Selecione o texto e use Ctrl+C'); }
  }

  // Alternativa que garante o alinhamento: arquivo RTF, que o Word abre direto.
  function baixarRtf() {
    const blob = new Blob([htmlParaRtf(ed.current!, { cab: imgCab, rod: imgRod })], { type: 'application/rtf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'laudo.rtf';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  return (
    <div className="app">
      <header className="topo">
        <h1>Laudos de ultrassonografia</h1>
        <select value={exame.id} onChange={(e) => trocarExame(e.target.value)} aria-label="Exame">
          {EXAMES.map((e) => <option key={e.id} value={e.id}>{e.titulo}</option>)}
        </select>
        <button type="button" onClick={tudoNormal}>Tudo normal / novo laudo</button>
      </header>

      <main className="corpo">
        <div className="form">
          {exame.secoes.filter((s) => !(s.ocultaSeOff && off.has(s.id))).map((s) => (
            <SecaoCard key={s.id} secao={s} resp={resp} set={set} normal={() => normalSecao(s.id)} off={off} />
          ))}
        </div>

        <aside className="laudo">
          <div className="barra">
            <strong>Laudo (rascunho para revisão médica)</strong>
            {editado && <button type="button" className="link" onClick={() => setEditado(false)}>voltar ao texto automático</button>}
          </div>
          {editado && <p className="nota">Texto editado manualmente: mudanças no formulário não alteram este texto até você voltar ao automático.</p>}
          {pend > 0 && <p className="alerta">{pend} pendência(s) entre colchetes no texto.</p>}
          <details className="imgsel">
            <summary>Imagem do cabeçalho (logo; salva neste navegador)</summary>
            <SeletorImagem rotulo="Cabeçalho" valor={imgCab} padrao={IMG_CAB_PADRAO} onChange={setImgCab} />
          </details>
          <details className="cab">
            <summary>Cabeçalho (paciente, data do exame, solicitante; não é salvo)</summary>
            <div className="cabcampos">
              <label>Paciente<input value={cab.pac} onChange={(e) => setCab({ ...cab, pac: e.target.value })} /></label>
              <label>Data de nascimento<input value={cab.nasc} placeholder="dd/mm/aaaa" onChange={(e) => setCab({ ...cab, nasc: e.target.value })} /></label>
              <label>Data do exame
                <input value={dataExame} placeholder="dd/mm/aaaa" onChange={(e) => setCab({ ...cab, data: e.target.value })} />
              </label>
              <button type="button" className="link" onClick={() => setCab({ ...cab, data: hojeBR() })}>usar data de hoje</button>
              <label>Médico solicitante<input value={cab.med} onChange={(e) => setCab({ ...cab, med: e.target.value })} /></label>
            </div>
          </details>
          <div className="fmt" onMouseDown={(e) => e.preventDefault()}>
            {FMT.map(([c, r, t]) => (
              <button key={c} type="button" title={t} aria-label={t} onClick={() => cmd(c)}>
                {c === 'bold' ? <b>{r}</b> : c === 'italic' ? <i>{r}</i> : r}
              </button>
            ))}
          </div>
          {imgCab && <img className="timbre cab" src={imgCab} alt="" />} {/* só aparece na impressão */}
          <div ref={ed} className="editor" contentEditable suppressContentEditableWarning spellCheck={false}
            aria-label="Texto do laudo" onInput={() => { setEditado(true); lerPend(); }} />
          {imgRod && <img className="timbre rod" src={imgRod} alt="" />} {/* só aparece na impressão */}
          <div className="acoes">
            <button type="button" className="primario" onClick={copiar}>Copiar laudo</button>
            <button type="button" onClick={() => window.print()}>Imprimir</button>
            <button type="button" onClick={baixarRtf} title="Arquivo que o Word abre com o alinhamento e o negrito">Baixar .rtf (Word)</button>
            <span role="status">{aviso}</span>
          </div>
          <details>
            <summary>Rodapé (nome e CRM, salvo neste navegador)</summary>
            <textarea className="rodape" rows={3} value={rodape} onChange={(e) => setRodape(e.target.value)}
              placeholder={'Dr(a). Nome\nMédico(a) - CRM/UF 00000'} />
          </details>
          <details className="imgsel">
            <summary>Imagem do rodapé (endereço; salva neste navegador)</summary>
            <SeletorImagem rotulo="Rodapé" valor={imgRod} padrao={IMG_ROD_PADRAO} onChange={setImgRod} />
          </details>
        </aside>
      </main>
    </div>
  );
}
