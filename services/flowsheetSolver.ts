
import { NodeData, Connection, StreamData, Component, RecoveryModel } from '../types';
import { calculateStreamAssays, calculateStreamProperties } from './models/sharedModels';
import { processNodeForward, processNodeBackward } from './nodeProcessors';
import { STANDARD_MODELS } from './miningMath';
import { STANDARD_CLASSES } from './models/millModels';

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

export const solveFlowsheet = (nodes: NodeData[] = [], connections: Connection[] = [], mineralsDb: Component[] = [], customModels: RecoveryModel[] = []): SimulationResult => {
  const activeMinerals = (mineralsDb || []).filter(m => m && m.selected);
  const allModels = [...STANDARD_MODELS, ...(customModels || [])];
  let streamState: Record<string, StreamData> = {};
  let nodeResults: Record<string, any> = {};
  const equipmentMessages: EquipmentMessage[] = [];
  
  // 1. Initial State: Streams originating from external points or ANY connection with parameters
  connections.forEach(conn => {
      const fromNode = nodes.find(n => n.id === conn.fromNode);
      const toNode = nodes.find(n => n.id === conn.toNode);
      
      const p = conn.parameters || (fromNode ? fromNode.parameters : {}) || {};
      const solids = parseFloat(p.solidsTph) || 0;
      
      // Inicializa se tiver parâmetros, se for origem (Feed), se for destino (Product) ou se não tiver nó de origem.
      if (solids > 0 || !conn.fromNode || (fromNode && fromNode.type === 'Feed')) {
          const pct = parseFloat(p.percentSolids) || 0;
          const sg = parseFloat(p.sg) || parseFloat(p.oreDensity) || 2.7;
          
          const min: Record<string, number> = {};
          Object.keys(p).forEach(k => { 
            if (k.startsWith('mineral_')) min[k.replace('mineral_', '')] = parseFloat(p[k]) || 0; 
          });
          
          if (Object.keys(min).length === 0 && fromNode) {
             Object.keys(fromNode.parameters || {}).forEach(k => {
                if (k.startsWith('mineral_')) min[k.replace('mineral_', '')] = parseFloat(fromNode.parameters[k]) || 0;
             });
          }

          const totalParts = Object.values(min).reduce((a, b) => a + b, 0) || 1;
          const flows: Record<string, number> = {};
          Object.keys(min).forEach(k => flows[k] = solids * (min[k] / totalParts));
          
          const den_p = parseFloat(p.slurryDensity || p.pulpDensity || '0') || 0;
          
          const props = calculateStreamProperties(solids, pct, sg, den_p > 0 ? den_p : undefined);
          streamState[conn.id] = { 
              totalTph: props.totalTph || 0, solidsTph: solids, waterTph: props.waterTph || 0, 
              percentSolids: props.percentSolids || pct, slurryDensity: props.slurryDensity || 1, sgSolids: sg, 
              mineralFlows: flows, elementalAssays: {},
              psdVector: { sizes: [...STANDARD_CLASSES], massFractions: new Array(STANDARD_CLASSES.length).fill(0).map((_,i) => i === 0 ? 1 : 0) },
              psd: new Array(STANDARD_CLASSES.length).fill(100)
          };
      } else {
          streamState[conn.id] = createEmptyStream();
      }
  });

  let maxError = 0;
  let iter = 0;
  const STANDARD_MODELS_LIST = [...STANDARD_MODELS, ...customModels];

  for (iter = 0; iter < MAX_ITERATIONS; iter++) {
    maxError = 0;
    
    // No início de cada iteração, forçamos os parâmetros conhecidos do usuário (Constraints)
    connections.forEach(conn => {
        if (conn.parameters && (parseFloat(conn.parameters.solidsTph) > 0 || parseFloat(conn.parameters.slurryDensity) > 0)) {
            const p = conn.parameters;
            const solids = parseFloat(p.solidsTph) || 0;
            const pct = parseFloat(p.percentSolids) || 0;
            const sg = parseFloat(p.sg) || 2.7;
            const den_p = parseFloat(p.slurryDensity || p.pulpDensity || '0') || 0;

            const props = calculateStreamProperties(solids, pct, sg, den_p > 0 ? den_p : undefined);
            
            // Preservamos o estado atual mas forçamos a massa se ela foi definida na linha ou se a densidade foi definida
            if (solids > 0) streamState[conn.id].solidsTph = solids;
            streamState[conn.id].waterTph = props.waterTph || 0;
            streamState[conn.id].totalTph = props.totalTph || 0;
            streamState[conn.id].percentSolids = props.percentSolids || 0;
            streamState[conn.id].slurryDensity = props.slurryDensity || 1.0;
        }
    });

    // Passagem para Trás (Backward) - Resolvemos de trás pra frente primeiro para capturar "outputs" definidos
    [...nodes].reverse().filter(n => n.type !== 'TableOverlay').forEach(node => {
        const inputs = connections.filter(c => c.toNode === node.id);
        const outputs = connections.filter(c => c.fromNode === node.id).map(c => streamState[c.id]);
        
        if (outputs.some(s => s && s.totalTph > 0.1)) {
             const back = processNodeBackward(node, outputs, inputs.map(c => streamState[c.id]));
             inputs.forEach((conn, idx) => {
                 const currentS = streamState[conn.id];
                 const newS = back[idx];
                 if (newS && (currentS.totalTph === 0 && newS.totalTph > 0.1)) {
                     streamState[conn.id] = newS;
                     maxError = Math.max(maxError, newS.totalTph);
                 }
             });
        }
    });

    // Passagem para Frente (Forward)
    nodes.filter(n => n.type !== 'TableOverlay').forEach(node => {
      const inputConnections = connections.filter(c => c.toNode === node.id);
      const inputs = inputConnections.map(c => streamState[c.id]);
      const outputs = connections.filter(c => c.fromNode === node.id);
      
      if (node.type === 'Feed' || inputs.some(s => s && s.totalTph > 0)) {
          const res = processNodeForward(node, inputs, outputs, mineralsDb, STANDARD_MODELS_LIST);
          if (res.nodeMeta) nodeResults[node.id] = { ...nodeResults[node.id], ...res.nodeMeta };
          
          outputs.forEach((conn, idx) => {
                const newS = res.streams[idx] || createEmptyStream();
                const currentS = streamState[conn.id];
                
                const diff = Math.abs(newS.totalTph - (currentS?.totalTph || 0)) + 
                            Math.abs(newS.solidsTph - (currentS?.solidsTph || 0));
                
                maxError = Math.max(maxError, diff);
                streamState[conn.id] = newS;
          });
      }
    });
    
    if (maxError < TOLERANCE_ABS && iter > 10) break; 
  }

  // Final Assays Calculation
  Object.values(streamState).forEach(s => { 
    const elemental = calculateStreamAssays(s.mineralFlows, activeMinerals);
    s.elementalAssays = elemental.assays;
    s.elementalMassFlows = elemental.massFlows;
  });

  // Global Balance Calculation
  let inSolids = 0, outSolids = 0;
  let inWater = 0, outWater = 0;
  
  connections.filter(c => !c.fromNode || nodes.find(n => n.id === c.fromNode)?.type === 'Feed').forEach(c => {
    inSolids += streamState[c.id].solidsTph;
    inWater += streamState[c.id].waterTph;
  });
  
  connections.filter(c => !c.toNode || nodes.find(n => n.id === c.toNode)?.type === 'Product').forEach(c => {
    outSolids += streamState[c.id].solidsTph;
    outWater += streamState[c.id].waterTph;
  });
  
  const inT = inSolids + inWater;
  const outT = outSolids + outWater;
  const globalErr = inT > 0 ? (Math.abs(inT - outT) / inT) * 100 : 0;

  // Equipment Health Messages
  nodes.filter(n => n.type !== 'TableOverlay').forEach(node => {
    const p = node.parameters || {};
    let reason = '';
    let type: 'error' | 'warning' = 'error';

    if (node.type === 'Moinho') {
        const meta = nodeResults[node.id];
        if (meta && meta.makeupWaterRequired > 0.1) {
            reason = `Falta água de diluição: ${meta.makeupWaterRequired.toFixed(1)} t/h necessários para atingir ${meta.targetDischargeSolids}% sólidos.`;
            type = 'warning';
        }
        if (!p.diameter || !p.length || !p.oreDensity) { reason = 'Faltam dimensões ou densidade'; type = 'error'; }
    } else if (node.type === 'Hydrocyclone') {
        if (!p.underflowSolids || !p.oreDensity) { reason = 'Faltam parâmetros de separação'; type = 'error'; }
    }

    if (!reason) {
        const hasInputs = connections.some(c => c.toNode === node.id);
        const hasOutputs = connections.some(c => c.fromNode === node.id);
        if (!hasInputs && !hasOutputs && node.type !== 'Feed' && node.type !== 'Product') {
            reason = 'Equipamento isolado';
            type = 'warning';
        } else if (node.type !== 'Feed' && node.type !== 'Product') {
            const inputStreams = connections.filter(c => c.toNode === node.id).map(c => streamState[c.id]);
            const outputStreams = connections.filter(c => c.fromNode === node.id).map(c => streamState[c.id]);
            const inSol = inputStreams.reduce((a, b) => a + (b?.solidsTph || 0), 0);
            const outSol = outputStreams.reduce((a, b) => a + (b?.solidsTph || 0), 0);
            
            if (inSol > 0.01 && Math.abs(inSol - outSol) / inSol > 0.01) {
                reason = `Erro de balanço de sólidos: In=${inSol.toFixed(1)}, Out=${outSol.toFixed(1)}`;
                type = 'error';
            }
        }
    }

    if (reason) {
        equipmentMessages.push({ nodeId: node.id, nodeLabel: node.label, type, text: reason });
    }
  });

  return {
    converged: iter < MAX_ITERATIONS, iterations: iter, error: globalErr,
    streams: streamState, nodeResults, globalBalance: { inputs: inT, outputs: outT, error: globalErr },
    diagnostics: iter >= MAX_ITERATIONS ? ["ALERTA: O circuito pode conter loops complexos que dificultam a convergência."] : [],
    equipmentMessages,
    activeMinerals
  };
};

