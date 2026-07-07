import React, { useState, useEffect, useMemo } from 'react';
import { NodeData, Connection, Component, StreamData, RecoveryModel, UnitConfig, NodeType } from '../types';
import { 
  Settings2, Hammer, Boxes, Layers, Shuffle, 
  Filter, Sliders, Search, Waves, ArrowRight, Droplets, Split
} from 'lucide-react';
import { STANDARD_MODELS } from '../services/miningMath';
import { calculateStreamProperties } from '../services/models/sharedModels';
import { 
  MillForm, SagMillForm, HPGRForm, GyratoryForm, JawCrusherForm, 
  CycloneForm, FlotationForm, MixerForm, StreamForm, DefaultForm 
} from '../components/SharedParameterForms';

interface ParametersViewProps {
  nodes: NodeData[];
  connections: Connection[];
  minerals: Component[];
  customModels: RecoveryModel[];
  units: UnitConfig;
  onUpdateNode: (id: string, updates: Partial<NodeData>) => void;
  onUpdateConnection: (id: string, updates: Partial<Connection>) => void;
  onNavigateToProject: () => void;
  initialTargetId?: string | null;
  onClearTargetId?: () => void;
  filterType?: string; // Filtro por categoria de equipamento
}

// Union type for local item handling
type ConfigItem = {
    id: string;
    label: string;
    type: string; // NodeType | 'Stream'
    parameters: Record<string, any>;
    itemType: 'node' | 'connection';
    streamState?: StreamData;
    fromNode?: string; // Essential to determine if it is a Feed Stream
};

