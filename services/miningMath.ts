
import { Component, RecoveryModel } from '../types';
import { calculateStreamProperties, calculateStreamAssays, parseStoichiometry } from './models/sharedModels';
import { calculateBondPower } from './models/millModels';
import { calculateCyclonePerformance } from './models/cycloneModels';
import { calculateFlotationPerformance } from './models/flotationModels';

// Re-exporta para manter compatibilidade com o flowsheetSolver existente
export { 
    calculateStreamProperties, 
    calculateStreamAssays, 
    parseStoichiometry,
    calculateBondPower,
    calculateCyclonePerformance,
    calculateFlotationPerformance
};

export const COMPONENT_DB: Component[] = [
  // ELEMENTOS
  { id: 'el_cu', name: 'Cobre Nativo', formula: 'Cu', density: 8.96, abrasionIndex: 0.1, workIndex: 12.0, class: 'Element', molecularWeight: 63.54, casNumber: '7440-50-8', elementalComposition: 'Cu: 100.0%', color: 'Copper Red', selected: true },
  { id: 'el_au', name: 'Ouro Nativo', formula: 'Au', density: 19.3, abrasionIndex: 0.01, workIndex: 6.0, class: 'Element', molecularWeight: 196.97, casNumber: '7440-57-5', elementalComposition: 'Au: 100.0%', color: 'Golden', selected: true },
  
  // MINERAIS INORGÂNICOS
  { id: '1', name: 'Quartzo', formula: 'SiO2', density: 2.65, abrasionIndex: 0.75, workIndex: 13.5, class: 'Mineral', molecularWeight: 60.08, casNumber: '14808-60-7', elementalComposition: 'Si: 46.7%, O: 53.3%', color: 'White', selected: true },
  { id: '6', name: 'Calcopirita', formula: 'CuFeS2', density: 4.2, abrasionIndex: 0.12, workIndex: 10.5, class: 'Mineral', molecularWeight: 183.5, casNumber: '1308-56-1', elementalComposition: 'Cu: 34.6%, Fe: 30.4%, S: 35.0%', color: 'Brass Yellow', selected: true },
  { id: 'bornite', name: 'Bornita', formula: 'Cu5FeS4', density: 5.07, abrasionIndex: 0.15, workIndex: 11.2, class: 'Mineral', molecularWeight: 501.8, casNumber: '1308-81-2', elementalComposition: 'Cu: 63.3%, Fe: 11.1%, S: 25.6%', color: 'Peacock Ore', selected: true },
  { id: 'chalcocite', name: 'Calcocita', formula: 'Cu2S', density: 5.60, abrasionIndex: 0.1, workIndex: 9.8, class: 'Mineral', molecularWeight: 159.16, casNumber: '22205-45-4', elementalComposition: 'Cu: 79.9%, S: 20.1%', color: 'Dark Gray', selected: true },
  { id: '5', name: 'Pirita', formula: 'FeS2', density: 5.01, abrasionIndex: 0.45, workIndex: 14.0, class: 'Mineral', molecularWeight: 119.9, casNumber: '1309-36-0', elementalComposition: 'Fe: 46.5%, S: 53.5%', color: 'Pale Gold', selected: true },
  
  // REAGENTES SOLICITADOS
  { id: 'reag_cmc', name: 'Carboximetilcelulose (CMC)', formula: 'C8H15NaO8', density: 1.6, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 242.16, casNumber: '9004-32-4', elementalComposition: 'C: 39.7%, Na: 9.5%', color: 'White Powder', selected: false },
  { id: 'reag_pam', name: 'Poliacrilamida (PAM)', formula: '(C3H5NO)n', density: 1.3, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 71.08, casNumber: '9003-05-8', elementalComposition: 'N: 19.7%', color: 'Granular', selected: false },
  { id: 'reag_amidex', name: 'Amidex (Amido Modificado)', formula: '(C6H10O5)n', density: 1.5, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 162.14, casNumber: '9005-25-8', color: 'Beige', selected: true },
  { id: 'reag_dtp', name: 'Ditiofosfato de Sódio', formula: 'C4H10NaO2PS2', density: 1.1, abrasionIndex: 0, workIndex: 0, class: 'Inorganic', molecularWeight: 208.21, casNumber: '3338-24-7', elementalComposition: 'P: 14.9%, S: 30.8%', color: 'Amber Liquid', selected: false },
  { id: 'reag_dtc', name: 'Ditiocarbonato (Xantato)', formula: 'C3H5NaOS2', density: 1.2, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 144.19, casNumber: '140-89-6', elementalComposition: 'S: 44.5%', color: 'Yellow pellets', selected: false },

  // OUTROS REAGENTES
  { id: 'org_sipx', name: 'Coletor SIPX', formula: 'C4H7NaOS2', density: 1.2, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 158.2, casNumber: '140-93-2', elementalComposition: 'S: 40.5%', color: 'Yellowish', selected: false },
  { id: 'org_mibc', name: 'Espumante MIBC', formula: 'C6H14O', density: 0.81, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 102.17, casNumber: '108-11-2', color: 'Colorless', selected: false },
  { id: 'in_caoh2', name: 'Cal Hidratada', formula: 'Ca(OH)2', density: 2.21, abrasionIndex: 0, workIndex: 0, class: 'Inorganic', molecularWeight: 74.09, casNumber: '1305-62-0', color: 'White Powder', selected: true },
];

export const STANDARD_MODELS: RecoveryModel[] = [
  {
    id: 'std_cu_sulfide',
    name: 'Cobre (Sulfetado)',
    targetElement: 'Cu',
    useStandardEquation: true,
    equation: 'R = R_max * (1 - exp(-k * t))',
    coefficients: { baseRecovery: 82, k_ph: -1.8, optimal_ph: 10.5, k_collector: 0.12, k_time: 2.5, k_air: 0.65, k_rotor: 0.04 }
  },
  {
    id: 'std_au_pyrite',
    name: 'Ouro (Assoc. Pirita)',
    targetElement: 'Au',
    useStandardEquation: true,
    equation: 'R = R_max * (1 - exp(-k * t))',
    coefficients: { baseRecovery: 75, k_ph: -0.8, optimal_ph: 9.0, k_collector: 0.15, k_time: 3.5, k_air: 0.5, k_rotor: 0.03 }
  },
  {
    id: 'std_klimpel_generic',
    name: 'Modelo de Klimpel',
    targetElement: 'Any',
    useStandardEquation: true,
    equation: 'R = R_max * [1 - (1/(k*t)) * (1 - e^(-k*t))]',
    coefficients: { baseRecovery: 50, k_ph: 0.2, optimal_ph: 10.0, k_collector: 0.05, k_time: 0, k_air: 0.02, k_rotor: 0.01 }
  }
];
