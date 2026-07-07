
export enum EquipmentType {
  DASHBOARD = 'DASHBOARD',
  COMMUNITY = 'COMMUNITY',
  PROJECT = 'PROJECT', 
  FLOWSHEET = 'FLOWSHEET', 
  PARAMETERS = 'PARAMETERS',
  RESULTS = 'RESULTS',
  RESULTS_SUMMARY = 'RESULTS_SUMMARY',
  RESULTS_STREAMS = 'RESULTS_STREAMS',
  RESULTS_PERFORMANCE = 'RESULTS_PERFORMANCE',
  RESULTS_CONSOLE = 'RESULTS_CONSOLE',
  ECONOMICS = 'ECONOMICS',
  UNITS = 'UNITS',
  COMPONENTS = 'COMPONENTS',
  KINETICS = 'KINETICS',
  CHARTS = 'CHARTS',
  OPTIMIZATION = 'OPTIMIZATION',
  REPORTS = 'REPORTS',
  HELP = 'HELP',
  ADMIN = 'ADMIN',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  TERMS_OF_SERVICE = 'TERMS_OF_SERVICE',
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  
  SET_EQUIPMENT_GROUP = 'SET_EQUIPMENT_GROUP',
  SET_MILL_GROUP = 'SET_MILL_GROUP',
  SET_BALL_MILL = 'SET_BALL_MILL',
  SET_SAG_MILL = 'SET_SAG_MILL',
  SET_HPGR = 'SET_HPGR',
  SET_CONE_CRUSHER = 'SET_CONE_CRUSHER',
  SET_GYRATORY_CRUSHER = 'SET_GYRATORY_CRUSHER',
  SET_JAW_CRUSHER = 'SET_JAW_CRUSHER',
  
  SET_CLASSIFICATION_GROUP = 'SET_CLASSIFICATION_GROUP',
  SET_CYCLONE = 'SET_CYCLONE',
  
  SET_CONCENTRATION_GROUP = 'SET_CONCENTRATION_GROUP',
  SET_FLOTATION = 'SET_FLOTATION',
  
  SET_SOLID_LIQUID_GROUP = 'SET_SOLID_LIQUID_GROUP',
  SET_THICKENER = 'SET_THICKENER',
  
  SET_AUXILIARY_GROUP = 'SET_AUXILIARY_GROUP',
  SET_MIXER = 'SET_MIXER',
  SET_SPLITTER = 'SET_SPLITTER',

  SET_STREAMS_GROUP = 'SET_STREAMS_GROUP',

  SET_CRUSHER = 'SET_CRUSHER', 
  SET_OTHERS = 'SET_OTHERS'
}

export type PlanType = 'Starter' | 'Pro' | 'Enterprise';

