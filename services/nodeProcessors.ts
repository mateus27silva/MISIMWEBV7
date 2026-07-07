
import { NodeData, StreamData, Connection, Component, RecoveryModel, FlotationCalculationMethod, FlotationInputs, BallMillInputs } from '../types';
import { calculateFlotationPerformance } from './models/flotationModels';
import { calculateHoggFuerstenauPower, solvePBM, fractionsToCumulativePassing, calculateP80, STANDARD_CLASSES } from './models/millModels';
import { calculateCyclonePerformance } from './models/cycloneModels';

const createEmptyStream = (): StreamData => ({
  totalTph: 0, solidsTph: 0, waterTph: 0, percentSolids: 0, slurryDensity: 1, sgSolids: 2.7, 
  mineralFlows: {}, elementalAssays: {},
  psdVector: { sizes: [...STANDARD_CLASSES], massFractions: new Array(STANDARD_CLASSES.length).fill(0).map((_,i) => i === 0 ? 1 : 0) },
  psd: new Array(STANDARD_CLASSES.length).fill(100)
});

const calculatePartition = (size: number, d50c: number, sharpness: number = 2.5): number => {
    if (d50c <= 0) return 0.5;
    // Modelo Lynch & Rao / Plitt para curva de partição
    const ratio = size / d50c;
    return 1 - Math.exp(-0.693 * Math.pow(ratio, sharpness));
};

const createStreamFromComponents = (minerals: Record<string, number>, water: number, sg: number): StreamData => {
    const solids = Object.values(minerals).reduce((a, b) => a + (b || 0), 0);
    const total = solids + (water || 0);
    const pct = total > 0 ? (solids/total)*100 : 0;
    const den = pct > 0 ? 100 / ((pct/(sg || 2.7)) + ((100-pct)/1)) : 1.0;
    return { 
        totalTph: total, 
        solidsTph: solids, 
        waterTph: water || 0, 
        percentSolids: pct, 
        slurryDensity: den, 
        sgSolids: sg || 2.7, 
        mineralFlows: minerals, 
        elementalAssays: {} 
    };
};

