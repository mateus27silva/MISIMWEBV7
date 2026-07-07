
import { BallMillInputs, PSDVector, PSDPoint } from '../../types';

/**
 * Define as 20 classes granulométricas padrão (µm)
 */
export const STANDARD_CLASSES = [
  10000, 8000, 6300, 5000, 4000, 3150, 2500, 2000, 1600, 1250, 
  1000, 800, 630, 500, 400, 315, 250, 200, 150, 100, 50, 10
];

/**
 * Calcula a Potência utilizando o modelo de Hogg & Fuerstenau
 */
export const calculateHoggFuerstenauPower = (inputs: BallMillInputs): { grossPower: number; netPower: number; specificEnergy: number; throughput: number } => {
  const { diameter, length, speedPctCrit, fillingBallsPct, oreDensity, ballDensity, powerLossFactor } = inputs;
  
  // Parâmetros empíricos
  const D = diameter || 1;
  const L = length || 1;
  const J = (fillingBallsPct || 35) / 100;
  const phi = (speedPctCrit || 75) / 100;
  
  // Densidade aparente da carga (simplificada)
  const rhoBall = ballDensity || 7.8;
  const rhoOre = oreDensity || 2.7;
  const rhoApp = rhoBall * J + rhoOre * (1 - J) * 0.4; // 0.4 void fraction

  // Modelo Hogg & Fuerstenau: P = K * D^2.5 * L * rho * sin(theta) * f(J, phi)
  // Simplificado para web simulation:
  const K = 7.5; 
  const powerFactor = J * (1 - 0.937 * J) * phi * (1 - Math.pow(0.1, 20 * phi));
  
  const netPower = K * Math.pow(D, 2.5) * L * rhoApp * powerFactor;
  const grossPower = netPower / (1 - (powerLossFactor || 0.05));
  
  return {
    grossPower: parseFloat(grossPower.toFixed(2)),
    netPower: parseFloat(netPower.toFixed(2)),
    specificEnergy: 0, // Calculado posteriormente com a vazão
    throughput: 0
  };
};

/**
 * Resolve o sistema PBM utilizando substituição sequencial para matriz triangular inferior
 */
export const solvePBM = (inputs: BallMillInputs, feedPsd: PSDVector, residenceTime: number): PSDVector => {
  const n = STANDARD_CLASSES.length;
  const dischargeFractions = new Array(n).fill(0);
  const { alpha0, alpha1, alpha2, dCrit, beta0, beta1, beta2 } = inputs;
  const tau = residenceTime || 1;

  // 1. Calcular Vetor de Seleção (S)
  const S = STANDARD_CLASSES.map(d => {
    const dRel = d / (dCrit || 1000);
    return alpha0 * Math.pow(dRel, alpha1) * Math.exp(-alpha2 * dRel);
  });

  // 2. Calcular Matriz de Quebra (B) - Função de Austin
  // b[i][j] é a fração que cai na classe i vindo da quebra da classe j
  const getB = (i: number, j: number): number => {
    if (i <= j) return 0;
    const di = STANDARD_CLASSES[i];
    const dj = STANDARD_CLASSES[j];
    const ratio = di / dj;
    
    // Função cumulativa de Austin: B(x,y) = phi * (x/y)^gamma + (1-phi)*(x/y)^beta
    const phi = beta0;
    const gamma = beta1;
    const beta = beta2;
    
    const Bi = phi * Math.pow(ratio, gamma) + (1 - phi) * Math.pow(ratio, beta);
    
    // Para a próxima peneira
    const diNext = i + 1 < n ? STANDARD_CLASSES[i+1] : 0;
    const ratioNext = diNext / dj;
    const BiNext = diNext > 0 ? (phi * Math.pow(ratioNext, gamma) + (1 - phi) * Math.pow(ratioNext, beta)) : 0;
    
    return Math.max(0, Bi - BiNext);
  };

  // 3. Resolver Sequencialmente (Assumindo Mistura Perfeita / PSR)
  // w_i_out * (1 + tau*S_i) = w_i_in + tau * sum_{j < i} (S_j * b_ij * w_j_out)
  for (let i = 0; i < n; i++) {
    let breakageContribution = 0;
    for (let j = 0; j < i; j++) {
      breakageContribution += S[j] * getB(i, j) * dischargeFractions[j];
    }
    
    const inputMass = feedPsd.massFractions[i] || 0;
    dischargeFractions[i] = (inputMass + tau * breakageContribution) / (1 + tau * S[i]);
  }

  // Normalização para garantir conservação de massa (tolerância < 0.5%)
  const total = dischargeFractions.reduce((a, b) => a + b, 0);
  return {
    sizes: [...STANDARD_CLASSES],
    massFractions: dischargeFractions.map(f => f / total)
  };
};

/**
 * Converte frações retidas em curva cumulativa passando (%)
 */
export const fractionsToCumulativePassing = (vector: PSDVector | undefined): PSDPoint[] => {
  if (!vector || !vector.sizes || !vector.massFractions) {
    return [];
  }
  let cumulative = 0;
  const points: PSDPoint[] = [];
  
  // Percorre do menor para o maior
  for (let i = vector.sizes.length - 1; i >= 0; i--) {
    cumulative += vector.massFractions[i] || 0;
    points.push({
      size: vector.sizes[i],
      passing: Math.min(100, cumulative * 100)
    });
  }
  
  return points.sort((a, b) => a.size - b.size);
};

export const calculateP80 = (psd: PSDPoint[]): number => {
    if (psd.length < 2) return 0;
    for (let i = 0; i < psd.length - 1; i++) {
        if (psd[i].passing <= 80 && psd[i+1].passing >= 80) {
            const p1 = psd[i];
            const p2 = psd[i+1];
            // Interpolação Linear no log-log seria ideal, mas linear simples para simulador web
            const ratio = (80 - p1.passing) / (p2.passing - p1.passing);
            return p1.size + ratio * (p2.size - p1.size);
        }
    }
    return psd[psd.length - 1].size;
};

// Mantendo compatibilidade com a assinatura antiga do Bond
export const calculateBondPower = (inputs: any): { specificEnergy: number; totalPower: number } => {
  const { workIndex, throughput, feedSizeF80, productSizeP80 } = inputs;
  if (feedSizeF80 <= 0 || productSizeP80 <= 0) return { specificEnergy: 0, totalPower: 0 };
  const p80Term = 10 / Math.sqrt(productSizeP80);
  const f80Term = 10 / Math.sqrt(feedSizeF80);
  const specificEnergy = workIndex * (p80Term - f80Term); 
  const totalPower = specificEnergy * throughput;
  return { specificEnergy, totalPower };
};
