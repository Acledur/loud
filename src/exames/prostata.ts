// ULTRASSONOGRAFIA DE PRÓSTATA: reaproveita a bexiga (com o volume vesical) do abdome.
import type { Exame } from '../tipos';
import { bexVol, secoesProstata } from './abdomeTotal';

export { secoesProstata };

export const prostata: Exame = {
  id: 'prostata',
  titulo: 'Próstata',
  tituloLaudo: 'ULTRASSONOGRAFIA DA PRÓSTATA',
  semRestante: true,
  secoes: [bexVol(10, true, true), ...secoesProstata()],
};
