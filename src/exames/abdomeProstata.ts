// ABDOME TOTAL + PRÓSTATA: abdome total com as seções da próstata logo após bexiga e volume vesical.
import type { Exame } from '../tipos';
import { abdomeTotal } from './abdomeTotal';
import { secoesProstata } from './prostata';

const ordemPros = 85; // depois da bexiga (80) e antes do líquido livre (90)

export const abdomeProstata: Exame = {
  ...abdomeTotal,
  id: 'abdomeProstata',
  titulo: 'Abdome total + próstata',
  tituloLaudo: 'ULTRASSONOGRAFIA DO ABDOME TOTAL E DA PRÓSTATA',
  secoes: abdomeTotal.secoes.map((x) => (x.id === 'pros' ? { ...secoesProstata()[0], ordem: ordemPros } : x)),
};
