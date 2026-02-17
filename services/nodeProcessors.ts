
import { NodeData, StreamData, Connection, Component, RecoveryModel, FlotationCalculationMethod, FlotationInputs, BallMillInputs } from '../types';
import { calculateFlotationPerformance } from './models/flotationModels';
import { calculateHoggFuerstenauPower, solvePBM, fractionsToCumulativePassing, calculateP80, STANDARD_CLASSES } from './models/millModels';

const createEmptyStream = (): StreamData => ({
  totalTph: 0, solidsTph: 0, waterTph: 0, percentSolids: 0, slurryDensity: 1, sgSolids: 2.7, 
  mineralFlows: {}, elementalAssays: {}
});

const createStreamFromComponents = (minerals: Record<string, number>, water: number, sg: number): StreamData => {
    const solids = Object.values(minerals).reduce((a, b) => a + b, 0);
    const total = solids + water;
    const pct = total > 0 ? (solids/total)*100 : 0;
    const den = pct > 0 ? 100 / ((pct/sg) + ((100-pct)/1)) : 1.0;
    return { totalTph: total, solidsTph: solids, waterTph: water, percentSolids: pct, slurryDensity: den, sgSolids: sg, mineralFlows: minerals, elementalAssays: {} };
};

const mixStreams = (streams: StreamData[]): StreamData => {
    let water = 0;
    let combinedMineralFlows: Record<string, number> = {};
    let combinedPsdVector: number[] = new Array(STANDARD_CLASSES.length).fill(0);
    let totalSolids = 0;

    streams.forEach(s => {
        water += s.waterTph;
        totalSolids += s.solidsTph;
        if (s.mineralFlows) {
            Object.entries(s.mineralFlows).forEach(([mid, mass]) => {
                combinedMineralFlows[mid] = (combinedMineralFlows[mid] || 0) + mass;
            });
        }
        
        // Mistura de granulometria (ponderada pela massa)
        if (s.psdVector && s.solidsTph > 0) {
            s.psdVector.massFractions.forEach((f, i) => {
                combinedPsdVector[i] += f * s.solidsTph;
            });
        }
    });

    if (totalSolids > 0) {
        combinedPsdVector = combinedPsdVector.map(v => v / totalSolids);
    }

    const solids = Object.values(combinedMineralFlows).reduce((a, b) => a + b, 0);
    let volSolids = streams.reduce((acc, s) => acc + (s.sgSolids > 0 ? s.solidsTph / s.sgSolids : 0), 0);
    let avgSg = solids > 0 && volSolids > 0 ? solids / volSolids : 2.7;
    
    const mixed = createStreamFromComponents(combinedMineralFlows, water, avgSg);
    mixed.psdVector = { sizes: [...STANDARD_CLASSES], massFractions: combinedPsdVector };
    mixed.psd = fractionsToCumulativePassing(mixed.psdVector);
    
    return mixed;
};

