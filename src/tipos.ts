// Tipos que descrevem um exame. Um exame é só DADOS: o motor (gerador.ts)
// e a interface (componentes/) leem esses dados e fazem o resto.

/** Uma opção de select/radio. */
export type Opc = {
  g?: string;       // texto de grupo (ver Grupo.unico)
  id?: string;      // identificador (se omitido, usa `r`)
  r: string;        // rótulo mostrado no formulário
  t?: string;       // texto usado quando a opção entra numa frase: {campo}
  c?: string;       // texto usado na conclusão (ID): {campo|c}
  corpo?: string;   // frase emitida no laudo quando esta opção está selecionada
  concl?: string;   // linha emitida na conclusão (ID) quando selecionada
  campos?: Campo[]; // campos extras que aparecem só quando esta opção é escolhida
};

export type Campo = {
  id: string;
  tipo: 'mm' | 'sel' | 'texto' | 'dims';
  rotulo: string;
  padrao?: string | number | number[]; // number[] em 'dims': um valor por medida
  opcoes?: Opc[]; // para tipo 'sel'
  n?: 2 | 3;      // para tipo 'dims': quantidade de medidas (mm)
  cab?: string[]; // 1º campo de uma lista: mostra os campos em grade (linhas = rótulo; colunas = estes títulos)
  opc?: boolean;  // para 'dims': só a 1ª medida é obrigatória (as outras podem ficar em branco)
};

type Base = {
  id: string;      // único no exame inteiro (ex.: 'fig.cisto')
  ordem?: number;  // posição do texto dentro do parágrafo do órgão
  fimDe?: string;  // (só check) o texto sai no fim do parágrafo da seção com este id (ex.: medidas dos rins no fim de rins2)
  desativadoPor?: string[]; // fica cinza e não escreve nada enquanto algum destes ids estiver marcado/alterado
};

/** Caixa independente: se marcada, emite a frase. */
export type Check = Base & {
  item?: string;   // texto deste item quando faz parte de um Grupo (no lugar de `corpo`)
  tipo: 'check';
  rotulo: string;
  campos?: Campo[];
  corpo?: string;  // frase: use {campo}, {campo|cm} (mm -> cm com vírgula)
  concl?: string;
  marcado?: boolean;
};

/** Escolha exclusiva (radio ou select). A 1ª opção é o padrão ("normal"). */
export type Escolha = Base & {
  tipo: 'escolha';
  ui: 'radio' | 'select';
  rotulo?: string;
  opcoes: Opc[];
  variavel?: string; // se definido, não emite frase: guarda o texto em {variavel}
};

/** Frase fixa (normalidade). Some quando algo a contradiz. */
export type Fixo = Base & {
  tipo: 'fixo';
  corpo: string;
  suprimidoPor?: string[]; // some se algum destes ids estiver "alterado"
  apenasSe?: string[];     // só aparece se algum destes ids estiver "alterado"
  concl?: string;          // linha de conclusão (ID)
  // Regra por volume: só vale se o check `ctl` estiver marcado e o volume (campo 'dims')
  // do exame satisfizer a comparação. Ex.: próstata > 25 ml => "Aumento prostático."
  vol?: { ctl: string; campo: string; op: '>' | '<='; limite: number };
};

/**
 * Junta vários Checks marcados numa frase só (ex.: "dois nódulos ... situados A e B" ou uma lista "- A", "- B").
 * Os Checks listados em `itens` não escrevem nada sozinhos: cada um traz `item` (e, se quiser, `concl`).
 */
export type Grupo = Base & {
  tipo: 'grupo';
  itens: string[];                 // ids dos Checks
  genero: 'm' | 'f';               // "dois"/"duas"
  juntar: 'e' | 'lista';           // "A, B e C"  ou  linhas "- A"
  um: string;                      // 1 item marcado. Tokens: {itens} e os de `unico`
  varios: string;                  // 2+ itens. Tokens: {n}, {itens} e os de `unico`
  conclUm?: string;                // conclusão do grupo (se omitida, vale a de cada item)
  conclVarios?: string;
  // valores distintos (juntos por " e ") de um campo 'sel' dos itens: usa o texto t, c ou g da opção
  unico?: { token: string; campo: string; usar: 't' | 'c' | 'g' }[];
  ordenarConcl?: string;           // id do campo 'sel' que ordena as conclusões dos itens
};

export type Controle = Check | Escolha | Fixo | Grupo;

export type Secao = {
  id: string;
  titulo: string;
  continua?: boolean; // o texto segue no mesmo parágrafo da seção anterior (box dividido só na tela)
  ordem: number;      // ordem do parágrafo no laudo
  controles: Controle[];
  desativadoPor?: string[];  // a seção inteira fica cinza e não escreve nada
  exceto?: string[];         // ids que continuam ativos quando a seção é desativada
  // Se a conclusão tiver "<base> à direita." e "<base> à esquerda.", vira uma linha só (resultado).
  bilateral?: { base: string; resultado: string }[];
  omitirSe?: string | string[];  // não gera parágrafo se algum destes ids estiver "alterado"
  umaPorLinha?: boolean;         // cada frase da seção em uma linha própria (em vez de juntas no parágrafo)
  ocultaSeOff?: boolean;         // se a seção estiver desativada, some da tela (em vez de ficar cinza)
};

export type Exame = {
  id: string;
  titulo: string;       // nome no menu
  tituloLaudo: string;  // título impresso no laudo
  fontePt?: number;      // tamanho da fonte do laudo (padrão 12 pt)
  semRestante?: boolean; // true: o ID não termina com "Restante do exame sem particularidades."
  obs?: string[];        // observações impressas depois do ID (ex.: aviso dos exames obstétricos)
  fim?: string[];        // linhas finais do ID, depois do "Restante..." (aceita {=val:idDoControle}), ex.: BI-RADS
  idNormal?: string;     // ID quando não há achados (padrão: "Exame sem anormalidades detectáveis pelo método.")
  restante?: string;     // frase final do ID quando há achados (padrão: "Restante do exame sem particularidades.")
  // Título do laudo conforme a opção de uma escolha (ex.: seletor direito/esquerdo). Chave = id da opção.
  tituloVar?: { ctl: string; opcoes: Record<string, string> };
  secoes: Secao[];
};

/** Respostas do formulário: chave `idDoControle` ou `idDoControle.idDoCampo`. */
export type Resp = Record<string, string | number | boolean>;

/** Uma linha do laudo já formatada. */
export type Linha = { t: string; a: 'left' | 'center' | 'right' | 'justify'; b?: boolean };
