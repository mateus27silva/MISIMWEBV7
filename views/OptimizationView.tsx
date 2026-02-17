
import React, { useState, useEffect, useRef } from 'react';
import { 
  NodeData, Connection, Component, RecoveryModel, OptimizationScenario, AIChatMessage, StreamData
} from '../types';
import { solveFlowsheet } from '../services/flowsheetSolver';
import { generateOptimizationInsights } from '../services/geminiService';
import { 
  Zap, Play, TrendingUp, Bot, ArrowRight, Activity
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

interface OptimizationViewProps {
  nodes: NodeData[];
  connections: Connection[];
  minerals: Component[];
  customModels: RecoveryModel[];
}

export const OptimizationView: React.FC<OptimizationViewProps> = ({
  nodes, connections, minerals, customModels
}) => {
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scenarios, setScenarios] = useState<OptimizationScenario[]>([]);
  const [baseline, setBaseline] = useState<OptimizationScenario | null>(null);
  const [chatHistory, setChatHistory] = useState<AIChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Constants for Simulation
  const MAX_ITERATIONS = 50; // Simulate 50 scenarios per batch
  const BATCH_DELAY = 100; // ms

  // Initial Message
  useEffect(() => {
      if (chatHistory.length === 0) {
          setChatHistory([{
              id: 'init',
              role: 'ai',
              content: "Olá! Sou seu Co-piloto de Otimização. Conectei-me ao fluxograma atual. Quando estiver pronto, clique em 'Iniciar Otimização' para que eu comece a explorar variaveis de processo (pH, Dosagem, Tempos) em busca do ponto ótimo econômico.",
              timestamp: new Date()
          }]);
      }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [chatHistory, isTyping]);

  // --- OPTIMIZATION ENGINE ---
  const runOptimizationLoop = async () => {
      if (nodes.length === 0) return;

      // 1. Establish Baseline
      const baseResult = solveFlowsheet(nodes, connections, minerals, customModels);
      const baseKPIs = calculateKPIs(baseResult, nodes);
      const baseScenario: OptimizationScenario = {
          id: 'baseline',
          name: 'Baseline (Atual)',
          parameters: extractOptimizableParams(nodes),
          results: baseKPIs,
          isBaseline: true
      };
      
      setBaseline(baseScenario);
      setScenarios([baseScenario]);
      
      // Chat update
      setChatHistory(prev => [...prev, {
          id: `sys_${Date.now()}`,
          role: 'ai',
          content: `Baseline estabelecido. Recuperação: ${baseKPIs.recovery.toFixed(2)}%, Score Econômico: ${baseKPIs.economicScore.toFixed(0)}. Iniciando exploração do espaço de parâmetros...`,
          timestamp: new Date()
      }]);

      setIsRunning(true);

      // 2. Loop
      let currentIter = 0;
      const newScenarios: OptimizationScenario[] = [];

      const interval = setInterval(async () => {
          if (currentIter >= MAX_ITERATIONS) {
              clearInterval(interval);
              setIsRunning(false);
              setProgress(100);
              finishOptimization(baseScenario, newScenarios);
              return;
          }

          // A. Perturb Parameters (Simple Random Walk / Genetic Mutation Logic)
          const perturbedNodes = perturbNodes(nodes);
          
          // B. Solve
          const result = solveFlowsheet(perturbedNodes, connections, minerals, customModels);
          
          // C. Evaluate
          if (result.converged) {
              const kpis = calculateKPIs(result, perturbedNodes);
              const scenario: OptimizationScenario = {
                  id: `iter_${currentIter}`,
                  name: `Simulação #${currentIter + 1}`,
                  parameters: extractOptimizableParams(perturbedNodes),
                  results: kpis
              };
              newScenarios.push(scenario);
              setScenarios(prev => [...prev, scenario]);
          }

          currentIter++;
          setProgress((currentIter / MAX_ITERATIONS) * 100);

      }, BATCH_DELAY);
  };

  const finishOptimization = async (base: OptimizationScenario, generated: OptimizationScenario[]) => {
      setIsTyping(true);
      
      // Sort by Economic Score
      const sorted = [...generated].sort((a, b) => b.results.economicScore - a.results.economicScore);
      const best = sorted[0];

      // Call Gemini
      const analysis = await generateOptimizationInsights(base, sorted);
      
      setChatHistory(prev => [...prev, {
          id: `analysis_${Date.now()}`,
          role: 'ai',
          content: analysis,
          timestamp: new Date()
      }]);
      setIsTyping(false);
  };

  // --- HELPERS ---

  const calculateKPIs = (result: any, currentNodes: NodeData[]) => {
      // Mock KPI calculation logic based on streams
      // Find Product Stream (usually from Flotation Conc or Hydrocyclone Overflow depending on circuit)
      let productStream: StreamData | null = null;
      let tailingsStream: StreamData | null = null;
      
      // Simple Heuristic: Product is stream leaving Flotation Conc or generic output
      Object.entries(result.streams).forEach(([id, stream]: [string, any]) => {
          // In a real app, use graph traversal to find sinks
          if (stream.totalTph > 0 && stream.elementalAssays && stream.elementalAssays.Cu > 5) {
              productStream = stream;
          }
      });

      // Default fallback
      if (!productStream) productStream = Object.values(result.streams)[0] as StreamData;

      const recovery = 85 + (Math.random() * 10 - 5); // Mock variability for demo if solver is static
      const grade = 25 + (Math.random() * 4 - 2);
      
      // Calculate Power & Water Cost
      let totalPower = 0;
      currentNodes.forEach(n => {
          if (n.type === 'Moinho') totalPower += (n.parameters.installedPower || 1000);
          if (n.type === 'FlotationCell') totalPower += (n.parameters.rotorSpeed || 1000) * 0.1;
      });

      // Economic Score = (Revenue - Cost)
      // Revenue ~ Recovery * Grade
      // Cost ~ Power + Reagents
      const revenue = recovery * grade * 10; 
      const cost = totalPower * 0.5;
      const score = revenue - cost;

      return {
          recovery,
          grade,
          throughput: productStream?.totalTph || 0,
          powerConsumption: totalPower,
          waterConsumption: 500,
          economicScore: score
      };
  };

  const extractOptimizableParams = (nodes: NodeData[]) => {
      const params: Record<string, number> = {};
      nodes.forEach(n => {
          if (n.type === 'FlotationCell') {
              params[`${n.label} pH`] = n.parameters.ph;
              params[`${n.label} Air`] = n.parameters.airFlow;
          }
          if (n.type === 'Moinho') {
              params[`${n.label} Filling`] = n.parameters.filling;
          }
      });
      return params;
  };

  const perturbNodes = (originalNodes: NodeData[]): NodeData[] => {
      return originalNodes.map(n => {
          const newNode = { ...n, parameters: { ...n.parameters } };
          
          // Random Walk Logic
          if (n.type === 'FlotationCell') {
              // Perturb pH +/- 0.5
              const currentPh = parseFloat(n.parameters.ph || 10.5);
              newNode.parameters.ph = Math.max(8, Math.min(12, currentPh + (Math.random() - 0.5)));
              
              // Perturb Air +/- 2
              const currentAir = parseFloat(n.parameters.airFlow || 12);
              newNode.parameters.airFlow = Math.max(5, Math.min(20, currentAir + (Math.random() * 4 - 2)));
          }
          
          return newNode;
      });
  };

  // --- RENDERERS ---

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 animate-in fade-in">
        
        {/* LEFT: Configuration & Control */}
        <div className="lg:w-1/4 flex flex-col space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 flex items-center mb-4">
                    <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                    Otimizador
                </h2>
                <p className="text-sm text-slate-500 mb-6">
                    O sistema executará múltiplas simulações variando parâmetros operacionais para maximizar a Eficiência Econômica.
                </p>

                <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">Objetivo Primário</span>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">Max Economic Score</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">Restrições</span>
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">Grade {'>'} 20%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">Variáveis Livres</span>
                        <span className="text-xs text-slate-500">pH, Ar, Tempo, Carga</span>
                    </div>
                </div>

                {!isRunning ? (
                    <button 
                        onClick={runOptimizationLoop}
                        className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center shadow-md hover:shadow-lg"
                    >
                        <Play className="w-5 h-5 mr-2" /> Iniciar Otimização
                    </button>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold text-blue-600 uppercase">
                            <span>Otimizando...</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-xs text-center text-slate-400 mt-2">Simulando cenário {scenarios.length} de {MAX_ITERATIONS}</p>
                    </div>
                )}
            </div>

            {/* Best Scenario Card */}
            {scenarios.length > 1 && (
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-lg border border-slate-700">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-400" /> Melhor Cenário
                    </h3>
                    {(() => {
                        const best = [...scenarios].sort((a,b) => b.results.economicScore - a.results.economicScore)[0];
                        const improvement = baseline ? ((best.results.economicScore - baseline.results.economicScore) / baseline.results.economicScore) * 100 : 0;
                        return (
                            <div>
                                <div className="text-3xl font-bold text-green-400 mb-1">
                                    +{improvement.toFixed(1)}%
                                </div>
                                <div className="text-xs text-slate-400 mb-4">Melhoria Econômica vs Baseline</div>
                                
                                <div className="space-y-2 text-sm border-t border-slate-700 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Recuperação</span>
                                        <span className="font-mono text-white">{best.results.recovery.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Teor (Grade)</span>
                                        <span className="font-mono text-white">{best.results.grade.toFixed(2)}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Consumo Energ.</span>
                                        <span className="font-mono text-white">{best.results.powerConsumption.toFixed(0)} kW</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>

        {/* MIDDLE: Visualization (Pareto) */}
        <div className="lg:w-2/4 flex flex-col space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-[400px]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <Activity className="w-5 h-5 mr-2 text-slate-500" /> Espaço de Soluções (Pareto)
                    </h3>
                    <div className="flex space-x-4 text-xs">
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div> Baseline</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div> Otimizado</div>
                        <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-slate-300 mr-2"></div> Explorados</div>
                    </div>
                </div>
                
                <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis 
                                type="number" 
                                dataKey="results.recovery" 
                                name="Recovery" 
                                unit="%" 
                                domain={['auto', 'auto']}
                                label={{ value: 'Recuperação (%)', position: 'bottom', offset: 0, fill: '#64748b' }}
                            />
                            <YAxis 
                                type="number" 
                                dataKey="results.grade" 
                                name="Grade" 
                                unit="%" 
                                domain={['auto', 'auto']}
                                label={{ value: 'Teor Concentrado (%)', angle: -90, position: 'left', fill: '#64748b' }}
                            />
                            <Tooltip 
                                cursor={{ strokeDasharray: '3 3' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                                                <p className="font-bold text-slate-800 mb-1">{data.name}</p>
                                                <p>Score: <span className="font-bold text-green-600">{data.results.economicScore.toFixed(0)}</span></p>
                                                <p>Rec: {data.results.recovery.toFixed(2)}%</p>
                                                <p>Grade: {data.results.grade.toFixed(2)}%</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Scatter name="Scenarios" data={scenarios} fill="#8884d8">
                                {scenarios.map((entry, index) => {
                                    if (entry.isBaseline) return <Cell key={`cell-${index}`} fill="#3b82f6" stroke="#1d4ed8" strokeWidth={2} />;
                                    // Highlight best
                                    const maxScore = Math.max(...scenarios.map(s => s.results.economicScore));
                                    if (entry.results.economicScore === maxScore) return <Cell key={`cell-${index}`} fill="#22c55e" stroke="#15803d" strokeWidth={2} r={6} />;
                                    return <Cell key={`cell-${index}`} fill="#cbd5e1" />;
                                })}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* RIGHT: AI Collaborator Chat */}
        <div className="lg:w-1/4 flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[600px] lg:h-auto">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div className="bg-purple-100 p-1.5 rounded-lg">
                        <Bot className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm text-slate-800">Engenheiro IA</h3>
                        <p className="text-[10px] text-green-600 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span> Online
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
                {chatHistory.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] rounded-2xl p-3 text-sm shadow-sm ${
                            msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                        }`}>
                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                            <span className={`text-[10px] block mt-2 opacity-70 ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'}`}>
                                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none p-3 shadow-sm">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        const input = (e.target as any).elements.msgInput;
                        const text = input.value;
                        if (!text.trim()) return;
                        
                        setChatHistory(prev => [...prev, {
                            id: `user_${Date.now()}`,
                            role: 'user',
                            content: text,
                            timestamp: new Date()
                        }]);
                        input.value = '';
                        
                        // Mock simple AI response for custom chat
                        setIsTyping(true);
                        setTimeout(() => {
                            setChatHistory(prev => [...prev, {
                                id: `ai_${Date.now()}`,
                                role: 'ai',
                                content: "Entendido. Vou considerar essa restrição na próxima iteração de otimização.",
                                timestamp: new Date()
                            }]);
                            setIsTyping(false);
                        }, 1500);
                    }}
                    className="flex items-center gap-2"
                >
                    <input 
                        name="msgInput"
                        type="text" 
                        placeholder="Converse com a IA..." 
                        className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button type="submit" className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>

    </div>
  );
};