const mixStreams = (streams: StreamData[]): StreamData => {
    let water = 0;
    let combinedMineralFlows: Record<string, number> = {};
    let combinedPsdVector: number[] = new Array(STANDARD_CLASSES.length).fill(0);
    let totalSolids = 0;
    let totalVolSolids = 0;

    streams.forEach(s => {
        if (!s) return;
        water += s.waterTph || 0;
        const solids = s.solidsTph || 0;
        totalSolids += solids;
        
        if (s.mineralFlows) {
            Object.entries(s.mineralFlows).forEach(([mid, mass]) => {
                combinedMineralFlows[mid] = (combinedMineralFlows[mid] || 0) + (mass || 0);
            });
        }
        
        if (s.sgSolids > 0) {
            totalVolSolids += solids / s.sgSolids;
        } else {
            totalVolSolids += solids / 2.7;
        }
        
        // Mistura de granulometria (ponderada pela massa)
        if (s.psdVector && solids > 0) {
            s.psdVector.massFractions.forEach((f, i) => {
                combinedPsdVector[i] += (f || 0) * solids;
            });
        }
    });

    if (totalSolids > 0) {
        combinedPsdVector = combinedPsdVector.map(v => v / totalSolids);
    } else {
        // Se não houver sólidos, usa a classe inicial como padrão
        combinedPsdVector = new Array(STANDARD_CLASSES.length).fill(0);
        combinedPsdVector[0] = 1;
    }

    const avgSg = totalSolids > 0 && totalVolSolids > 0 ? totalSolids / totalVolSolids : 2.7;
    
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
        case 'Feed': {
            const solids = parseFloat(p.solidsTph) || 0;
            const pct = parseFloat(p.percentSolids) || 80;
            const sg = parseFloat(p.sg) || parseFloat(p.oreDensity) || 2.7;
            const water = solids > 0 && pct > 0 ? solids * ((100 - pct) / pct) : 0;
            
            const min: Record<string, number> = {};
            Object.keys(p).forEach(k => { 
                if (k.startsWith('mineral_')) min[k.replace('mineral_', '')] = parseFloat(p[k]) || 0; 
            });
            
            const totalParts = Object.values(min).reduce((a, b) => a + (b || 0), 0) || 1;
            const flows: Record<string, number> = {};
            Object.keys(min).forEach(k => flows[k] = solids * ((min[k] || 0) / totalParts));
            
            const s = createStreamFromComponents(flows, water, sg);
            s.psdVector = { sizes: [...STANDARD_CLASSES], massFractions: new Array(STANDARD_CLASSES.length).fill(0).map((_,i) => i === 0 ? 1 : 0) };
            s.psd = fractionsToCumulativePassing(s.psdVector);
            
            return { streams: outputConnections.map(() => ({...s})) };
        }

        case 'Product':
            return { streams: outputConnections.map(() => ({...feed})) };

        default:
            // Safety check for processing nodes that depend on feed
            if (feed.totalTph <= 0) {
                return { streams: outputConnections.map(() => createEmptyStream()) };
            }
    }

    switch (node.type) {
        case 'Mixer': {
            const outCount = Math.max(1, outputConnections.length);
            const ratio = 1 / outCount;
            const streams = Array.from({length: outCount}, () => {
                const min: Record<string, number> = {};
                Object.keys(feed.mineralFlows).forEach(k => min[k] = feed.mineralFlows[k] * ratio);
                const s = createStreamFromComponents(min, feed.waterTph * ratio, feed.sgSolids);
                s.psdVector = feed.psdVector;
                s.psd = feed.psd;
                return s;
            });
            return { streams };
        }

        case 'Splitter': {
            let ratio = Math.max(0, Math.min(100, parseFloat(p.splitRatio || 50))) / 100;
            const s1Min: Record<string, number> = {};
            const s2Min: Record<string, number> = {};
            Object.keys(feed.mineralFlows).forEach(k => {
                s1Min[k] = feed.mineralFlows[k] * ratio;
                s2Min[k] = feed.mineralFlows[k] * (1 - ratio);
            });
            
            const out1 = createStreamFromComponents(s1Min, feed.waterTph * ratio, feed.sgSolids);
            out1.psdVector = feed.psdVector; out1.psd = feed.psd;
            const out2 = createStreamFromComponents(s2Min, feed.waterTph * (1 - ratio), feed.sgSolids);
            out2.psdVector = feed.psdVector; out2.psd = feed.psd;
            
            return { streams: [out1, out2]};
        }

        case 'Moinho': {
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
            
            // 3. Balanço de Água Rigoroso: Saída = Entrada
            const targetDischarge = parseFloat(p.targetDischargeSolids || 70);
            const requiredWaterForTarget = feed.solidsTph * ((100 - targetDischarge) / targetDischarge);
            const waterShortfall = Math.max(0, requiredWaterForTarget - feed.waterTph);

            const dischargeStream = createStreamFromComponents(feed.mineralFlows, feed.waterTph, feed.sgSolids);
            dischargeStream.psdVector = dischargePsdVector;
            dischargeStream.psd = dischargePsd;
            dischargeStream.p80 = calculateP80(dischargePsd);
            dischargeStream.f80 = calculateP80(feed.psd || []);

            return { 
                streams: [dischargeStream],
                nodeMeta: { 
                    ...p,
                    ...powerResults, 
                    specificEnergy: feed.solidsTph > 0 ? powerResults.netPower / feed.solidsTph : 0,
                    throughput: feed.solidsTph,
                    type: 'Moinho', 
                    label: node.label,
                    p80: dischargeStream.p80,
                    f80: dischargeStream.f80,
                    reductionRatio: dischargeStream.f80 / (dischargeStream.p80 || 1),
                    targetDischargeSolids: targetDischarge,
                    actualDischargeSolids: dischargeStream.percentSolids,
                    makeupWaterRequired: waterShortfall
                }
            };
        }

        case 'Hydrocyclone': {
            const cycRes = calculateCyclonePerformance(p as any);
            const d50c = cycRes.cutPoint || parseFloat(p.d50c as string) || 100;
            const Rf = Math.max(0, Math.min(1, (cycRes.waterRecovery || parseFloat(p.waterRecoveryToUnderflow || '40')) / 100));
            
            const ufMin: Record<string, number> = {};
            const ofMin: Record<string, number> = {};
            const ufPsdFractions = new Array(STANDARD_CLASSES.length).fill(0);
            const ofPsdFractions = new Array(STANDARD_CLASSES.length).fill(0);
            
            let totalUfSolids = 0;
            let totalOfSolids = 0;

            // 1. Calcular Partição por Classe Granulométrica
            const feedPsd = feed.psdVector || { sizes: [...STANDARD_CLASSES], massFractions: [] };
            const m = parseFloat(p.sharpnessIndex as string) || 2.5;

            feedPsd.massFractions.forEach((fraction, i) => {
                const size = feedPsd.sizes[i];
                // Recuperação real (ajustada para bypass de água Rf)
                // R = Rf + (1 - Rf) * R_particao
                const rPart = calculatePartition(size, d50c, m);
                const rTotal = Rf + (1 - Rf) * rPart;
                
                const massInClass = fraction * feed.solidsTph;
                const massToUf = massInClass * rTotal;
                const massToOf = massInClass * (1 - rTotal);
                
                ufPsdFractions[i] = massToUf;
                ofPsdFractions[i] = massToOf;
                totalUfSolids += massToUf;
                totalOfSolids += massToOf;
            });

            // 2. Distribuir Minerais Proporcionalmente aos sólidos Totais (simplificação)
            // Ou poderíamos ter d50c por densidade. Por enquanto, balanceamos a massa total.
            Object.keys(feed.mineralFlows).forEach(k => {
                const globalRecovery = feed.solidsTph > 0 ? totalUfSolids / feed.solidsTph : 0.5;
                ufMin[k] = feed.mineralFlows[k] * globalRecovery;
                ofMin[k] = feed.mineralFlows[k] * (1 - globalRecovery);
            });

            const sOf = createStreamFromComponents(ofMin, feed.waterTph * (1 - Rf), feed.sgSolids);
            const sUf = createStreamFromComponents(ufMin, feed.waterTph * Rf, feed.sgSolids);
            
            if (totalOfSolids > 0) {
                sOf.psdVector = { sizes: [...STANDARD_CLASSES], massFractions: ofPsdFractions.map(v => v / totalOfSolids) };
            } else {
                sOf.psdVector = { sizes: [...STANDARD_CLASSES], massFractions: new Array(STANDARD_CLASSES.length).fill(0).map((_,i) => i === 0 ? 1 : 0) };
            }
            
            if (totalUfSolids > 0) {
                sUf.psdVector = { sizes: [...STANDARD_CLASSES], massFractions: ufPsdFractions.map(v => v / totalUfSolids) };
            } else {
                sUf.psdVector = { sizes: [...STANDARD_CLASSES], massFractions: new Array(STANDARD_CLASSES.length).fill(0).map((_,i) => i === 0 ? 1 : 0) };
            }
            
            sOf.psd = fractionsToCumulativePassing(sOf.psdVector!);
            sUf.psd = fractionsToCumulativePassing(sUf.psdVector!);
            sOf.p80 = calculateP80(sOf.psd);
            sUf.p80 = calculateP80(sUf.psd);

            return { 
                streams: [sOf, sUf],
                nodeMeta: { 
                    ...p,
                    type: 'Hydrocyclone', 
                    label: node.label,
                    rf: Rf * 100,
                    d50c,
                    feedSolids: feed.percentSolids,
                    overflowP80: sOf.p80,
                    underflowP80: sUf.p80
                }
            };
        }

        case 'FlotationCell': {
            const method: FlotationCalculationMethod = p.calculationMethod || 'Database_Model';
            const model = availableModels.find(m => m.id === p.recoveryModelId) || availableModels[0];
            const perf = calculateFlotationPerformance(p as unknown as FlotationInputs, feed, model, mineralsDb);
            const concMin: Record<string, number> = {};
            const tailMin: Record<string, number> = {};
            
            Object.keys(feed.mineralFlows).forEach(mid => {
                const recovered = Math.min(feed.mineralFlows[mid], perf.componentSplits[mid] || 0);
                concMin[mid] = recovered;
                tailMin[mid] = Math.max(0, feed.mineralFlows[mid] - recovered);
            });
            
            const massRec = feed.solidsTph > 0 ? (perf.concFlowTph / feed.solidsTph) : 0.1;
            const wSplit = Math.max(0.01, Math.min(0.9, massRec * 1.2)); 
            const sConc = createStreamFromComponents(concMin, feed.waterTph * wSplit, feed.sgSolids);
            const sTail = createStreamFromComponents(tailMin, feed.waterTph * (1 - wSplit), feed.sgSolids);
            sConc.psdVector = feed.psdVector; sConc.psd = feed.psd;
            sTail.psdVector = feed.psdVector; sTail.psd = feed.psd;
            
            return { 
                streams: [sConc, sTail],
                nodeMeta: { 
                    ...p,
                    ...perf, 
                    type: 'FlotationCell', 
                    label: node.label, 
                    method,
                    massPull: (sConc.solidsTph / (feed.solidsTph || 1)) * 100,
                    metallurgicalRecovery: perf.calculatedRecovery
                }
            };
        }

        case 'Thickener': {
            const targetUf = parseFloat(p.underflowSolids || 65);
            const maxWUnderflow = feed.solidsTph > 0 ? feed.solidsTph * ((100 - targetUf) / targetUf) : 0;
            const wUf = Math.min(maxWUnderflow, feed.waterTph);
            const outUf = createStreamFromComponents(feed.mineralFlows, wUf, feed.sgSolids);
            outUf.psdVector = feed.psdVector; outUf.psd = feed.psd;
            const outOf = createStreamFromComponents({}, Math.max(0, feed.waterTph - wUf), 1.0);
            return { 
                streams: [outUf, outOf],
                nodeMeta: {
                    ...p,
                    type: 'Thickener',
                    label: node.label,
                    underflowSolids: targetUf,
                    waterRecovered: feed.waterTph - wUf
                }
            };
        }

        default:
            return { streams: outputConnections.map(() => ({...feed})) };
    }
};

