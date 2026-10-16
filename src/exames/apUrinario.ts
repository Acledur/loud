// ULTRASSONOGRAFIA DO APARELHO URINÁRIO = limitações + rins + bexiga (+ volumes) do abdome total.
import type { Exame } from '../tipos';
import { S, volves } from './abdomeTotal';

export const apUrinario: Exame = {
  id: 'ap-urinario',
  titulo: 'Aparelho urinário',
  tituloLaudo: 'ULTRASSONOGRAFIA DO APARELHO URINÁRIO',
  secoes: [S.lim, S.rins, S.bex, volves(81, false, false)],
};
