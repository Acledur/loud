// ULTRASSONOGRAFIA DO APARELHO URINÁRIO = limitações + rins + bexiga (+ volumes) do abdome total.
import type { Exame } from '../tipos';
import { S, resid, volpre } from './abdomeTotal';

export const apUrinario: Exame = {
  id: 'ap-urinario',
  titulo: 'Aparelho urinário',
  tituloLaudo: 'ULTRASSONOGRAFIA DO APARELHO URINÁRIO',
  secoes: [S.lim, S.rins, S.bex, volpre, resid(82, false, false)],
};