export const processNodeBackward = (node: NodeData, outputs: StreamData[], currentInputs: StreamData[]): StreamData[] => {
    const totalOutput = mixStreams(outputs);
    
    if (totalOutput.totalTph <= 0) return currentInputs;

    switch (node.type) {
        case 'Mixer': {
            const emptyIndices = currentInputs.map((s, i) => (!s || s.totalTph <= 0) ? i : -1).filter(i => i !== -1);
            if (emptyIndices.length === 0) return currentInputs;

            const existingSum = mixStreams(currentInputs.filter((_, i) => !emptyIndices.includes(i)));
            
            const missingWater = Math.max(0, totalOutput.waterTph - existingSum.waterTph) / emptyIndices.length;
            const missingMin: Record<string, number> = {};
            Object.keys(totalOutput.mineralFlows).forEach(mid => {
                missingMin[mid] = Math.max(0, totalOutput.mineralFlows[mid] - (existingSum.mineralFlows[mid] || 0)) / emptyIndices.length;
            });

            const fill = createStreamFromComponents(missingMin, missingWater, totalOutput.sgSolids);
            fill.psdVector = totalOutput.psdVector;
            fill.psd = totalOutput.psd;

            return currentInputs.map((s, i) => emptyIndices.includes(i) ? fill : s);
        }

        case 'Splitter':
        case 'Moinho':
        case 'Hydrocyclone':
        case 'FlotationCell':
        case 'Thickener': {
            if (currentInputs.length === 1 && (!currentInputs[0] || currentInputs[0].totalTph <= 0)) {
                return [totalOutput];
            }
            return currentInputs;
        }

        default:
            return currentInputs;
    }
};