export const processNodeForward = (
    node: NodeData, 
    inputs: StreamData[], 
    outputConnections: Connection[], 
    mineralsDb: Component[],
    availableModels: RecoveryModel[]
): { streams: StreamData[], nodeMeta?: any } => {
    
    const p = node.parameters || {};
    const feed = mixStreams(inputs);
    
    switch (node.type) {
        case 'Mixer':
            const outCount = outputConnections.length || 1;
            return { streams: Array.from({length: outCount}, () => {
                const ratio = 1 / outCount;
                const min: Record<string, number> = {};
                Object.keys(feed.mineralFlows).forEach(k => min[k] = feed.mineralFlows[k] * ratio);
                const s = createStreamFromComponents(min, feed.waterTph * ratio, feed.sgSolids);
                s.psdVector = feed.psdVector;
                s.psd = feed.psd;
                return s;
            })};

        case 'Splitter':
            let ratio = parseFloat(p.splitRatio || 50) / 100;
            const s1Min: Record<string, number> = {};
            Object.keys(feed.mineralFlows).forEach(k => s1Min[k] = feed.mineralFlows[k] * ratio);
            const s2Min: Record<string, number> = {};
            Object.keys(feed.mineralFlows).forEach(k => s2Min[k] = feed.mineralFlows[k] * (1 - ratio));
            
            const out1 = createStreamFromComponents(s1Min, feed.waterTph * ratio, feed.sgSolids);
            out1.psdVector = feed.psdVector; out1.psd = feed.psd;
            const out2 = createStreamFromComponents(s2Min, feed.waterTph * (1 - ratio), feed.sgSolids);
            out2.psdVector = feed.psdVector; out2.psd = feed.psd;
            
            return { streams: [out1, out2]};

        case 'Moinho':
            const millInputs = p as unknown as BallMillInputs;
            
            // 1. Potência Hogg & Fuerstenau
            const powerResults = calculateHoggFuerstenauPower(millInputs);
            
            // 2. Resolver PBM para Granulometria
            const millVol = Math.PI * Math.pow(millInputs.diameter/2, 2) * millInputs.length;
            const slurryFlowVol = feed.totalTph / (feed.slurryDensity || 1);
            const tau = slurryFlowVol > 0 ? (millVol * (millInputs.fillingBallsPct/100) * 0.4) / slurryFlowVol : 1; 
            
            const feedPsd = feed.psdVector || { 
                sizes: [...STANDARD_CLASSES], 
                massFractions: new Array(STANDARD_CLASSES.length).fill(0).map((_,i) => i === 0 ? 1 : 0)
            };
            
            const dischargePsdVector = solvePBM(millInputs, feedPsd, tau);
            const dischargePsd = fractionsToCumulativePassing(dischargePsdVector);
            
            // 3. Balanço de Água (Target Discharge Solids)
            const targetDischarge = parseFloat(p.targetDischargeSolids || 70);
            const targetWater = feed.solidsTph * ((100 - targetDischarge) / targetDischarge);
            
            const dischargeStream = createStreamFromComponents(feed.mineralFlows, Math.max(feed.waterTph, targetWater), feed.sgSolids);
            dischargeStream.psdVector = dischargePsdVector;
            dischargeStream.psd = dischargePsd;
            dischargeStream.p80 = calculateP80(dischargePsd);
            dischargeStream.f80 = calculateP80(feed.psd || []);

            // 4. Cálculos Adicionais de Performance
            const throughput = feed.solidsTph;
            const specificEnergy = throughput > 0 ? powerResults.netPower / throughput : 0;

            return { 
                streams: [dischargeStream],
                nodeMeta: { 
                    ...p, // Include all input parameters
                    ...powerResults, 
                    specificEnergy: parseFloat(specificEnergy.toFixed(2)),
                    throughput: parseFloat(throughput.toFixed(2)),
                    type: 'Moinho', 
                    label: node.label,
                    p80: dischargeStream.p80,
                    f80: dischargeStream.f80,
                    reductionRatio: dischargeStream.f80 / (dischargeStream.p80 || 1),
                    targetDischargeSolids: targetDischarge,
                    actualDischargeSolids: dischargeStream.percentSolids
                }
            };

        case 'Hydrocyclone':
            const cycInputs = p as any;
            const Rf = parseFloat(p.waterRecoveryToUnderflow || 40) / 100;
            const ufMin: Record<string, number> = {};
            const ofMin: Record<string, number> = {};
            Object.keys(feed.mineralFlows).forEach(k => {
                 const mDef = mineralsDb.find(m => m.id === k);
                 const splitUf = Math.max(0.01, Math.min(0.99, 0.75 + ((mDef?.density || 2.7) - 2.7) * 0.08));
                 ufMin[k] = feed.mineralFlows[k] * splitUf;
                 ofMin[k] = feed.mineralFlows[k] * (1 - splitUf);
            });
            const sOf = createStreamFromComponents(ofMin, feed.waterTph * (1 - Rf), feed.sgSolids);
            const sUf = createStreamFromComponents(ufMin, feed.waterTph * Rf, feed.sgSolids);
            sOf.psdVector = feed.psdVector; sOf.psd = feed.psd;
            sUf.psdVector = feed.psdVector; sUf.psd = feed.psd;
            return { 
                streams: [sOf, sUf],
                nodeMeta: { 
                    ...p, // Include all input parameters
                    type: 'Hydrocyclone', 
                    label: node.label,
                    rf: Rf * 100,
                    feedSolids: feed.percentSolids
                }
            };

        case 'FlotationCell':
            const method: FlotationCalculationMethod = p.calculationMethod || 'Database_Model';
            const model = availableModels.find(m => m.id === p.recoveryModelId) || availableModels[0];
            const perf = calculateFlotationPerformance(p as unknown as FlotationInputs, feed, model, mineralsDb);
            const concMin: Record<string, number> = {};
            const tailMin: Record<string, number> = {};
            Object.keys(feed.mineralFlows).forEach(mid => {
                concMin[mid] = perf.componentSplits[mid] || 0;
                tailMin[mid] = Math.max(0, feed.mineralFlows[mid] - concMin[mid]);
            });
            const massRec = feed.solidsTph > 0 ? (perf.concFlowTph / feed.solidsTph) : 0.1;
            const wSplit = Math.min(0.9, massRec * 1.2); 
            const sConc = createStreamFromComponents(concMin, feed.waterTph * wSplit, feed.sgSolids);
            const sTail = createStreamFromComponents(tailMin, feed.waterTph * (1 - wSplit), feed.sgSolids);
            sConc.psdVector = feed.psdVector; sConc.psd = feed.psd;
            sTail.psdVector = feed.psdVector; sTail.psd = feed.psd;
            return { 
                streams: [sConc, sTail],
                nodeMeta: { 
                    ...p, // Include all input parameters
                    ...perf, 
                    type: 'FlotationCell', 
                    label: node.label, 
                    method,
                    massPull: (perf.concFlowTph / (feed.solidsTph || 1)) * 100,
                    metallurgicalRecovery: perf.calculatedRecovery,
                    enrichmentRatio: (perf.concGrade / (perf.details.gradeFeed || 0.1))
                }
            };

        case 'Thickener':
            const targetUf = parseFloat(p.underflowSolids || 65);
            const wUf = Math.min(feed.solidsTph * ((100 - targetUf) / targetUf), feed.waterTph);
            const outUf = createStreamFromComponents(feed.mineralFlows, wUf, feed.sgSolids);
            outUf.psdVector = feed.psdVector; outUf.psd = feed.psd;
            const outOf = createStreamFromComponents({}, feed.waterTph - wUf, 1.0);
            return { 
                streams: [outUf, outOf],
                nodeMeta: {
                    ...p, // Include all input parameters
                    type: 'Thickener',
                    label: node.label,
                    underflowSolids: targetUf,
                    waterRecovered: feed.waterTph - wUf
                }
            };

        default:
            return { streams: [feed] };
    }
};

export const processNodeBackward = (node: NodeData, outputs: StreamData[], currentInputs: StreamData[]): StreamData[] => {
    const targetOut = mixStreams(outputs);
    if (node.type === 'Mixer' && currentInputs.some(s => s.totalTph === 0)) {
        const emptyIndices = currentInputs.map((s, i) => s.totalTph === 0 ? i : -1).filter(i => i !== -1);
        const currentSum = mixStreams(currentInputs);
        const missingW = Math.max(0, (targetOut.waterTph - currentSum.waterTph) / emptyIndices.length);
        const missingMin: Record<string, number> = {};
        Object.keys(targetOut.mineralFlows).forEach(mid => {
            missingMin[mid] = Math.max(0, (targetOut.mineralFlows[mid] - (currentSum.mineralFlows[mid] || 0)) / emptyIndices.length);
        });
        const fill = createStreamFromComponents(missingMin, missingW, targetOut.sgSolids);
        fill.psdVector = targetOut.psdVector;
        fill.psd = targetOut.psd;
        return currentInputs.map((s, i) => emptyIndices.includes(i) ? fill : s);
    }
    return currentInputs.length === 1 ? [targetOut] : currentInputs.map(() => createEmptyStream());
};
