
import { NodeData, Connection, StreamData, Component, RecoveryModel } from '../types';
import { calculateStreamAssays, calculateStreamProperties } from './models/sharedModels';
import { processNodeForward, processNodeBackward } from './nodeProcessors';
import { STANDARD_MODELS } from './miningMath';

const MAX_ITERATIONS = 500;
const TOLERANCE_ABS = 1e-4;

export interface EquipmentMessage {
  nodeId: string;
  nodeLabel: string;
  type: 'error' | 'warning';
  text: string;
}

export interface SimulationResult {
  converged: boolean;
  iterations: number;
  error: number;
  streams: Record<string, StreamData>;
  nodeResults: Record<string, any>;
  globalBalance: { inputs: number; outputs: number; error: number; };
  diagnostics: string[];
  equipmentMessages: EquipmentMessage[];
  activeMinerals?: Component[];
}

const createEmptyStream = (): StreamData => ({
  totalTph: 0, solidsTph: 0, waterTph: 0, percentSolids: 0, slurryDensity: 1, sgSolids: 2.7, 
  mineralFlows: {}, elementalAssays: {}
});

export const solveFlowsheet = (nodes: NodeData[], connections: Connection[], mineralsDb: Component[], customModels: RecoveryModel[] = []): SimulationResult => {
  const activeMinerals = mineralsDb.filter(m => m.selected);
  const allModels = [...STANDARD_MODELS, ...customModels];
  let streamState: Record<string, StreamData> = {};
  let nodeResults: Record<string, any> = {};
  
  connections.forEach(conn => {
      if (!conn.fromNode) {
          const p = conn.parameters || {};
          const solids = parseFloat(p.solidsTph) || 0;
          const pct = parseFloat(p.percentSolids) || 80;
          const sg = parseFloat(p.sg) || 2.7;
          const min: Record<string, number> = {};
          Object.keys(p).forEach(k => { if (k.startsWith('mineral_')) min[k.replace('mineral_', '')] = parseFloat(p[k]) || 0; });
          const totalParts = Object.values(min).reduce((a, b) => a + b, 0) || 1;
          const flows: Record<string, number> = {};
          Object.keys(min).forEach(k => flows[k] = solids * (min[k] / totalParts));
          const props = calculateStreamProperties(solids, pct, sg);
          streamState[conn.id] = { 
              totalTph: props.totalTph || 0, solidsTph: solids, waterTph: props.waterTph || 0, 
              percentSolids: pct, slurryDensity: props.slurryDensity || 1, sgSolids: sg, 
              mineralFlows: flows, elementalAssays: {} 
          };
      } else {
          streamState[conn.id] = createEmptyStream();
      }
  });

  let maxError = 0;
  let iter = 0;

  for (iter = 0; iter < MAX_ITERATIONS; iter++) {
    maxError = 0;
    nodes.filter(n => n.type !== 'TableOverlay').forEach(node => {
      const inputs = connections.filter(c => c.toNode === node.id).map(c => streamState[c.id]);
      const outputs = connections.filter(c => c.fromNode === node.id);
      if (inputs.some(s => s.totalTph > 0)) {
          const res = processNodeForward(node, inputs, outputs, mineralsDb, allModels);
          if (res.nodeMeta) nodeResults[node.id] = res.nodeMeta;
          outputs.forEach((conn, idx) => {
                const newS = res.streams[idx] || createEmptyStream();
                maxError = Math.max(maxError, Math.abs(newS.totalTph - streamState[conn.id].totalTph));
                streamState[conn.id] = newS;
          });
      }
    });

    [...nodes].reverse().filter(n => n.type !== 'TableOverlay').forEach(node => {
        const inputs = connections.filter(c => c.toNode === node.id);
        const outputs = connections.filter(c => c.fromNode === node.id).map(c => streamState[c.id]);
        if (inputs.some(c => streamState[c.id].totalTph === 0) && outputs.some(s => s.totalTph > 0)) {
             const back = processNodeBackward(node, outputs, inputs.map(c => streamState[c.id]));
             inputs.forEach((conn, idx) => {
                 if (streamState[conn.id].totalTph === 0) {
                     streamState[conn.id] = back[idx];
                     maxError = Math.max(maxError, back[idx].totalTph);
                 }
             });
        }
    });
    if (maxError < TOLERANCE_ABS) break;
  }

  Object.values(streamState).forEach(s => { if (s.solidsTph > 0) s.elementalAssays = calculateStreamAssays(s.mineralFlows, activeMinerals); });

  let inT = 0, outT = 0;
  connections.filter(c => !c.fromNode).forEach(c => inT += streamState[c.id].totalTph);
  connections.filter(c => !c.toNode).forEach(c => outT += streamState[c.id].totalTph);
  const err = inT > 0 ? (Math.abs(inT - outT) / inT) * 100 : 0;

  // Equipment Health Messages
  const equipmentMessages: EquipmentMessage[] = [];
  nodes.filter(n => n.type !== 'TableOverlay').forEach(node => {
    const p = node.parameters || {};
    let reason = '';

    if (node.type === 'Moinho') {
        if (!p.diameter || !p.length || !p.oreDensity) reason = 'Faltam dimensões ou densidade';
    } else if (node.type === 'Hydrocyclone') {
        if (!p.overflowSolids || !p.underflowSolids || !p.oreDensity) reason = 'Faltam parâmetros de separação';
    } else if (node.type === 'FlotationCell') {
        if (!p.ph || !p.airFlow || !p.residenceTime) reason = 'Faltam parâmetros cinéticos';
    }

    if (!reason) {
        const hasInputs = connections.some(c => c.toNode === node.id);
        const hasOutputs = connections.some(c => c.fromNode === node.id);
        if (!hasInputs && !hasOutputs) reason = 'Equipamento isolado';
        else {
            const streamResults = connections.filter(c => c.fromNode === node.id).map(c => streamState[c.id]);
            const hasEffectiveOutput = streamResults.some(s => s && s.solidsTph > 0);
            const inputStreams = connections.filter(c => c.toNode === node.id).map(c => streamState[c.id]);
            const hasEffectiveInput = inputStreams.some(s => s && s.solidsTph > 0);
            if (hasEffectiveInput && !hasEffectiveOutput) reason = 'Nenhum sólido reportado na saída';
        }
    }

    if (reason) {
        equipmentMessages.push({
            nodeId: node.id,
            nodeLabel: node.label,
            type: 'error',
            text: reason
        });
    }
  });

  return {
    converged: maxError < TOLERANCE_ABS, iterations: iter, error: err < 1e-4 ? 0 : err,
    streams: streamState, nodeResults, globalBalance: { inputs: inT, outputs: outT, error: err },
    diagnostics: iter >= MAX_ITERATIONS ? ["ALERTA: Limite de iterações atingido."] : [],
    equipmentMessages,
    activeMinerals
  };
};
