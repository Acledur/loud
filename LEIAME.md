# Assistente de Laudos de Ultrassonografia

Aplicação web que roda 100% no navegador (sem servidor, sem banco, sem envio de dados).
O laudo gerado é sempre um **rascunho para revisão médica**.

## Rodar no WSL (Ubuntu)

```bash
cd ~/projetos/laudos-us
npm install
npm run dev        # abra http://localhost:5173 no Windows
npm test           # testes do gerador de texto
npm run build      # gera a pasta dist/ (site estático; inclui CSP que bloqueia rede)
```

## Exames

Abdome total, Abdome superior, Aparelho urinário, Próstata, Tireoide, Mamas, Transvaginal, Obstétrica 1º trimestre, Obstétrica 2º/3º trimestre, Joelhos, Ombros, Cotovelos, Partes moles e Bolsa testicular.
Joelhos, Ombros e Cotovelos são unilaterais: o seletor "Lado examinado" (direito/esquerdo) no topo define o título do laudo;
no joelho o lado não escolhido some da tela.
Novo exame = novo arquivo em `src/exames/` combinando seções (`com(S.rins, 10)`) e acrescentando seções próprias;
depois, incluí-lo em `EXAMES` (`src/App.tsx`).

## Onde mexer

| Quero... | Arquivo |
|---|---|
| Mudar uma frase, achado ou conclusão | `src/exames/*.ts` |
| Mudar limites e cálculos (volumes, resíduo, referências) | `src/gerador.ts` |
| Entender a estrutura dos dados | `src/tipos.ts` |
| Mudar a tela | `src/App.tsx`, `src/componentes/SecaoCard.tsx`, `src/styles.css` |

## Sintaxe das frases

- `{campo}` valor do campo · `{campo|cm}` mm em cm com vírgula (5 → 0,5) · `{campo|c}` texto de conclusão da opção
- `{med|vol}` volume de elipsoide em cm³ (fator 0,523) · `{med|ml}` em ml inteiro · `{med|ind}` índice (a x b)
- `{=nome}` ou `{=nome:argumento}`: cálculo nomeado, definido em `gerador.ts`
  (`voltireoide`, `refvol`, `dimtireoide`, `residuo`, `dimutero`, `concutero`, `ovaumentado`, `ovconcl`)
- `{?id1,id2?texto}`: o texto só entra se algum desses controles estiver marcado. `{!id1,id2!texto}`: só se nenhum estiver
- `\n` dentro de uma frase quebra a linha do laudo
- A 1ª opção de cada escolha é o padrão (normal)
- `suprimidoPor` / `apenasSe`: fazem uma frase normal sumir (ou só aparecer) conforme outros controles
- `desativadoPor` (controle ou seção): fica cinza e não escreve nada (ex.: tireoidectomia desativa as medidas da tireoide)
- `desativadoPor: ['idDaEscolha=idDaOpção']` desativa conforme a opção escolhida (usado no seletor de lado do joelho)
- Exame: `idNormal` (ID quando não há achados; padrão "detectáveis"), `tituloVar` (título conforme uma escolha) e `restante` (frase final do ID quando há achados)
- Obstétricos: medidas e IG começam em branco ([PREENCHER]); ILA (VR 8–24) é calculado em `gerador.ts` (`ila`, `ilaconcl`, `rum`); `umaPorLinha` (seção) e `obs` (exame) controlam linhas e avisos finais
- Mamas: horário → quadrante e texto/ID dos nódulos em `src/mamasCalc.ts`; Exame `fim` = linhas depois do ID (BI-RADS)
- Controle `grupo`: junta vários Checks marcados numa frase ou lista ("dois nódulos ... situados A e B")
- `[PREENCHER]` aparece sozinho quando falta um campo obrigatório. Qualquer texto entre colchetes com
  `PREENCHER` ou `REVISAR` faz o app avisar antes de copiar.

## Regras automáticas (em `gerador.ts`)

| Regra | Valor |
|---|---|
| Volume de elipsoide | a × b × c × 0,523 |
| Volume da tireoide | lobos (0,523) + 1,0 cm³ do istmo; normal 8–15 cm³ (mulher), 10–18 cm³ (homem) |
| Resíduo pós-miccional | < 1 ml ausente · até 40 desprezível · até 100 moderado · acima acentuado |
| Próstata | conclusão cita o volume até 30 cm³; acima, "Aumento prostático." |
| Útero | normal abaixo de 100 cm³ |
| Ovário | normal até 9 cm³ |

## Cabeçalho, formatação e Word

- Cabeçalho (nome, data de nascimento, solicitante, data do exame): fica recolhido acima do editor, entra no topo do laudo à esquerda em negrito e **não é salvo**.
  A data já vem preenchida com o dia de hoje (editável; o link "usar data de hoje" restaura).
- Título centralizado em negrito; "ID:" em negrito; rodapé (nome/CRM) à esquerda em negrito.
- O laudo é um editor: selecione o texto e use N, I, Esq., Centro, Dir., Just.
- **Copiar laudo** leva a formatação; ao colar no Word use "Manter Formatação de Origem".
  Se o alinhamento não vier, use **Baixar .rtf (Word)**: o Word abre o arquivo com alinhamento, negrito e itálico.

## Imagens do cabeçalho e do rodapé (logo e endereço)

- Padrão: `src/imagens.ts` (PNGs embutidos em base64, para funcionar sem rede). Para trocar o padrão, substitua as duas constantes.
- Na tela, "Imagem do cabeçalho" (acima dos campos do cabeçalho) e "Imagem do rodapé" (abaixo dos campos do rodapé): cada uma é um bloco recolhível que traz a prévia junto com o envio da imagem — ao recolher, a prévia some. Enviar outra imagem (qualquer formato; vira PNG), "usar padrão" ou "sem imagem". A escolha fica salva no navegador.
- **Imprimir / salvar em PDF**: logo no topo da 1ª página e endereço no fim da última (colado embaixo se o laudo cabe em uma página). Desative "Cabeçalhos e rodapés" na janela de impressão.
- **Baixar .rtf**: imagens entram como cabeçalho/rodapé de cada página (16 cm de largura, no máx. 3,9 cm de altura).
- **Copiar laudo** copia só o texto (o Word não aceita imagens coladas como cabeçalho/rodapé).

## Privacidade

- Nada é enviado: o build inclui Content-Security-Policy com `connect-src 'none'`.
- Só o rodapé (nome/CRM) e as imagens do cabeçalho/rodapé (logo da clínica) são salvos, no `localStorage`. Paciente, nascimento e data só existem na tela.

## Pendências conhecidas

- Doppler renal, duplo J, "+ ureteral", sistema porta
- Ombro: tendão do redondo menor (não incluído, como no laudo de referência); seções "ventre" dos músculos (aparecem nos prints, sem conteúdo visível) e itens abaixo da acromioclavicular; revisar as frases de bíceps (rotura parcial/longitudinal/luxação) e de retração
- Tireoide: PAAF, TI-RADS final, Doppler das artérias tireoideanas
- Transvaginal: D.U.M., gesta, pesquisa de endometriose
- Abdome total + pelve, aparelho urinário + pelve e demais combinações
- Exames: mamas, testículos, obstétrico, musculoesquelético
