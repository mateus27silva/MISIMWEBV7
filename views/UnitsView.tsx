
import React, { useState, useEffect } from 'react';
import { 
  Ruler, X, ChevronDown, Droplets, Zap, Box, Check
} from 'lucide-react';
import { UnitConfig } from '../types';

interface UnitsViewProps {
  units: UnitConfig;
  setUnits: (units: UnitConfig) => void;
  projectName?: string;
  onNavigateBack?: () => void;
}

const SectionHeader: React.FC<{ icon: React.ElementType, title: string }> = ({ icon: Icon, title }) => (
  <div className="flex items-center space-x-2 text-slate-400 mb-6 border-b border-slate-100 pb-2">
    <Icon className="w-4 h-4" />
    <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">{title}</h3>
  </div>
);

const UnitDropdown: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-tight">{label}</label>
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 pl-4 pr-10 bg-white border border-slate-200 rounded-lg appearance-none text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-sm group-hover:border-slate-300"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  </div>
);

export const UnitsView: React.FC<UnitsViewProps> = ({ units, setUnits, onNavigateBack }) => {
  const [localUnits, setLocalUnits] = useState<UnitConfig>(units);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setLocalUnits(units);
  }, [units]);

  const handleChange = (key: keyof UnitConfig, value: string) => {
    setLocalUnits(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    setUnits(localUnits);
    setHasChanges(false);
    if (onNavigateBack) onNavigateBack();
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
      
      {/* Container que preenche a página inteira */}
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shadow-sm border border-blue-100">
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-none mb-1">Configuração de Unidades</h1>
                <p className="text-xs text-slate-500">Defina as unidades de medida para todo o sistema de simulação.</p>
              </div>
            </div>
            <button 
              onClick={onNavigateBack}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body do Formulário - Removido max-width para preencher a tela */}
          <div className="p-8 md:p-12 space-y-12 flex-1 overflow-y-auto custom-scrollbar">
            
            <div className="w-full">
              {/* Primeira Linha: Fluxos e Energia */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
                
                {/* SEÇÃO: FLUXOS E MASSAS */}
                <div className="space-y-6">
                  <SectionHeader icon={Droplets} title="FLUXOS E MASSAS" />
                  <div className="space-y-6">
                    <UnitDropdown 
                      label="VAZÃO DE SÓLIDOS (MASS FLOW)" 
                      value={localUnits.massFlow}
                      onChange={(v) => handleChange('massFlow', v)}
                      options={[
                        { value: 't/h', label: 'Toneladas por hora (t/h)' },
                        { value: 'kg/s', label: 'Quilogramas por segundo (kg/s)' },
                        { value: 'lb/h', label: 'Libras por hora (lb/h)' }
                      ]}
                    />
                    <UnitDropdown 
                      label="VAZÃO VOLUMÉTRICA (VOLUME FLOW)" 
                      value={localUnits.volumeFlow}
                      onChange={(v) => handleChange('volumeFlow', v)}
                      options={[
                        { value: 'm³/h', label: 'Metros cúbicos por hora (m³/h)' },
                        { value: 'L/s', label: 'Litros por segundo (L/s)' },
                        { value: 'gpm', label: 'Galões por minuto (gpm)' }
                      ]}
                    />
                    <UnitDropdown 
                      label="DENSIDADE DE SÓLIDOS" 
                      value={localUnits.solidDensity}
                      onChange={(v) => handleChange('solidDensity', v)}
                      options={[
                        { value: 't/m³', label: 'Toneladas por metro cúbico (t/m³)' },
                        { value: 'g/cm³', label: 'Gramas por centímetro cúbico (g/cm³)' },
                        { value: 'lb/ft³', label: 'Libras por pé cúbico (lb/ft³)' }
                      ]}
                    />
                  </div>
                </div>

                {/* SEÇÃO: ENERGIA E PRESSÃO */}
                <div className="space-y-6">
                  <SectionHeader icon={Zap} title="ENERGIA E PRESSÃO" />
                  <div className="space-y-6">
                    <UnitDropdown 
                      label="PRESSÃO OPERACIONAL" 
                      value={localUnits.pressure}
                      onChange={(v) => handleChange('pressure', v)}
                      options={[
                        { value: 'kPa', label: 'Quilopascals (kPa)' },
                        { value: 'bar', label: 'Bar (bar)' },
                        { value: 'psi', label: 'Libras por pol² (psi)' }
                      ]}
                    />
                    <UnitDropdown 
                      label="POTÊNCIA (POWER)" 
                      value={localUnits.power}
                      onChange={(v) => handleChange('power', v)}
                      options={[
                        { value: 'kW', label: 'Quilowatts (kW)' },
                        { value: 'HP', label: 'Cavalos (HP)' }
                      ]}
                    />
                    <UnitDropdown 
                      label="ENERGIA ESPECÍFICA" 
                      value={localUnits.specificEnergy}
                      onChange={(v) => handleChange('specificEnergy', v)}
                      options={[
                        { value: 'kWh/t', label: 'Quilowatts-hora por tonelada (kWh/t)' }
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* SEÇÃO: GEOMETRIA E PARTÍCULAS */}
              <div className="pt-12 mt-12 border-t border-slate-100 space-y-6">
                <SectionHeader icon={Box} title="GEOMETRIA E PARTÍCULAS" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
                  <UnitDropdown 
                    label="DIMENSÕES EQUIPAMENTO" 
                    value={localUnits.length}
                    onChange={(v) => { handleChange('length', v); handleChange('diameter', v); }}
                    options={[
                      { value: 'm', label: 'Metros (m)' },
                      { value: 'ft', label: 'Pés (ft)' },
                      { value: 'in', label: 'Polegadas (in)' }
                    ]}
                  />
                  <UnitDropdown 
                    label="TAMANHO DE PARTÍCULA" 
                    value={localUnits.particleSize}
                    onChange={(v) => handleChange('particleSize', v)}
                    options={[
                      { value: 'µm', label: 'Microns (µm)' },
                      { value: 'mm', label: 'Milímetros (mm)' },
                      { value: 'mesh', label: 'Mesh (Tyler)' }
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Ações */}
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex justify-end space-x-4 shrink-0">
            <button 
              onClick={onNavigateBack}
              className="px-8 py-2.5 bg-white border border-slate-300 text-slate-600 font-bold rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all text-sm"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              disabled={!hasChanges}
              className={`px-10 py-2.5 rounded-lg font-bold shadow-lg transition-all text-sm flex items-center ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-blue-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
            >
              {hasChanges && <Check className="w-4 h-4 mr-2" />}
              Salvar Configurações
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
