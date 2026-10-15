// ULTRASSONOGRAFIA DO ABDOME SUPERIOR = limitações + fígado, vesícula, vias biliares, pâncreas, baço e aorta do abdome total.
import type { Exame } from '../tipos';
import { S } from './abdomeTotal';

export const abdomeSuperior: Exame = {
  id: 'abdome-superior',
  titulo: 'Abdome superior',
  tituloLaudo: 'ULTRASSONOGRAFIA DO ABDOME SUPERIOR',
  secoes: [S.lim, S.fig, S.ves, S.vb, S.panc, S.baco, S.aorta],
};
