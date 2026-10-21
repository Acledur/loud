// ============================================================================
// ULTRASSONOGRAFIA COM DOPPLER DAS ARTÉRIAS CARÓTIDAS E VERTEBRAIS (dados).
// IMT e velocidades começam em branco ([PREENCHER]). IMT > 0,1 cm gera o HD sozinho ({=imtc}, em gerador.ts).
// ============================================================================
import type { Campo, Check, Exame, Opc, Secao } from '../tipos';
import { chk, dims, esc, fixo, ops, sel } from './abdomeTotal';

const LADO = ops('direita', 'esquerda');
const ART = ops('comum', 'interna', 'externa');
const texto = (id: string, rotulo: string): Campo => ({ id, tipo: 'texto', rotulo, padrao: '' });
const ID = { ateroma: 'car.ateroma', placa: 'car.placa', esp: 'car.esp', e0: 'car.e0', e50: 'car.e50', e70: 'car.e70', ocl: 'car.ocl', kink: 'car.kink' };
const SUP_CALIBRE = [ID.e0, ID.e50, ID.e70, ID.ocl, ID.kink];
const SUP_PAREDE = [ID.ateroma, ID.placa, ID.e0, ID.e50, ID.e70, ID.ocl];
const SUP_ESPEC = [ID.e0, ID.e50, ID.e70, ID.ocl, ID.kink];

const PLACA = 'Artéria carótida {art} {lado} apresenta diâmetro reduzido por placa aterosclerótica';
const ESTENOSE = (id: string, corpo: string, concl: string, extra: Campo[] = [], ordem: number): Check =>
  chk(id, `Estenose carotídea ${concl.slice(concl.lastIndexOf('}') + 2).replace('.', '')}`, corpo, `Estenose da artéria carótida {art} {lado} ${concl.slice(concl.lastIndexOf('}') + 2)}`,
    [sel('art', 'artéria', ART), sel('lado', 'lado', LADO), ...extra], ordem);

const esp: Check = chk(ID.esp, 'Espessamento médio-intimal (só na conclusão)', '', 'Espessamento médio-intimal da artéria carótida comum {lado}.', [sel('lado', 'lado', LADO)], 30);

const achados: Check[] = [
  chk(ID.ateroma, 'Ateromatose carotídea', 'Ateromatose carotídea {lado}, com placas calcificadas nos bulbos carotídeos, sem causar repercussão hemodinâmica.', 'Ateromatose carotídea {lado}.',
    [sel('lado', 'lado', [{ r: 'direita', t: 'à direita' }, { r: 'esquerda', t: 'à esquerda' }, { r: 'bilateral', t: 'bilateral' }])], 10),
  chk(ID.placa, 'Placa calcificada na emergência da carótida interna', 'Placa ateromatosa calcificada na emergência da artéria carótida interna {lado}, medindo {med} cm (extensão x espessura), que não determina repercussão hemodinâmica significativa (estenose inferior a 50%).',
    'Placa ateromatosa calcificada na artéria carótida interna {lado}, sem repercussão hemodinâmica significativa.', [sel('lado', 'lado', LADO), dims('med', 'extensão x espessura (mm)', 2, 10)], 20),
  ESTENOSE(ID.e0, `${PLACA} excêntrica, homogênea, com superfície regular. Ao estudo dopplerfluxométrico, caracterizam-se curvas espectrais que apresentam borramento parcial e discreto alargamento das janelas espectrais na artéria {art}, com velocidades de picos sistólicos e diastólicas finais {vel}, caracterizando estenose inferior a 50%.`,
    '{lado} inferior a 50%.', [sel('vel', 'velocidades', ops('no limite superior da normalidade', 'dentro dos limites da normalidade'))], 40),
  ESTENOSE(ID.e50, `${PLACA}, homogênea, com superfície regular. Ao estudo dopplerfluxométrico, caracterizam-se curvas espectrais que apresentam aumento das velocidades de picos sistólicos, representando estenose de 50% a 69%.`, '{lado} entre 50 a 69%.', [], 50),
  ESTENOSE(ID.e70, `${PLACA} homogênea, com superfície regular. Ao estudo dopplerfluxométrico, caracterizam-se curvas espectrais que apresentam aumento das velocidades de picos sistólicos, representando estenose de >70%.`, '{lado} maior que 70%.', [], 60),
  chk(ID.ocl, 'Oclusão da carótida interna', 'A artéria carótida comum {lado} de aspecto morfológico normal. Ao estudo Doppler observa-se curva espectral de amplitude reduzida, com componente reverso e ausência de componente telediastólico (padrão de resistência elevada). A artéria carótida interna apresenta-se com preenchimento luminal por placa aterosclerótica heterogênea e componente hipoecogênico, compatível com trombo. Ao estudo dopplerfluxométrico, evidencia-se ausência de curvas espectrais neste vaso.',
    'Achados compatíveis com oclusão da artéria carótida interna {lado}.', [sel('lado', 'lado', LADO)], 70),
  chk(ID.kink, 'Acotovelamento (kinking) da carótida interna', 'A artéria carótida interna {lado} apresenta-se com diâmetro normal. Não se observam placas ateroscleróticas significativas em seu segmento proximal, caracterizando no segmento médio acotovelamento (Kinking) em ângulo reto, determinando aumento da velocidade de pico sistólico.',
    'Acotovelamento da artéria carótida interna {lado}.', [sel('lado', 'lado', LADO)], 80),
];

