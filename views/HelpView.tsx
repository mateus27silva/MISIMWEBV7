import React, { useState } from 'react';
// Added Droplets to the import list below to fix the "Cannot find name 'Droplets'" error on line 199
import { 
  BookOpen, 
  Cpu, 
  Activity, 
  Layers, 
  Filter, 
  Settings2, 
  ChevronRight, 
  Calculator, 
  Info, 
  Sigma, 
  MousePointer2, 
  PlayCircle, 
  FileText, 
  Zap, 
  Target, 
  Waves, 
  BarChart3, 
  Search, 
  Database, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Droplets
} from 'lucide-react';

export const HelpView: React.FC = () => {
  const [activeTopic, setActiveTopic] = useState('how-to');

  const topics = [
    { id: 'how-to', label: 'Como Utilizar (Tutorial)', icon: MousePointer2 },
    { id: 'philosophy', label: 'Filosofia da Simulação', icon: BookOpen },
    { id: 'solver', label: 'Motor de Cálculo (Solver)', icon: Cpu },
    { id: 'streams', label: 'Propriedades das Correntes', icon: Activity },
    { id: 'comminution', label: 'Moagem (Lei de Bond)', icon: Settings2 },
    { id: 'classification', label: 'Classificação (Plitt)', icon: Filter },
    { id: 'flotation', label: 'Flotação (Modelo Cinético)', icon: Layers },
  ];

  const renderContent = () => {
    switch (activeTopic) {
      case 'how-to':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Guia de Utilização</h2>
              <p className="text-slate-500 mt-2">Passo a passo detalhado para configurar e simular seu circuito mineralógico.</p>
            </header>

            <div className="space-y-12">
              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-200">1</div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">Montagem do Fluxograma</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Acesse a aba <strong>Project Flowsheet</strong>. No painel inferior (expandível), selecione o grupo de equipamentos e arraste os ícones para o canvas. 
                  </p>
                  <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
                    <li>Clique com o botão direito para <strong>rotacionar</strong> ou ver o <strong>Data Sheet</strong> técnico.</li>
                    <li>Utilize o mouse para selecionar múltiplos itens e movê-los em bloco.</li>
                    <li>O scroll do mouse ou os botões laterais controlam o <strong>Zoom</strong>.</li>
                  </ul>
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start space-x-3">
                    <Waves className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Use a ferramenta de <strong>Correntes (Streams)</strong> para conectar as saídas de um equipamento às entradas de outro. Clique e arraste de uma porta (seta azul/vermelha) até o destino. Você pode criar <strong>pontos de rota (waypoints)</strong> clicando na linha selecionada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-purple-200">2</div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">Parametrização Operacional</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Configure as vazões e mineralogia na <strong>Alimentação (Feed)</strong>. Alimentações são correntes que não possuem origem em outro equipamento.
                  </p>
                  <ul className="text-sm text-slate-500 space-y-2 list-disc pl-5">
                    <li>Clique duas vezes em um equipamento ou corrente para abrir as <strong>Propriedades</strong>.</li>
                    <li>No menu <strong>Componentes</strong>, selecione quais minerais e reagentes farão parte do balanço.</li>
                    <li>Configure as <strong>Unidades de Medida</strong> globais para que o simulador converta automaticamente os valores de entrada.</li>
                  </ul>
                  <p className="text-xs text-slate-400 italic">Dica: O sistema aceita o ponto (.) ou vírgula (,) como separador decimal, normalizando automaticamente para cálculo.</p>
                </div>
              </div>

              <div className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-orange-200">3</div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-800">Execução e IA</h3>
                  <p className="text-slate-600 leading-relaxed">
                    Clique no botão <strong>Play</strong> para iniciar o solver iterativo. O sistema percorrerá todos os reciclos até atingir a convergência mássica.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Relatórios</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Acesse a aba de <strong>Resultados</strong> para visualizar o balanço consolidado e performance por equipamento.</p>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-700 uppercase mb-2 flex items-center">
                            <Zap className="w-3 h-3 mr-1" /> Otimização IA
                        </h4>
                        <p className="text-[11px] text-indigo-600 leading-relaxed">Ative o módulo de otimização para que o <strong>Google Gemini</strong> analise seus resultados e sugira novos setpoints operacionais.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'philosophy':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Filosofia da Simulação</h2>
              <p className="text-slate-500 mt-2">Fundamentos de regime permanente e modelagem fenomenológica.</p>
            </header>
            
            <div className="space-y-8 text-slate-700">
              <p className="text-lg leading-relaxed">
                O MISIMWEB foi desenvolvido para engenharia de processos minerais, focando na predição de comportamento de circuitos complexos em <strong>Estado Estacionário (Steady-State)</strong>.
              </p>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 shadow-sm">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center"><Target className="w-5 h-5 mr-2" /> Conservação de Massa</h3>
                    <p className="text-sm text-blue-700 leading-relaxed">
                        Diferente de simuladores simplistas, o MISIMWEB conserva a massa individual de cada componente mineralógico. Se você alimenta 10 t/h de Calcopirita, o solver garante que a soma de Calcopirita no concentrado e no rejeito seja exatamente 10 t/h, independentemente das transformações químicas ou físicas.
                    </p>
                </div>
                
                <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm">
                    <h3 className="font-bold text-emerald-900 mb-4 flex items-center"><Zap className="w-5 h-5 mr-2" /> Modelagem de "Equipamento Inteligente"</h3>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                        Cada nó no sistema possui um <strong>Processor Unit</strong> dedicado. Ao receber uma corrente, o equipamento consulta seu modelo matemático (ex: Bond para moinhos, Plitt para ciclones) e gera correntes de saída com novas propriedades físicas e granulométricas.
                    </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'solver':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Motor de Cálculo (Solver)</h2>
              <p className="text-slate-500 mt-2">Algoritmo Modular Sequencial para balanço de massa em circuitos com reciclo.</p>
            </header>

            <div className="space-y-8 text-slate-700">
              <p className="leading-relaxed">
                Para resolver circuitos onde o produto de um equipamento retorna para a entrada de outro (reciclo), o MISIMWEB utiliza o método de <strong>Substituição Sequencial Direta</strong>.
              </p>

              <div className="bg-slate-900 p-10 rounded-[32px] border border-slate-800 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-6 opacity-10"><Cpu className="w-24 h-24 text-white" /></div>
                <h3 className="text-xl font-bold text-emerald-400 mb-8 flex items-center">
                  <Sigma className="w-6 h-6 mr-3" />
                  Parâmetros de Convergência
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Tolerância Absoluta</span>
                            <p className="text-white font-mono text-lg">10⁻⁴ t/h</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Limite de Iterações</span>
                            <p className="text-white font-mono text-lg">500 Ciclos</p>
                        </div>
                    </div>
                    <div className="text-sm text-slate-400 leading-relaxed pt-2">
                        O solver monitora o <strong>erro residual global</strong>. Em cada ciclo, ele compara a vazão anterior com a nova. Se a diferença for menor que a tolerância em todas as correntes, o sistema é considerado "Converguido" e o estado estacionário é atingido.
                    </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'streams':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Propriedades das Correntes</h2>
              <p className="text-slate-500 mt-2">Cálculos fundamentais de densidade de polpa e balanço de sólidos/líquidos.</p>
            </header>

            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-800 text-xl flex items-center">
                    <Droplets className="w-6 h-6 mr-3 text-blue-500" />
                    Densidade da Polpa (ρₚ)
                </h3>
                <p className="text-slate-600 leading-relaxed">
                    Utilizada em todos os dimensionamentos. Considera o volume ocupado pelos sólidos (SG) e pela água (SG=1.0).
                </p>
                <div className="bg-slate-900 p-8 rounded-3xl font-mono text-2xl text-center text-emerald-400 border border-slate-800 shadow-inner">
                  ρₚ = 100 / [ (C_w / ρₛ) + ((100 - C_w) / 1) ]
                </div>
                <div className="flex justify-center space-x-12 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>C_w: % Sólidos (p/p)</span>
                    <span>ρₛ: Densidade Real Sólido</span>
                </div>
              </div>

              <div className="bg-indigo-50 p-10 rounded-[40px] border border-indigo-100 shadow-sm space-y-6">
                <h3 className="font-bold text-indigo-900 text-xl flex items-center">
                    <Activity className="w-6 h-6 mr-3 text-indigo-500" />
                    Vazão Volumétrica (Q)
                </h3>
                <p className="text-indigo-700 leading-relaxed">
                    Calculada para estimar tempos de residência em células de flotação e moinhos, além de carregamento hidráulico em ciclones.
                </p>
                <div className="bg-white p-6 rounded-2xl font-mono text-2xl text-center text-indigo-600 shadow-sm border border-indigo-200">
                  Q (m³/h) = TotalMassFlow (t/h) / ρₚ
                </div>
              </div>
            </div>
          </div>
        );

      case 'comminution':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Moagem (Cominuição)</h2>
              <p className="text-slate-500 mt-2">Modelagem energética de Hogg-Fuerstenau e granulométrica via PBM.</p>
            </header>

            <div className="space-y-10">
              <div className="bg-amber-50 p-10 rounded-[40px] border border-amber-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Settings2 className="w-32 h-32 text-amber-900" /></div>
                <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-3" /> 
                  Consumo de Potência Ativa (Hogg & Fuerstenau)
                </h3>
                <p className="text-sm text-amber-800 leading-relaxed mb-6 max-w-2xl">
                    Diferente da Lei de Bond (que é ideal para dimensionamento), o modelo de <strong>Hogg & Fuerstenau</strong> prediz a potência real que o moinho consumirá baseado na sua geometria, nível de enchimento e velocidade.
                </p>
                <div className="bg-white p-6 rounded-2xl font-mono text-xl text-center text-amber-700 shadow-inner border border-amber-200">
                    P_net = K · D².⁵ · L · ρ_app · f(J, φ)
                </div>
                <p className="text-[10px] text-amber-600/70 mt-4 uppercase font-bold tracking-wider text-center">
                    Calcula a potência no eixo baseada no diâmetro (D), comprimento (L), enchimento (J) e velocidade crítica (φ).
                </p>
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-800 text-xl flex items-center">
                    <BarChart3 className="w-6 h-6 mr-3 text-blue-500" />
                    Balanço Populacional (Austin PBM)
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">
                    A quebra das partículas é simulada através de modelos de matriz de quebra e seleção. O simulador resolve a equação de balanço de massa para 20 classes granulométricas simultâneas.
                </p>
                <div className="bg-slate-50 p-6 rounded-2xl font-mono text-sm text-center border border-slate-100 leading-relaxed text-slate-700">
                    w_out · (1 + τ·S) = w_in + τ · Σ (Sⱼ · bᵢⱼ · wⱼ)
                </div>
                <ul className="grid grid-cols-2 gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                    <li>τ: Tempo de Residência</li>
                    <li>S: Função de Seleção (Quebra)</li>
                    <li>bᵢⱼ: Função de Fragmentação</li>
                    <li>w: Fração Mássica na Classe</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'classification':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Classificação (Hidrociclone)</h2>
              <p className="text-slate-500 mt-2">Modelo de Plitt para predição de corte (d50c) e arraste hidráulico (Rf).</p>
            </header>

            <div className="space-y-8">
              <div className="bg-indigo-50 p-10 rounded-[40px] border border-indigo-100 shadow-sm space-y-8">
                <div>
                    <h4 className="font-black text-indigo-900 mb-4 uppercase tracking-widest text-xs">Tamanho de Corte Corrigido (d50c)</h4>
                    <div className="bg-white p-8 rounded-3xl font-mono text-xs text-indigo-700 overflow-x-auto shadow-inner border border-indigo-200 leading-relaxed">
                        d50c = (K1 · D⁰.⁴⁶ · Di⁰.⁶ · Do¹.²¹ · exp(0.063 · φ)) / (Du⁰.⁷¹ · h⁰.³⁸ · P⁰.⁴⁵)
                    </div>
                </div>
                <div>
                    <h4 className="font-black text-indigo-900 mb-4 uppercase tracking-widest text-xs">Recuperação de Água para o Underflow (Rf)</h4>
                    <div className="bg-white p-8 rounded-3xl font-mono text-xs text-indigo-700 overflow-x-auto shadow-inner border border-indigo-200 leading-relaxed">
                        Rf = 10 + (SolidsFeed · 0.4) + (Du/Do) · (h/D) · 10
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center"><Smartphone className="w-4 h-4 mr-2 text-blue-500" /> Curva de Tromp</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        O simulador gera a curva de partição baseada na equação de eficiência exponencial. Isso permite prever o "bypass" de finos para o underflow e a contaminação de grossos no overflow.
                    </p>
                </div>
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center"><Target className="w-4 h-4 mr-2 text-orange-500" /> Efeito SG</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                        O modelo ajusta o d50c para cada mineral individualmente baseado em sua densidade relativa. Minerais pesados (ex: sulfetos) tendem a ser classificados mais "finos" que a gangue leve.
                    </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'flotation':
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="border-b border-slate-200 pb-6">
              <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Flotação (Modelo Cinético)</h2>
              <p className="text-slate-500 mt-2 italic">Modelo de primeira ordem com fatores de correção operacionais.</p>
            </header>

            <div className="space-y-8 text-slate-700">
              <p className="leading-relaxed text-lg">
                O MISIMWEB utiliza um modelo cinético avançado onde a recuperação metalúrgica (R) é função do tempo de residência e da constante cinética (k) modificada por variáveis operacionais.
              </p>

              <div className="bg-green-50 p-10 rounded-[40px] border border-green-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Layers className="w-32 h-32 text-green-900" /></div>
                <div className="relative z-10">
                    <h3 className="font-black text-green-900 mb-8 uppercase tracking-widest text-sm flex items-center">
                        <Calculator className="w-5 h-5 mr-3" /> Equação Mestra de Recuperação
                    </h3>
                    <div className="bg-white p-10 rounded-[32px] font-mono text-3xl text-center text-slate-800 mb-8 shadow-md border border-green-200">
                    R_total = R_base + Σ (Fatores de Correção)
                    </div>
                    <p className="text-sm text-green-800 font-bold mb-6 flex items-center">
                        <Info className="w-4 h-4 mr-2" /> Onde os fatores de correção ajustam a recuperação base (ex: 82% para Cu):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                        <div className="bg-white/40 p-4 rounded-2xl border border-green-100 flex items-start">
                            <ChevronRight className="w-5 h-5 text-green-600 mt-0.5 mr-2 shrink-0" />
                            <p><span className="font-bold text-green-900">pH:</span> Penalidade parabólica se desviar do pH ótimo configurado.</p>
                        </div>
                        <div className="bg-white/40 p-4 rounded-2xl border border-green-100 flex items-start">
                            <ChevronRight className="w-5 h-5 text-green-600 mt-0.5 mr-2 shrink-0" />
                            <p><span className="font-bold text-green-900">Coletor:</span> Ganho logarítmico baseado na dosagem (g/t) e Work Index do reagente.</p>
                        </div>
                        <div className="bg-white/40 p-4 rounded-2xl border border-green-100 flex items-start">
                            <ChevronRight className="w-5 h-5 text-green-600 mt-0.5 mr-2 shrink-0" />
                            <p><span className="font-bold text-green-900">Aeração/Rotor:</span> Ajuste hidrodinâmico na probabilidade de colisão bolha-partícula.</p>
                        </div>
                        <div className="bg-white/40 p-4 rounded-2xl border border-green-100 flex items-start">
                            <ChevronRight className="w-5 h-5 text-green-600 mt-0.5 mr-2 shrink-0" />
                            <p><span className="font-bold text-green-900">Tempo:</span> Modelo de 1ª ordem R = R_max(1 - exp(-kt)) para bancos de células.</p>
                        </div>
                    </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-lg space-y-8">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm border-b border-slate-100 pb-6 flex items-center">
                    <Database className="w-5 h-5 mr-3 text-blue-500" /> Distribuição de Espécies & Mineralogia
                </h3>
                <div className="space-y-6">
                    <div className="flex gap-6 group">
                        <div className="bg-slate-100 text-slate-900 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 mt-1 transition-colors group-hover:bg-blue-600 group-hover:text-white">1</div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">Massa Mineral Alvo</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                O sistema calcula a recuperação metalúrgica individual para o mineral portador do elemento de interesse (ex: Calcopirita para Cu).
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6 group">
                        <div className="bg-slate-100 text-slate-900 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 mt-1 transition-colors group-hover:bg-blue-600 group-hover:text-white">2</div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">Cálculo de Ganga e Mass Pull</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                A massa de ganga arrastada para o concentrado é calculada para satisfazer a <strong>Razão de Concentração (Enriquecimento)</strong> ou o <strong>Mass Pull</strong> desejado.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-6 group">
                        <div className="bg-slate-100 text-slate-900 w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg shrink-0 mt-1 transition-colors group-hover:bg-blue-600 group-hover:text-white">3</div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">Derivação Química</h4>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Os teores elementares finais (Cu, Fe, S, Au) são derivados da estequiometria atômica dos minerais presentes em cada corrente resultante, cruzando dados do <strong>Database Técnico</strong>.
                            </p>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-full bg-slate-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-xl z-10">
        <div className="p-8 border-b border-slate-100">
          <div className="flex items-center space-x-3 text-blue-600 mb-2">
             <Info className="w-6 h-6" />
             <h1 className="text-2xl font-black tracking-tight uppercase">Documentação</h1>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {topics.map((topic) => {
            const Icon = topic.icon;
            const isActive = activeTopic === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setActiveTopic(topic.id)}
                className={`w-full flex items-center px-6 py-4 text-sm font-bold rounded-xl transition-all ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 mr-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                {topic.label}
              </button>
            );
          })}
        </nav>
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="text-[10px] font-black uppercase text-slate-400 text-center tracking-widest leading-loose">
            MISIMWEB v3.1<br/>Technical Reference
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar bg-slate-100">
        <div className="max-w-4xl mx-auto bg-white p-12 md:p-20 rounded-[60px] shadow-2xl border border-white min-h-full animate-in zoom-in-95 duration-500">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};