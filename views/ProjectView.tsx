
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Settings2, Hammer, Boxes, Layers, Shuffle, Trash2, MousePointer2, 
  Save as SaveIcon, ChevronDown, ChevronUp, Database, Plus, ArrowLeft,
  Droplets, Waves, Split, Filter, ArrowRight,
  ZoomIn, ZoomOut, Download, Upload,
  PlusCircle, Zap, BarChart3, DollarSign, Lock, History,
  RotateCw, RotateCcw, ChevronRight, GripVertical,
  PanelBottomClose, PanelBottomOpen, Play, RefreshCcw,
  X, Calculator, Sliders, Search, Edit,
  Table, Type, Image, Grid, PlusSquare, Star, AlertTriangle, FileText, Clipboard,
  Atom, Beaker, Leaf, Mountain, Ruler, Scaling, Gauge, LayoutTemplate, Info
} from 'lucide-react';
import { 
  NodeType, EquipmentConfig, NodeData, Connection, Component, LogEntry, LogType, RecoveryModel, PlanType, StreamData, UnitConfig, EquipmentType
} from '../types';
import { solveFlowsheet, SimulationResult } from '../services/flowsheetSolver';
import { InputGroup, MillForm, SagMillForm, HPGRForm, GyratoryForm, JawCrusherForm, CycloneForm, FlotationForm, MixerForm, StreamForm, DefaultForm, CustomSelect } from '../components/SharedParameterForms';
import { ResultsView } from './ResultsView';
import { ParametersView } from './ParametersView';
import { EconomicsView } from './EconomicsView';
import { UnitsView } from './UnitsView';
import { ComponentsView } from './ComponentsView';
import { KineticsView } from './KineticsView';
import { ChartsView } from './ChartsView';
import { OptimizationView } from './OptimizationView';
import { STANDARD_MODELS } from '../services/miningMath';

interface ProjectViewProps {
  nodes: NodeData[];
  setNodes: React.Dispatch<React.SetStateAction<NodeData[]>>;
  connections: Connection[];
  setConnections: React.Dispatch<React.SetStateAction<Connection[]>>;
  minerals: Component[]; 
  setMinerals: React.Dispatch<React.SetStateAction<Component[]>>;
  customModels: RecoveryModel[];
  setCustomModels: React.Dispatch<React.SetStateAction<RecoveryModel[]>>;
  units: UnitConfig;
  setUnits: React.Dispatch<React.SetStateAction<UnitConfig>>;
  logs: LogEntry[];
  setLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  simulationResult: SimulationResult | null;
  onSimulationComplete: (results: SimulationResult) => void;
  onNavigateToResults: () => void;
  onNavigate: (view: EquipmentType) => void;
  user: {
      credits: number;
      plan: PlanType;
      name: string;
      email: string;
      isAdmin: boolean;
      avatarUrl?: string;
      subtitle?: string;
  } | null;
  onUpdateCredits: (amount: number) => void;
  onTriggerOptimization?: () => void;
  
  onSnapshot?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetSimulation?: () => void;
  onSetCustomModels?: (action: React.SetStateAction<RecoveryModel[]>) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  
  openTabs: string[];
  activeTabId: string;
  onOpenTab: (id: string) => void;
  onOpenParameters?: (id: string) => void;
  projectName?: string;
  executionFlags: {
      economics: boolean;
      charts: boolean;
      optimization: boolean;
  };
  onToggleExecutionFlag: (flag: 'economics' | 'charts' | 'optimization') => void;
  onSwitchTab: (id: string) => void;
  onCloseTab: (id: string) => void;
}

const GyratoryIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M16 4h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
        <path d="M12 2v4" />
        <path d="m9 8 3-4 3 4 2 12H7L9 8Z" />
    </svg>
);

const JawCrusherIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M5 4h14" />
        <path d="M16 4v16" />
        <path d="M8 4l6 14" />
        <circle cx="11" cy="9" r="2" />
    </svg>
);

const MixerIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="1" fill="#cbd5e1" stroke="currentColor" />
        <line x1="12" y1="3" x2="12" y2="16" stroke="currentColor" />
        <path d="M12 16l-4-2-2 2 2 2z" fill="currentColor" />
        <path d="M12 16l4-2 2 2-2 2z" fill="currentColor" />
    </svg>
);

const ToggleSwitch = ({ enabled, onClick, disabled, activeColor }: { enabled: boolean, onClick: () => void, disabled?: boolean, activeColor: string }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        disabled={disabled}
        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${disabled ? 'bg-slate-200 cursor-not-allowed opacity-50' : enabled ? activeColor : 'bg-slate-300'}`}
    >
        <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-4' : 'translate-x-0'}`}
        />
    </button>
);

