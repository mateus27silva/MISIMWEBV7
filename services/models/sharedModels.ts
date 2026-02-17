
import { StreamData, Component } from '../../types';

export const parseStoichiometry = (compositionStr: string): Record<string, number> => {
  const result: Record<string, number> = {};
  if (!compositionStr) return result;

  const parts = compositionStr.split(',').map(s => s.trim());
  parts.forEach(part => {
    const [element, percentage] = part.split(':').map(s => s.trim());
    if (element && percentage) {
      const value = parseFloat(percentage.replace('%', ''));
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

export const calculateStreamAssays = (
  componentFlowsTph: Record<string, number>, 
  componentsDb: Component[]
): Record<string, number> => {
  const totalSolidsTph = Object.values(componentFlowsTph).reduce((a, b) => a + b, 0);
  if (totalSolidsTph === 0) return {};

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
  Object.entries(elementMassFlows).forEach(([element, mass]) => {
    assays[element] = (mass / totalSolidsTph) * 100;
  });

  return assays;
};

export const calculateStreamProperties = (tphSolids: number, percentSolids: number, sgSolids: number): Partial<StreamData> => {
  const fractionSolids = percentSolids / 100;
  if (fractionSolids === 0) return { totalTph: 0, solidsTph: 0, waterTph: 0 };
  const tphTotal = tphSolids / fractionSolids;
  const tphWater = tphTotal - tphSolids;
  const slurryDensity = 100 / ((percentSolids / sgSolids) + ((100 - percentSolids) / 1));
  return {
    totalTph: tphTotal,
    solidsTph: tphSolids,
    waterTph: tphWater,
    percentSolids,
    slurryDensity,
    sgSolids
  };
};