export const ParametersView: React.FC<ParametersViewProps> = ({ 
    nodes, 
    connections, 
    minerals,
    customModels,
    units,
    onUpdateNode, 
    onUpdateConnection, 
    onNavigateToProject,
    initialTargetId,
    onClearTargetId,
    filterType
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Define mapeamento de categorias para tipos de nó
  const CATEGORY_MAP: Record<string, NodeType[]> = {
    'COMINUIÇÃO': ['Moinho', 'MoinhoSAG', 'MoinhoRolos', 'Britador', 'BritadorGiratorio', 'BritadorMandibula'],
    'CLASSIFICAÇÃO': ['Hydrocyclone'],
    'CONCENTRAÇÃO': ['FlotationCell', 'Conditioner'],
    'SÓLIDOS-LÍQUIDO': ['Thickener'],
    'AUXILIARES': ['Mixer', 'Splitter'],
    'CORRENTES': [] // No nodes, only streams
  };

  // Combine Nodes and Connections for the list, Memoized to prevent unnecessary recalculations.
  const allItems: ConfigItem[] = useMemo(() => {
      const items: ConfigItem[] = [];
      const seenKeys = new Set<string>();

      // Process Nodes
      for (const n of nodes) {
          if (n.type === 'Feed' || n.type === 'Product') continue;
          
          // Aplicar filtro de categoria se existir
          if (filterType) {
              if (filterType === 'CORRENTES') continue; // Explicitly skip nodes if filtering for streams
              if (CATEGORY_MAP[filterType]) {
                  if (!CATEGORY_MAP[filterType].includes(n.type)) continue;
              }
          }

          const key = `node-${n.id}`;
          if (!seenKeys.has(key)) {
              seenKeys.add(key);
              items.push({ 
                  id: n.id, 
                  label: n.label, 
                  type: n.type, 
                  parameters: n.parameters, 
                  itemType: 'node' 
              });
          }
      }

      // Process Connections - apenas se não houver filtro de categoria de equipamento específico ou se for CORRENTES
      if (!filterType || filterType === 'CORRENTES') {
          for (const c of connections) {
              const key = `conn-${c.id}`;
              if (!seenKeys.has(key)) {
                  seenKeys.add(key);
                  items.push({ 
                      id: c.id, 
                      label: c.label || 'Stream', 
                      type: 'Stream', 
                      parameters: c.parameters || {}, 
                      itemType: 'connection',
                      streamState: c.streamState,
                      fromNode: c.fromNode
                  });
              }
          }
      }
      
      return items;
  }, [nodes, connections, filterType]);

  // Robust Auto-selection effect
  useEffect(() => {
    if (allItems.length === 0) {
        if (activeId !== null) setActiveId(null);
        return;
    }

    if (initialTargetId) {
        setActiveId(initialTargetId);
        if (onClearTargetId) onClearTargetId();
        return;
    }

    const currentExists = allItems.find(i => i.id === activeId);
    
    if (!activeId || !currentExists) {
        setActiveId(allItems[0].id);
    }
  }, [allItems, activeId, initialTargetId]);

  const activeItem = allItems.find(n => n.id === activeId);

  const handleLabelChange = (val: string) => {
      if (!activeItem) return;
      if (activeItem.itemType === 'node') {
          onUpdateNode(activeItem.id, { label: val });
      } else {
          onUpdateConnection(activeItem.id, { label: val });
      }
  };

  const handleParamChange = (key: string, value: string | number | any) => {
    if (!activeItem) return;
    
    // Permitir strings para evitar que o ponto decimal desapareça durante a digitação
    let finalValue = value;
    if (typeof value === 'string' && key !== 'targetElement' && key !== 'recoveryModelId' && key !== 'calculationMethod') {
        // Normalização básica: trocar vírgula por ponto para compatibilidade matemática
        finalValue = value.replace(',', '.');
    }
    
    // Cálculo de Balanço de Massa Automático para Correntes (C_w, SG, Rho_p)
    let updatedParams = { ...activeItem.parameters, [key]: finalValue };
    
    if (activeItem.type === 'Stream' || activeItem.type === 'Feed') {
      const solids = parseFloat(updatedParams.solidsTph || '0') || 0;
      let pct = parseFloat(updatedParams.percentSolids || '0') || 0;
      let sg = parseFloat(updatedParams.sg || updatedParams.oreDensity || '2.7') || 2.7;
      let rho_p = parseFloat(updatedParams.slurryDensity || updatedParams.pulpDensity || '0') || 0;

      // Recalcular SG (Densidade Mineral) a partir da composição se um mineral mudou
      if (key.startsWith('mineral_')) {
        let harmonicSum = 0;
        let totalPct = 0;
        minerals.forEach(m => {
          const mPct = parseFloat(updatedParams[`mineral_${m.id}`] || '0') || 0;
          if (mPct > 0) {
            harmonicSum += mPct / (m.density || 2.7);
            totalPct += mPct;
          }
        });

        if (totalPct > 0 && harmonicSum > 0) {
          // Assume que o restante da massa (até 100%) tem densidade 2.7 (ganga padrão)
          const remainingPct = Math.max(0, 100 - totalPct);
          const finalSum = harmonicSum + (remainingPct / 2.7);
          sg = 100 / finalSum;
          updatedParams.sg = sg.toFixed(3);
          if (updatedParams.oreDensity !== undefined) updatedParams.oreDensity = updatedParams.sg;
        }
      }
      
      if (key === 'percentSolids' && pct > 0 && sg > 1) {
        // Recalcular Densidade de Polpa
        rho_p = 100 / ((pct / sg) + (100 - pct));
        updatedParams.slurryDensity = rho_p.toFixed(3);
        if (updatedParams.pulpDensity !== undefined) updatedParams.pulpDensity = updatedParams.slurryDensity;
      } else if (key === 'slurryDensity' && rho_p > 1 && sg > 1) {
        // Recalcular % Sólidos
        pct = (sg / rho_p) * ((rho_p - 1) / (sg - 1)) * 100;
        updatedParams.percentSolids = pct.toFixed(2);
      } else if (key === 'sg' && sg > 1) {
        if (pct > 0 && (!rho_p || rho_p <= 1)) {
            rho_p = 100 / ((pct / sg) + (100 - pct));
            updatedParams.slurryDensity = rho_p.toFixed(3);
            if (updatedParams.pulpDensity !== undefined) updatedParams.pulpDensity = updatedParams.slurryDensity;
        } else if (rho_p > 1) {
            pct = (sg / rho_p) * ((rho_p - 1) / (sg - 1)) * 100;
            updatedParams.percentSolids = pct.toFixed(2);
        }
      }

      // Re-fetch values after potential updates above for the volumetric flow calculation
      const finalSolids = parseFloat(updatedParams.solidsTph || '0') || 0;
      const finalPct = parseFloat(updatedParams.percentSolids || '0') || 0;
      const finalDen = parseFloat(updatedParams.slurryDensity || '1.0') || 1.0;
      
      if (finalSolids >= 0 && finalPct > 0) {
        const total = finalSolids / (finalPct / 100);
        updatedParams.volumetricFlow = (total / finalDen).toFixed(2);
      }
    }
    
    if (activeItem.itemType === 'node') {
        onUpdateNode(activeItem.id, {
            parameters: updatedParams
        });
    } else {
        onUpdateConnection(activeItem.id, {
            parameters: updatedParams
        });
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Moinho': return Settings2;
      case 'MoinhoSAG': return Settings2;
      case 'MoinhoRolos': return Settings2;
      case 'Hydrocyclone': return Filter;
      case 'FlotationCell': return Layers;
      case 'Britador': return Hammer;
      case 'BritadorGiratorio': return Hammer; 
      case 'BritadorMandibula': return Hammer;
      case 'Mixer': return Shuffle;
      case 'Splitter': return Split;
      case 'Thickener': return Droplets;
      case 'Stream': return Waves;
      default: return Sliders;
    }
  };

  const filteredItems = allItems.filter(n => 
    n.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFeedStreamForNode = (nodeId: string) => {
      const inputConn = connections.find(c => c.toNode === nodeId);
      return inputConn?.streamState;
  };

  const getOutputStreamForNode = (nodeId: string, port: string) => {
      const outputConn = connections.find(c => c.fromNode === nodeId && c.fromPort === port);
      return outputConn?.streamState;
  };

  if (allItems.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Sliders className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhum equipamento em {filterType || 'esta categoria'}</h2>
        <p className="text-slate-500 max-w-md mb-6">
          Adicione equipamentos deste grupo no fluxograma para habilitar suas configurações individuais.
        </p>
        <button 
          onClick={onNavigateToProject}
          className="px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center"
        >
          Ir para Fluxograma <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      
      <div className="flex flex-col border-b border-slate-200 bg-slate-50 shrink-0">
         
         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-6 py-4 bg-white border-b border-slate-100">
             <div className="mb-2 sm:mb-0">
                 <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <Sliders className="w-5 h-5 mr-2 text-blue-600" />
                    Parâmetros: {filterType || 'Geral'}
                 </h2>
                 <p className="text-xs text-slate-500 mt-1">Configure as variáveis de processo para as instâncias do circuito.</p>
             </div>
             
             <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                    type="text" 
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                />
            </div>
         </div>

         <div className="flex overflow-x-auto custom-scrollbar px-2 space-x-1 pt-2">
            {filteredItems.map(item => {
                const Icon = getIconForType(item.type);
                const isActive = activeId === item.id;
                const isStream = item.itemType === 'connection';
                const uniqueKey = item.itemType + '-' + item.id;
                return (
                    <button
                        key={uniqueKey} 
                        onClick={() => setActiveId(item.id)}
                        className={`
                            flex items-center px-4 py-3 border-t border-x rounded-t-lg text-sm font-medium whitespace-nowrap transition-all relative top-px select-none
                            ${isActive 
                                ? 'bg-white border-slate-200 border-b-white text-blue-600 z-10' 
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }
                        `}
                    >
                        <div className={`p-1 rounded mr-2 ${isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                             <Icon className="w-3.5 h-3.5" />
                        </div>
                        {item.label}
                        <span className={`ml-2 text-[10px] uppercase ${isStream ? 'text-cyan-500' : 'text-slate-400'}`}>
                            {isStream ? 'Stream' : item.type}
                        </span>
                    </button>
                );
            })}
         </div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/30">
         {activeItem ? (
             <div className="flex-1 overflow-y-auto p-6 md:p-8">
                 <div className="w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="w-full">
                             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                 {activeItem.itemType === 'connection' ? 'Nome da Corrente' : 'Nome do Equipamento (Tag)'}
                             </label>
                             <input 
                                 type="text" 
                                 value={activeItem.label}
                                 onChange={(e) => handleLabelChange(e.target.value)}
                                 className="w-full text-2xl font-bold text-slate-900 border-b-2 border-transparent hover:border-slate-200 focus:border-blue-500 outline-none py-1 bg-transparent transition-colors"
                             />
                        </div>
                        <div className="mt-2 sm:mt-0 px-3 py-1 bg-slate-100 rounded text-xs font-mono text-slate-500 whitespace-nowrap">
                            ID: {activeItem.id}
                        </div>
                    </header>

                    {activeItem.type === 'Moinho' && <MillForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(k, v)} units={units} />}
                    {activeItem.type === 'MoinhoSAG' && <SagMillForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(k, v)} units={units} />}
                    {activeItem.type === 'MoinhoRolos' && <HPGRForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(k, v)} units={units} />}
                    {activeItem.type === 'BritadorGiratorio' && <GyratoryForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(k, v)} units={units} />}
                    {activeItem.type === 'BritadorMandibula' && <JawCrusherForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(k, v)} units={units} />}
                    
                    {activeItem.type === 'Hydrocyclone' && (
                        <CycloneForm 
                            params={activeItem.parameters} 
                            onChange={(k, v) => handleParamChange(k, v)} 
                            minerals={minerals} 
                            units={units} 
                            streamState={getFeedStreamForNode(activeItem.id)} 
                            ofStream={getOutputStreamForNode(activeItem.id, 'overflow')}
                            ufStream={getOutputStreamForNode(activeItem.id, 'underflow')}
                        />
                    )}
                    
                    {activeItem.type === 'FlotationCell' && (
                        <FlotationForm 
                            params={activeItem.parameters} 
                            onChange={(k, v) => handleParamChange(k, v)} 
                            minerals={minerals} 
                            customModels={customModels}
                            units={units}
                            feedStream={getFeedStreamForNode(activeItem.id)}
                        />
                    )}
                    
                    {activeItem.type === 'Mixer' && <MixerForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(k, v)} units={units} />}
                    
                    {activeItem.type === 'Stream' && (
                        <StreamForm 
                            params={activeItem.parameters} 
                            onChange={(k, v) => handleParamChange(k, v)} 
                            minerals={minerals} 
                            units={units}
                            streamState={activeItem.streamState}
                            isFeed={activeItem.itemType === 'connection' && !activeItem.fromNode}
                            isClassicOutput={(() => {
                                const sourceNodeId = activeItem.fromNode;
                                const sourceNode = sourceNodeId ? nodes.find(n => n.id === sourceNodeId) : null;
                                return sourceNode?.parameters?.interactionMode === 'Classic';
                            })()}
                        />
                    )}
                    
                    {!['Feed', 'Moinho', 'MoinhoSAG', 'MoinhoRolos', 'BritadorGiratorio', 'BritadorMandibula', 'Hydrocyclone', 'FlotationCell', 'Mixer', 'Stream'].includes(activeItem.type) && 
                        <DefaultForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(k, v)} />
                    }
                 </div>
             </div>
         ) : (
             <div className="flex-1 flex items-center justify-center text-slate-400">
                 Selecione um item acima para editar
             </div>
         )}
      </div>

    </div>
  );
};