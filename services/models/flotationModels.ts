
import { FlotationInputs, StreamData, Component, RecoveryModel } from '../../types';
import { calculateStreamAssays, getComponentElementFraction } from './sharedModels';

export const calculateFlotationPerformance = (
    inputs: FlotationInputs, 
    feedStream: StreamData,
    model: RecoveryModel,
    componentsDb: Component[]
): any => {
    const { residenceTime, ph, collectorDosage, frotherDosage, airFlow, rotorSpeed, calculationMethod, rMax, targetRecovery, concentrationRatio, targetElement } = inputs;
    const { coefficients, customParameters, useStandardEquation } = model;
    
    let effectPh = 0, effectCollector = 0, effectFrother = 0, effectAir = 0, effectTime = 0, effectRotor = 0;
    const componentSplits: Record<string, number> = {}; 
    let concSolidsTph = 0;
    let recoveredElementMass = 0;
    
    if (calculationMethod === 'Stoichiometric') {
        const R_target = (targetRecovery || 85); 
        const enrichmentRatio = Math.max(1, concentrationRatio || 1); 
        const El_target = targetElement || 'Cu';
        const feedAssays = calculateStreamAssays(feedStream.mineralFlows, componentsDb);
        const f = feedAssays[El_target] || 0; 
        let c = Math.min(95, f * enrichmentRatio);
        let t = 0;
        const den = (100 * c) - (R_target * f);
        if (den !== 0) t = (c * f * (100 - R_target)) / den;
        t = Math.max(0, Math.min(f, t));
        
        let yieldFrac = (c - t) !== 0 ? (f - t) / (c - t) : 0;
        yieldFrac = Math.max(0, Math.min(1, yieldFrac));
        concSolidsTph = feedStream.solidsTph * yieldFrac;
        
        const componentElementFractions: Record<string, number> = {};
        Object.entries(feedStream.mineralFlows).forEach(([mid, mass]) => {
            const comp = componentsDb.find(m => m.id === mid);
            if (comp) componentElementFractions[mid] = getComponentElementFraction(comp, El_target);
        });
        
        const oreComponents = Object.keys(feedStream.mineralFlows).filter(mid => componentElementFractions[mid] > 0);
        const gangueComponents = Object.keys(feedStream.mineralFlows).filter(mid => !componentElementFractions[mid] || componentElementFractions[mid] === 0);
        
        oreComponents.forEach(mid => {
            componentSplits[mid] = feedStream.mineralFlows[mid] * (R_target / 100);
        });
        
        const massOreInConc = Object.values(componentSplits).reduce((a, b) => a + b, 0);
        let requiredGangue = Math.max(0, concSolidsTph - massOreInConc);
        const totalGangueFeed = gangueComponents.reduce((sum, mid) => sum + (feedStream.mineralFlows[mid] || 0), 0);
        
        if (totalGangueFeed > 0) {
            const gangueRecovery = Math.min(1, Math.max(0, requiredGangue / totalGangueFeed));
            gangueComponents.forEach(mid => {
                componentSplits[mid] = (feedStream.mineralFlows[mid] || 0) * gangueRecovery;
            });
        }
    } else {
        let globalKModifier = 1.0;
        if (useStandardEquation !== false) {
            const phDiff = Math.abs((ph || coefficients.optimal_ph) - coefficients.optimal_ph);
            globalKModifier *= Math.max(0.1, 1.0 - (Math.abs(coefficients.k_ph) * phDiff * 0.05));
            globalKModifier *= (collectorDosage > 0) ? 1.0 + (coefficients.k_collector * Math.log(collectorDosage/10)) : 0.5;
            globalKModifier *= 1.0 + (coefficients.k_air * (airFlow - 10) * 0.05);
            globalKModifier *= 1.0 + (coefficients.k_rotor * (rotorSpeed - 1000) * 0.001);
            globalKModifier *= 1.0 + (frotherDosage > 10 ? 0.1 : 0);
        }
        
        const targetEl = model.targetElement === 'Any' ? (targetElement || 'Cu') : model.targetElement;
        
        Object.entries(feedStream.mineralFlows).forEach(([mid, massIn]) => {
            if (massIn <= 0) return;
            const comp = componentsDb.find(m => m.id === mid);
            let k_component = 0;
            let r_max_component = 100;
            
            const isTarget = comp && (
                (model.targetElement !== 'Any' && comp.elementalComposition?.includes(model.targetElement)) ||
                (model.targetElement === 'Any' && (comp.class === 'Mineral' || comp.class === 'Element'))
            );

            if (isTarget) {
                k_component = (coefficients.baseRecovery / 100) * 0.25 * globalKModifier; 
                r_max_component = calculationMethod === 'Klimpel' ? (rMax || 95) : 98;
            } else {
                k_component = (coefficients.baseRecovery / 100) * 0.05 * globalKModifier; 
                r_max_component = 80;
            }

            const t = Math.max(0.1, residenceTime);
            let recoveryFrac = 0;
            
            if (calculationMethod === 'Klimpel' && (k_component * t > 0.0001)) {
                recoveryFrac = (r_max_component/100) * (1 - (1/(k_component*t)) * (1 - Math.exp(-k_component*t)));
            } else if (calculationMethod === 'Kelsall') {
                // Simplified Kelsall: 60% fast, 40% slow (k_slow = 0.1 * k_fast)
                const f_fast = 0.6;
                const k_fast = k_component;
                const k_slow = k_fast * 0.1;
                recoveryFrac = (r_max_component/100) * (f_fast * (1 - Math.exp(-k_fast * t)) + (1 - f_fast) * (1 - Math.exp(-k_slow * t)));
            } else {
                // Kinetic or Garcia-Zuniga (standard 1st order)
                recoveryFrac = (r_max_component/100) * (1 - Math.exp(-k_component * t));
            }

            const massConc = massIn * Math.max(0, Math.min(1, recoveryFrac));
            componentSplits[mid] = massConc;
            concSolidsTph += massConc;
            if (comp) recoveredElementMass += massConc * getComponentElementFraction(comp, targetEl);
        });
    }

    const concAssays = calculateStreamAssays(componentSplits, componentsDb);
    const feedAssays = calculateStreamAssays(feedStream.mineralFlows, componentsDb);
    const targetEl = model.targetElement === 'Any' ? (targetElement || 'Cu') : model.targetElement;
    
    const gc = concAssays[targetEl] || 0;
    const gf = feedAssays[targetEl] || 0;
    let recoveryFundamental = (feedStream.solidsTph > 0 && gf > 0) ? ((concSolidsTph * gc) / (feedStream.solidsTph * gf)) * 100 : 0;

    return {
        calculatedRecovery: Math.max(0, Math.min(100, recoveryFundamental)),
        concFlowTph: parseFloat(concSolidsTph.toFixed(2)),
        concGrade: parseFloat(gc.toFixed(2)),
        componentSplits: componentSplits,
        recoveredElementMass: parseFloat(recoveredElementMass.toFixed(3)),
        details: {
            massRecovery: feedStream.solidsTph > 0 ? (concSolidsTph / feedStream.solidsTph) * 100 : 0,
            gradeFeed: parseFloat(gf.toFixed(2)),
            gradeConc: parseFloat(gc.toFixed(2))
        }
    };
};
