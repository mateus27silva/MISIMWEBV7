
import { HydrocycloneInputs } from '../../types';

export const calculateCyclonePerformance = (inputs: HydrocycloneInputs): { cutPoint: number; waterRecovery: number } => {
  const { 
    pressure, 
    feedDensity, 
    diameter, 
    height, 
    inletDiameter, 
    vortexFinderDiameter, 
    apexDiameter,
    k1
  } = inputs;

  // Modelo de Plitt Simplificado para d50c
  // d50c = (K1 * D^0.46 * Di^0.6 * Do^1.21 * exp(0.063 * phi)) / (Du^0.71 * h^0.38 * P^0.45)
  // Onde: D = Diâmetro, Di = Inlet, Do = Vortex, Du = Apex, h = Altura, P = Pressão, phi = %Vol Sólidos
  
  // Default de calibração solicitado: 9.932
  const K1 = k1 ?? 9.932; 
  
  // Garantir valores mínimos para evitar divisão por zero ou erro NaN
  const D = diameter || 26.0;
  const Di = inletDiameter || 6.5;
  const Do = vortexFinderDiameter || 9.1;
  const Du = apexDiameter || 4.6;
  const h = height || 78.0;
  const P = Math.max(1, pressure || 100);
  const phi = feedDensity || 20;

  // Cálculo do fator geométrico (Numerador)
  const geomNum = Math.pow(D, 0.46) * Math.pow(Di, 0.6) * Math.pow(Do, 1.21);
  const expFactor = Math.exp(0.063 * (phi / 2.7)); // phi volumétrico aproximado
  
  // Cálculo do fator geométrico (Denominador)
  const geomDen = Math.pow(Du, 0.71) * Math.pow(h, 0.38) * Math.pow(P, 0.45);
  
  const cutPoint = (K1 * geomNum * expFactor) / geomDen;

  // Recuperação de Água para o Underflow (Rf)
  // Influenciada pela geometria (especialmente Apex e Vortex) e densidade
  const geomRf = (Du / Do) * (h / D) * 10;
  const waterRecovery = Math.min(90, Math.max(5, 10 + (feedDensity * 0.4) + geomRf)); 

  return { 
    cutPoint: parseFloat(cutPoint.toFixed(2)), 
    waterRecovery: parseFloat(waterRecovery.toFixed(2)) 
  };
};