export interface PlanPermissions {
  [key: string]: EquipmentType[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  credits: number;
  plan: PlanType;
  is_admin: boolean;
  stripe_customer_id?: string;
  trial_end_date?: string;
  is_trial_active?: boolean;
  days_free?: number;
  updated_at?: string;
  is_fan_club_member?: boolean;
  last_payment_amount?: number;
  stripe_subscription_id?: string;
}

export interface UnitConfig {
  massFlow: string;
  volumeFlow: string;
  pressure: string;
  length: string;
  diameter: string;
  solidDensity: string;
  liquidDensity: string;
  power: string;
  specificEnergy: string;
  particleSize: string;
}

export interface EquationParameter {
  name: string;
  label: string;
  unit: string;
  defaultValue: number;
}

export interface EquipmentEquation {
  id: string;
  equipment_type: string;
  name: string;
  formula: string;
  parameters: EquationParameter[];
  is_system_default: boolean;
  user_id?: string;
}

export interface UnitDefinition {
  id: string;
  category: keyof UnitConfig;
  symbol: string;
  name: string;
  to_base_factor: number;
  is_base_unit: boolean;
}

export const DEFAULT_UNITS: UnitConfig = {
  massFlow: 't/h',
  volumeFlow: 'm³/h',
  pressure: 'kPa',
  length: 'm',
  diameter: 'm',
  solidDensity: 't/m³',
  liquidDensity: 't/m³',
  power: 'kW',
  specificEnergy: 'kWh/t',
  particleSize: 'µm'
};

export interface PSDPoint {
  size: number;
  passing: number; 
}

export interface PSDVector {
  sizes: number[];     
  massFractions: number[]; 
}

export interface StreamData {
  totalTph: number;
  solidsTph: number;
  waterTph: number;
  percentSolids: number;
  slurryDensity: number;
  mineralFlows: Record<string, number>;
  elementalAssays?: Record<string, number>;
  elementalMassFlows?: Record<string, number>;
  sgSolids: number;
  p80?: number;
  f80?: number;
  psd?: PSDPoint[];
  psdVector?: PSDVector; 
}

export interface Component {
  id: string;
  name: string;
  formula: string;
  density: number;
  abrasionIndex: number;
  workIndex: number;
  class: string;
  selected?: boolean;
  molecularWeight?: number;
  casNumber?: string;
  elementalComposition?: string;
  stoichiometry?: Record<string, number>;
  color?: string;
}

export interface RecoveryModel {
  id: string;
  name: string;
  targetElement: string;
  equation?: string;
  useStandardEquation?: boolean;
  coefficients: {
    baseRecovery: number;
    k_ph: number;
    optimal_ph: number;
    k_collector: number;
    k_time: number;
    k_air: number;
    k_rotor: number;
  };
  customParameters?: Record<string, number>;
}

export interface BallMillInputs {
  diameter: number;
  length: number;
  speedPctCrit: number;
  fillingBallsPct: number;
  fillingDegreePct: number;
  slurryFillingPct: number;
  linerAngle: number;
  oreDensity: number;
  ballDensity: number;
  powerLossFactor: number;
  alpha0: number;
  alpha1: number;
  alpha2: number;
  dCrit: number;
  beta0: number;
  beta1: number;
  beta2: number;
  interactionMode: 'Standard' | 'Parameterized' | 'Advanced' | 'Classic';
  targetDischargeSolids: number;
}

export interface HydrocycloneInputs {
  pressure: number;
  feedDensity: number;
  d50Req: number;
  numberOfCyclones: number;
  waterRecoveryToUnderflow: number;
  shortCircuit: number;
  diameter: number;
  height: number;
  inletDiameter: number;
  vortexFinderDiameter: number;
  apexDiameter: number;
  overflowSolids: number;
  underflowSolids: number;
  millDischargeSolids: number;
  k1?: number;
  k2?: number;
  k3?: number;
  k4?: number;
  lambda?: number;
  bpc?: number;
  interactionMode?: 'Standard' | 'Parameterized' | 'Advanced' | 'Classic';
  oreDensity?: number;
}

export type FlotationCalculationMethod = 'Stoichiometric' | 'Yield' | 'Klimpel' | 'Kelsall' | 'Garcia-Zuniga' | 'Database_Model';

export interface FlotationInputs {
  calculationMethod?: FlotationCalculationMethod;
  concentrationRatio: number;
  targetRecovery?: number;
  mineralYields?: Record<string, number>;
  waterSplit?: number;
  residenceTime: number;
  ph: number;
  collectorDosage: number;
  frotherDosage: number;
  airFlow: number;
  rotorSpeed: number;
  recoveryModelId?: string;
  rMax?: number;
  targetElement?: string;
}

export type NodeType = 'Feed' | 'Product' | 'Mixer' | 'Splitter' | 'Moinho' | 'MoinhoSAG' | 'MoinhoRolos' | 'Britador' | 'BritadorGiratorio' | 'BritadorMandibula' | 'Hydrocyclone' | 'FlotationCell' | 'Conditioner' | 'Thickener' | 'TableOverlay';

export interface Port {
  id: string;
  type: 'input' | 'output';
  label?: string;
}

export interface EquipmentConfig {
  type: NodeType;
  icon: any;
  label: string;
  color: string;
  inputs: Port[];
  outputs: Port[];
  defaultParameters?: Record<string, any>;
}

export interface NodeData {
  id: string;
  type: NodeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  label: string;
  parameters: Record<string, any>;
  rotation?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export interface Waypoint {
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  label?: string;
  fromNode?: string;
  fromPort?: string;
  fromX?: number;
  fromY?: number;
  toNode?: string;
  toPort?: string;
  toX?: number;
  toY?: number;
  parameters?: Record<string, any>;
  streamState?: StreamData;
  labelOffsetX?: number;
  labelOffsetY?: number;
  waypoints?: Waypoint[];
}

export type LogType = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: number;
  timestamp: string;
  type: LogType;
  message: string;
}

export interface OptimizationScenario {
  id: string;
  name: string;
  parameters: Record<string, number>;
  results: {
    recovery: number;
    grade: number;
    throughput: number;
    powerConsumption: number;
    waterConsumption: number;
    economicScore: number;
  };
  isBaseline?: boolean;
}

export interface AIChatMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  relatedScenarioId?: string;
}

export type NotificationType = 'system' | 'community' | 'simulation' | 'credit' | 'info';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  read: boolean;
  linkTo?: EquipmentType;
}