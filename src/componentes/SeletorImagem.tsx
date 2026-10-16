import { useState } from 'react';

/** Lê um arquivo de imagem e devolve um PNG em data URI (largura máx. 1600 px). O RTF exige PNG. */
function paraPng(f: File): Promise<string> {
  return new Promise((ok, erro) => {
    const rd = new FileReader();
    rd.onerror = () => erro(new Error('leitura'));
    rd.onload = () => {
      const im = new Image();
      im.onerror = () => erro(new Error('imagem'));
      im.onload = () => {
        if (!im.naturalWidth || !im.naturalHeight) return erro(new Error('imagem'));
        const k = Math.min(1, 1600 / im.naturalWidth);
        const c = document.createElement('canvas');
        c.width = Math.round(im.naturalWidth * k);
        c.height = Math.round(im.naturalHeight * k);
        c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL('image/png'));
      };
      im.src = String(rd.result);
    };
    rd.readAsDataURL(f);
  });
}

type Props = { rotulo: string; valor: string; padrao: string; onChange: (v: string) => void };

/** Escolha da imagem do cabeçalho/rodapé: enviar arquivo, voltar ao padrão ou não usar imagem. */
export default function SeletorImagem({ rotulo, valor, padrao, onChange }: Props) {
  const [erro, setErro] = useState('');
  const enviar = async (f?: File) => {
    if (!f) return;
    setErro('');
    try { onChange(await paraPng(f)); } catch { setErro('Não foi possível ler esta imagem.'); }
  };
  return (
    <div className="seletorimg">
      <b>{rotulo}</b>
      {valor ? <img className="previa" src={valor} alt={`Prévia da imagem do ${rotulo.toLowerCase()}`} /> : <em className="semimg">sem imagem</em>}
      <label className="campo">
        <span>enviar imagem</span>
        <input type="file" accept="image/*" onChange={(e) => { void enviar(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
      <div className="acoes">
        <button type="button" onClick={() => onChange(padrao)} disabled={valor === padrao}>usar padrão</button>
        <button type="button" onClick={() => onChange('')} disabled={valor === ''}>sem imagem</button>
        {erro && <span className="erro">{erro}</span>}
      </div>
    </div>
  );
}
