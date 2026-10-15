// ULTRASSONOGRAFIA DE PRÓSTATA: reaproveita a bexiga e o resíduo do abdome.
import type { Exame } from '../tipos';
import { S, com, dims, mm, sel, ops, chk, fixo, esc, resid } from './abdomeTotal';

const LOCAIS = ['médio', 'basal', 'apical'].flatMap((t) => ['à direita', 'à esquerda'].map((l) => `no terço ${t} ${l}`));
const OMITE = ['pros.nao', 'pros.pr'];

export const prostata: Exame = {
  id: 'prostata',
  titulo: 'Próstata',
  tituloLaudo: 'ULTRASSONOGRAFIA DE PRÓSTATA',
  semRestante: true,
  secoes: [
    com(S.bex, 10),
    resid(50, true, true),
    {
      id: 'prosop', titulo: 'Próstata: opções', ordem: 19,
      controles: [
        chk('pros.nao', 'não citar próstata', ''),
        chk('pros.pr', 'prostatectomia radical', 'Próstata e vesículas seminais não identificadas (status pós cirúrgico).', 'Status pós-prostatectomia radical.'),
      ],
    },
    {
      id: 'pros', titulo: 'Próstata', ordem: 20, omitirSe: OMITE,
      controles: [
        esc('pros.cont', 'select', [
          { r: 'contornos regulares', corpo: 'Próstata de contornos regulares, com ecotextura habitual.' },
          { r: 'contornos irregulares', corpo: 'Próstata de contornos irregulares, com ecotextura habitual.' },
        ], { rotulo: 'Contornos', desativadoPor: ['tr.on'] }),
        // logo depois da frase de contornos/ecotextura da próstata
        chk('pros.rtu', 'ressecção transuretral da próstata (R.T.U.)', 'Há sinais de manipulação cirúrgica por via uretral (alargamento do colo vesical).', 'Sinais de manipulação cirúrgica da próstata (ressecção transuretral).', undefined, 5),
        chk('pros.protr', 'citar protrusão prostática intravesical', 'Protrusão prostática intravesical: {mm|cm} cm{grau}.',
          'Protrusão prostática intravesical.',
          [mm('mm', 'tamanho', 4), sel('grau', 'grau', [{ r: 'sem graduação', t: '' }, { r: 'grau I', t: ' (grau I)' }, { r: 'grau II', t: ' (grau II)' }, { r: 'grau III', t: ' (grau III)' }])], 20),
      ],
    },
    {
      id: 'tr', titulo: 'Exame por via transretal', ordem: 21, omitirSe: OMITE,
      controles: [
        chk('tr.on', 'exame por via transretal',
          'Próstata de contornos {cont}, apresentando glândula interna de ecotextura característica.{!tr.nod! A zona periférica é homogênea, sem lesões focais detectáveis.}',
          undefined, [sel('cont', 'contornos', ops('regulares', 'irregulares'))], 10),
        chk('tr.nod', 'nódulo na zona periférica', 'Na zona periférica observa-se um nódulo {eco} situado {local}, medindo {med} cm.{bx}',
          'Nódulo na zona periférica da próstata.',
          [sel('eco', 'ecogenicidade', ops('hipoecogênico', 'hiperecogênico', 'isoecogênico')), dims('med', 'medidas (mm)', 3, 10),
           sel('local', 'situado', ops(...LOCAIS)),
           sel('bx', 'biópsia', [{ r: 'sem biópsia', t: '' }, ...['6', '8', '10', '12', '14'].map((n) => ({ r: `biópsia com ${n} fragmentos`, t: ` Realizada biópsia com ${n} fragmentos, sem intercorrências dignas de nota.` }))])], 20),
      ],
    },
    {
      id: 'prosmed', titulo: 'Medidas e volume', ordem: 30, omitirSe: OMITE,
      controles: [
        { ...chk('pros.med', 'citar medidas e volume', 'Medidas: {med} cm. Volume estimado em {med|vol} cm³ (normal até 30,0 cm³).',
            undefined, [dims('med', 'medidas', 3, 25)]), marcado: true },
        // Até 30 cm³ cita o volume na conclusão; acima disso, "Aumento prostático."
        fixo('pros.volN', '', { ordem: 90, concl: 'Próstata com volume estimado em {med|vol} cm³.', vol: { ctl: 'pros.med', campo: 'med', op: '<=', limite: 30 } }),
        fixo('pros.volA', '', { ordem: 91, concl: 'Aumento prostático.', vol: { ctl: 'pros.med', campo: 'med', op: '>', limite: 30 } }),
      ],
    },
    {
      id: 'vs', titulo: 'Vesículas seminais', ordem: 40,
      controles: [fixo('vs.normal', 'Vesículas seminais com dimensões normais. Ângulos vesicosseminais simétricos.', { suprimidoPor: ['pros.pr'] })],
    },
  ],
};