const dom = (id: string, r: string, corpo: string, concl: string): Opc => ({ id, r, campos: [sel('lado', 'lado', [{ r: 'direita', c: 'esquerda' }, { r: 'esquerda', c: 'direita' }])], corpo, concl });
const ARTS = ['ACCD', 'ACCE', 'ACID', 'ACIE', 'ACED', 'ACEE', 'AVD', 'AVE'];

const secoes: Secao[] = [
  {
    id: 'car.vel', titulo: 'Velocidades (cm/s)', ordem: 60,
    controles: [{ ...chk('car.vel', 'citar velocidades (VPSM / VPDM)', '¶\n\u200b\tVPSM (cm/s)\tVPDM (cm/s)\n' + ARTS.map((k) => `${k} -\t{${k}s}\t{${k}d}`).join('\n'), undefined,
      ARTS.flatMap((k, i) => [i ? texto(`${k}s`, k) : { ...texto(`${k}s`, k), cab: ['VPS', 'VPD'] }, texto(`${k}d`, k)]), 10), marcado: true }],
  },
  {
    id: 'car.parede', titulo: 'Paredes e complexo médio-intimal', ordem: 20,
    controles: [
      fixo('car.hab', 'Carótidas comuns, externas e internas de trajeto e calibres habituais.\n', { ordem: -1, suprimidoPor: SUP_CALIBRE }),
      fixo('car.par', 'Paredes regulares, sem placas ateromatosas.', { ordem: 0, suprimidoPor: SUP_PAREDE }),
      { ...chk('car.imt', 'citar complexo médio-intimal (cm)', '{=imt}', undefined, [texto('d', 'direita (cm)'), texto('e', 'esquerda (cm)')], 10), marcado: true },
      fixo('car.imtD', '', { ordem: 20, concl: '{=imtc:d}' }),
      fixo('car.imtE', '', { ordem: 21, concl: '{=imtc:e}' }),
      esp,
      fixo('car.esp.n', '\nEspectrofluxometria conservada dos vários segmentos analisados, com velocidade sistólica e diastólica dentro dos limites da normalidade.', { ordem: 40, suprimidoPor: SUP_ESPEC }),
    ],
  },
  { id: 'car.ach', titulo: 'Achados nas carótidas', ordem: 40, umaPorLinha: true, controles: achados },
  {
    id: 'car.vert', titulo: 'Artérias vertebrais', ordem: 50,
    controles: [esc('car.vert', 'radio', [
      { id: 'n', r: 'fluxo anterógrado e normal', corpo: 'Artérias vertebrais com fluxo anterógrado e normal.' },
      dom('d1', 'dominância (vertebral contralateral reduzida)', 'Artérias vertebrais com fluxo anterógrado. Artéria vertebral {lado} com calibre reduzido e pico de fluxo sistólico reduzido em relação à vertebral contralateral, podendo representar dominância à {lado|c}.', 'Sinais de dominância da artéria vertebral à {lado|c} (variação anatômica).'),
      dom('d2', 'sinais de dominância da vertebral', 'Sinais de dominância da artéria vertebral {lado} (variação anatômica).', 'Sinais de dominância da artéria vertebral {lado} (variação anatômica).'),
      { id: 'nc', r: 'fluxo vertebral não caracterizado', campos: [sel('lado', 'lado', [{ r: 'direito' }, { r: 'esquerdo' }])], corpo: 'Fluxo vertebral {lado} não caracterizado.', concl: 'Fluxo vertebral {lado} não caracterizado.' },
    ], { rotulo: 'Fluxo vertebral' })],
  },
];

export const carotidas: Exame = {
  id: 'carotidas',
  titulo: 'Doppler de carótidas e vertebrais',
  tituloLaudo: 'ULTRASSONOGRAFIA COM DOPPLER DAS ARTÉRIAS CARÓTIDAS E VERTEBRAIS',
  semRestante: true,
  fontePt: 11, // fonte menor p/ caber em 1 página
  idNormal: 'Ultrassonografia com Doppler-Fluxometria das Artérias Carótidas e Vertebrais dentro da normalidade.',
  secoes,
};
