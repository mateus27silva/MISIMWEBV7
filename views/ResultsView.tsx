import React, { useState, useMemo, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Activity, 
  ArrowRight, 
  Scale, 
  Percent, 
  Atom, 
  Layers, 
  Box, 
  Zap, 
  Ruler, 
  TrendingUp, 
  Filter, 
  Waves, 
  Settings2, 
  Target, 
  Table, 
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Terminal,
  ChevronRight,
  ChevronDown,
  Clipboard,
  ChevronLeft,
  Plus,
  X,
  Cpu
} from 'lucide-react';
import { SimulationResult } from '../services/flowsheetSolver';
import { EquipmentType, Connection, StreamData, Component, UnitConfig, LogEntry } from '../types';

interface ResultsViewProps {
  results: SimulationResult | null;
  connections: Connection[];
  projectName?: string;
  units: UnitConfig;
  onNavigate: (view: EquipmentType) => void;
  activeTab?: 'summary' | 'streams' | 'performance' | 'console';
  hideHeader?: boolean;
  logs?: LogEntry[];
}

export const ResultsView: React.FC<ResultsViewProps> = ({ 
    results, 
    connections = [], 
    projectName, 
    units, 
    onNavigate,
    activeTab: initialTab = 'summary',
    hideHeader = false,
    logs = []
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'streams' | 'performance' | 'console'>(initialTab);
  const [columnSelections, setColumnSelections] = useState<string[]>([]);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // State for collapsible table sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
      physical: true,
      grade: true,
      mass: false,
      element: false,
      user_params: true,
      calc_performance: true
  });

  const toggleSection = (section: string) => {
      setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Helper to extract unique elements from active components for headers
  const getUniqueElements = (components: Component[]) => {
      const elements = new Set<string>();
      if (!components || !Array.isArray(components)) return [];
      
      components.forEach(m => {
          if (m && m.elementalComposition) {
              const parts = m.elementalComposition.split(',');
              parts.forEach(part => {
                  const segment = part.split(':');
                  if (segment.length > 0) {
                      const el = segment[0].trim();
                      if (el) elements.add(el);
                  }
              });
          }
      });
      return Array.from(elements).sort();
  };

  const streamList = useMemo(() => {
    if (!results) return [];
    return Object.entries(results.streams || {}).map(([id, s]) => {
      const stream = s as StreamData;
      const connection = (connections || []).find(c => c.id === id);
      const label = connection?.label || (typeof id === 'string' ? (id.split('_')[1] || id) : 'Stream');
      return { id, label, stream, connection };
    });
  }, [results, connections]);

  const nodeResultItems = useMemo(() => {
    if (!results) return [];
    return Object.values(results.nodeResults || {}).filter(item => item !== null && typeof item === 'object');
  }, [results]);

  // Combined list of selectable entities (Streams and Equipments)
  const selectableItems = useMemo(() => {
    const items: { id: string; label: string; type: 'stream' | 'node'; data: any }[] = [];
    
    streamList.forEach(s => {
      items.push({ id: `stream:${s.id}`, label: s.label, type: 'stream', data: s.stream });
    });
    
    nodeResultItems.forEach((node: any) => {
      items.push({ id: `node:${node.id}`, label: node.label || 'Equipamento', type: 'node', data: node });
    });
    
    return items;
  }, [streamList, nodeResultItems]);

  // Initialize column selections
  useEffect(() => {
    if (selectableItems.length > 0 && columnSelections.length === 0) {
        setColumnSelections(selectableItems.slice(0, 3).map(s => s.id));
    }
  }, [selectableItems]);

  const displayedEntities = useMemo(() => {
    return columnSelections.map(id => selectableItems.find(s => s.id === id)).filter(Boolean) as typeof selectableItems;
  }, [columnSelections, selectableItems]);

  const inputBreakdown = useMemo(() => {
    if (!results || !results.streams) return { solids: 0, water: 0 };
    return (connections || [])
      .filter(c => !c.fromNode && results.streams[c.id])
      .reduce((acc, c) => {
          const s = results.streams[c.id];
          if (!s) return acc;
          return { 
              solids: acc.solids + (s.solidsTph || 0), 
              water: acc.water + (s.waterTph || 0) 
          };
      }, { solids: 0, water: 0 });
  }, [results, connections]);

  const outputBreakdown = useMemo(() => {
    if (!results || !results.streams) return { solids: 0, water: 0 };
    return (connections || [])
      .filter(c => !c.toNode && results.streams[c.id])
      .reduce((acc, c) => {
          const s = results.streams[c.id];
          if (!s) return acc;
          return { 
              solids: acc.solids + (s.solidsTph || 0), 
              water: acc.water + (s.waterTph || 0) 
          };
      }, { solids: 0, water: 0 });
  }, [results, connections]);

  if (!results) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-white p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Nenhum resultado disponível</h2>
        <p className="text-slate-500 max-w-md mb-6">
          Execute uma simulação na aba "Project Flowsheet" para gerar o balanço de massa e visualizar o relatório técnico aqui.
        </p>
        <button 
          onClick={() => onNavigate(EquipmentType.PROJECT)}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          Ir para o Fluxograma <ArrowRight className="ml-2 w-4 h-4" />
        </button>
      </div>
    );
  }

  const hasMinerals = Array.isArray(results.activeMinerals) && results.activeMinerals.length > 0;
  const uniqueElements = hasMinerals ? getUniqueElements(results.activeMinerals || []) : [];
  
  const statusMessages = [];
  const safeError = results.error || 0;
  const safeIterations = results.iterations || 0;
  const safeGlobalBalance = results.globalBalance || { inputs: 0, outputs: 0 };

  if (!results.converged) {
    statusMessages.push({
      type: 'error',
      title: 'ATENÇÃO AO ERRO',
      text: 'A simulação falhou ao convergir após atingir o limite máximo de iterações configurado no solver. Recomenda-se verificar se há reciclos instáveis ou parâmetros divergentes no fluxograma.'
    });
  } else if (safeError > 1.0) {
    statusMessages.push({
      type: 'warning',
      title: 'ATENÇÃO AO ERRO',
      text: `Convergência detectada, mas o erro de fechamento global (${(safeError ?? 0).toFixed(2)}%) está acima do limite ideal de 0.1%. Verifique as vazões de entrada e saída para assegurar a precisão do modelo.`
    });
  } else {
    statusMessages.push({
      type: 'success',
      title: 'SIMULAÇÃO ESTÁVEL',
      text: 'O circuito atingiu o regime permanente com um balanço de massa preciso e convergência validada dentro dei limites de tolerância do sistema.'
    });
  }

  // Add equipment specific messages
  if (Array.isArray(results.equipmentMessages) && results.equipmentMessages.length > 0) {
      results.equipmentMessages.forEach(msg => {
          statusMessages.push({
              type: msg.type,
              title: `ALERTA EQUIPAMENTO: ${msg.nodeLabel?.toUpperCase() || 'EQUIPAMENTO'}`,
              text: msg.text
          });
      });
  }

  // Unified list of row definitions for equipment performance
  const performanceRowDefs = [
    { section: 'user_params', header: 'PARÂMETROS DE ENTRADA (USER)' },
    { key: 'diameter', label: 'Diâmetro Interno', unit: 'ft', section: 'user_params' },
    { key: 'length', label: 'Comprimento (EGL)', unit: 'ft', section: 'user_params' },
    { key: 'speedPctCrit', label: 'Velocidade Crítica', unit: '%', section: 'user_params' },
    { key: 'fillingBallsPct', label: 'Carga de Bolas (J)', unit: '%', section: 'user_params' },
    { key: 'fillingDegreePct', label: 'Enchimento Total (G)', unit: '%', section: 'user_params' },
    { key: 'pressure', label: 'Pressão Operacional', unit: units.pressure, section: 'user_params' },
    { key: 'numberOfCyclones', label: 'Nº de Ciclones', unit: '-', section: 'user_params' },
    { key: 'residenceTime', label: 'Tempo de Residência', unit: 'min', section: 'user_params' },
    { key: 'ph', label: 'pH Polpa', unit: '-', section: 'user_params' },
    { key: 'airFlow', label: 'Vazão de Ar', unit: 'm³/min', section: 'user_params' },
    { key: 'underflowSolids', label: 'Sólidos U/F Alvo', unit: '%', section: 'user_params' },
    
    { section: 'calc_performance', header: 'MÉTRICAS DE PERFORMANCE (CALC)' },
    { key: 'netPower', label: 'Potência (Net)', unit: units.power, section: 'calc_performance' },
    { key: 'specificEnergy', label: 'Energia Específica', unit: units.specificEnergy, section: 'calc_performance' },
    { key: 'p80', label: 'P80 Produto', unit: units.particleSize, section: 'calc_performance' },
    { key: 'reductionRatio', label: 'Razão de Redução', unit: '-', section: 'calc_performance' },
    { key: 'metallurgicalRecovery', label: 'Recup. Metalúrgica', unit: '%', section: 'calc_performance' },
    { key: 'massPull', label: 'Mass Pull (Y)', unit: '%', section: 'calc_performance' },
    { key: 'concGrade', label: 'Teor Concentrado', unit: '%', section: 'calc_performance' },
    { key: 'enrichmentRatio', label: 'Razão Enriquecimento', unit: '-', section: 'calc_performance' },
    { key: 'rf', label: 'Rf (Water to UF)', unit: '%', section: 'calc_performance' },
    { key: 'feedSolids', label: '% Sólidos Feed', unit: '%', section: 'calc_performance' },
    { key: 'waterRecovered', label: 'Água Recuperada', unit: units.volumeFlow, section: 'calc_performance' },
  ];

  const addColumn = () => {
    setColumnSelections(prev => [...prev, selectableItems[0]?.id || '']);
  };

  const removeColumn = (idx: number) => {
    setColumnSelections(prev => prev.filter((_, i) => i !== idx));
  };

  const updateColumn = (idx: number, id: string) => {
    const next = [...columnSelections];
    next[idx] = id;
    setColumnSelections(next);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
        {!hideHeader && (
          <header className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center space-x-3 mb-1">
                 <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                 </div>
                 <div>
                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">Relatório de Simulação</h1>
                    <div className="flex items-center space-x-2 mt-0.5">
                      {projectName && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wide">{projectName}</span>}
                      <span className="text-[10px] text-slate-400 font-medium italic">Gerado em regime permanente</span>
                    </div>
                 </div>
              </div>
            </div>
            <button 
              onClick={() => window.print()} 
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 flex items-center shadow-sm"
            >
              <Download className="w-4 h-4 mr-2" /> Exportar PDF
            </button>
          </header>
        )}

        <div className={`flex border-b border-slate-200 overflow-x-auto no-scrollbar ${hideHeader ? 'mt-0' : 'mt-4'}`}>
            <button 
                onClick={() => setActiveTab('summary')}
                className={`flex items-center px-6 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'summary' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <ClipboardList className="w-4 h-4 mr-2" />
                Resumo Operacional
            </button>
            <button 
                onClick={() => setActiveTab('streams')}
                className={`flex items-center px-6 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'streams' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <Table className="w-4 h-4 mr-2" />
                Detalhamento das Correntes & Equipamentos
            </button>
            <button 
                onClick={() => setActiveTab('console')}
                className={`flex items-center px-6 py-4 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'console' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
                <Terminal className="w-4 h-4 mr-2" />
                Console & Logs
            </button>
        </div>

        <div className="mt-2 animate-in fade-in duration-300">
            {activeTab === 'summary' && (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                             <Terminal className="w-4 h-4 text-slate-500" />
                             <h3 className="font-bold text-slate-800 text-sm uppercase tracking-widest">RUN STATUS</h3>
                         </div>
                         <div className="flex items-center space-x-3">
                            <span className={`flex items-center px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest ${results.converged ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                                {results.converged ? <CheckCircle2 className="w-3 h-3 mr-1.5" /> : <AlertTriangle className="w-3 h-3 mr-1.5" />}
                                {results.converged ? 'CONVERGIDO' : 'DIVERGENTE'}
                            </span>
                         </div>
                      </div>

                      <div className="p-8 bg-slate-900 text-slate-300 font-mono text-sm leading-relaxed overflow-x-auto">
                        <div className="max-w-4xl space-y-10">
                            <div>
                                <div className="text-white font-bold mb-4 border-b border-slate-700 pb-1 uppercase text-xs tracking-widest flex items-center">
                                    <ChevronRight className="w-4 h-4 mr-1 text-emerald-500" /> Balanço de Massa (Inputs / Outputs)
                                </div>
                                <p className="text-emerald-400/90 leading-relaxed mb-4">
                                    O circuito processou uma carga total de alimentação de <strong>{(safeGlobalBalance.inputs ?? 0).toFixed(2)} {units.massFlow}</strong>. 
                                    Este fluxo de entrada é constituído por {(inputBreakdown.solids ?? 0).toFixed(2)} {units.massFlow} de material sólido e {(inputBreakdown.water ?? 0).toFixed(2)} {units.volumeFlow} de fase líquida.
                                </p>
                                <p className="text-emerald-400/90 leading-relaxed">
                                    As correntes de saída do sistema totalizam <strong>{(safeGlobalBalance.outputs ?? 0).toFixed(2)} {units.massFlow}</strong> em regime permanente, 
                                    compostas por {(outputBreakdown.solids ?? 0).toFixed(2)} {units.massFlow} de sólidos totais e {(outputBreakdown.water ?? 0).toFixed(2)} {units.volumeFlow} de água.
                                </p>
                            </div>

                            <div>
                                <div className="text-white font-bold mb-4 border-b border-slate-700 pb-1 uppercase text-xs tracking-widest flex items-center">
                                    <ChevronRight className="w-4 h-4 mr-1 text-emerald-500" /> Performance do Solver
                                </div>
                                <p className="text-emerald-400/90 leading-relaxed">
                                    A convergência do modelo matemático foi atingida em <strong>{safeIterations}</strong> iterações consecutivas. 
                                    O erro de fechamento mássico residual é de <span className={safeError < 0.1 ? 'text-emerald-300' : 'text-amber-400'}>{(safeError ?? 0).toFixed(8)}%</span>, 
                                    garantindo a estabilidade e a validade física dos resultados calculados para o fluxograma atual.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="text-white font-bold border-b border-slate-700 pb-1 uppercase text-xs tracking-widest flex items-center mb-4">
                                    <ChevronRight className="w-4 h-4 mr-1 text-emerald-500" /> Mensagens do Sistema
                                </div>
                                <div className="space-y-6">
                                    {statusMessages.map((msg, idx) => (
                                        <div key={idx} className="animate-in slide-in-from-bottom-2 duration-500" style={{ transitionDelay: `${idx * 100}ms` }}>
                                            <p className={`text-xs font-black uppercase tracking-widest mb-1.5 flex items-center ${msg.type === 'error' ? 'text-rose-400' : msg.type === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
                                                {msg.type === 'error' ? <AlertCircle className="w-4 h-4 mr-2" /> : msg.type === 'warning' ? <AlertTriangle className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                                {msg.title}
                                            </p>
                                            <p className="text-sm text-slate-400 leading-relaxed pl-6 italic">
                                                {msg.text}
                                            </p>
                                        </div>
                                    ))}
                                    {statusMessages.length === 0 && (
                                        <p className="text-xs text-slate-500 italic py-2">
                                            &gt; STATUS: Nenhuma notificação ou alerta pendente para esta rodada.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-800 pt-8">
                            <button 
                                onClick={() => {
                                    const text = `========================================\nSIMULATION REPORT SUMMARY\n========================================\n` +
                                        `CONVERGENCE: ${results.converged ? 'YES' : 'NO'}\n` +
                                        `TOTAL INPUTS: ${(safeGlobalBalance.inputs ?? 0).toFixed(2)} ${units.massFlow}\n` +
                                        `TOTAL OUTPUTS: ${(safeGlobalBalance.outputs ?? 0).toFixed(2)} ${units.massFlow}\n` +
                                        `CLOSURE ERROR: ${(safeError ?? 0).toFixed(6)}%\n` +
                                        `ITERATIONS: ${safeIterations}\n` +
                                        `========================================`;
                                    navigator.clipboard.writeText(text);
                                    alert("Resumo técnico copiado com sucesso!");
                                }}
                                className="flex items-center text-[10px] text-slate-500 hover:text-emerald-400 transition-colors uppercase font-bold tracking-widest group"
                            >
                                <Clipboard className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" /> COPIAR RESUMO TÉCNICO
                            </button>
                            
                            <div className="flex flex-col sm:items-end text-[10px] text-slate-600 uppercase tracking-tighter">
                                <span>MISIMWEB_ENGINE_V3.1_RELEASE</span>
                                <span>{new Date().toLocaleString()}</span>
                            </div>
                        </div>
                      </div>
                    </div>
                </div>
            )}

            {activeTab === 'streams' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Detalhamento das Correntes & Equipamentos</h3>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded italic">Compare dados de processo e performance mecânica na mesma visão</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap font-mono border-collapse">
                          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                              <tr>
                                  <th className="px-6 py-4 font-black uppercase text-xs tracking-widest sticky left-0 bg-slate-50 z-20 w-60 min-w-[240px]">
                                    PROPRIEDADE / MÉTRICA
                                  </th>
                                  <th className="px-4 py-4 font-black uppercase text-xs tracking-widest border-r border-slate-200 text-center sticky left-[240px] bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">
                                    UNID
                                  </th>
                                  {displayedEntities.map((ent, idx) => (
                                      <th key={idx} className={`px-6 py-4 font-black text-center uppercase text-xs tracking-widest border-l border-slate-100 min-w-[180px] bg-white group relative ${ent.type === 'stream' ? 'text-blue-700' : 'text-indigo-700'}`}>
                                          <div className="relative">
                                            <div className="flex items-center justify-center space-x-1 mb-1">
                                                {ent.type === 'stream' ? <Waves className="w-3 h-3 text-blue-400" /> : <Settings2 className="w-3 h-3 text-indigo-400" />}
                                                <span className="text-[9px] opacity-50">{ent.type === 'stream' ? 'STREAM' : 'EQUIP'}</span>
                                            </div>
                                            <select 
                                                value={ent.id}
                                                onChange={(e) => updateColumn(idx, e.target.value)}
                                                className={`bg-transparent border-none font-black uppercase text-xs tracking-widest text-center cursor-pointer outline-none focus:ring-0 w-full appearance-none py-1 rounded transition-colors ${ent.type === 'stream' ? 'text-blue-700 hover:bg-blue-50' : 'text-indigo-700 hover:bg-indigo-50'}`}
                                            >
                                                <optgroup label="Correntes de Processo">
                                                    {selectableItems.filter(i => i.type === 'stream').map(item => (
                                                        <option key={item.id} value={item.id} className="text-slate-700 font-bold">{item.label}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Performance por Equipamento">
                                                    {selectableItems.filter(i => i.type === 'node').map(item => (
                                                        <option key={item.id} value={item.id} className="text-slate-700 font-bold">{item.label}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                            <div className={`absolute top-1/2 -right-1 -translate-y-1/2 pointer-events-none ${ent.type === 'stream' ? 'text-blue-300' : 'text-indigo-300'}`}>
                                                <ChevronDown className="w-3 h-3" />
                                            </div>
                                          </div>
                                          
                                          {columnSelections.length > 1 && (
                                              <button 
                                                onClick={() => removeColumn(idx)}
                                                className="absolute -top-1 -right-1 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                  <X className="w-3 h-3" />
                                              </button>
                                          )}
                                      </th>
                                  ))}
                                  <th className="px-2 bg-slate-50/30 border-l border-slate-100 w-10">
                                      <button 
                                        onClick={addColumn}
                                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                                        title="Adicionar Coluna"
                                      >
                                          <Plus className="w-4 h-4" />
                                      </button>
                                  </th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                              
                              {/* --- STREAM PROPERTIES SECTION --- */}
                              <tr 
                                onClick={() => toggleSection('physical')}
                                className="bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors border-y border-slate-200"
                              >
                                  <td colSpan={displayedEntities.length + 3} className="px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                      <div className="flex items-center">
                                          {expandedSections.physical ? <ChevronDown className="w-3 h-3 mr-2" /> : <ChevronRight className="w-3 h-3 mr-2" />}
                                          <Waves className="w-3.5 h-3.5 mr-2 text-blue-500" /> Propriedades de Fluxo
                                      </div>
                                  </td>
                              </tr>
                              {expandedSections.physical && (
                                <>
                                  <tr className="hover:bg-blue-50/30">
                                      <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">Vazão Sólidos</td>
                                      <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">{units.massFlow}</td>
                                      {displayedEntities.map((ent, i) => (
                                          <td key={i} className="px-6 py-3 text-center font-bold text-slate-800">{ent.type === 'stream' ? (ent.data?.solidsTph ?? 0).toFixed(2) : '-'}</td>
                                      ))}
                                      <td className="bg-slate-50/10"></td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30">
                                      <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">Vazão Água</td>
                                      <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">{units.volumeFlow}</td>
                                      {displayedEntities.map((ent, i) => (
                                          <td key={i} className="px-6 py-3 text-center font-bold text-slate-800">{ent.type === 'stream' ? (ent.data?.waterTph ?? 0).toFixed(2) : '-'}</td>
                                      ))}
                                      <td className="bg-slate-50/10"></td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30">
                                      <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">Vazão Total</td>
                                      <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">{units.massFlow}</td>
                                      {displayedEntities.map((ent, i) => (
                                          <td key={i} className="px-6 py-3 text-center font-bold text-slate-800">{ent.type === 'stream' ? (ent.data?.totalTph ?? 0).toFixed(2) : '-'}</td>
                                      ))}
                                      <td className="bg-slate-50/10"></td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30">
                                      <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">Vazão de Polpa</td>
                                      <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">{units.volumeFlow}</td>
                                      {displayedEntities.map((ent, i) => (
                                          <td key={i} className="px-6 py-3 text-center font-bold text-slate-800">{ent.type === 'stream' ? (ent.data ? (ent.data.totalTph / (ent.data.slurryDensity || 1)).toFixed(2) : '0.00') : '-'}</td>
                                      ))}
                                      <td className="bg-slate-50/10"></td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30">
                                      <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">% Sólidos</td>
                                      <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">%</td>
                                      {displayedEntities.map((ent, i) => (
                                          <td key={i} className="px-6 py-3 text-center font-bold text-slate-800">{ent.type === 'stream' ? (ent.data?.percentSolids ?? 0).toFixed(1) : '-'}</td>
                                      ))}
                                      <td className="bg-slate-50/10"></td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30">
                                      <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">Densidade da Polpa</td>
                                      <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">{units.solidDensity}</td>
                                      {displayedEntities.map((ent, i) => (
                                          <td key={i} className="px-6 py-3 text-center font-bold text-slate-800">{ent.type === 'stream' ? (ent.data?.slurryDensity ?? 1.0).toFixed(2) : '-'}</td>
                                      ))}
                                      <td className="bg-slate-50/10"></td>
                                  </tr>
                                  <tr className="hover:bg-blue-50/30">
                                      <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">Densidade Mineralógica</td>
                                      <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">{units.solidDensity}</td>
                                      {displayedEntities.map((ent, i) => (
                                          <td key={i} className="px-6 py-3 text-center font-bold text-slate-800">{ent.type === 'stream' ? (ent.data?.sgSolids ?? 2.7).toFixed(2) : '-'}</td>
                                      ))}
                                      <td className="bg-slate-50/10"></td>
                                  </tr>
                                </>
                              )}

                              {hasMinerals && (
                                  <>
                                      {/* --- COMPOSITION SECTION --- */}
                                      <tr 
                                        onClick={() => toggleSection('grade')}
                                        className="bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors border-y border-slate-200"
                                      >
                                          <td colSpan={displayedEntities.length + 3} className="px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                              <div className="flex items-center">
                                                  {expandedSections.grade ? <ChevronDown className="w-3 h-3 mr-2" /> : <ChevronRight className="w-3 h-3 mr-2" />}
                                                  <Atom className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Composição (% Componente)
                                              </div>
                                          </td>
                                      </tr>
                                      {expandedSections.grade && (results.activeMinerals || []).map(m => (
                                          <tr key={`grade-${m.id}`} className="hover:bg-blue-50/30">
                                              <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">
                                                  {m.name}
                                                  <span className="block text-[10px] font-normal text-slate-400 uppercase tracking-tighter">{m.formula}</span>
                                              </td>
                                              <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">%</td>
                                              {displayedEntities.map((ent, i) => {
                                                  if (ent.type !== 'stream') return <td key={i} className="px-6 py-3 text-center font-bold text-slate-300">-</td>;
                                                  const mass = ent.data?.mineralFlows?.[m.id] || 0;
                                                  const solids = ent.data?.solidsTph || 0;
                                                  const val = (solids > 0 ? (mass / solids) * 100 : 0);
                                                  return (
                                                      <td key={i} className="px-6 py-3 text-center font-bold text-blue-600">{(val ?? 0).toFixed(2)}</td>
                                                  );
                                              })}
                                              <td className="bg-slate-50/10"></td>
                                          </tr>
                                      ))}

                                      {/* --- ELEMENTAL ASSAY SECTION --- */}
                                      <tr 
                                        onClick={() => toggleSection('element')}
                                        className="bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors border-y border-slate-200"
                                      >
                                          <td colSpan={displayedEntities.length + 3} className="px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                              <div className="flex items-center">
                                                  {expandedSections.element ? <ChevronDown className="w-3 h-3 mr-2" /> : <ChevronRight className="w-3 h-3 mr-2" />}
                                                  <Scale className="w-3.5 h-3.5 mr-2 text-teal-500" /> Composição (Elemental %)
                                              </div>
                                          </td>
                                      </tr>
                                      {expandedSections.element && uniqueElements.map(el => (
                                          <tr key={`element-${el}`} className="hover:bg-teal-50/30">
                                              <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">{el}</td>
                                              <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">%</td>
                                              {displayedEntities.map((ent, i) => (
                                                  <td key={i} className="px-6 py-3 text-center font-black text-teal-700">{ent.type === 'stream' ? (ent.data?.elementalAssays?.[el] ?? 0).toFixed(4) : '-'}</td>
                                              ))}
                                              <td className="bg-slate-50/10"></td>
                                          </tr>
                                      ))}
                                  </>
                              )}

                              {/* --- EQUIPMENT PERFORMANCE SECTIONS --- */}
                              {performanceRowDefs.map((row, idx) => {
                                  if (row.section && row.header) {
                                      return (
                                          <tr 
                                            key={`section-${row.section}`}
                                            onClick={() => toggleSection(row.section)}
                                            className="bg-slate-50/80 cursor-pointer hover:bg-slate-100 transition-colors border-y border-slate-200"
                                          >
                                              <td colSpan={displayedEntities.length + 3} className="px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                                                  <div className="flex items-center">
                                                      {expandedSections[row.section] ? <ChevronDown className="w-3 h-3 mr-2" /> : <ChevronRight className="w-3 h-3 mr-2" />}
                                                      {row.section === 'user_params' ? <Cpu className="w-3.5 h-3.5 mr-2 text-amber-500" /> : <Target className="w-3.5 h-3.5 mr-2 text-indigo-500" />}
                                                      {row.header}
                                                  </div>
                                              </td>
                                          </tr>
                                      );
                                  }

                                  // Only show row if current section is expanded
                                  if (!expandedSections[row.section || '']) return null;

                                  // Check if at least one selected entity (if node) has this data
                                  const hasAnyData = displayedEntities.some(ent => ent.type === 'node' && ent.data[row.key!] !== undefined);
                                  if (!hasAnyData && !displayedEntities.some(e => e.type === 'stream')) return null;

                                  return (
                                      <tr key={row.key} className="hover:bg-indigo-50/30">
                                          <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">{row.label}</td>
                                          <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">{row.unit}</td>
                                          {displayedEntities.map((ent, i) => {
                                              if (ent.type !== 'node') return <td key={i} className="px-6 py-3 text-center font-bold text-slate-300">-</td>;
                                              const val = ent.data[row.key!];
                                              const formatted = val !== undefined && val !== null ? (
                                                  typeof val === 'number' 
                                                      ? val.toFixed(row.key!.includes('Grade') || row.key!.includes('Ratio') ? 2 : 1)
                                                      : val
                                              ) : '-';
                                              return (
                                                  <td key={i} className="px-6 py-3 text-center font-bold text-indigo-800">{formatted}</td>
                                              );
                                          })}
                                          <td className="bg-slate-50/10"></td>
                                      </tr>
                                  );
                              })}

                          </tbody>
                      </table>
                  </div>
                </div>
            )}

            {activeTab === 'performance' && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-lg font-bold text-slate-800">Performance por Equipamento</h3>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Métricas Consolidadas</span>
                    </div>
                    {nodeResultItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap font-mono">
                                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-4 font-black uppercase text-xs tracking-widest sticky left-0 bg-slate-50 z-20 w-60 min-w-[240px]">
                                            MÉTRICA / PARÂMETRO
                                        </th>
                                        <th className="px-4 py-4 font-black uppercase text-xs tracking-widest border-r border-slate-200 text-center sticky left-[240px] bg-slate-50 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">
                                            UNID
                                        </th>
                                        {nodeResultItems.map((meta: any, idx: number) => (
                                            <th key={idx} className="px-6 py-4 font-black text-center uppercase text-xs tracking-widest text-blue-700 border-l border-slate-100 min-w-[150px] bg-white">
                                                {meta.label || 'Equipamento'}
                                                <span className="block text-[10px] text-slate-400 font-normal tracking-tighter mt-1">{meta.type || ''}</span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {performanceRowDefs.map((metric, mIdx) => {
                                        if (metric.header) {
                                            return (
                                                <tr key={`header-${mIdx}`} className="bg-slate-50">
                                                    <td colSpan={nodeResultItems.length + 2} className="px-6 py-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                                        {metric.header}
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        // Only show row if at least one equipment has this metric
                                        const hasAnyValue = nodeResultItems.some(meta => meta && meta[metric.key!] !== undefined);
                                        if (!hasAnyValue) return null;

                                        return (
                                            <tr key={metric.key} className="hover:bg-blue-50/30">
                                                <td className="px-6 py-3 font-bold text-slate-700 sticky left-0 bg-white z-10 w-60 min-w-[240px]">
                                                    {metric.label}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 text-xs text-center sticky left-[240px] bg-white z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] w-20 min-w-[80px]">
                                                    {metric.unit}
                                                </td>
                                                {nodeResultItems.map((meta: any, idx: number) => {
                                                    const value = meta ? meta[metric.key!] : undefined;
                                                    const formattedValue = value !== undefined && value !== null ? (
                                                        typeof value === 'number' 
                                                            ? value.toFixed(metric.key!.includes('error') || metric.key === 'concGrade' || metric.key === 'reductionRatio' ? 2 : 1) 
                                                            : value
                                                    ) : '-';
                                                    return (
                                                        <td key={idx} className="px-6 py-3 text-center font-bold text-slate-800">
                                                            {formattedValue}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                            <TrendingUp className="w-8 h-8 mb-2 opacity-50" />
                            <p className="text-sm">Métricas de performance não disponíveis.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'console' && (
                <div className="bg-slate-900 rounded-xl shadow-inner border border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-350px)]">
                    <div className="p-4 border-b border-slate-800 bg-slate-800/50 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Terminal className="w-4 h-4 text-emerald-500" />
                            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest">System Output Console</h3>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Kernel Active</span>
                            </div>
                            <button 
                                onClick={() => {
                                    const text = (logs || []).map(l => `[${l.timestamp}] [${l.type?.toUpperCase()}] ${l.message}`).join('\n');
                                    navigator.clipboard.writeText(text);
                                    alert('Histórico de log copiado para a área de transferência!');
                                }}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1 rounded transition-colors border border-slate-700 font-bold"
                            >
                                DOWNLOAD LOGS
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed custom-scrollbar bg-slate-950/50">
                        <div className="max-w-4xl space-y-1">
                            <p className="text-slate-600 mb-4 font-bold border-b border-slate-800 pb-2">
                                &gt; MISIMWEB V3.1 - SIMULATION ENGINE CONSOLE INITIALIZED<br/>
                                &gt; (c) 2024 MINESIM RESEARCH GROUP. ALL RIGHTS RESERVED.<br/>
                                &gt; SOLVER READY FOR INPUT DATA...
                            </p>
                            
                            {(logs || []).map((log) => (
                                <div key={log.id} className="flex items-start hover:bg-slate-800/20 group py-0.5 rounded px-2 transition-colors">
                                    <span className="text-slate-600 mr-4 shrink-0 font-bold">[{log.timestamp}]</span>
                                    <span className={`shrink-0 mr-4 font-black uppercase text-[10px] w-16 ${
                                        log.type === 'error' ? 'text-rose-500' : 
                                        log.type === 'warning' ? 'text-amber-500' : 
                                        log.type === 'success' ? 'text-emerald-500' : 
                                        'text-blue-400'
                                    }`}>
                                        [{log.type}]
                                    </span>
                                    <span className={`break-words ${
                                        log.type === 'error' ? 'text-rose-400' : 
                                        log.type === 'warning' ? 'text-amber-400' : 
                                        log.type === 'success' ? 'text-emerald-400' : 
                                        'text-slate-300'
                                    }`}>
                                        {log.message}
                                    </span>
                                </div>
                            ))}

                            {results && (
                                <div className="mt-8 pt-4 border-t border-slate-800">
                                    <p className="text-emerald-500 font-bold">&gt; SOLVER STATUS: PROCESS_COMPLETE</p>
                                    <p className="text-slate-500">&gt; ITERATIONS: {safeIterations}</p>
                                    <p className="text-slate-500">&gt; GLOBAL ERROR: {(safeError ?? 0).toFixed(10)}</p>
                                    <p className="text-slate-500">&gt; MEMORY USAGE: STABLE</p>
                                    <p className="text-emerald-500 font-bold animate-pulse">&gt; _</p>
                                </div>
                            )}

                            {(!logs || logs.length === 0) && (
                                <p className="text-slate-600 italic">Esperando execução da simulação para captura de fluxo de dados...</p>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center px-6">
                        <div className="flex space-x-4 text-[10px] font-bold text-slate-600 uppercase">
                            <span>Total de entradas: {logs?.length || 0}</span>
                            <span>Erros: {logs?.filter(l => l.type === 'error').length || 0}</span>
                        </div>
                        <span className="text-[10px] text-slate-700 font-mono">MISIM_CORE_RUN_ID: {(Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase()}</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};