const MixerShape = ({ className }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full drop-shadow-md overflow-visible">
                <defs>
                    <linearGradient id="mixerBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#94a3b8', stopOpacity: 1 }} />
                        <stop offset="40%" style={{ stopColor: '#f1f5f9', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <rect x="5" y="5" width="90" height="90" fill="url(#mixerBodyGrad)" stroke="#000" strokeWidth="2" />
                <line x1="50" y1="5" x2="50" y2="75" stroke="#000" strokeWidth="3" />
                <path d="M50 75 L25 65 L10 75 L25 85 Z" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
                <path d="M50 75 L75 65 L90 75 L75 85 Z" fill="none" stroke="#000" strokeWidth="3" strokeLinejoin="round" />
            </svg>
        </div>
    </div>
);

const HydrocycloneShape = ({ className }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 160" preserveAspectRatio="none" className="w-full h-full drop-shadow-md overflow-visible">
                <defs>
                    <linearGradient id="cycloneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style={{ stopColor: '#ffffd4', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#ffff8d', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#ffffd4', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <rect x="35" y="0" width="30" height="20" fill="url(#cycloneGrad)" stroke="#000" strokeWidth="2" />
                <rect x="5" y="20" width="90" height="12" fill="url(#cycloneGrad)" stroke="#000" strokeWidth="2" />
                <rect x="25" y="32" width="50" height="40" fill="url(#cycloneGrad)" stroke="#000" strokeWidth="2" />
                <rect x="5" y="72" width="90" height="12" fill="url(#cycloneGrad)" stroke="#000" strokeWidth="2" />
                <path d="M25 84 L75 84 L60 135 L40 135 Z" fill="url(#cycloneGrad)" stroke="#000" strokeWidth="2" />
                <rect x="35" y="135" width="30" height="15" fill="url(#cycloneGrad)" stroke="#000" strokeWidth="2" />
            </svg>
        </div>
    </div>
);

const HPGRShape = ({ className }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 200 100" preserveAspectRatio="none" className="w-full h-full drop-shadow-md overflow-visible">
                <defs>
                    <linearGradient id="hpgrBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#7a7d23', stopOpacity: 1 }} />
                        <stop offset="25%" style={{ stopColor: '#f1f2d5', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="75%" style={{ stopColor: '#f1f2d5', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#7a7d23', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <path d="M30 15 L50 15 L50 85 L30 85 L20 65 L20 35 Z" fill="#fff" stroke="#000" strokeWidth="2" />
                <rect x="10" y="40" width="10" height="20" fill="#fff" stroke="#000" strokeWidth="2" />
                <rect x="50" y="15" width="100" height="70" fill="url(#hpgrBodyGrad)" stroke="#000" strokeWidth="2" />
                <rect x="65" y="5" width="15" height="90" fill="url(#hpgrBodyGrad)" stroke="#000" strokeWidth="2" />
                <rect x="65" y="5" width="15" height="10" fill="#7a7d23" stroke="#000" strokeWidth="2" />
                <rect x="65" y="85" width="15" height="10" fill="#7a7d23" stroke="#000" strokeWidth="2" />
                <path d="M150 15 L170 15 L180 35 L180 65 L170 85 L150 85 Z" fill="#fff" stroke="#000" strokeWidth="2" />
                <rect x="180" y="40" width="10" height="20" fill="#fff" stroke="#000" strokeWidth="2" />
                <line x1="85" y1="70" x2="140" y2="70" stroke="#000" strokeWidth="1" />
                <line x1="85" y1="74" x2="140" y2="74" stroke="#000" strokeWidth="1" />
                <line x1="85" y1="78" x2="140" y2="78" stroke="#000" strokeWidth="1" />
                <line x1="85" y1="82" x2="140" y2="82" stroke="#000" strokeWidth="1" />
            </svg>
        </div>
    </div>
);

const BallMillShape = ({ className }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 200 140" preserveAspectRatio="none" className="w-full h-full drop-shadow-md overflow-visible">
                <defs>
                    <linearGradient id="millKhakiGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#9fa157', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#c4c688', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#9fa157', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <path d="M20 40 L50 25 L50 115 L20 100 Z" fill="#c4c688" stroke="#000" strokeWidth="2" />
                <path d="M180 40 L150 25 L150 115 L180 100 Z" fill="#c4c688" stroke="#000" strokeWidth="2" />
                <rect x="10" y="60" width="10" height="20" fill="#fff" stroke="#000" strokeWidth="2" />
                <rect x="180" y="60" width="10" height="20" fill="#fff" stroke="#000" strokeWidth="2" />
                <rect x="50" y="25" width="100" height="90" fill="url(#millKhakiGrad)" stroke="#000" strokeWidth="2" />
                <rect x="75" y="10" width="20" height="120" fill="#7a7d23" stroke="#000" strokeWidth="2" />
                <g fill="#333">
                   <circle cx="65" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="75" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="85" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="95" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="105" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="115" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="125" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="135" cy="100" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="70" cy="92" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="80" cy="92" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="90" cy="92" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="100" cy="92" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="110" cy="92" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="120" cy="92" r="4" stroke="#000" strokeWidth="1" />
                   <circle cx="130" cy="92" r="4" stroke="#000" strokeWidth="1" />
                </g>
            </svg>
        </div>
    </div>
);

const FlotationCellShape = ({ className }: { className?: string }) => (
    <div className={`flex flex-col items-center justify-center h-full w-full ${className}`}>
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 160 80" preserveAspectRatio="none" className="w-full h-full drop-shadow-md overflow-visible">
                <defs>
                    <linearGradient id="flotGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#ffffd4', stopOpacity: 1 }} />
                        <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#ffffd4', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>
                <rect x="5" y="5" width="120" height="70" fill="url(#flotGrad)" stroke="#000" strokeWidth="2" />
                <line x1="25" y1="5" x2="25" y2="75" stroke="#000" strokeWidth="2" />
                <path d="M25 5 L60 55 L60 75" fill="none" stroke="#000" strokeWidth="2" />
                <path d="M125 5 L90 55 L90 75" fill="none" stroke="#000" strokeWidth="2" />
                <rect x="125" y="55" width="30" height="20" fill="url(#flotGrad)" stroke="#000" strokeWidth="2" />
            </svg>
        </div>
    </div>
);

const EQUIPMENT_CONFIGS: Record<NodeType, EquipmentConfig> = {
  'Feed': { type: 'Feed', icon: ArrowRight, label: '', color: '', inputs: [], outputs: [] },
  'Product': { type: 'Product', icon: ArrowRight, label: '', color: '', inputs: [], outputs: [] },
  'Mixer': { 
    type: 'Mixer', icon: MixerIcon, label: 'Mixer', color: 'bg-transparent border-transparent text-slate-700',
    inputs: [{ id: 'in1', type: 'input' }, { id: 'in2', type: 'input' }, { id: 'in3', type: 'input' }],
    outputs: [{ id: 'out1', type: 'output' }],
    defaultParameters: { description: 'Ideal Mixer', inputCount: 3, outputCount: 1 } 
  },
  'Splitter': {
    type: 'Splitter', icon: Split, label: 'Splitter', color: 'bg-slate-200 border-slate-500 text-slate-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'stream1', type: 'output', label: 'S1' }, { id: 'stream2', type: 'output', label: 'S2' }],
    defaultParameters: { splitRatio: 50, description: '% Mass to Stream 1' }
  },
  'Moinho': { 
    type: 'Moinho', icon: Settings2, label: 'Moinho de Bolas', color: 'bg-transparent border-transparent text-slate-700',
    inputs: [{ id: 'feed', type: 'input', label: 'Feed' }],
    outputs: [{ id: 'discharge', type: 'output', label: 'Product' }],
    defaultParameters: { 
        workIndex: 12.5, diameter: 4.5, length: 6.0, fillingBallsPct: 35, 
        fillingDegreePct: 40, slurryFillingPct: 100, targetDischargeSolids: 70,
        oreDensity: 2.7, ballDensity: 7.8, powerLossFactor: 0.05
    }
  },
  'MoinhoSAG': {
    type: 'MoinhoSAG', icon: Settings2, label: 'Moinho SAG', color: 'bg-indigo-100 border-indigo-500 text-indigo-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'discharge', type: 'output' }],
    defaultParameters: { diameter: 10, length: 5, fillingTotal: 25, fillingBalls: 10, criticalSpeed: 75 }
  },
  'MoinhoRolos': {
    type: 'MoinhoRolos', icon: Settings2, label: 'HPGR (Rolos)', color: 'bg-transparent border-transparent text-stone-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'center', type: 'output', label: 'Cake' }, { id: 'edge', type: 'output', label: 'Edge' }],
    defaultParameters: { specificForce: 3, rollSpeed: 1.5, workingGap: 20 }
  },
  'Britador': { 
    type: 'Britador', icon: Hammer, label: 'Britador Cônico', color: 'bg-slate-300 border-slate-600 text-slate-800',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'product', type: 'output' }],
    defaultParameters: { capacity: 300, closedSideSetting: 12, reductionRatio: 4 }
  },
  'BritadorGiratorio': {
    type: 'BritadorGiratorio', icon: GyratoryIcon, label: 'Britador Giratório', color: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'product', type: 'output' }],
    defaultParameters: { capacity: 1000, oss: 150, css: 25, power: 500 }
  },
  'BritadorMandibula': {
    type: 'BritadorMandibula', icon: JawCrusherIcon, label: 'Britador Mandíbula', color: 'bg-stone-100 border-stone-500 text-stone-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'product', type: 'output' }],
    defaultParameters: { capacity: 500, oss: 100, css: 20, power: 250, throw: 30 }
  },
  'Hydrocyclone': { 
    type: 'Hydrocyclone', icon: Filter, label: 'Cyclones', color: 'bg-transparent border-transparent text-indigo-700',
    inputs: [{ id: 'feed', type: 'input', label: 'Feed' }],
    outputs: [{ id: 'overflow', type: 'output', label: 'O/F' }, { id: 'underflow', type: 'output', label: 'U/F' }],
    defaultParameters: { 
        pressure: 100, d50c: 150, waterRecoveryToUnderflow: 45, numberOfCyclones: 2,
        diameter: 26.0, height: 107.8, inletDiameter: 8.74, vortexFinderDiameter: 6.50, apexDiameter: 5.00,
        overflowSolids: 30, underflowSolids: 75, millDischargeSolids: 70, oreDensity: 2.7,
        k1: 9.932, k2: 1.361, k3: 52.968, k4: 0.441, lambda: 0.95, bpc: 0.00
    }
  },
  'FlotationCell': { 
    type: 'FlotationCell', icon: Layers, label: 'Flotation Cell', color: 'bg-transparent border-transparent text-green-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'conc', type: 'output', label: 'Conc' }, { id: 'tail', type: 'output', label: 'Tail' }],
    defaultParameters: { 
        calculationMethod: 'Database_Model',
        residenceTime: 15, airFlow: 50, massPull: 10, waterPull: 15, mineralRecovery: 90, targetElement: 'Cu', concentrationRatio: 10,
        ph: 10.5, collectorDosage: 20, frotherDosage: 10, rotorSpeed: 1200
    }
  },
  'Conditioner': {
    type: 'Conditioner', icon: Droplets, label: 'Conditioner', color: 'bg-teal-100 border-teal-500 text-teal-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'out', type: 'output' }],
    defaultParameters: { residenceTime: 5, reagents: 'PAX' }
  },
  'Thickener': {
    type: 'Thickener', icon: Boxes, label: 'Thickener', color: 'bg-cyan-100 border-cyan-500 text-cyan-700',
    inputs: [{ id: 'feed', type: 'input' }],
    outputs: [{ id: 'underflow', type: 'output', label: 'U/F' }, { id: 'overflow', type: 'output', label: 'Water' }],
    defaultParameters: { underflowSolids: 65, flocculantDosage: 20 }
  },
  'TableOverlay': {
    type: 'TableOverlay', icon: Table, label: 'Tabela de Correntes', color: 'bg-white border-slate-400 text-slate-700',
    inputs: [], outputs: [], defaultParameters: {}
  }
};

const DEFAULT_WIDTHS: Record<string, number> = {
  'Hydrocyclone': 80,
  'Mixer': 80,
  'TableOverlay': 320,
  'DEFAULT': 120
};

const DEFAULT_HEIGHTS: Record<string, number> = {
  'Hydrocyclone': 120,
  'Mixer': 120,
  'TableOverlay': 180,
  'DEFAULT': 80
};

const rotatePoint = (cx: number, cy: number, x: number, y: number, angle: number) => {
    const rad = (Math.PI / 180) * angle;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const nx = (cos * (x - cx)) - (sin * (y - cy)) + cx;
    const ny = (sin * (x - cx)) + (cos * (y - cy)) + cy;
    return { x: nx, y: ny };
};

const EQUIPMENT_GROUPS = [
    { id: 'comminution', title: 'Cominuição', icon: Hammer, types: ['Britador', 'BritadorGiratorio', 'BritadorMandibula', 'Moinho', 'MoinhoSAG', 'MoinhoRolos'], color: 'text-yellow-600' },
    { id: 'classification', title: 'Classificação', icon: Filter, types: ['Hydrocyclone'], color: 'text-indigo-600' },
    { id: 'separation', title: 'Concentração', icon: Layers, types: ['FlotationCell', 'Conditioner'], color: 'text-green-600' },
    { id: 'solid_liquid', title: 'Sólido-Líquido', icon: Droplets, types: ['Thickener'], color: 'text-cyan-600' },
    { id: 'auxiliary', title: 'Auxiliares', icon: MixerIcon, types: ['Mixer', 'Splitter'], color: 'text-purple-600' }
];

export const ProjectView: React.FC<ProjectViewProps> = ({ 
  nodes, setNodes, connections, setConnections, minerals, setMinerals, customModels, setCustomModels, units, setUnits, logs, setLogs,
  simulationResult, onSimulationComplete, onNavigateToResults, onNavigate, user, onUpdateCredits, onTriggerOptimization,
  onSnapshot, onUndo, onRedo, onResetSimulation, canUndo, canRedo,
  openTabs, activeTabId, onOpenTab, projectName,
  executionFlags, onToggleExecutionFlag, onSwitchTab, onCloseTab
}) => {
  const STORAGE_KEY_SIDEBAR = 'misim_ui_sidebar';
  const STORAGE_KEY_GROUPS = 'misim_ui_groups';

  const [showSidebar, setShowSidebar] = useState(() => {
      const saved = localStorage.getItem(STORAGE_KEY_SIDEBAR);
      return saved !== null ? JSON.parse(saved) : true;
  });

  const [activeEquipmentGroup, setActiveEquipmentGroup] = useState(() => EQUIPMENT_GROUPS[0].id);

  const [simState, setSimState] = useState<'idle' | 'running' | 'paused' | 'success'>('idle');
  const [activeTool, setActiveTool] = useState<'pointer' | 'stream'>('pointer');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const [showDataSheet, setShowDataSheet] = useState(false);
  const [dataSheetItem, setDataSheetItem] = useState<any>(null);
  const [dataSheetPos, setDataSheetPos] = useState<{ x: number, y: number } | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{startX: number, startY: number, endX: number, endY: number} | null>(null);
  const [zoom, setZoom] = useState(1);
  const [draggingNode, setDraggingNode] = useState<{id: string, offsetX: number, offsetY: number} | null>(null);
  const [resizingNode, setResizingNode] = useState<{id: string, startWidth: number, startHeight: number, startX: number, startY: number, rotation: number} | null>(null);
  const [draggingLabel, setDraggingLabel] = useState<{id: string, startMouseX: number, startMouseY: number, startOffsetX: number, startOffsetY: number, itemType: 'node' | 'connection'} | null>(null);
  const [draggingStreamPoint, setDraggingStreamPoint] = useState<{id: string, pointType: 'from' | 'to'} | null>(null);
  const [draggingWaypoint, setDraggingWaypoint] = useState<{ connectionId: string, index: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'node' | 'connection' | 'canvas' | 'waypoint'; id: string; extra?: string } | null>(null);
  const [drawingLine, setDrawingLine] = useState<{ fromNode?: string; fromPort?: string; startX: number; startY: number; currX: number; currY: number; startDir?: number; } | null>(null);

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
      const saved = localStorage.getItem(STORAGE_KEY_GROUPS);
      if (saved) { try { return JSON.parse(saved); } catch (e) {} }
      return { 'comminution': true, 'classification': false, 'separation': false, 'solid_liquid': false, 'auxiliary': false };
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const lastCanvasClick = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null); 

  const getFilterTypeForTab = (id: string): string | undefined => {
      switch (id) {
          case EquipmentType.SET_MILL_GROUP: return 'COMINUIÇÃO';
          case EquipmentType.SET_CLASSIFICATION_GROUP: return 'CLASSIFICAÇÃO';
          case EquipmentType.SET_CONCENTRATION_GROUP: return 'CONCENTRAÇÃO';
          case EquipmentType.SET_SOLID_LIQUID_GROUP: return 'SÓLIDOS-LÍQUIDO';
          case EquipmentType.SET_AUXILIARY_GROUP: return 'AUXILIARES';
          case EquipmentType.SET_STREAMS_GROUP: return 'CORRENTES';
          default: return undefined;
      }
  };

  const handleUpdateNode = (id: string, updates: Partial<NodeData>) => {
      if (onSnapshot) onSnapshot();
      setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleUpdateConnection = (id: string, updates: Partial<Connection>) => {
      if (onSnapshot) onSnapshot();
      setConnections(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const contentSize = useMemo(() => {
      let maxX = 0;
      let maxY = 0;
      nodes.forEach(n => {
          const w = n.width || DEFAULT_WIDTHS[n.type] || DEFAULT_WIDTHS['DEFAULT'];
          const h = n.height || DEFAULT_HEIGHTS[n.type] || DEFAULT_HEIGHTS['DEFAULT'];
          if (n.x + w > maxX) maxX = n.x + w;
          if (n.y + h > maxY) maxY = n.y + h;
      });
      connections.forEach(c => {
          if (c.fromX && c.fromX > maxX) maxX = c.fromX;
          if (c.fromY && c.fromY > maxY) maxY = c.fromY;
          if (c.toX && c.toX > maxX) maxX = c.toX;
          if (c.toY && c.toY > maxY) maxY = c.toY;
      });
      return { width: Math.max(maxX + 1000, 3000), height: Math.max(maxY + 1000, 2000) };
  }, [nodes, connections]);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_SIDEBAR, JSON.stringify(showSidebar)); }, [showSidebar]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(expandedGroups)); }, [expandedGroups]);

  useEffect(() => {
    const handleWindowClick = () => {
        if (contextMenu) setContextMenu(null);
    };
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [contextMenu]);

  const toggleGroup = (groupId: string) => { setExpandedGroups(prev => { const isCurrentlyOpen = prev[groupId]; const newState: Record<string, boolean> = {}; Object.keys(prev).forEach(key => newState[key] = false); if (!isCurrentlyOpen) { newState[groupId] = true; } return newState; }); };

  const userPlan = user?.plan || 'Starter';
  const hasOptimization = ['Enterprise'].includes(userPlan);
  const hasCharts = ['Pro', 'Enterprise'].includes(userPlan);
  const hasEconomics = ['Enterprise'].includes(userPlan);

  useEffect(() => { setSelectedIds([]); setDrawingLine(null); setSimState(simulationResult?.converged ? 'success' : 'idle'); }, [simulationResult, nodes]);

  const addLog = (message: string, type: LogType = 'info') => {
    const newLog: LogEntry = { id: Date.now() + Math.random(), timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false }), type, message };
    setLogs(prev => [newLog, ...prev]); 
  };

  const getAbsolutePortPosition = (nodeId: string, portId: string) => { 
    const node = nodes.find(n => n.id === nodeId); 
    if (!node) return { x: 0, y: 0, dir: 0 }; 
    const config = EQUIPMENT_CONFIGS[node.type]; 
    if (!config) return { x: node.x, y: node.y, dir: 0 }; 

    const width = node.width || DEFAULT_WIDTHS[node.type] || DEFAULT_WIDTHS['DEFAULT'];
    const height = node.height || DEFAULT_HEIGHTS[node.type] || DEFAULT_HEIGHTS['DEFAULT'];

    let dir = 0; 
    const inputIndex = config.inputs.findIndex(p => p.id === portId); 
    const outputIndex = config.outputs.findIndex(p => p.id === portId); 
    let rx = 0; let ry = 0; 
    
    if (node.type === 'Hydrocyclone') {
        if (portId === 'feed') { rx = 0; ry = height / 2.5; dir = 180; }
        else if (portId === 'overflow') { rx = width / 2; ry = 0; dir = 270; }
        else if (portId === 'underflow') { rx = width / 2; ry = height; dir = 90; }
    } else {
        if (inputIndex >= 0) { 
            rx = 0; ry = (height / (config.inputs.length + 1)) * (inputIndex + 1); 
            dir = 180;
        } else if (outputIndex >= 0) { 
            rx = width; ry = (height / (config.outputs.length + 1)) * (outputIndex + 1); 
            dir = 0;
        } 
    }

    dir = (dir + (node.rotation || 0)) % 360;
    if (node.rotation) { 
        const unrotated = { x: node.x + rx, y: node.y + ry }; 
        const rotated = rotatePoint(node.x, node.y, unrotated.x, unrotated.y, node.rotation); 
        return { ...rotated, dir };
    } 
    return { x: node.x + rx, y: node.y + ry, dir }; 
  };

  const getSmartPath = (start: {x: number, y: number, dir: number}, end: {x: number, y: number, dir: number}) => {
    const isHorizontal = (d: number) => d % 180 === 0;

    if (isHorizontal(start.dir)) {
        const midX = (start.x + end.x) / 2;
        return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`;
    } else {
        const midY = (start.y + end.y) / 2;
        return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`;
    }
  };

  const getPath = (start: {x: number, y: number, dir: number}, end: {x: number, y: number, dir: number}, waypoints?: {x: number, y: number}[]) => {
    if (!waypoints || waypoints.length === 0) {
      return getSmartPath(start, end);
    }
    
    const pts = [
        { x: start.x, y: start.y, dir: start.dir }, 
        ...(waypoints || []).map(w => ({ ...w, dir: -1 })), 
        { x: end.x, y: end.y, dir: -1 }
    ];

    let d = `M ${pts[0].x} ${pts[0].y}`;
    let curDir = pts[0].dir === -1 ? 0 : pts[0].dir;

    for (let i = 0; i < pts.length - 1; i++) {
        const p1 = pts[i];
        const p2 = pts[i+1];
        if (curDir % 180 === 0) { d += ` L ${p2.x} ${p1.y} L ${p2.x} ${p2.y}`; curDir = 90; } 
        else { d += ` L ${p1.x} ${p2.y} L ${p2.x} ${p2.y}`; curDir = 0; }
    }
    return d;
  };

  const findClosestSegmentIndex = (x: number, y: number, points: {x: number, y: number}[]) => {
    let minSource = 0;
    let minDist = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i+1];
        const A = x - p1.x;
        const B = y - p1.y;
        const C = p2.x - p1.x;
        const D = p2.y - p1.y;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;
        let xx, yy;
        if (param < 0) { xx = p1.x; yy = p1.y; }
        else if (param > 1) { xx = p2.x; yy = p2.y; }
        else { xx = p1.x + param * C; yy = p1.y + param * D; }
        const dx = x - xx;
        const dy = y - yy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
            minDist = dist;
            minSource = i;
        }
    }
    return minSource;
  };
  
  const isPointOnAnyConnection = (x: number, y: number, excludeId?: string) => {
    const threshold = 15;
    for (const c of connections) {
        if (c.id === excludeId) continue;
        let start, end; 
        if (c.fromNode) start = getAbsolutePortPosition(c.fromNode, c.fromPort!); else start = { x: c.fromX!, y: c.fromY!, dir: 0 }; 
        if (c.toNode) end = getAbsolutePortPosition(c.toNode, c.toPort!); else end = { x: c.toX!, y: c.toY!, dir: 180 }; 
        if (!start || !end) continue; 

        const points = [start, ...(c.waypoints || []), end];
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i+1];
            
            const isHorizontal = Math.abs(p1.y - p2.y) < 2;
            const isVertical = Math.abs(p1.x - p2.x) < 2;

            if (isHorizontal) {
                const minX = Math.min(p1.x, p2.x);
                const maxX = Math.max(p1.x, p2.x);
                if (x >= minX - threshold && x <= maxX + threshold && Math.abs(y - p1.y) < threshold) return true;
            } else if (isVertical) {
                const minY = Math.min(p1.y, p2.y);
                const maxY = Math.max(p1.y, p2.y);
                if (y >= minY - threshold && y <= maxY + threshold && Math.abs(x - p1.x) < threshold) return true;
            }
        }
    }
    return false;
  };

  const handleParamChange = (id: string, key: string, value: string | number | any) => {
      const isNode = nodes.some(n => n.id === id);
      let finalValue = value;
      if (typeof value === 'string' && key !== 'targetElement' && key !== 'recoveryModelId' && key !== 'calculationMethod') {
          finalValue = value.replace(',', '.');
      }
      
      if (onSnapshot) onSnapshot();
      if (isNode) { setNodes(prev => prev.map(n => n.id === id ? { ...n, parameters: { ...n.parameters, [key]: finalValue } } : n)); } 
      else { setConnections(prev => prev.map(c => c.id === id ? { ...c, parameters: { ...c.parameters, [key]: finalValue } } : c)); }
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'node' | 'port' | 'canvas' | 'connection' | 'label' | 'resize' | 'streamPoint' | 'waypoint', id?: string, portIdOrPoint?: string, isConnectionLabel?: boolean) => { 
    if (e.button !== 0) return; 
    e.stopPropagation(); 
    if (type === 'node' || type === 'port' || type === 'label' || type === 'resize' || type === 'streamPoint' || type === 'waypoint') { if (onSnapshot) onSnapshot(); } 
    const rect = canvasRef.current?.getBoundingClientRect(); 
    if (!rect) return; 
    const scrollLeft = canvasRef.current?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.scrollTop || 0;
    const x = (e.clientX - rect.left + scrollLeft) / zoom; 
    const y = (e.clientY - rect.top + scrollTop) / zoom; 
    
    if (type === 'canvas') { 
        if (activeTool === 'pointer') {
            setSelectionRect({ startX: x, startY: y, endX: x, endY: y });
        }
        lastCanvasClick.current = Date.now(); 
    } 

    if (type === 'node' || type === 'connection' || type === 'label' || type === 'resize' || type === 'waypoint') { 
        if (!e.ctrlKey && !e.shiftKey) { if (id && !selectedIds.includes(id)) setSelectedIds([id]); } 
        else if (id) { if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(i => i !== id)); else setSelectedIds(prev => [...prev, id]); } 
    } else if (type === 'canvas' && !selectionRect) {
        setSelectedIds([]); 
    }
    if (type !== 'node' && type !== 'port' && type !== 'label' && type !== 'resize') e.preventDefault(); 
    if (type === 'port' && id && portIdOrPoint) { 
        const pPos = getAbsolutePortPosition(id, portIdOrPoint);
        setDrawingLine({ fromNode: id, fromPort: portIdOrPoint, startX: x, startY: y, currX: x, currY: y, startDir: pPos.dir }); 
        return; 
    } 
    if (type === 'streamPoint' && id && portIdOrPoint) {
        setDraggingStreamPoint({ id, pointType: portIdOrPoint as 'from' | 'to' });
        setConnections(prev => prev.map(c => {
            if (c.id === id) {
                if (portIdOrPoint === 'from') return { ...c, fromX: x, fromY: y, fromNode: undefined, fromPort: undefined };
                else return { ...c, toX: x, toY: y, toNode: undefined, toPort: undefined };
            }
            return c;
        }));
        return;
    }
    if (type === 'waypoint' && id && portIdOrPoint !== undefined) {
        setDraggingWaypoint({ connectionId: id, index: parseInt(portIdOrPoint) });
        return;
    }
    if (activeTool === 'stream') { 
        if (type === 'canvas') { 
            if (isPointOnAnyConnection(x, y)) {
                addLog("Operação Inválida: Não é permitido iniciar correntes em cima de outras linhas. Use um 'Splitter'.", 'warning');
                return;
            }
            setDrawingLine({ fromNode: undefined, fromPort: undefined, startX: x, startY: y, currX: x, currY: y, startDir: 0 }); 
            return; 
        } 
    } 
    if (activeTool === 'pointer' && type === 'node' && id) { 
        const node = nodes.find(n => n.id === id); 
        if (node) setDraggingNode({ id, offsetX: x - node.x, offsetY: y - node.y }); 
    }
    if (activeTool === 'pointer' && type === 'resize' && id) {
      const node = nodes.find(n => n.id === id);
      if (node) {
        setResizingNode({ 
          id, 
          startX: x, 
          startY: y, 
          startWidth: node.width || DEFAULT_WIDTHS[node.type] || DEFAULT_WIDTHS['DEFAULT'], 
          startHeight: node.height || DEFAULT_HEIGHTS[node.type] || DEFAULT_HEIGHTS['DEFAULT'], 
          rotation: node.rotation || 0 
        });
      }
    }
    if (activeTool === 'pointer' && type === 'label' && id) { 
        if (!isConnectionLabel) {
            const node = nodes.find(n => n.id === id); 
            if (node) { const lx = node.labelOffsetX ?? 0; const ly = node.labelOffsetY ?? -25; setDraggingLabel({ id, startMouseX: x, startMouseY: y, startOffsetX: lx, startOffsetY: ly, itemType: 'node' }); } 
        } else {
            const conn = connections.find(c => c.id === id);
            if (conn) { setDraggingLabel({ id, startMouseX: x, startMouseY: y, startOffsetX: conn.labelOffsetX ?? 0, startOffsetY: conn.labelOffsetY ?? 0, itemType: 'connection' }); }
        }
    } 
  };
  
  const handleMouseMove = (e: React.MouseEvent) => { 
    const rect = canvasRef.current?.getBoundingClientRect(); 
    if (!rect) return; 
    const scrollLeft = canvasRef.current?.scrollLeft || 0;
    const scrollTop = canvasRef.current?.scrollTop || 0;
    const x = (e.clientX - rect.left + scrollLeft) / zoom; 
    const y = (e.clientY - rect.top + scrollTop) / zoom; 
    const isShiftPressed = e.shiftKey;

    if (selectionRect) { 
        setSelectionRect(prev => prev ? { ...prev, endX: x, endY: y } : null); 
        const sx = Math.min(selectionRect.startX, x); const sy = Math.min(selectionRect.startY, y); 
        const ex = Math.max(selectionRect.startX, x); const ey = Math.max(selectionRect.startY, y); 
        const newSelection: string[] = []; 
        nodes.forEach(n => { 
            const w = n.width || DEFAULT_WIDTHS[n.type] || DEFAULT_WIDTHS['DEFAULT']; 
            const h = n.height || DEFAULT_HEIGHTS[n.type] || DEFAULT_HEIGHTS['DEFAULT']; 
            if (n.x < ex && n.x + w > sx && n.y < ey && n.y + h > sy) newSelection.push(n.id); 
        }); 
        connections.forEach(c => { 
            let start, end; 
            if (c.fromNode) start = getAbsolutePortPosition(c.fromNode, c.fromPort!); else start = { x: c.fromX!, y: c.fromY!, dir: 0 }; 
            if (c.toNode) end = getAbsolutePortPosition(c.toNode, c.toPort!); else end = { x: c.toX!, y: c.toY!, dir: 180 }; 
            if (start && end) { 
                const centerX = (start.x + end.x) / 2; const centerY = (start.y + end.y) / 2; 
                if (centerX > sx && centerX < ex && centerY > sy && centerY < ey) newSelection.push(c.id); 
            } 
        }); 
        setSelectedIds(newSelection); 
        return; 
    } 
    if (draggingNode) { 
        setNodes(prev => prev.map(n => n.id === draggingNode.id ? { ...n, x: x - draggingNode.offsetX, y: y - draggingNode.offsetY } : n)); 
    }
    if (resizingNode) {
      const node = nodes.find(n => n.id === resizingNode.id);
      if (node) {
        const rad = (node.rotation || 0) * Math.PI / 180;
        const dx = x - node.x; const dy = y - node.y;
        const localX = dx * Math.cos(-rad) - dy * Math.sin(-rad);
        const localY = dx * Math.sin(-rad) + dy * Math.cos(-rad);
        setNodes(prev => prev.map(n => n.id === resizingNode.id ? { ...n, width: Math.max(40, localX), height: Math.max(40, localY) } : n));
      }
    }
    if (draggingStreamPoint) {
        setConnections(prev => prev.map(c => {
            if (c.id === draggingStreamPoint.id) {
                let anchor = { x: 0, y: 0 };
                if (draggingStreamPoint.pointType === 'from') {
                   if (c.toNode) { const p = getAbsolutePortPosition(c.toNode, c.toPort!); anchor = { x: p.x, y: p.y }; }
                   else { anchor = { x: c.toX!, y: c.toY! }; }
                } else {
                   if (c.fromNode) { const p = getAbsolutePortPosition(c.fromNode, c.fromPort!); anchor = { x: p.x, y: p.y }; }
                   else { anchor = { x: c.fromX!, y: c.fromY! }; }
                }
                
                let nx = x, ny = y;
                if (!isShiftPressed) {
                   if (Math.abs(x - anchor.x) < Math.abs(y - anchor.y)) nx = anchor.x; else ny = anchor.y;
                }

                if (draggingStreamPoint.pointType === 'from') return { ...c, fromX: nx, fromY: ny };
                else return { ...c, toX: nx, toY: ny };
            }
            return c;
        }));
    }
    if (draggingWaypoint) {
        setConnections(prev => prev.map(c => {
            if (c.id === draggingWaypoint.connectionId && c.waypoints) {
                const next = [...c.waypoints];
                const idx = draggingWaypoint.index;
                
                let prevAnchor;
                if (idx === 0) {
                    if (c.fromNode) prevAnchor = getAbsolutePortPosition(c.fromNode, c.fromPort!);
                    else prevAnchor = { x: c.fromX!, y: c.fromY! };
                } else prevAnchor = next[idx - 1];

                let nextAnchor;
                if (idx === next.length - 1) {
                    if (c.toNode) nextAnchor = getAbsolutePortPosition(c.toNode, c.toPort!);
                    else nextAnchor = { x: c.toX!, y: c.toY! };
                } else nextAnchor = next[idx + 1];

                let nx = x, ny = y;
                if (!isShiftPressed) {
                    const threshold = 20;
                    if (Math.abs(x - prevAnchor.x) < threshold) nx = prevAnchor.x;
                    if (Math.abs(y - prevAnchor.y) < threshold) ny = prevAnchor.y;
                    if (Math.abs(x - nextAnchor.x) < threshold) nx = nextAnchor.x;
                    if (Math.abs(y - nextAnchor.y) < threshold) ny = nextAnchor.y;
                }

                next[idx] = { x: nx, y: ny };
                return { ...c, waypoints: next };
            }
            return c;
        }));
    }
    if (draggingLabel) { 
        const dx = x - draggingLabel.startMouseX; const dy = y - draggingLabel.startMouseY; 
        if (draggingLabel.itemType === 'node') { setNodes(prev => prev.map(n => n.id === draggingLabel.id ? { ...n, labelOffsetX: draggingLabel.startOffsetX + dx, labelOffsetY: draggingLabel.startOffsetY + dy } : n)); } 
        else { setConnections(prev => prev.map(c => c.id === draggingLabel.id ? { ...c, labelOffsetX: draggingLabel.startOffsetX + dx, labelOffsetY: draggingLabel.startOffsetY + dy } : c)); }
    } 
    if (drawingLine) {
        setDrawingLine(prev => prev ? { ...prev, currX: x, currY: y } : null);
    }
  };
  
  const handleMouseUp = (e: React.MouseEvent, type: 'port' | 'canvas', nodeId?: string, portId?: string) => { 
    e.stopPropagation(); setDraggingNode(null); setResizingNode(null); setDraggingLabel(null); setSelectionRect(null); setDraggingWaypoint(null);
    const rect = canvasRef.current?.getBoundingClientRect(); 
    const getNextStreamLabel = () => { 
        let maxNum = 0; 
        connections.forEach(c => { const match = c.label?.match(/^Stream (\d+)$/); if (match) { const num = parseInt(match[1]); if (num > maxNum) maxNum = num; } }); 
        return `Stream ${maxNum + 1}`; 
    }; 

    if (draggingStreamPoint) {
        if (type === 'port' && nodeId && portId) {
            setConnections(prev => prev.map(c => {
                if (c.id === draggingStreamPoint.id) {
                    if (draggingStreamPoint.pointType === 'from') {
                        return { ...c, fromNode: nodeId, fromPort: portId, fromX: undefined, fromY: undefined };
                    } else {
                        return { ...c, toNode: nodeId, toPort: portId, toX: undefined, toY: undefined };
                    }
                }
                return c;
            }));
            addLog(`Conexão atualizada`, 'info');
        }
        setDraggingStreamPoint(null);
        return;
    }

    if (drawingLine) { 
        if (type === 'port' && nodeId && portId && nodeId !== drawingLine.fromNode) { 
            const newLabel = getNextStreamLabel(); 
            const newConn: Connection = { id: `stream_${Date.now()}`, fromNode: drawingLine.fromNode, fromPort: drawingLine.fromPort, fromX: drawingLine.fromNode ? undefined : drawingLine.startX, fromY: drawingLine.fromNode ? undefined : drawingLine.startY, toNode: nodeId, toPort: portId, label: newLabel, parameters: {} }; 
            setConnections(prev => [...prev, newConn]); setSelectedIds([newConn.id]); addLog(`Nova conexão criada: ${newLabel}`, 'info'); 
        } else if (type === 'canvas' && rect) { 
            if (isPointOnAnyConnection(drawingLine.currX, drawingLine.currY)) {
                addLog("Operação Inválida: Não é permitido ramificar correntes. Use um equipamento 'Splitter'.", 'warning');
                setDrawingLine(null);
                return;
            }
            const newLabel = getNextStreamLabel(); 
            const newConn: Connection = { id: `stream_${Date.now()}`, fromNode: drawingLine.fromNode, fromPort: drawingLine.fromPort, fromX: drawingLine.fromNode ? undefined : drawingLine.startX, fromY: drawingLine.fromNode ? undefined : drawingLine.startY, toNode: undefined, toPort: undefined, toX: drawingLine.currX, toY: drawingLine.currY, label: newLabel, parameters: {} }; 
            setConnections(prev => [...prev, newConn]); setSelectedIds([newConn.id]); addLog(`Nova conexão (Produto) criada: ${newLabel}`, 'info'); 
        } setDrawingLine(null); 
    } 
  };
  
  const openEditModal = (type: 'node' | 'connection' | 'canvas' | 'waypoint', id: string) => { if (type !== 'canvas' && type !== 'waypoint') onOpenTab(id); setContextMenu(null); };
  const handleContextMenu = (e: React.MouseEvent, type: 'node' | 'connection' | 'canvas' | 'waypoint', id: string, extra?: string) => { e.preventDefault(); e.stopPropagation(); if (type !== 'canvas' && type !== 'waypoint' && !selectedIds.includes(id)) setSelectedIds([id]); setContextMenu({ x: e.clientX, y: e.clientY, type, id, extra }); };
  const deleteItem = () => { if (onSnapshot) onSnapshot(); if (selectedIds.length === 0 && contextMenu) setSelectedIds([contextMenu.id]); const idsToDelete = selectedIds.length > 0 ? selectedIds : (contextMenu ? [contextMenu.id] : []); if (idsToDelete.length > 0) { idsToDelete.forEach(id => onCloseTab(id)); setNodes(prev => prev.filter(n => !idsToDelete.includes(n.id))); setConnections(prev => prev.filter(c => !idsToDelete.includes(c.id) && !idsToDelete.includes(c.fromNode!) && !idsToDelete.includes(c.toNode!))); addLog(`${idsToDelete.length} item(s) deletado(s).`, 'warning'); } setSelectedIds([]); setContextMenu(null); };
  const handleRotateNode = (id: string, angle: number) => { if (onSnapshot) onSnapshot(); setNodes(prev => prev.map(n => { if (n.id === id) { const currentRot = n.rotation || 0; return { ...n, rotation: (currentRot + angle) % 360 }; } return n; })); setContextMenu(null); };
  const addNode = (type: NodeType, x: number, y: number) => { if (onSnapshot) onSnapshot(); const newNode: NodeData = { id: `${type}_${Date.now()}`, type, x, y, label: EQUIPMENT_CONFIGS[type].label, parameters: { ...EQUIPMENT_CONFIGS[type].defaultParameters }, rotation: 0 }; setNodes(prev => [...prev, newNode]); setSelectedIds([newNode.id]); addLog(`Adicionado equipamento: ${newNode.label}`, 'info'); return newNode; };
  const handleLabelChange = (id: string, newLabel: string) => { if (onSnapshot) onSnapshot(); const isNode = nodes.some(n => n.id === id); if (isNode) { setNodes(prev => prev.map(n => n.id === id ? { ...n, label: newLabel } : n)); } else { setConnections(prev => prev.map(c => c.id === id ? { ...c, label: newLabel } : c)); } };
  const handlePasteStreamTable = () => { if (!contextMenu) return; if (onSnapshot) onSnapshot(); const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return; const scrollLeft = canvasRef.current?.scrollLeft || 0; const scrollTop = canvasRef.current?.scrollTop || 0; const x = (contextMenu.x - rect.left + scrollLeft) / zoom; const y = (contextMenu.y - rect.top + scrollTop) / zoom; const newNode: NodeData = { id: `table_${Date.now()}`, type: 'TableOverlay', x, y, label: 'Resumo de Balanço', parameters: {}, rotation: 0 }; setNodes(prev => [...prev, newNode]); addLog('Tabela de correntes colada no fluxograma.', 'success'); setContextMenu(null); };
  const handleOpenDataSheetFromContext = () => { if (!contextMenu) return; const item = nodes.find(n => n.id === contextMenu.id) || connections.find(c => c.id === contextMenu.id); if (item) { setDataSheetItem(item); setDataSheetPos({ x: contextMenu.x, y: contextMenu.y }); setShowDataSheet(true); } setContextMenu(null); };
  const handleLoadExample = () => { if (onSnapshot) onSnapshot(); setSelectedIds([]); setMinerals(prev => prev.map(m => (['1', '6'].includes(m.id)) ? { ...m, selected: true } : m)); const newNodes: NodeData[] = [ { id: 'cyc_simple', type: 'Hydrocyclone', x: 400, y: 300, label: 'Ciclone de Classificação', parameters: { pressure: 100, d50c: 150, waterRecoveryToUnderflow: 40, diameter: 26.0, height: 107.8, inletDiameter: 8.74, vortexFinderDiameter: 6.50, apexDiameter: 5.00, overflowSolids: 30, underflowSolids: 75, millDischargeSolids: 70, oreDensity: 2.7 } } ]; const newConns: Connection[] = [ { id: 's_feed_simple', fromNode: undefined, fromX: 150, fromY: 348, toNode: 'cyc_simple', toPort: 'feed', label: 'Alimentação do Ciclone', parameters: { solidsTph: 200, percentSolids: 55, sg: 2.7, mineral_1: 90, mineral_6: 10 } }, { id: 's_of_simple', fromNode: 'cyc_simple', fromPort: 'overflow', toNode: undefined, toX: 437.5, toY: 100, label: 'Overflow (Finos)', parameters: {} }, { id: 's_uf_simple', fromNode: 'cyc_simple', fromPort: 'underflow', toNode: undefined, toX: 437.5, toY: 550, label: 'Underflow (Grossos)', parameters: {} } ]; setNodes(newNodes); setConnections(newConns); addLog('Exemplo Simples de Classificação carregado.', 'success'); };
  const handleClearFlowsheetRequest = () => setShowClearConfirm(true);
  const handleConfirmClear = () => { if (onSnapshot) onSnapshot(); setNodes([]); setConnections([]); setSelectedIds([]); addLog('Fluxograma limpo.', 'warning'); setSimState('idle'); setShowClearConfirm(false); };
  const handleRunSimulation = () => { if (!user || user.credits <= 0) { addLog("Créditos insuficientes.", 'error'); return; } setSimState('running'); setTimeout(() => { try { const result = solveFlowsheet(nodes, connections, minerals, customModels); const updatedConnections = connections.map(c => ({ ...c, streamState: result.streams[c.id] })); setConnections(updatedConnections); onSimulationComplete(result); setSimState(result.converged ? 'success' : 'idle'); addLog(`Simulação concluída. Erro: ${result.error.toFixed(4)}%`, result.converged ? 'success' : 'warning'); if (user) { onUpdateCredits(user.credits - 10); } if (executionFlags.optimization && hasOptimization && onTriggerOptimization) { onTriggerOptimization(); } } catch (error) { setSimState('idle'); addLog('Erro na simulação.', 'error'); } }, 500); };
  const handleDownloadProject = () => { const data = { version: '1.0', timestamp: new Date().toISOString(), nodes, connections, minerals, customModels, logs, simulationResult }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `misim_project.json`; document.body.appendChild(a); a.click(); document.body.removeChild(a); };
  const handleUploadClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = (evt) => { try { const data = JSON.parse(evt.target?.result as string); if (data.nodes) setNodes(data.nodes); if (data.connections) setConnections(data.connections); if (data.minerals) setMinerals(data.minerals); if (data.customModels) setCustomModels(data.customModels); if (data.logs) setLogs(data.logs); if (data.simulationResult) { onSimulationComplete(data.simulationResult); if (data.simulationResult.converged) setSimState('success'); } addLog('Projeto carregado.', 'success'); } catch { addLog('Erro ao ler arquivo.', 'error'); } }; reader.readAsText(file); e.target.value = ''; };
  const handleSelectAll = () => { const allIds = [...nodes.map(n => n.id), ...connections.map(c => c.id)]; setSelectedIds(allIds); setContextMenu(null); };
  const generateDataSheetText = (item: any): string => { if (!item) return "Nenhum item selecionado."; let text = `========================================\nTECHNICAL DATA SHEET - ${item.label?.toUpperCase() || 'UNTITLED'}\n========================================\n\n[IDENTIFICATION]\nID: ${item.id}\nType: ${'type' in item ? item.type : 'Process Stream'}\n\n[OPERATIONAL PARAMETERS]\n`; Object.entries(item.parameters || {}).forEach(([key, val]) => { if (typeof val === 'object') return; text += `${key.padEnd(20)}: ${val}\n`; }); text += `\n`; const s = item.streamState || (('id' in item) ? simulationResult?.streams[item.id] : null); if (s) { text += `[SIMULATION RESULTS - MASS BALANCE]\nTotal Mass Flow    : ${(s.totalTph as number).toFixed(2)} t/h\nSolids Flow       : ${(s.solidsTph as number).toFixed(2)} t/h\nWater Flow        : ${(s.waterTph as number).toFixed(2)} m³/h\n% Sólidos (w/w)    : ${(s.percentSolids as number).toFixed(1)} %\nSlurry Density    : ${(s.slurryDensity as number).toFixed(2)} t/m³\nSolids SG         : ${(s.sgSolids as number).toFixed(2)}\n\n`; if (s.mineralFlows && Object.keys(s.mineralFlows).length > 0) { text += `[COMPONENT COMPOSITION]\n`; Object.entries(s.mineralFlows).forEach(([mid, flow]) => { const min = minerals.find(m => m.id === mid); const pct = (s.solidsTph as number) > 0 ? ((flow as number) / (s.solidsTph as number)) * 100 : 0; text += `${(min?.name || mid).padEnd(20)}: ${pct.toFixed(2)} % (${(flow as number).toFixed(2)} t/h)\n`; }); } } text += `\n========================================\nGenerated by MISIMWEB v3.1\n${new Date().toLocaleString()}\n`; return text; };
  const checkNodeHealth = (node: NodeData): { isHealthy: boolean; reason?: string } => { if (node.type === 'TableOverlay') return { isHealthy: true }; const msg = simulationResult?.equipmentMessages.find(m => m.nodeId === node.id); if (msg) return { isHealthy: false, reason: msg.text }; return { isHealthy: true }; };
  const handleClearWaypoints = (connId: string) => { setConnections(prev => prev.map(c => c.id === connId ? { ...c, waypoints: [] } : c)); setContextMenu(null); };
  const handleRemoveSingleWaypoint = (connId: string, idx: number) => { setConnections(prev => prev.map(c => { if (c.id === connId && c.waypoints) { const next = [...c.waypoints]; next.splice(idx, 1); return { ...c, waypoints: next }; } return c; })); setContextMenu(null); };

  const renderConnection = (c: Connection) => { 
    let start, end; 
    if (c.fromNode) start = getAbsolutePortPosition(c.fromNode, c.fromPort!); else start = { x: c.fromX!, y: c.fromY!, dir: 0 }; 
    if (c.toNode) end = getAbsolutePortPosition(c.toNode, c.toPort!); else end = { x: c.toX!, y: c.toY!, dir: 180 }; 
    if (!start || !end) return null; 
    const path = getPath(start, end, c.waypoints); 
    const isSelected = selectedIds.includes(c.id); 
    const isSource = !c.fromNode; 
    const isSink = !c.toNode; 
    return ( 
        <g key={c.id} onContextMenu={(e) => handleContextMenu(e, 'connection', c.id)} onMouseDown={(e) => handleMouseDown(e, 'connection', c.id)} onDoubleClick={() => openEditModal('connection', c.id)} className="cursor-pointer group pointer-events-auto"> 
            <path d={path} stroke="transparent" strokeWidth={20} fill="none" onMouseDown={(e) => {
                if (isSelected && e.button === 0) {
                    e.stopPropagation();
                    const rect = canvasRef.current?.getBoundingClientRect();
                    if (rect) {
                        const x = (e.clientX - rect.left + canvasRef.current!.scrollLeft) / zoom;
                        const y = (e.clientY - rect.top + canvasRef.current!.scrollTop) / zoom;
                        const currentPoints = [start, ...(c.waypoints || []), end];
                        const insertAfterIdx = findClosestSegmentIndex(x, y, currentPoints);
                        const nextWaypoints = [...(c.waypoints || [])];
                        nextWaypoints.splice(insertAfterIdx, 0, { x, y });
                        setConnections(prev => prev.map(conn => conn.id === c.id ? { ...conn, waypoints: nextWaypoints } : conn));
                        setDraggingWaypoint({ connectionId: c.id, index: insertAfterIdx });
                    }
                }
            }} /> 
            <path d={path} stroke={isSelected ? '#f97316' : '#64748b'} strokeWidth={isSelected ? 4 : 2} fill="none" className={`transition-colors duration-200 ${!isSelected && 'group-hover:stroke-orange-300'}`} /> 
            <path d={`M ${end.x} ${end.y} L ${end.x - 6} ${end.y - 3} L ${end.x - 6} ${end.y + 3} Z`} fill={isSelected ? '#f97316' : '#64748b'} /> 
            {isSource && ( <circle cx={start.x} cy={start.y} r={4} fill="#22c55e" stroke="white" strokeWidth={1} className="cursor-move hover:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'streamPoint', c.id, 'from')} /> )} 
            {isSink && ( <circle cx={end.y !== undefined ? end.x : 0} cy={end.y !== undefined ? end.y : 0} r={4} fill="#ef4444" stroke="white" strokeWidth={1} className="cursor-move hover:scale-125 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'streamPoint', c.id, 'to')} /> )} 
            {isSelected && c.waypoints?.map((w, idx) => ( <circle key={idx} cx={w.x} cy={w.y} r={5} fill="#f97316" stroke="white" strokeWidth={1} style={{ pointerEvents: 'all' }} className="cursor-move hover:scale-125 transition-transform" onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'waypoint', c.id, idx.toString()); }} onContextMenu={(e) => { e.stopPropagation(); handleContextMenu(e, 'waypoint', c.id, idx.toString()); }} /> ))}
        </g> 
    ); 
  };

  const activeItem = (activeTabId && activeTabId !== 'flowsheet') ? (
      nodes.find(n => n.id === activeTabId) || 
      connections.find(c => c.id === activeTabId)
  ) : null;

  const isNode = activeItem && 'type' in activeItem;
  const isGroupTab = !!getFilterTypeForTab(activeTabId);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-slate-50">
      <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
      <div className="flex-1 relative overflow-hidden bg-slate-50">
          <div className={`absolute inset-0 flex flex-col ${activeTabId === 'flowsheet' ? 'z-10 visible' : 'z-0 invisible pointer-events-none'}`}>
              <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 shadow-sm shrink-0">
                 <div className="flex items-center space-x-2">
                    <button onClick={() => setActiveTool('pointer')} className={`p-2 rounded-lg ${activeTool === 'pointer' ? 'bg-orange-100 text-orange-600' : 'text-slate-500'}`}><MousePointer2 className="w-5 h-5" /></button>
                    <button onClick={() => setActiveTool('stream')} className={`p-2 rounded-lg ${activeTool === 'stream' ? 'bg-orange-100 text-orange-600' : 'text-slate-500'}`}><Waves className="w-5 h-5" /></button>
                    <div className="h-6 w-px bg-slate-200 mx-2"></div>
                    <div className="flex items-center space-x-4 ml-2">
                        <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors" title="Otimização">
                            {hasOptimization ? <Zap className={`w-4 h-4 ${executionFlags.optimization ? 'text-orange-600 fill-orange-600' : 'text-slate-400'}`} /> : <Lock className="w-4 h-4 text-slate-400" />}
                            <ToggleSwitch enabled={executionFlags.optimization} onClick={() => hasOptimization && onToggleExecutionFlag('optimization')} disabled={!hasOptimization} activeColor="bg-orange-600" />
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors" title="Gráficos">
                            {hasCharts ? <BarChart3 className={`w-4 h-4 ${executionFlags.charts ? 'text-blue-600' : 'text-slate-400'}`} /> : <Lock className="w-4 h-4 text-slate-400" />}
                            <ToggleSwitch enabled={executionFlags.charts} onClick={() => hasCharts && onToggleExecutionFlag('charts')} disabled={!hasCharts} activeColor="bg-blue-600" />
                        </div>
                        <div className="flex items-center space-x-2 px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors" title="Economia">
                            {hasEconomics ? <DollarSign className={`w-4 h-4 ${executionFlags.economics ? 'text-green-600' : 'text-slate-400'}`} /> : <Lock className="w-4 h-4 text-slate-400" />}
                            <ToggleSwitch enabled={executionFlags.economics} onClick={() => hasEconomics && onToggleExecutionFlag('economics')} disabled={!hasEconomics} activeColor="bg-green-600" />
                        </div>
                    </div>
                 </div>
                 <div className="flex items-center space-x-2">
                     <button onClick={handleUploadClick} className="flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Carregar Projeto"> <Upload className="w-5 h-5" /> </button>
                     <button onClick={handleDownloadProject} className="flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Salvar Projeto"> <Download className="w-5 h-5" /> </button>
                     <div className="h-6 w-px bg-slate-200 mx-1"></div>
                     <button onClick={onUndo} disabled={!canUndo} className="flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Desfazer (Undo)"> <RotateCcw className="w-5 h-5" /> </button>
                     <button onClick={onRedo} disabled={!canRedo} className="flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title="Refazer (Redo)"> <RotateCw className="w-5 h-5" /> </button>
                     <div className="h-6 w-px bg-slate-200 mx-1"></div>
                     <button onClick={handleClearFlowsheetRequest} className="flex items-center justify-center p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Limpar Tudo"> <Trash2 className="w-5 h-5" /> </button>
                     <button onClick={handleLoadExample} className="flex items-center justify-center p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Carregar Exemplo"> <LayoutTemplate className="w-5 h-5" /> </button>
                     <div className="h-6 w-px bg-slate-200 mx-1"></div>
                     <button onClick={handleRunSimulation} className={`flex items-center justify-center p-2.5 rounded-lg font-bold text-white shadow-md transition-all ${simState === 'running' ? 'bg-green-600' : 'bg-orange-600 hover:bg-orange-700'}`} title={executionFlags.optimization ? "Run & Optimize" : "Run Simulation"}> <Play className="w-5 h-5" /> </button>
                    <button disabled={!simulationResult} onClick={onResetSimulation} className={`flex items-center justify-center p-2 rounded-lg transition-colors ml-1 ${!simulationResult ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:text-red-600'}`} title="Resetar Resultados"> <RefreshCcw className="w-5 h-5" /> </button>
                    <button disabled={!simulationResult} onClick={() => onOpenTab('results_summary')} className={`flex items-center justify-center p-2.5 rounded-lg font-bold shadow-md transition-all ml-1 ${!simulationResult ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700'}`} title="Resultados da Simulação"> <FileText className="w-5 h-5" /> </button>
                 </div>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden relative">
                 <div className="flex-1 relative overflow-hidden flex flex-col">
                    <div className="flex-1 relative overflow-hidden">
                        <div ref={canvasRef} className="absolute inset-0 overflow-auto bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] cursor-crosshair" onMouseMove={handleMouseMove} onMouseUp={(e) => handleMouseUp(e, 'canvas')} onMouseDown={(e) => handleMouseDown(e, 'canvas')} onContextMenu={(e) => handleContextMenu(e, 'canvas', 'canvas')}>
                            <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: contentSize.width, height: contentSize.height, minWidth: '100%', minHeight: '100%' }}> 
                                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible', zIndex: 20 }}> 
                                    {connections.map(renderConnection)} 
                                    {drawingLine && (<path d={getPath({x: drawingLine.startX, y: drawingLine.startY, dir: drawingLine.startDir ?? 0}, {x: drawingLine.currX, y: drawingLine.currY, dir: (drawingLine.startDir ?? 0 + 180) % 360})} stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" fill="none"/>)} 
                                </svg> 

                                {nodes.map(node => { 
                                    const config = EQUIPMENT_CONFIGS[node.type];
                                    const isSelected = selectedIds.includes(node.id);
                                    const isDragging = draggingNode?.id === node.id;
                                    const health = checkNodeHealth(node);
                                    const isUnhealthy = simulationResult && !health.isHealthy;
                                    const width = node.width || DEFAULT_WIDTHS[node.type] || DEFAULT_WIDTHS['DEFAULT'];
                                    const height = node.height || DEFAULT_HEIGHTS[node.type] || DEFAULT_HEIGHTS['DEFAULT'];
                                    const dynamicZIndex = isDragging ? 50 : isSelected ? 40 : 30;
                                    const dynamicCursor = activeTool === 'pointer' ? 'cursor-move' : 'cursor-crosshair';

                                    if (node.type === 'TableOverlay') {
                                        return (
                                            <div key={node.id} style={{ left: node.x, top: node.y, width: width, height: height, zIndex: dynamicZIndex + 5 }} className={`absolute bg-white rounded shadow-xl border-2 ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300'} overflow-hidden animate-in zoom-in-95 duration-200 ${dynamicCursor}`} onMouseDown={(e) => handleMouseDown(e, 'node', node.id)} onContextMenu={(e) => handleContextMenu(e, 'node', node.id)}>
                                                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                                                    <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Resumo Balanço de Correntes</span>
                                                    <div className="flex space-x-1">
                                                        <button onClick={(e) => {e.stopPropagation(); deleteItem();}} className="p-0.5 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                    </div>
                                                </div>
                                                <div className="p-0 overflow-x-auto h-full pb-8">
                                                    <table className="w-full text-[10px] text-left border-collapse">
                                                        <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                                                            <tr>
                                                                <th className="px-2 py-1.5 font-bold text-slate-700">Tag</th>
                                                                <th className="px-2 py-1.5 font-bold text-slate-700 text-right">Sol. ({units.massFlow})</th>
                                                                <th className="px-2 py-1.5 font-bold text-slate-700 text-right">%S</th>
                                                                <th className="px-2 py-1.5 font-bold text-slate-700 text-right">{units.volumeFlow}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {connections.length > 0 ? (
                                                                connections.map(c => {
                                                                    const s = simulationResult?.streams?.[c.id];
                                                                    if (!s) return null;
                                                                    return (
                                                                        <tr key={c.id} className="hover:bg-blue-50/30">
                                                                            <td className="px-2 py-1 font-medium text-slate-800">{c.label || 'Stream'}</td>
                                                                            <td className="px-2 py-1 text-right font-mono text-blue-600">{(s.solidsTph ?? 0).toFixed(1)}</td>
                                                                            <td className="px-2 py-1 text-right font-mono">{(s.percentSolids ?? 0).toFixed(1)}</td>
                                                                            <td className="px-2 py-1 text-right font-mono text-slate-500">{(s.totalTph / (s.slurryDensity || 1)).toFixed(1)}</td>
                                                                        </tr>
                                                                    );
                                                                })
                                                            ) : (
                                                                <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-400 italic">Nenhuma corrente ativa</td></tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                {isSelected && activeTool === 'pointer' && (
                                                    <div 
                                                        className="absolute bottom-0 right-0 w-6 h-6 bg-transparent cursor-nwse-resize z-30 flex items-end justify-end p-0.5"
                                                        onMouseDown={(e) => handleMouseDown(e, 'resize', node.id)}
                                                    >
                                                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-tl-sm shadow-sm" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    let ports = { inputs: config.inputs, outputs: config.outputs }; 
                                    if (node.type === 'Mixer') { 
                                        const inC = node.parameters.inputCount || 3; 
                                        const outC = node.parameters.outputCount || 1; 
                                        ports = { inputs: Array.from({length: inC}, (_, i) => ({ id: `in${i+1}`, type: 'input' as const })), outputs: Array.from({length: outC}, (_, i) => ({ id: `out${i+1}`, type: 'output' as const })) }; 
                                    }
                                    return ( 
                                <div key={node.id} style={{ left: node.x, top: node.y, width: width, height: height, zIndex: dynamicZIndex, transform: `rotate(${node.rotation || 0}deg)`, transformOrigin: '0 0' }} className={`absolute rounded-lg ${config.color.split(' ')[0]} border shadow-sm ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2' : ''} ${isUnhealthy ? 'border-red-500 border-4 animate-pulse ring-red-200 ring-offset-0 ring-4' : ''} overflow-visible ${dynamicCursor}`} onMouseDown={(e) => handleMouseDown(e, 'node', node.id)} onContextMenu={(e) => handleContextMenu(e, 'node', node.id)} onDoubleClick={() => openEditModal('node', node.id)} > 
                                    <div className="absolute inset-0 flex flex-col items-center justify-center"> 
                                        {node.type === 'Hydrocyclone' ? ( <HydrocycloneShape /> ) : node.type === 'Moinho' ? ( <BallMillShape /> ) : node.type === 'MoinhoRolos' ? ( <HPGRShape /> ) : node.type === 'FlotationCell' ? ( <FlotationCellShape /> ) : node.type === 'Mixer' ? ( <MixerShape /> ) : ( <config.icon className={`w-6 h-6 mb-1 ${config.color.split(' ').pop()}`} /> )}
                                    </div> 
                                    <div className="absolute cursor-move whitespace-nowrap px-1 py-0.5 rounded hover:bg-white/50 transition-colors z-[15] select-none" style={{ left: node.labelOffsetX ?? 0, top: node.labelOffsetY ?? -25, transform: `rotate(${- (node.rotation || 0)}deg)` }} onMouseDown={(e) => handleMouseDown(e, 'label', node.id)} >
                                    <span className={`text-[11px] font-bold px-1 rounded border shadow-sm ${isUnhealthy ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white/80 text-slate-800 border-slate-200/50'}`}>{node.label}</span>
                                    </div>
                                    {isSelected && activeTool === 'pointer' && (
                                    <div 
                                        className="absolute bottom-0 right-0 w-6 h-6 bg-transparent cursor-nwse-resize z-30 flex items-end justify-end p-0.5"
                                        onMouseDown={(e) => handleMouseDown(e, 'resize', node.id)}
                                    >
                                        <div className="w-2.5 h-2.5 bg-orange-500 rounded-tl-sm shadow-sm" />
                                    </div>
                                    )}
                                {ports.inputs.map((p, i) => {
                                    let style: React.CSSProperties = {top: `${((i + 1) * 100) / (ports.inputs.length + 1)}%`, left: -5, transform: 'translateY(-50%)'};
                                    if (node.type === 'Hydrocyclone' && p.id === 'feed') { style = { top: '40%', left: -5, transform: 'translateY(-50%)' }; }
                                    return ( <div key={p.id} style={style} className="absolute w-3.5 h-3.5 cursor-pointer z-20 hover:scale-150 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'port', node.id, p.id)} onMouseUp={(e) => handleMouseUp(e, 'port', node.id, p.id)} title="Entrada (Input)"> <svg viewBox="0 0 24 24" fill="#2563eb" className="drop-shadow-sm"><path d="M5 3l14 9-14 9V3z" /></svg> </div> );
                                })} 
                                {ports.outputs.map((p, i) => {
                                    let style: React.CSSProperties = {top: `${((i + 1) * 100) / (ports.outputs.length + 1)}%`, right: -5, transform: 'translateY(-50%)'};
                                    if (node.type === 'Hydrocyclone') {
                                        if (p.id === 'overflow') style = { top: -5, left: '50%', transform: 'translateX(-50%) rotate(-90deg)' };
                                        if (p.id === 'underflow') style = { bottom: -5, left: '50%', transform: 'translateX(-50%) rotate(90deg)' };
                                    }
                                    return ( <div key={p.id} style={style} className="absolute w-3.5 h-3.5 cursor-pointer z-20 hover:scale-150 transition-transform" onMouseDown={(e) => handleMouseDown(e, 'port', node.id, p.id)} onMouseUp={(e) => handleMouseUp(e, 'port', node.id, p.id)} title="Saída (Output)"> <svg viewBox="0 0 24 24" fill="#dc2626" className="drop-shadow-sm"><path d="M5 3l14 9-14 9V3z" /></svg> </div> );
                                })} 
                                </div> ); 
                                })} 
                                
                                {connections.map(c => {
                                    let start, end;
                                    if (c.fromNode) start = getAbsolutePortPosition(c.fromNode, c.fromPort!); else start = { x: c.fromX!, y: c.fromY!, dir: 0 };
                                    if (c.toNode) end = getAbsolutePortPosition(c.toNode, c.toPort!); else end = { x: c.toX!, y: c.toY!, dir: 180 };
                                    if (!start || !end) return null;
                                    const midX = (start.x + end.x) / 2;
                                    const midY = (start.y + end.y) / 2;
                                    const hasFlowProblem = simulationResult && simulationResult.streams?.[c.id] && simulationResult.streams[c.id].solidsTph <= 0 && c.fromNode;
                                    return (
                                        <div key={`${c.id}_label`} className="absolute cursor-move whitespace-nowrap px-1 py-0.5 rounded hover:bg-white/50 transition-colors z-[25] select-none" style={{ left: midX + (c.labelOffsetX ?? 0), top: midY + (c.labelOffsetY ?? -15), transform: 'translateX(-50%) translateY(-50%)' }} onMouseDown={(e) => handleMouseDown(e, 'label', c.id, undefined, true)} >
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${hasFlowProblem ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-white/80 text-slate-600 border-slate-200/50'}`}>{c.label}</span>
                                        </div>
                                    );
                                })}
                                {selectionRect && ( <div className="absolute border border-blue-500 bg-blue-500/10 pointer-events-none z-50" style={{ left: Math.min(selectionRect.startX, selectionRect.endX), top: Math.min(selectionRect.startY, selectionRect.endY), width: Math.abs(selectionRect.endX - selectionRect.startX), height: Math.abs(selectionRect.endY - selectionRect.startY), }} /> )} 
                            </div>
                        </div>
                        <div className="absolute right-6 bottom-6 flex flex-col space-y-3 z-30 pointer-events-none transition-all duration-300"> 
                            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 text-slate-600 pointer-events-auto transition-all active:scale-95"> <ZoomIn className="w-6 h-6" /> </button> 
                            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2.5 bg-white rounded-xl shadow-lg border border-slate-200 hover:bg-slate-50 text-slate-600 pointer-events-auto transition-all active:scale-95"> <ZoomOut className="w-6 h-6" /> </button> 
                        </div>
                    </div>
                    <div ref={sidebarRef} className="w-full bg-white border-t border-slate-200 flex flex-col shadow-inner z-10 shrink-0 transition-all duration-300">
                        <div className="flex bg-slate-50 border-b border-slate-200 items-center overflow-x-auto no-scrollbar scroll-smooth shrink-0">
                            <button 
                                onClick={() => setShowSidebar(!showSidebar)} 
                                className={`p-2.5 ml-2 rounded-lg transition-colors ${!showSidebar ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`}
                                title={showSidebar ? "Minimizar Barra de Ferramentas" : "Expandir Barra de Ferramentas"}
                            >
                                {showSidebar ? <PanelBottomClose className="w-5 h-5" /> : <PanelBottomOpen className="w-5 h-5" />}
                            </button>
                            <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />
                            {EQUIPMENT_GROUPS.map((group) => {
                                const GroupIcon = group.icon;
                                const isActive = activeEquipmentGroup === group.id;
                                return (
                                    <button
                                        key={group.id}
                                        onClick={() => {
                                            setActiveEquipmentGroup(group.id);
                                            if (!showSidebar) setShowSidebar(true);
                                        }}
                                        className={`flex items-center px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap
                                            ${isActive 
                                                ? 'border-blue-600 text-blue-600 bg-white' 
                                                : 'border-transparent text-slate-700 hover:text-slate-100'
                                            }`}
                                    >
                                        <GroupIcon className={`w-3.5 h-3.5 mr-2 ${isActive ? group.color : 'text-slate-400'}`} />
                                        {group.title}
                                    </button>
                                );
                            })}
                        </div>
                        {showSidebar && (
                            <div className="h-32 overflow-x-auto p-2.5 flex flex-row items-center space-x-2.5 custom-scrollbar bg-slate-50/30 animate-in slide-in-from-bottom-2 duration-200">
                                {EQUIPMENT_GROUPS.find(g => g.id === activeEquipmentGroup)?.types.map(type => {
                                    const config = EQUIPMENT_CONFIGS[type as NodeType];
                                    const key = type;
                                    return (
                                        <div 
                                            key={key} 
                                            draggable 
                                            onDragEnd={(e) => { 
                                                const rect = canvasRef.current?.getBoundingClientRect(); 
                                                if(rect) { 
                                                    const scrollLeft = canvasRef.current?.scrollLeft || 0; 
                                                    const scrollTop = canvasRef.current?.scrollTop || 0; 
                                                    const x = (e.clientX - rect.left + scrollLeft) / zoom - (DEFAULT_WIDTHS[key] || DEFAULT_WIDTHS['DEFAULT'])/2; 
                                                    const y = (e.clientY - rect.top + scrollTop) / zoom - (DEFAULT_HEIGHTS[key] || DEFAULT_HEIGHTS['DEFAULT'])/2; 
                                                    addNode(key as NodeType, x, y); 
                                                } 
                                            }} 
                                            className="flex flex-col items-center justify-center p-1.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md cursor-grab transition-all group min-w-[95px] h-20 select-none"
                                            title={config.label}
                                        > 
                                            <div className={`w-7 h-7 shrink-0 flex items-center justify-center rounded-lg mb-1 ${config.color.split(' ')[0]}`}> 
                                                {key === 'Moinho' ? <BallMillShape className="w-5 h-5" /> : 
                                                 key === 'MoinhoRolos' ? <HPGRShape className="w-5 h-5" /> : 
                                                 key === 'Hydrocyclone' ? <HydrocycloneShape className="w-5 h-5" /> : 
                                                 key === 'FlotationCell' ? <FlotationCellShape className="w-5 h-5" /> : 
                                                 key === 'Mixer' ? <MixerShape className="w-5 h-5" /> : 
                                                 <config.icon className={`w-4 h-4 ${config.color.split(' ').pop()}`} />} 
                                            </div> 
                                            <span className="text-[8px] font-black text-slate-600 text-center leading-tight uppercase truncate w-full px-1">{config.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                 </div>
              </div>
          </div>

          {contextMenu && (
              <div 
                  className="fixed z-50 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[180px] animate-in fade-in zoom-in-95 duration-100"
                  style={{ left: contextMenu.x, top: contextMenu.y }}
              >
                  {contextMenu.type === 'node' && (
                      <>
                          <button onClick={() => openEditModal('node', contextMenu.id)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <Edit className="w-3.5 h-3.5 mr-2 text-slate-400" /> Editar Parâmetros
                          </button>
                          <button onClick={() => handleRotateNode(contextMenu.id, 90)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <RotateCw className="w-3.5 h-3.5 mr-2 text-slate-400" /> Girar 90°
                          </button>
                          <button onClick={() => handleRotateNode(contextMenu.id, -90)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <RotateCcw className="w-3.5 h-3.5 mr-2 text-slate-400" /> Girar -90°
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button onClick={handleOpenDataSheetFromContext} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" /> Ver Data Sheet
                          </button>
                      </>
                  )}
                  {contextMenu.type === 'connection' && (
                      <>
                          <button onClick={() => openEditModal('connection', contextMenu.id)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <Edit className="w-3.5 h-3.5 mr-2 text-slate-400" /> Editar Corrente
                          </button>
                          <button onClick={() => handleClearWaypoints(contextMenu.id)} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <RefreshCcw className="w-3.5 h-3.5 mr-2 text-slate-400" /> Limpar Pontos de Rota
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button onClick={handleOpenDataSheetFromContext} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <FileText className="w-3.5 h-3.5 mr-2 text-slate-400" /> Ver Data Sheet
                          </button>
                      </>
                  )}
                  {contextMenu.type === 'waypoint' && (
                      <button onClick={() => handleRemoveSingleWaypoint(contextMenu.id, parseInt(contextMenu.extra || '0'))} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center font-medium">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Remover Ponto
                      </button>
                  )}
                  {contextMenu.type === 'canvas' && (
                      <>
                          <button onClick={handlePasteStreamTable} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <Table className="w-3.5 h-3.5 mr-2 text-slate-400" /> Colar Tabela de Resumo
                          </button>
                          <button onClick={handleSelectAll} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <Grid className="w-3.5 h-3.5 mr-2 text-slate-400" /> Selecionar Tudo
                          </button>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button onClick={handleLoadExample} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center">
                              <LayoutTemplate className="w-3.5 h-3.5 mr-2 text-slate-400" /> Carregar Fluxograma Exemplo
                          </button>
                      </>
                  )}
                  {contextMenu.type !== 'canvas' && contextMenu.type !== 'waypoint' && (
                      <>
                          <div className="h-px bg-slate-100 my-1"></div>
                          <button onClick={deleteItem} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center font-medium">
                              <Trash2 className="w-3.5 h-3.5 mr-2" /> Deletar Seleção
                          </button>
                      </>
                  )}
              </div>
          )}

          {showDataSheet && dataSheetItem && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                          <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                  <FileText className="w-6 h-6" />
                              </div>
                              <div>
                                  <h2 className="text-xl font-bold text-slate-800">Folha de Dados Técnicos</h2>
                                  <p className="text-sm text-slate-500 font-mono">TAG: {dataSheetItem.label}</p>
                              </div>
                          </div>
                          <button onClick={() => setShowDataSheet(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                          <pre className="bg-slate-900 text-emerald-400 p-6 rounded-xl font-mono text-xs leading-relaxed shadow-inner overflow-x-auto whitespace-pre">
                              {generateDataSheetText(dataSheetItem)}
                          </pre>
                      </div>
                      <div className="p-6 border-t border-slate-100 flex justify-end space-x-3 bg-slate-50 rounded-b-2xl">
                          <button 
                              onClick={() => {
                                  navigator.clipboard.writeText(generateDataSheetText(dataSheetItem));
                                  alert('Dados copiados para a área de transferência!');
                              }}
                              className="px-6 py-2 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 flex items-center transition-all shadow-md"
                          >
                              <Clipboard className="w-4 h-4 mr-2" /> Copiar Texto
                          </button>
                          <button onClick={() => setShowDataSheet(false)} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all">
                              Fechar
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {showClearConfirm && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-in zoom-in-95 duration-200">
                      <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                          <AlertTriangle className="w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 mb-2">Limpar Fluxograma?</h2>
                      <p className="text-slate-500 mb-8 leading-relaxed">Você está prestes a deletar todos os equipamentos e correntes desta simulação. Esta ação não poderá ser desfeita.</p>
                      <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setShowClearConfirm(false)} className="px-6 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancelar</button>
                          <button onClick={handleConfirmClear} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all shadow-lg shadow-red-200">Sim, Limpar Tudo</button>
                      </div>
                  </div>
              </div>
          )}
      </div>

      <div className={`absolute inset-0 z-0 ${activeTabId !== 'flowsheet' ? 'visible' : 'invisible'}`}>
          {['results_summary', 'results_streams', 'results_performance', 'results_console'].includes(activeTabId) && (
              <ResultsView 
                  results={simulationResult} 
                  connections={connections} 
                  projectName={projectName}
                  units={units}
                  onNavigate={onNavigate}
                  logs={logs}
                  activeTab={activeTabId === 'results_summary' ? 'summary' : activeTabId === 'results_streams' ? 'streams' : activeTabId === 'results_performance' ? 'performance' : 'console'}
                  hideHeader={true}
              />
          )}
          {activeTabId === 'results_report' && (
              <ResultsView 
                  results={simulationResult} 
                  connections={connections} 
                  projectName={projectName}
                  units={units}
                  onNavigate={onNavigate}
                  logs={logs}
                  hideHeader={true}
              />
          )}
          {activeTabId === 'economics' && (
              <div className="h-full w-full bg-white overflow-y-auto p-12">
                  {executionFlags.economics ? (
                      <EconomicsView results={simulationResult} units={units} />
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                              <DollarSign className="w-12 h-12 text-slate-200" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo de Economia Desativado</h3>
                          <p className="text-slate-500 max-w-sm">Ative o botão de economia ($) na barra de ferramentas do fluxograma para processar e visualizar dados financeiros.</p>
                      </div>
                  )}
              </div>
          )}
          {activeTabId === 'charts' && (
              <div className="h-full w-full bg-white overflow-y-auto p-12">
                  {executionFlags.charts ? (
                      <ChartsView results={simulationResult} connections={connections} units={units} />
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                              <BarChart3 className="w-12 h-12 text-slate-200" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo de Gráficos Desativado</h3>
                          <p className="text-slate-500 max-w-sm">Ative o botão de gráficos na barra de ferramentas do fluxograma para visualizar as distribuições e balanços gráficos.</p>
                      </div>
                  )}
              </div>
          )}
          {activeTabId === 'units' && (
              <div className="h-full w-full bg-white overflow-y-auto">
                  <UnitsView units={units} setUnits={setUnits} projectName={projectName} onNavigateBack={() => onSwitchTab('flowsheet')} />
              </div>
          )}
          {activeTabId === 'components' && (
              <div className="h-full w-full bg-white overflow-y-auto">
                  <ComponentsView minerals={minerals} setMinerals={setMinerals} />
              </div>
          )}
          {activeTabId === 'kinetics' && (
              <div className="h-full w-full bg-white overflow-y-auto">
                  <KineticsView customModels={customModels} setCustomModels={setCustomModels} />
              </div>
          )}
          {activeTabId === 'optimization' && (
              <div className="h-full w-full bg-white overflow-y-auto p-12">
                  {executionFlags.optimization ? (
                      <OptimizationView nodes={nodes} connections={connections} minerals={minerals} customModels={customModels} />
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in">
                          <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                              <Zap className="w-12 h-12 text-slate-200" />
                          </div>
                          <h3 className="text-xl font-bold text-slate-800 mb-2">Módulo de Otimização Desativado</h3>
                          <p className="text-slate-500 max-w-sm">Ative o botão de otimização (raio) na barra de ferramentas do fluxograma para habilitar a exploração de cenários por IA.</p>
                      </div>
                  )}
              </div>
          )}
          {activeTabId === 'reports' && (
              <div className="h-full w-full bg-white overflow-y-auto">
                  <ResultsView 
                    results={simulationResult} 
                    connections={connections} 
                    projectName={projectName}
                    units={units}
                    onNavigate={onNavigate}
                    logs={logs}
                    activeTab="summary"
                    hideHeader={true}
                  />
              </div>
          )}
          {isGroupTab && (
              <div className="h-full w-full bg-white overflow-hidden">
                  <ParametersView
                      nodes={nodes}
                      connections={connections}
                      minerals={minerals}
                      customModels={customModels}
                      units={units}
                      onUpdateNode={handleUpdateNode}
                      onUpdateConnection={handleUpdateConnection}
                      onNavigateToProject={() => onSwitchTab('flowsheet')}
                      filterType={getFilterTypeForTab(activeTabId)}
                  />
              </div>
          )}
          {activeItem && !isNode && !isGroupTab && !['results_summary', 'results_streams', 'results_performance', 'results_console', 'results_report', 'economics', 'charts', 'units', 'components', 'kinetics', 'optimization', 'reports'].includes(activeTabId) && (
              <div className="h-full w-full bg-white overflow-y-auto p-12">
                  <div className="max-w-[95%] mx-auto">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                          <div className="flex items-center space-x-3 w-full">
                              <div className="p-3 bg-cyan-100 text-cyan-600 rounded-xl shrink-0">
                                  <Waves className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <input 
                                      type="text" 
                                      value={activeItem.label || ''} 
                                      onChange={(e) => handleLabelChange(activeItem.id, e.target.value)}
                                      className="text-2xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none w-full transition-colors"
                                      placeholder="Nome da Corrente"
                                  />
                                  <p className="text-sm text-slate-500 font-mono">ID: {activeItem.id} (Configuração de Corrente)</p>
                              </div>
                          </div>
                      </div>
                      <StreamForm 
                          params={activeItem.parameters} 
                          onChange={(k, v) => handleParamChange(activeItem.id, k, v)} 
                          minerals={minerals} 
                          units={units} 
                          streamState={(activeItem as Connection).streamState}
                          isFeed={!(activeItem as Connection).fromNode}
                          isClassicOutput={(() => {
                              const conn = activeItem as Connection;
                              const sourceNode = conn.fromNode ? nodes.find(n => n.id === conn.fromNode) : null;
                              return sourceNode?.parameters?.interactionMode === 'Classic';
                          })()}
                      />
                  </div>
              </div>
          )}
          {activeItem && isNode && !isGroupTab && !['results_summary', 'results_streams', 'results_performance', 'results_console', 'results_report', 'economics', 'charts', 'units', 'components', 'kinetics', 'optimization', 'reports'].includes(activeTabId) && (
              <div className="h-full w-full bg-white overflow-y-auto p-12">
                  <div className="max-w-[95%] mx-auto">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                          <div className="flex items-center space-x-3 w-full">
                              <div className="p-3 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                                  <Settings2 className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                  <input 
                                      type="text" 
                                      value={activeItem.label || ''} 
                                      onChange={(e) => handleLabelChange(activeItem.id, e.target.value)}
                                      className="text-2xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 outline-none w-full transition-colors"
                                      placeholder="Tag do Equipamento"
                                  />
                                  <p className="text-sm text-slate-500 font-mono">ID: {activeItem.id} ({activeItem.type})</p>
                              </div>
                          </div>
                      </div>
                      {activeItem.type === 'Moinho' && <MillForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(activeItem.id, k, v)} units={units} />}
                      {activeItem.type === 'MoinhoSAG' && <SagMillForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(activeItem.id, k, v)} units={units} />}
                      {activeItem.type === 'MoinhoRolos' && <HPGRForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(activeItem.id, k, v)} units={units} />}
                      {activeItem.type === 'BritadorGiratorio' && <GyratoryForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(activeItem.id, k, v)} units={units} />}
                      {activeItem.type === 'BritadorMandibula' && <JawCrusherForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(activeItem.id, k, v)} units={units} />}
                      {activeItem.type === 'Hydrocyclone' && (
                          <CycloneForm 
                              params={activeItem.parameters} 
                              onChange={(k, v) => handleParamChange(activeItem.id, k, v)} 
                              minerals={minerals} 
                              units={units} 
                              streamState={connections.find(c => c.toNode === activeItem.id)?.streamState}
                              ofStream={connections.find(c => c.fromNode === activeItem.id && c.fromPort === 'overflow')?.streamState}
                              ufStream={connections.find(c => c.fromNode === activeItem.id && c.fromPort === 'underflow')?.streamState}
                          />
                      )}
                      {activeItem.type === 'FlotationCell' && (
                          <FlotationForm 
                              params={activeItem.parameters} 
                              onChange={(k, v) => handleParamChange(activeItem.id, k, v)} 
                              minerals={minerals} 
                              customModels={customModels}
                              units={units}
                          />
                      )}
                      {activeItem.type === 'Mixer' && <MixerForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(activeItem.id, k, v)} units={units} />}
                      {!['Feed', 'Moinho', 'MoinhoSAG', 'MoinhoRolos', 'BritadorGiratorio', 'BritadorMandibula', 'Hydrocyclone', 'FlotationCell', 'Mixer'].includes(activeItem.type) && 
                          <DefaultForm params={activeItem.parameters} onChange={(k, v) => handleParamChange(activeItem.id, k, v)} />
                      }
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

const CheckCircleMini = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
       <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
       <path d="m9 11 3 3L22 4" />
    </svg>
 );
