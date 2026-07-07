
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
  { id: 'el_ag', name: 'Prata Nativa', formula: 'Ag', density: 10.5, abrasionIndex: 0.05, workIndex: 8.0, class: 'Element', molecularWeight: 107.87, casNumber: '7440-22-4', elementalComposition: 'Ag: 100.0%', color: 'Silver', selected: false },
  { id: 'el_graphite', name: 'Grafita', formula: 'C', density: 2.23, abrasionIndex: 0.05, workIndex: 9.0, class: 'Element', molecularWeight: 12.01, casNumber: '7782-42-5', elementalComposition: 'C: 100.0%', color: 'Dark Gray', selected: false },
  { id: 'el_diamond', name: 'Diamante', formula: 'C', density: 3.51, abrasionIndex: 0.95, workIndex: 10.0, class: 'Element', molecularWeight: 12.01, casNumber: '7782-40-3', elementalComposition: 'C: 100.0%', color: 'Crystal', selected: false },
  
  // MINERAIS INORGÂNICOS (SULFETOS)
  { id: '1', name: 'Quartzo', formula: 'SiO2', density: 2.65, abrasionIndex: 0.75, workIndex: 13.5, class: 'Mineral', molecularWeight: 60.08, casNumber: '14808-60-7', elementalComposition: 'Si: 46.7%, O: 53.3%', color: 'White', selected: true },
  { id: '6', name: 'Calcopirita', formula: 'CuFeS2', density: 4.19, abrasionIndex: 0.12, workIndex: 10.5, class: 'Mineral', molecularWeight: 183.5, casNumber: '1308-56-1', elementalComposition: 'Cu: 34.6%, Fe: 30.4%, S: 35.0%', color: 'Brass Yellow', selected: true },
  { id: 'bornite', name: 'Bornita', formula: 'Cu5FeS4', density: 5.07, abrasionIndex: 0.15, workIndex: 11.2, class: 'Mineral', molecularWeight: 501.8, casNumber: '1308-81-2', elementalComposition: 'Cu: 63.3%, Fe: 11.1%, S: 25.6%', color: 'Peacock Ore', selected: true },
  { id: 'chalcocite', name: 'Calcocita', formula: 'Cu2S', density: 5.60, abrasionIndex: 0.1, workIndex: 9.8, class: 'Mineral', molecularWeight: 159.16, casNumber: '22205-45-4', elementalComposition: 'Cu: 79.9%, S: 20.1%', color: 'Dark Gray', selected: true },
  { id: '5', name: 'Pirita', formula: 'FeS2', density: 5.01, abrasionIndex: 0.45, workIndex: 14.0, class: 'Mineral', molecularWeight: 119.9, casNumber: '1309-36-0', elementalComposition: 'Fe: 46.5%, S: 53.5%', color: 'Pale Gold', selected: true },
  { id: 'galena', name: 'Galena', formula: 'PbS', density: 7.58, abrasionIndex: 0.05, workIndex: 10.1, class: 'Mineral', molecularWeight: 239.27, casNumber: '12179-39-4', elementalComposition: 'Pb: 86.6%, S: 13.4%', color: 'Silver Gray', selected: false },
  { id: 'sphalerite', name: 'Esfarelita', formula: 'ZnS', density: 4.09, abrasionIndex: 0.12, workIndex: 11.5, class: 'Mineral', molecularWeight: 97.47, casNumber: '12169-20-9', elementalComposition: 'Zn: 67.1%, S: 32.9%', color: 'Brownish', selected: false },
  { id: 'molybdenite', name: 'Molibdenita', formula: 'MoS2', density: 4.73, abrasionIndex: 0.08, workIndex: 11.8, class: 'Mineral', molecularWeight: 160.07, casNumber: '1317-33-5', elementalComposition: 'Mo: 59.9%, S: 40.1%', color: 'Gray Blue', selected: false },
  { id: 'arsenopyrite', name: 'Arsenopirita', formula: 'FeAsS', density: 6.07, abrasionIndex: 0.4, workIndex: 13.0, class: 'Mineral', molecularWeight: 162.83, casNumber: '1303-18-0', elementalComposition: 'Fe: 34.3%, As: 46.0%, S: 19.7%', color: 'Steel Gray', selected: false },
  { id: 'pentlandite', name: 'Pentlandita', formula: '(Fe,Ni)9S8', density: 4.8, abrasionIndex: 0.25, workIndex: 12.2, class: 'Mineral', molecularWeight: 772.13, casNumber: '53809-86-2', elementalComposition: 'Ni: 34.2%, Fe: 32.5%, S: 33.2%', color: 'Bronze', selected: false },
  { id: 'covellite', name: 'Covellita', formula: 'CuS', density: 4.68, abrasionIndex: 0.1, workIndex: 10.0, class: 'Mineral', molecularWeight: 95.62, casNumber: '19139-68-5', elementalComposition: 'Cu: 66.5%, S: 33.5%', color: 'Indigo Blue', selected: false },
  { id: 'pyrrhotite', name: 'Pirrotita', formula: 'Fe7S8', density: 4.61, abrasionIndex: 0.35, workIndex: 13.0, class: 'Mineral', molecularWeight: 647.28, casNumber: '1310-50-9', elementalComposition: 'Fe: 60.4%, S: 39.6%', color: 'Bronze Yellow', selected: false },
  { id: 'tetrahedrite', name: 'Tetraedrita', formula: 'Cu12Sb4S13', density: 4.97, abrasionIndex: 0.18, workIndex: 11.0, class: 'Mineral', molecularWeight: 1664.24, casNumber: '12054-35-2', elementalComposition: 'Cu: 45.8%, Sb: 29.3%, S: 24.9%', color: 'Flint Gray', selected: false },
  
  // ÓXIDOS E HIDRÓXIDOS
  { id: 'hematite', name: 'Hematita', formula: 'Fe2O3', density: 5.26, abrasionIndex: 0.35, workIndex: 12.8, class: 'Mineral', molecularWeight: 159.69, casNumber: '1317-60-8', elementalComposition: 'Fe: 69.9%, O: 30.1%', color: 'Reddish Black', selected: false },
  { id: 'magnetite', name: 'Magnetita', formula: 'Fe3O4', density: 5.17, abrasionIndex: 0.4, workIndex: 14.2, class: 'Mineral', molecularWeight: 231.53, casNumber: '1317-61-9', elementalComposition: 'Fe: 72.4%, O: 27.6%', color: 'Black', selected: false },
  { id: 'cassiterite', name: 'Cassiterita', formula: 'SnO2', density: 6.95, abrasionIndex: 0.6, workIndex: 15.0, class: 'Mineral', molecularWeight: 150.71, casNumber: '1317-45-9', elementalComposition: 'Sn: 78.8%, O: 21.2%', color: 'Dark Brown', selected: false },
  { id: 'rutile', name: 'Rutilo', formula: 'TiO2', density: 4.23, abrasionIndex: 0.7, workIndex: 14.0, class: 'Mineral', molecularWeight: 79.87, casNumber: '1317-80-2', elementalComposition: 'Ti: 59.9%, O: 40.1%', color: 'Reddish Brown', selected: false },
  { id: 'ilmenite', name: 'Ilmenita', formula: 'FeTiO3', density: 4.72, abrasionIndex: 0.45, workIndex: 13.5, class: 'Mineral', molecularWeight: 151.71, casNumber: '12168-52-4', elementalComposition: 'Fe: 36.8%, Ti: 31.6%, O: 31.6%', color: 'Iron Black', selected: false },
  { id: 'gibbsite', name: 'Gibbsita (Alumina)', formula: 'Al(OH)3', density: 2.42, abrasionIndex: 0.15, workIndex: 11.5, class: 'Mineral', molecularWeight: 78.0, casNumber: '14762-49-3', elementalComposition: 'Al: 34.6%, O: 61.5%, H: 3.9%', color: 'White', selected: false },
  { id: 'boehmite', name: 'Boemita (Bauxita)', formula: 'AlO(OH)', density: 3.05, abrasionIndex: 0.25, workIndex: 12.0, class: 'Mineral', molecularWeight: 59.99, casNumber: '1318-23-6', elementalComposition: 'Al: 45.0%, O: 53.3%, H: 1.7%', color: 'Yellowish White', selected: false },
  { id: 'chromite', name: 'Cromita', formula: 'FeCr2O4', density: 4.79, abrasionIndex: 0.55, workIndex: 13.8, class: 'Mineral', molecularWeight: 223.84, casNumber: '1308-31-2', elementalComposition: 'Cr: 46.5%, Fe: 24.9%, O: 28.6%', color: 'Dark Brownish Black', selected: false },
  { id: 'pyrolusite', name: 'Pirolusita (Manganês)', formula: 'MnO2', density: 4.73, abrasionIndex: 0.3, workIndex: 11.5, class: 'Mineral', molecularWeight: 86.94, casNumber: '1313-13-9', elementalComposition: 'Mn: 63.2%, O: 36.8%', color: 'Dark Gray to Black', selected: false },
  
  // CARBONATOS
  { id: 'calcite', name: 'Calcita', formula: 'CaCO3', density: 2.71, abrasionIndex: 0.08, workIndex: 11.0, class: 'Mineral', molecularWeight: 100.09, casNumber: '471-34-1', elementalComposition: 'Ca: 40.0%, C: 12.0%, O: 48.0%', color: 'White', selected: true },
  { id: 'dolomite', name: 'Dolomita', formula: 'CaMg(CO3)2', density: 2.84, abrasionIndex: 0.15, workIndex: 12.5, class: 'Mineral', molecularWeight: 184.4, casNumber: '16389-88-1', elementalComposition: 'Ca: 21.7%, Mg: 13.2%, C: 13.0%', color: 'White', selected: false },
  { id: 'malachite', name: 'Malaquita', formula: 'Cu2(CO3)(OH)2', density: 4.0, abrasionIndex: 0.1, workIndex: 10.2, class: 'Mineral', molecularWeight: 221.12, casNumber: '1319-53-5', elementalComposition: 'Cu: 57.5%, O: 36.2%', color: 'Green', selected: false },
  { id: 'azurite', name: 'Azurita', formula: 'Cu3(CO3)2(OH)2', density: 3.77, abrasionIndex: 0.1, workIndex: 10.4, class: 'Mineral', molecularWeight: 344.67, casNumber: '1319-45-5', elementalComposition: 'Cu: 55.3%, O: 37.1%', color: 'Azure Blue', selected: false },
  { id: 'siderite', name: 'Siderita', formula: 'FeCO3', density: 3.96, abrasionIndex: 0.2, workIndex: 12.0, class: 'Mineral', molecularWeight: 115.86, casNumber: '14476-16-5', elementalComposition: 'Fe: 48.2%, C: 10.4%', color: 'Brown', selected: false },
  { id: 'rhodochrosite', name: 'Rodocrosita', formula: 'MnCO3', density: 3.69, abrasionIndex: 0.15, workIndex: 11.0, class: 'Mineral', molecularWeight: 114.95, casNumber: '598-62-9', elementalComposition: 'Mn: 47.8%, C: 10.4%, O: 41.8%', color: 'Pinkish Red', selected: false },
  { id: 'cerussite', name: 'Cerussita', formula: 'PbCO3', density: 6.55, abrasionIndex: 0.08, workIndex: 10.5, class: 'Mineral', molecularWeight: 267.21, casNumber: '513-48-4', elementalComposition: 'Pb: 77.5%, C: 4.5%, O: 18.0%', color: 'Colorless to Gray', selected: false },
  
  // SULFATO & HALETOS
  { id: 'barite', name: 'Barita', formula: 'BaSO4', density: 4.5, abrasionIndex: 0.08, workIndex: 10.0, class: 'Mineral', molecularWeight: 233.39, casNumber: '13462-86-7', elementalComposition: 'Ba: 58.8%, S: 13.7%, O: 27.4%', color: 'White or Colorless', selected: false },
  { id: 'gypsum', name: 'Gipsita (Gesso)', formula: 'CaSO4.2H2O', density: 2.31, abrasionIndex: 0.02, workIndex: 8.5, class: 'Mineral', molecularWeight: 172.17, casNumber: '13397-24-5', elementalComposition: 'Ca: 23.3%, S: 18.6%, H: 2.3%, O: 55.8%', color: 'White to Light Gray', selected: false },
  { id: 'halite', name: 'Halita (Sal)', formula: 'NaCl', density: 2.16, abrasionIndex: 0.01, workIndex: 7.2, class: 'Mineral', molecularWeight: 58.44, casNumber: '14762-51-7', elementalComposition: 'Na: 39.3%, Cl: 60.7%', color: 'Colorless to White', selected: false },
  { id: 'scheelite', name: 'Scheelita (Tungstênio)', formula: 'CaWO4', density: 6.1, abrasionIndex: 0.25, workIndex: 13.5, class: 'Mineral', molecularWeight: 287.92, casNumber: '14940-64-8', elementalComposition: 'Ca: 13.9%, W: 63.8%, O: 22.2%', color: 'Golden Yellow to White', selected: false },
  
  // SILICATOS E OUTROS
  { id: 'talc', name: 'Talco', formula: 'Mg3Si4O10(OH)2', density: 2.7, abrasionIndex: 0.02, workIndex: 8.5, class: 'Mineral', molecularWeight: 379.27, casNumber: '14807-96-6', elementalComposition: 'Mg: 19.2%, Si: 29.6%', color: 'Pale Green', selected: false },
  { id: 'muscovite', name: 'Muscovita', formula: 'KAl2(AlSi3O10)(OH)2', density: 2.82, abrasionIndex: 0.25, workIndex: 13.0, class: 'Mineral', molecularWeight: 398.31, casNumber: '1318-94-1', elementalComposition: 'K: 9.8%, Al: 20.3%', color: 'Clear', selected: false },
  { id: 'fluorite', name: 'Fluorita', formula: 'CaF2', density: 3.18, abrasionIndex: 0.1, workIndex: 9.8, class: 'Mineral', molecularWeight: 78.07, casNumber: '7789-75-5', elementalComposition: 'Ca: 51.3%, F: 48.7%', color: 'Purple', selected: false },
  { id: 'apatite', name: 'Apatita', formula: 'Ca5(PO4)3F', density: 3.19, abrasionIndex: 0.12, workIndex: 11.2, class: 'Mineral', molecularWeight: 504.3, casNumber: '1306-05-4', elementalComposition: 'Ca: 39.7%, P: 18.4%', color: 'Greenish Blue', selected: false },
  { id: 'zircon', name: 'Zircão', formula: 'ZrSiO4', density: 4.65, abrasionIndex: 0.85, workIndex: 16.5, class: 'Mineral', molecularWeight: 183.31, casNumber: '14940-68-2', elementalComposition: 'Zr: 49.8%, Si: 15.3%', color: 'Brown Red', selected: false },
  { id: 'spodumene', name: 'Espodumênio (Lítio)', formula: 'LiAlSi2O6', density: 3.15, abrasionIndex: 0.65, workIndex: 14.2, class: 'Mineral', molecularWeight: 186.09, casNumber: '1302-37-0', elementalComposition: 'Li: 3.7%, Al: 14.5%, Si: 30.2%, O: 51.6%', color: 'Grayish White', selected: false },
  { id: 'lepidolite', name: 'Lepidolita (Lítio)', formula: 'K(Li,Al)3(Al,Si)4O10(F,OH)2', density: 2.85, abrasionIndex: 0.22, workIndex: 12.8, class: 'Mineral', molecularWeight: 388.3, casNumber: '1317-64-2', elementalComposition: 'K: 10.1%, Li: 3.6%, Al: 13.9%, Si: 28.9%', color: 'Lilac to Pink', selected: false },
  { id: 'kaolinite', name: 'Caulinita (Argila)', formula: 'Al2Si2O5(OH)4', density: 2.63, abrasionIndex: 0.03, workIndex: 9.0, class: 'Mineral', molecularWeight: 258.16, casNumber: '1318-74-7', elementalComposition: 'Al: 20.9%, Si: 21.8%, H: 1.6%, O: 55.8%', color: 'White', selected: false },
  { id: 'feldspar', name: 'Feldspato Potássico', formula: 'KAlSi3O8', density: 2.56, abrasionIndex: 0.55, workIndex: 12.5, class: 'Mineral', molecularWeight: 278.33, casNumber: '68476-25-5', elementalComposition: 'K: 14.1%, Al: 9.7%, Si: 30.3%, O: 45.9%', color: 'Pinkish White', selected: false },
  { id: 'albite', name: 'Albita (Feldspato Na)', formula: 'NaAlSi3O8', density: 2.62, abrasionIndex: 0.5, workIndex: 12.0, class: 'Mineral', molecularWeight: 262.22, casNumber: '12244-10-9', elementalComposition: 'Na: 8.8%, Al: 10.3%, Si: 32.1%', color: 'White', selected: false },
  { id: 'beryl', name: 'Berilo', formula: 'Be3Al2Si6O18', density: 2.76, abrasionIndex: 0.7, workIndex: 14.5, class: 'Mineral', molecularWeight: 537.5, casNumber: '1302-52-9', elementalComposition: 'Be: 5.0%, Al: 10.0%, Si: 31.4%', color: 'Pale Green to Blue', selected: false },

  // REAGENTES
  { id: 'reag_cmc', name: 'Carboximetilcelulose (CMC)', formula: 'C8H15NaO8', density: 1.6, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 242.16, casNumber: '9004-32-4', elementalComposition: 'C: 39.7%, Na: 9.5%', color: 'White Powder', selected: false },
  { id: 'reag_pam', name: 'Poliacrilamida (PAM)', formula: '(C3H5NO)n', density: 1.3, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 71.08, casNumber: '9003-05-8', elementalComposition: 'N: 19.7%', color: 'Granular', selected: false },
  { id: 'reag_amidex', name: 'Amidex (Amido Modificado)', formula: '(C6H10O5)n', density: 1.5, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 162.14, casNumber: '9005-25-8', color: 'Beige', selected: true },
  { id: 'reag_dtp', name: 'Ditiofosfato de Sódio', formula: 'C4H10NaO2PS2', density: 1.1, abrasionIndex: 0, workIndex: 0, class: 'Inorganic', molecularWeight: 208.21, casNumber: '3338-24-7', elementalComposition: 'P: 14.9%, S: 30.8%', color: 'Amber Liquid', selected: false },
  { id: 'reag_dtc', name: 'Ditiocarbonato (Xantato)', formula: 'C3H5NaOS2', density: 1.2, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 144.19, casNumber: '140-89-6', elementalComposition: 'S: 44.5%', color: 'Yellow pellets', selected: false },
  { id: 'org_sipx', name: 'Coletor SIPX', formula: 'C4H7NaOS2', density: 1.2, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 158.2, casNumber: '140-93-2', elementalComposition: 'S: 40.5%', color: 'Yellowish', selected: false },
  { id: 'org_pax', name: 'Coletor PAX', formula: 'C6H11KOS2', density: 1.1, abrasionIndex: 0, workIndex: 0, class: 'Organic', molecularWeight: 202.38, casNumber: '928-70-1', elementalComposition: 'S: 31.7%', color: 'Yellowish', selected: false },
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
