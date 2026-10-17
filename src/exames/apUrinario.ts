// ULTRASSONOGRAFIA DO APARELHO URINÁRIO = limitações + rins + bexiga (com volumes) do abdome total + próstata (começa com "não citar próstata").
import type { Exame } from '../tipos';
import { S, bexVol } from './abdomeTotal';
import { secoesProstata } from './prostata';

export const apUrinario: Exame = {
  id: 'ap-urinario',
  titulo: 'Aparelho urinário',
  tituloLaudo: 'ULTRASSONOGRAFIA DO APARELHO URINÁRIO',
  tituloVar: { ctl: 'pros.nao', opcoes: { false: 'ULTRASSONOGRAFIA DO APARELHO URINÁRIO E PRÓSTATA', undefined: 'ULTRASSONOGRAFIA DO APARELHO URINÁRIO E PRÓSTATA' } },
  secoes: [S.lim, { ...S.rins, controles: S.rins.controles.map((c) => (c.id === 'rins.medidas' ? { ...c, marcado: true } : c)) }, S.rins2, bexVol(80, false, false), ...secoesProstata(true).map((x) => ({ ...x, ordem: 85 }))],
};
