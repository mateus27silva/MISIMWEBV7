
import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, X, PlusCircle, Calculator, Save, RotateCcw, FileText, Sliders, Plus, Trash2, Loader2, Database, Trash
} from 'lucide-react';
import { RecoveryModel } from '../types';
import { supabase } from '../services/supabaseClient';

interface KineticsViewProps {
  customModels: RecoveryModel[];
  setCustomModels: React.Dispatch<React.SetStateAction<RecoveryModel[]>>;
}

const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.1em] mb-2 select-none">
    {children}
  </label>
);

const DarkInputWithDelete: React.FC<{ 
  label: string,
  value: number | string, 
  onChange: (val: string) => void, 
  onDelete: () => void,
  type?: string, 
  step?: string 
}> = ({ 
  label, 
  value, 
  onChange, 
  onDelete,
  type = "number", 
  step = "0.01" 
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center pr-1">
      <Label>{label}</Label>
      <button 
        onClick={onDelete}
        className="text-slate-400 hover:text-red-500 transition-colors mb-1"
        title="Remover Coeficiente"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
    <div className="bg-[#1e293b] rounded-lg border border-slate-700 overflow-hidden h-11 flex shadow-inner group transition-all focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/10">
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent px-4 text-white text-sm font-mono outline-none"
      />
    </div>
  </div>
);

export const KineticsView: React.FC<KineticsViewProps> = ({ customModels, setCustomModels }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCoeffLabel, setNewCoeffLabel] = useState('');
  const [newCoeffValue, setNewCoeffValue] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const initialFormState = {
    name: '',
    targetElement: '',
    equation: 'R = BASERECOVERY * (1 - exp(-K_PH * K_AIR * K_TIME * K_ROTOR * K_COLLECTOR * t))',
    dynamicCoefficients: [
      { id: 'k_ph', label: 'K_PH', value: -1 },
      { id: 'k_air', label: 'K_AIR', value: 0.5 },
      { id: 'k_time', label: 'K_TIME', value: 2 },
      { id: 'k_rotor', label: 'K_ROTOR', value: 0.05 },
      { id: 'optimal_ph', label: 'OPTIMAL_PH', value: 10 },
      { id: 'k_collector', label: 'K_COLLECTOR', value: 0.1 },
      { id: 'baseRecovery', label: 'BASERECOVERY', value: 80 }
    ]
  };

  const [form, setForm] = useState(initialFormState);

  const handleReset = () => {
    setForm(initialFormState);
    setEditingId(null);
    setNewCoeffLabel('');
    setNewCoeffValue('0');
  };

  const handleAddCoeff = () => {
    if (!newCoeffLabel.trim()) return;
    setForm(prev => ({
      ...prev,
      dynamicCoefficients: [
        ...prev.dynamicCoefficients,
        { id: `coeff_${Date.now()}`, label: newCoeffLabel.trim().toUpperCase(), value: parseFloat(newCoeffValue) || 0 }
      ]
    }));
    setNewCoeffLabel('');
    setNewCoeffValue('0');
  };

  const handleRemoveCoeff = (id: string) => {
    setForm(prev => ({
      ...prev,
      dynamicCoefficients: prev.dynamicCoefficients.filter(c => c.id !== id)
    }));
  };

  const handleUpdateCoeffValue = (id: string, val: string) => {
    setForm(prev => ({
      ...prev,
      dynamicCoefficients: prev.dynamicCoefficients.map(c => 
        c.id === id ? { ...c, value: parseFloat(val) || 0 } : c
      )
    }));
  };

  const parseError = (err: any): string => {
    if (!err) return "Erro desconhecido";
    if (typeof err === 'string') return err;
    return err.message || err.error_description || JSON.stringify(err);
  };

  const handleDeleteModel = async (e: React.MouseEvent | null, idToDelete: string) => {
    if (e) e.stopPropagation();
    
    const idStr = String(idToDelete).trim();
    if (!idStr) return;
    
    if (!window.confirm("Deseja realmente excluir este modelo permanentemente? Esta ação removerá o registro do banco de dados e deste projeto.")) return;
    
    setIsDeleting(idStr);
    try {
      const isTemporaryId = idStr.startsWith('model_') || idStr.startsWith('proj_');
      
      if (!isTemporaryId) {
        const { error: deleteError } = await supabase
          .from('equipment_equations')
          .delete()
          .eq('id', idStr);

        if (deleteError) {
          throw new Error(`Falha ao excluir no banco de dados: ${deleteError.message}`);
        }
      }
      
      setCustomModels(prevModels => {
        const filtered = prevModels.filter(m => String(m.id).trim() !== idStr);
        return filtered;
      });
      
      if (editingId && String(editingId).trim() === idStr) {
        handleReset();
      }
      
    } catch (err: any) {
      const errorMsg = parseError(err);
      console.error("Erro no processo de exclusão:", errorMsg);
      alert(`Erro ao excluir modelo: ${errorMsg}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.targetElement) return;
    setIsSaving(true);

    try {
        const coeffsObj: any = {};
        form.dynamicCoefficients.forEach(c => {
          coeffsObj[c.id] = c.value;
        });

        const currentId = editingId;
        const dbId = (currentId && !currentId.toString().startsWith('model_')) ? currentId : undefined;

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData?.user;
        
        if (!user) throw new Error("Usuário não autenticado.");

        const { data: savedData, error: upsertError } = await supabase
          .from('equipment_equations')
          .upsert({
            id: dbId,
            user_id: user.id,
            name: form.name,
            equipment_type: 'KineticModel',
            formula: form.equation,
            parameters: coeffsObj,
            updated_at: new Date().toISOString()
          })
          .select();
        
        if (upsertError) throw upsertError;

        const realId = savedData?.[0]?.id || currentId || `model_${Date.now()}`;

        const modelToSave = {
          id: String(realId),
          name: form.name,
          targetElement: form.targetElement,
          equation: form.equation,
          useStandardEquation: true,
          coefficients: coeffsObj,
          metadata: {
            coeffLabels: form.dynamicCoefficients.map(c => ({ id: c.id, label: c.label }))
          }
        };

        if (currentId) {
          setCustomModels(prev => prev.map(m => String(m.id) === String(currentId) ? modelToSave : m));
        } else {
          setCustomModels(prev => [...prev, modelToSave]);
        }
        
        setEditingId(String(realId));
        setIsSaving(false);
        alert("Modelo salvo com sucesso!");
    } catch (error: any) {
        const errorMsg = parseError(error);
        alert(`Erro ao salvar: ${errorMsg}`);
        setIsSaving(false);
    }
  };

  const loadModelIntoForm = (m: any) => {
    const labels = m.metadata?.coeffLabels || [];
    const dynCoeffs = Object.entries(m.coefficients || {}).map(([id, value]) => {
      const foundLabel = labels.find((l: any) => l.id === id);
      return {
        id,
        label: foundLabel ? foundLabel.label : id.toUpperCase(),
        value: value as number
      };
    });

    setForm({
      name: m.name,
      targetElement: m.targetElement,
      equation: m.equation || initialFormState.equation,
      dynamicCoefficients: dynCoeffs.length > 0 ? dynCoeffs : initialFormState.dynamicCoefficients
    });
    setEditingId(String(m.id));
  };

  return (
    <div className="h-full w-full flex flex-col bg-white animate-in fade-in duration-500 overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center space-x-3 text-[#1e293b]">
            <History className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-tight">Histórico de Modelos & Cinética</h1>
          </div>
          <button className="p-2 text-slate-300 hover:text-slate-500 transition-colors" onClick={handleReset}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-slate-100 bg-slate-50/40 p-6 flex flex-col space-y-4 shrink-0 overflow-y-auto custom-scrollbar">
            <button 
              onClick={handleReset}
              className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center space-y-2 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
            >
              <PlusCircle className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
              <span className="text-sm font-bold text-slate-500 group-hover:text-blue-600">Novo Modelo</span>
            </button>

            <div className="flex flex-col pt-6">
              {customModels.length === 0 ? (
                <div className="flex items-center justify-center py-10">
                    <p className="text-sm text-slate-400 italic text-center px-4 leading-relaxed">Nenhum modelo customizado.</p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  {customModels.map(m => (
                    <div key={String(m.id)} className="group relative flex flex-col">
                      <button
                        onClick={() => loadModelIntoForm(m)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${editingId === String(m.id) ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow'}`}
                      >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{m.targetElement}</p>
                        <p className={`font-bold text-sm truncate ${editingId === String(m.id) ? 'text-blue-700' : 'text-[#1e293b]'}`}>{m.name}</p>
                      </button>
                      
                      {/* Delete button matches screenshot red text style below boxes */}
                      <button 
                        onClick={(e) => handleDeleteModel(e, String(m.id))}
                        disabled={isDeleting === String(m.id)}
                        className="mt-1 flex items-center text-[10px] font-black text-red-500 uppercase tracking-widest px-2 opacity-0 group-hover:opacity-100 transition-all hover:text-red-700 disabled:opacity-30"
                        title="Excluir Permanentemente"
                      >
                        {isDeleting === String(m.id) ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash className="w-3 h-3 mr-1" />}
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 p-8 md:p-12 overflow-y-auto custom-scrollbar bg-white">
            <div className="w-full space-y-12">
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-8">
                  <Label>NOME DO MODELO</Label>
                  <input 
                    type="text"
                    value={form.name} 
                    onChange={(e) => setForm({...form, name: e.target.value})} 
                    placeholder="Ex: COBRE M1" 
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner font-bold"
                  />
                </div>
                <div className="col-span-4">
                  <Label>ELEMENTO ALVO</Label>
                  <input 
                    type="text"
                    value={form.targetElement} 
                    onChange={(e) => setForm({...form, targetElement: e.target.value})} 
                    placeholder="Ex: Cu" 
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-inner font-bold"
                  />
                </div>
              </div>

              {/* Removed Description Field as requested by "exclua do modelo" */}

              <div className="pt-8 border-t border-slate-100 pb-20">
                <div className="flex items-center space-x-3 text-purple-600 mb-6">
                  <Calculator className="w-5 h-5" />
                  <h3 className="text-sm font-black uppercase tracking-[0.15em]">COEFICIENTES DA EQUAÇÃO PADRÃO</h3>
                </div>

                <div className="bg-[#0f172a] rounded-xl p-6 mb-10 shadow-lg border border-slate-800 flex flex-col space-y-2">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Equação do Modelo Cinético (Editável)</p>
                  <div className="flex items-start">
                    <span className="text-emerald-500 font-mono text-xs mt-1 mr-2">&gt; Modelo:</span>
                    <textarea
                      value={form.equation}
                      onChange={(e) => setForm({ ...form, equation: e.target.value })}
                      className="flex-1 bg-transparent text-emerald-400 font-mono text-xs leading-relaxed outline-none border-none resize-none focus:ring-0 min-h-[60px]"
                      placeholder="Defina a estrutura da fórmula aqui..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {form.dynamicCoefficients.map((coeff) => (
                    <DarkInputWithDelete 
                      key={coeff.id}
                      label={coeff.label}
                      value={coeff.value}
                      onChange={(v) => handleUpdateCoeffValue(coeff.id, v)}
                      onDelete={() => handleRemoveCoeff(coeff.id)}
                    />
                  ))}
                  
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col space-y-4">
                    <div className="space-y-3">
                      <input 
                        type="text"
                        value={newCoeffLabel}
                        onChange={(e) => setNewCoeffLabel(e.target.value.toUpperCase())}
                        placeholder="Novo R_MAX"
                        className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm font-bold"
                      />
                      <input 
                        type="number"
                        value={newCoeffValue}
                        onChange={(e) => setNewCoeffValue(e.target.value)}
                        placeholder="0.0"
                        className="w-full h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
                      />
                    </div>
                    <button 
                      onClick={handleAddCoeff}
                      className="w-full h-11 bg-[#1e293b] text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all flex items-center justify-center shadow-md active:scale-95"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Adicionar Coeficiente
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-white border-t border-slate-100 flex justify-end items-center space-x-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {isSaving && (
              <div className="flex items-center mr-4 text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                <Database className="w-4 h-4 mr-2" /> Sincronizando...
              </div>
          )}
          
          {editingId && (
            <button 
              onClick={(e) => handleDeleteModel(e, editingId)}
              disabled={isDeleting === editingId || isSaving}
              className="px-8 py-3 bg-white border border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 hover:border-red-400 transition-all text-sm shadow-sm active:scale-95 flex items-center space-x-2 disabled:opacity-50"
            >
              {isDeleting === editingId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash className="w-4 h-4" />}
              <span>Excluir Modelo</span>
            </button>
          )}

          <button 
            onClick={handleReset}
            disabled={isSaving || (isDeleting !== null)}
            className="px-10 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all text-sm shadow-sm active:scale-95 disabled:opacity-50"
          >
            Cancelar
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={!form.name || isSaving || (isDeleting !== null)}
            className={`px-12 py-3 rounded-xl font-bold shadow-xl transition-all text-sm flex items-center space-x-3 active:scale-95 ${form.name && !isSaving ? 'bg-[#9333ea] text-white hover:bg-purple-700 shadow-purple-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Salvar Modelo Cinético</span>
          </button>
        </div>

      </div>
    </div>
  );
};
