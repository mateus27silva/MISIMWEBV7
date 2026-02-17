import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Search, X, ArrowLeft, Mountain, Atom, Beaker, Leaf, 
  Trash2, Edit, Check, Save, Loader2, Cloud, Package, AlertCircle, Activity
} from 'lucide-react';
import { Component } from '../types';
import { supabase } from '../services/supabaseClient';

interface ComponentsViewProps {
  minerals: Component[];
  setMinerals: React.Dispatch<React.SetStateAction<Component[]>>;
}

export const ComponentsView: React.FC<ComponentsViewProps> = ({ minerals, setMinerals }) => {
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const initialFormState: Partial<Component> = {
    name: '',
    formula: '',
    class: 'Mineral',
    density: 2.7,
    molecularWeight: 0,
    casNumber: '',
    elementalComposition: '',
    workIndex: 12.0,
    abrasionIndex: 0.1,
    selected: true
  };

  const [form, setForm] = useState<Partial<Component>>(initialFormState);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name', { ascending: true });

      if (error) {
        console.error("Supabase PostgrestError:", error);
        throw new Error(error.message || "Erro desconhecido no banco de dados.");
      }

      if (data) {
        const mapped: Component[] = data.map(item => ({
          id: item.id,
          name: item.name,
          formula: item.formula || '',
          density: parseFloat(item.density) || 2.7,
          class: item.class,
          molecularWeight: parseFloat(item.molecular_weight) || 0,
          casNumber: item.cas_number || '',
          elementalComposition: item.elemental_composition || '',
          workIndex: parseFloat(item.work_index) || 12.0,
          abrasionIndex: parseFloat(item.abrasion_index) || 0.1,
          selected: item.is_selected,
          color: item.color || undefined
        }));
        setMinerals(mapped);
      }
    } catch (err: any) {
      const msg = err.message === 'Failed to fetch' 
        ? "Erro de Conexão: Não foi possível alcançar o servidor Supabase. Verifique sua internet ou se a URL do projeto está correta."
        : `Erro ao buscar componentes: ${err.message || JSON.stringify(err)}`;
      
      console.error(msg, err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setViewMode('list');
    setEditingId(null);
    setForm(initialFormState);
  };

  const handleEdit = (comp: Component) => {
    setEditingId(comp.id);
    setForm({ ...comp });
    setViewMode('edit');
  };

  const handleSave = async () => {
    if (!form.name || !form.class) return;
    setIsSyncing(true);
    setErrorMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const dbPayload = {
        name: form.name,
        formula: form.formula,
        class: form.class,
        density: form.density,
        molecular_weight: form.molecularWeight,
        cas_number: form.casNumber,
        elemental_composition: form.elementalComposition,
        work_index: form.workIndex,
        abrasion_index: form.abrasionIndex,
        is_selected: form.selected,
        user_id: user?.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('components')
        .upsert({
          id: editingId || undefined,
          ...dbPayload
        });

      if (error) throw error;
      
      await fetchComponents();
      handleBack();
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar componente.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este componente?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('components').delete().eq('id', id);
      if (error) throw error;
      setMinerals(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao excluir componente.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = async (comp: Component) => {
    const newState = !comp.selected;
    setMinerals(prev => prev.map(m => m.id === comp.id ? { ...m, selected: newState } : m));
    
    try {
      const { error } = await supabase
        .from('components')
        .update({ is_selected: newState })
        .eq('id', comp.id);
      if (error) throw error;
    } catch (err: any) {
      console.error("Erro ao atualizar seleção:", err);
    }
  };

  const filteredMinerals = minerals.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.formula.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (viewMode === 'edit') {
    return (
      <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300 h-full flex flex-col overflow-y-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-4">
            <button onClick={handleBack} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500 transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
                <h1 className="text-2xl font-bold text-slate-900">{editingId ? 'Editar Componente' : 'Novo Componente'}</h1>
                <p className="text-slate-500 text-sm">Preencha os parâmetros técnicos para o banco de dados.</p>
            </div>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSyncing}
            className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center shadow-md transition-all active:scale-95"
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Componente
          </button>
        </header>

        {errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center border border-red-100 animate-in shake duration-500">
                <AlertCircle className="w-5 h-5 mr-2" />
                {errorMessage}
            </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-8 flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center">
                        <Package className="w-4 h-4 mr-2" /> Informações Básicas
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Componente</label>
                            <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ex: Calcopirita" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Fórmula Química</label>
                                <input type="text" value={form.formula} onChange={e => setForm({...form, formula: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" placeholder="Ex: CuFeS2" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Classe / Tipo</label>
                                <select value={form.class} onChange={e => setForm({...form, class: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                                    <option value="Mineral">Mineral</option>
                                    <option value="Element">Elemento Nativo</option>
                                    <option value="Organic">Orgânico</option>
                                    <option value="Inorganic">Inorgânico</option>
                                    <option value="Other">Outro</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center">
                        <Activity className="w-4 h-4 mr-2" /> Propriedades Físicas
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Densidade (t/m³)</label>
                            <input type="number" step="0.01" value={form.density} onChange={e => setForm({...form, density: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Massa Molecular</label>
                            <input type="number" step="0.01" value={form.molecularWeight} onChange={e => setForm({...form, molecularWeight: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Work Index (kWh/t)</label>
                            <input type="number" step="0.1" value={form.workIndex} onChange={e => setForm({...form, workIndex: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Abrasion Index</label>
                            <input type="number" step="0.01" value={form.abrasionIndex} onChange={e => setForm({...form, abrasionIndex: parseFloat(e.target.value) || 0})} className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center">
                    <Atom className="w-4 h-4 mr-2" /> Composição & Identificação
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Composição Elemental (%)</label>
                        <textarea value={form.elementalComposition} onChange={e => setForm({...form, elementalComposition: e.target.value})} className="w-full h-32 px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none font-mono text-sm" placeholder="Ex: Cu: 34.6, Fe: 30.4, S: 35.0" />
                        <p className="text-[10px] text-slate-400 mt-2 italic">Formato exigido pelo solver: Simbolo: Valor, Simbolo: Valor</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Número CAS (Opcional)</label>
                        <input type="text" value={form.casNumber} onChange={e => setForm({...form, casNumber: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: 1308-56-1" />
                    </div>
                </div>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden animate-in fade-in duration-500">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center tracking-tight">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            Base de Componentes
          </h1>
          <p className="text-slate-500 mt-1">Gerencie minerais, elementos e reagentes para simulações de flotação e moagem.</p>
        </div>
        <button 
          onClick={() => { setEditingId(null); setForm(initialFormState); setViewMode('edit'); }}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center shadow-lg shadow-blue-100 active:scale-95"
        >
          <Plus className="w-5 h-5 mr-2" /> Novo Componente
        </button>
      </header>

      <div className="flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm items-center space-x-4 shrink-0">
          <div className="relative flex-1 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Pesquisar por nome, fórmula ou classe..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
              />
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-400 font-bold uppercase tracking-widest px-4 border-l border-slate-100">
              <Cloud className="w-4 h-4" />
              <span>Sincronizado</span>
          </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="overflow-auto flex-1 custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Database...</p>
                </div>
            ) : errorMessage ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-red-500 space-y-4 px-8 text-center">
                    <AlertCircle className="w-12 h-12 opacity-50" />
                    <p className="font-bold">{errorMessage}</p>
                    <button onClick={fetchComponents} className="text-blue-600 font-bold underline">Tentar novamente</button>
                </div>
            ) : filteredMinerals.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400 space-y-4">
                    <Package className="w-16 h-16 opacity-20" />
                    <p className="font-bold">Nenhum componente encontrado.</p>
                </div>
            ) : (
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest w-12 text-center">Ativo</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Componente</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Classe</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Densidade</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredMinerals.map((comp) => (
                            <tr key={comp.id} className={`group hover:bg-blue-50/30 transition-colors ${!comp.selected ? 'opacity-60' : ''}`}>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleToggleSelect(comp)}
                                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${comp.selected ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-300 bg-white hover:border-blue-400'}`}
                                    >
                                        {comp.selected && <Check className="w-4 h-4 stroke-[3px]" />}
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className={`p-2 rounded-xl ${
                                            comp.class === 'Mineral' ? 'bg-orange-50 text-orange-600' :
                                            comp.class === 'Element' ? 'bg-amber-50 text-amber-600' :
                                            comp.class === 'Organic' ? 'bg-green-50 text-green-600' :
                                            'bg-blue-50 text-blue-600'
                                        }`}>
                                            {comp.class === 'Mineral' ? <Mountain className="w-5 h-5" /> :
                                             comp.class === 'Element' ? <Atom className="w-5 h-5" /> :
                                             comp.class === 'Organic' ? <Leaf className="w-5 h-5" /> :
                                             <Beaker className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{comp.name}</p>
                                            <p className="text-xs font-mono text-slate-500">{comp.formula || '-'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">{comp.class}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-sm font-bold text-slate-700">{comp.density.toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">t/m³</span></span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                          onClick={() => handleEdit(comp)}
                                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDelete(comp.id)}
                                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total de Componentes: {minerals.length}</p>
              <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span>Database Cloud Engine</span>
              </div>
          </div>
      </div>
    </div>
  );
};
