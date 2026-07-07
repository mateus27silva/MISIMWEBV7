
import { StreamData, Component } from '../../types';

export const parseStoichiometry = (compositionStr: string): Record<string, number> => {
  const result: Record<string, number> = {};
  if (!compositionStr || typeof compositionStr !== 'string') return result;

  // Split by comma, semicolon or newline to be robust
  const parts = compositionStr.split(/[,\;\n]/).map(s => s.trim()).filter(Boolean);
  
  parts.forEach(part => {
    let element = '';
    let percentageStr = '';
    
    // Handle different separators: :, =, or spaces (e.g. "Cu: 34.6", "Cu=34.6", "Cu 34.6")
    if (part.includes(':')) {
        const segments = part.split(':');
        element = segments[0]?.trim();
        percentageStr = segments[1]?.trim();
    } else if (part.includes('=')) {
        const segments = part.split('=');
        element = segments[0]?.trim();
        percentageStr = segments[1]?.trim();
    } else {
        // Try space separation as in "Cu 100"
        const spaceParts = part.split(/\s+/);
        if (spaceParts.length >= 2) {
            element = spaceParts[0];
            percentageStr = spaceParts[1];
        } else {
            // Case "Cu" or "Ag" -> assume 100%
            element = part;
            percentageStr = '100';
        }
    }

    if (element) {
      // Handle percentage signs and both dot/comma as decimal separators
      const cleanedValue = percentageStr ? percentageStr.replace('%', '').replace(',', '.').trim() : '100';
      const value = parseFloat(cleanedValue);
      if (!isNaN(value)) {
        result[element] = value / 100;
      }
    }
  });
  return result;
};

export const getComponentElementFraction = (component: Component, elementSymbol: string): number => {
    if (!component.elementalComposition) return 0;
    const stoichiometry = parseStoichiometry(component.elementalComposition);
    return stoichiometry[elementSymbol] || 0;
};

export interface ElementalData {
  assays: Record<string, number>;
  massFlows: Record<string, number>;
}

export const calculateStreamAssays = (
  componentFlowsTph: Record<string, number>, 
  componentsDb: Component[]
): ElementalData => {
  const totalSolidsTph = Object.values(componentFlowsTph).reduce((a, b) => a + (b || 0), 0);
  const elementMassFlows: Record<string, number> = {};

  Object.entries(componentFlowsTph).forEach(([compId, massTph]) => {
    const compDef = componentsDb.find(m => m.id === compId);
    if (compDef && compDef.elementalComposition) {
      const stoichiometry = parseStoichiometry(compDef.elementalComposition);
      Object.entries(stoichiometry).forEach(([element, fraction]) => {
        elementMassFlows[element] = (elementMassFlows[element] || 0) + (massTph * fraction);
      });
    }
  });

  const assays: Record<string, number> = {};
  if (totalSolidsTph > 0) {
    Object.entries(elementMassFlows).forEach(([element, mass]) => {
      assays[element] = (mass / totalSolidsTph) * 100;
    });
  }

  return { assays, massFlows: elementMassFlows };
};

export const calculateStreamProperties = (
  tphSolids: number, 
  percentSolids: number, 
  sgSolids: number,
  optionalSlurryDensity?: number
): Partial<StreamData> => {
  let ps = percentSolids;
  let rho_s = sgSolids || 2.7;
  let rho_p = optionalSlurryDensity;
  const rho_L = 1.0; // Água

  // Lógica de cálculo flexível (C_w, rho_s, rho_p)
  // Caso 1: Temos rho_p e rho_s, mas falta ps
  if ((ps === 0 || isNaN(ps)) && rho_p && rho_p > 1 && rho_s > 1) {
    // Formula: %S = (rho_s / rho_p) * ((rho_p - rho_L) / (rho_s - rho_L)) * 100
    ps = (rho_s / rho_p) * ((rho_p - rho_L) / (rho_s - rho_L)) * 100;
  } 
  // Caso 2: Temos ps e rho_p, mas falta rho_s (ou rho_s é o padrão de 2.7 mas ps e rho_p não batem)
  else if (ps > 0 && rho_p && rho_p > 1 && (!rho_s || isNaN(rho_s) || rho_s <= 1)) {
     // Formula: rho_s = ps / (100/rho_p - (100 - ps)/rho_L)
     const denom = (100 / rho_p) - ((100 - ps) / rho_L);
     if (denom > 0) {
         rho_s = ps / denom;
     }
  }
  // Caso 3: Temos ps e rho_p, e rho_s foi fornecido, mas queremos que ps e rho_s definam rho_p se ps/rho_s são prioridades
  // Ou vice-versa. Por padrão, se ps e rho_s existem, rho_p é derivado.
  else if (ps > 0 && rho_s > 1 && (!rho_p || rho_p <= 1)) {
     rho_p = 100 / ((ps / rho_s) + ((100 - ps) / rho_L));
  }
  // Caso Extra: Se rho_s e ps estao presentes, rho_p DEVE ser recalculado para garantir consistência
  else if (ps > 0 && rho_s > 1) {
     rho_p = 100 / ((ps / rho_s) + ((100 - ps) / rho_L));
  }

  // Fallback para evitar divisão por zero se nada for fornecido
  if ((ps === 0 || isNaN(ps)) && (!rho_p || rho_p <= 1)) {
    ps = 80; // Padrão de 80% se faltar info
  }

  const fractionSolids = ps / 100;
  if (fractionSolids <= 0) return { 
    totalTph: tphSolids, 
    solidsTph: tphSolids, 
    waterTph: 0, 
    percentSolids: 0, 
    slurryDensity: 1.0, 
    sgSolids: rho_s 
  };

  const tphTotal = tphSolids / fractionSolids;
  const tphWater = tphTotal - tphSolids;
  
  // Recalcular densidade final baseada no %S e rho_s final
  const finalSlurryDensity = 100 / ((ps / rho_s) + ((100 - ps) / rho_L));

  return {
    totalTph: tphTotal,
    solidsTph: tphSolids,
    waterTph: tphWater,
    percentSolids: ps,
    slurryDensity: finalSlurryDensity,
    sgSolids: rho_s
  };
};
