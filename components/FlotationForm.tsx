
import React, { useState, useMemo, useEffect } from 'react';
import { Layers, Database, Zap, PieChart, Atom, Loader2, Info } from 'lucide-react';
import { Component, RecoveryModel, UnitConfig, StreamData, EquipmentEquation } from '../types';
import { STANDARD_MODELS } from '../services/miningMath';
import { InputGroup, CustomSelect, FormTabs } from './FormBase';
import { supabase } from '../services/supabaseClient';

export const FlotationForm = ({ params, onChange, minerals, customModels, units, feedStream }: { params: any, onChange: (k: string, v: any) => void, minerals: Component[], customModels: RecoveryModel[], units: UnitConfig, feedStream?: StreamData }) => {
    const [activeTab, setActiveTab] = useState('config');
    const [dbEquations, setDbEquations] = useState<EquipmentEquation[]>([]);
    const [isLoadingEq, setIsLoadingEq] = useState(false);
    
    const allModels = [...STANDARD_MODELS, ...customModels];
    
    // Busca as equações do banco de dados ao montar o componente ou quando o usuário mudar
    useEffect(() => {
        const fetchEquations = async () => {
            setIsLoadingEq(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Busca modelos específicos de 'FlotationCell' e também 'KineticModel'
                // para garantir que modelos criados na aba de Cinética apareçam aqui, 
                // filtrados pelo usuário logado conforme a solicitação.
                const { data, error } = await supabase
                    .from('equipment_equations')
                    .select('*')
                    .or('equipment_type.eq.FlotationCell,equipment_type.eq.KineticModel')
                    .eq('user_id', user.id)
                    .order('name', { ascending: true });
                
                if (error) throw error;
                if (data) setDbEquations(data);
            } catch (err) {
                console.error("Erro ao carregar equações da Flotação:", err);
            } finally {
                setIsLoadingEq(false);
            }
        };
        fetchEquations();
    }, []);

    const availableElements = useMemo(() => {
        const elSet = new Set<string>();
        minerals.filter(m => m.selected).forEach(m => {
            if (m.elementalComposition) {
                const parts = m.elementalComposition.split(',');
                parts.forEach(part => {
                    const segment = part.split(':');
                    if (segment.length > 0) {
                        const el = segment[0].trim();
                        if (el) elSet.add(el);
                    }
                });
            }
        });
        return Array.from(elSet).sort().map(el => ({ value: el, label: el }));
    }, [minerals]);

    // Mescla as opções de método base com as equações do banco de dados
    const methodOptions = useMemo(() => {
        const baseOptions = [
            { value: 'Stoichiometric', label: 'Estequiométrico (Alvo)', description: 'Recuperação fixa para elemento alvo.' },
            { value: 'Yield', label: 'Rendimento (Yield)', description: 'Partição fixa por mineral.' },
            { value: 'Klimpel', label: 'Modelo de Klimpel', description: 'Modelo cinético de distribuição de tempo.' },
            { value: 'Kelsall', label: 'Modelo de Kelsall', description: 'Modelo com frações rápida e lenta.' },
            { value: 'Garcia-Zuniga', label: 'Garcia-Zuniga', description: 'Modelo clássico de primeira ordem.' }
        ];
        
        const eqOptions = dbEquations.map(eq => ({
            value: `eq_${eq.id}`, 
            label: eq.name,
            description: `Modelo: ${eq.formula}`
        }));

        // Retorna primeiro os modelos do banco (criados pelo usuário) conforme o destaque no print
        return [...eqOptions, ...baseOptions];
    }, [dbEquations]);

    // Valor atual para o select unificado
    const currentMethodValue = useMemo(() => {
        if (params.calculationMethod === 'Database_Model' && params.dbEquationId) {
            return `eq_${params.dbEquationId}`;
        }
        return params.calculationMethod || 'Stoichiometric';
    }, [params.calculationMethod, params.dbEquationId]);

    const handleMethodSelection = (val: string) => {
        if (val.startsWith('eq_')) {
            const eqId = val.replace('eq_', '');
            onChange('calculationMethod', 'Database_Model');
            onChange('dbEquationId', eqId);
        } else {
            onChange('calculationMethod', val);
            onChange('dbEquationId', undefined);
        }
    };

    const selectedDbEq = useMemo(() => {
        return dbEquations.find(eq => eq.id === params.dbEquationId);
    }, [dbEquations, params.dbEquationId]);

    const tabs = [
        { id: 'config', label: 'MODELO & ALVO', icon: Database },
        { id: 'dynamic_params', label: 'INPUTS DO MODELO', icon: Zap, hidden: params.calculationMethod !== 'Database_Model' },
        { id: 'params', label: 'PARÂMETROS GERAIS', icon: Zap, hidden: params.calculationMethod === 'Database_Model' || params.calculationMethod === 'Stoichiometric' || params.calculationMethod === 'Yield' },
        { id: 'yield', label: 'PARTIÇÃO (YIELD)', icon: PieChart, hidden: params.calculationMethod !== 'Yield' }
    ];

    // Se o método de cálculo mudar e a aba atual ficar oculta, volta para a aba de config
    useEffect(() => {
        const currentTabConfig = tabs.find(t => t.id === activeTab);
        if (currentTabConfig?.hidden) {
            setActiveTab('config');
        }
    }, [params.calculationMethod]);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col relative z-20">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                    <Layers className="w-5 h-5 mr-2 text-green-500" /> CÉLULA DE FLOTAÇÃO
                </h3>
                {isLoadingEq && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
            </div>

            <FormTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="p-8 animate-in fade-in duration-300">
                {activeTab === 'config' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Coluna da Esquerda: Seleção Unificada de Método */}
                        <div className="space-y-6">
                            <CustomSelect 
                                label="MÉTODO DE CÁLCULO" 
                                value={currentMethodValue} 
                                options={methodOptions} 
                                onChange={handleMethodSelection} 
                                required
                            />

                            {params.calculationMethod === 'Stoichiometric' && (
                                <div className="space-y-4 animate-in slide-in-from-top-2">
                                    <InputGroup label="RECUPERAÇÃO ALVO" value={params.targetRecovery || 85} onChange={(v) => onChange('targetRecovery', v)} unit="%" required />
                                    <InputGroup label="RAZÃO DE CONCENTRAÇÃO" value={params.concentrationRatio || 10} onChange={(v) => onChange('concentrationRatio', v)} subLabel="Qf/Qc" required />
                                    <CustomSelect 
                                        label="ELEMENTO ALVO" 
                                        value={params.targetElement || ''} 
                                        options={availableElements} 
                                        onChange={(v) => onChange('targetElement', v)} 
                                        icon={Atom}
                                        placeholder="Selecione um elemento..."
                                        required
                                    />
                                </div>
                            )}

                            {(['Klimpel', 'Kelsall', 'Garcia-Zuniga'].includes(params.calculationMethod || '')) && (
                                <div className="animate-in slide-in-from-top-2">
                                    <CustomSelect 
                                        label="MODELO CINÉTICO" 
                                        value={params.recoveryModelId || 'std_cu_sulfide'} 
                                        options={allModels.map(m => ({ value: m.id, label: m.name, description: `Alvo: ${m.targetElement}` }))} 
                                        onChange={(v) => onChange('recoveryModelId', v)} 
                                        required
                                    />
                                </div>
                            )}
                        </div>

                        {/* Coluna da Direita: Informações de Apoio */}
                        <div className="space-y-6">
                            {params.calculationMethod === 'Database_Model' && selectedDbEq && (
                                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in zoom-in-95">
                                    <p className="text-[10px] font-black text-blue-800 uppercase mb-1 flex items-center">
                                        <Info className="w-3 h-3 mr-1" /> FÓRMULA DO MODELO
                                    </p>
                                    <code className="text-sm font-mono text-blue-600 font-bold block mt-1">{selectedDbEq.formula}</code>
                                </div>
                            )}
                            
                            {params.calculationMethod === 'Yield' && (
                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl animate-in fade-in">
                                    <h4 className="text-xs font-bold text-slate-700 uppercase mb-2">Instruções</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        O método Yield permite definir manualmente a porcentagem de cada mineral que será reportada para o concentrado.
                                        Ajuste os valores na aba <strong>Partição (Yield)</strong>.
                                    </p>
                                </div>
                            )}

                            {!params.calculationMethod && (
                                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 italic text-sm">
                                    Selecione um método de cálculo para visualizar as opções.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'dynamic_params' && selectedDbEq && (
                    <div className="animate-in slide-in-from-right-4 duration-300">
                        <div className="mb-6 pb-4 border-b border-slate-100">
                            <h4 className="font-black text-slate-400 uppercase text-[10px] tracking-[0.2em]">Inputs Necessários para {selectedDbEq.name}</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {selectedDbEq.parameters && (Array.isArray(selectedDbEq.parameters) ? (
                                selectedDbEq.parameters.map((param) => (
                                    <InputGroup 
                                        key={param.name}
                                        label={param.label}
                                        value={params[`eq_param_${param.name}`] ?? param.defaultValue}
                                        onChange={(v) => onChange(`eq_param_${param.name}`, v)}
                                        unit={param.unit}
                                        required
                                    />
                                ))
                            ) : (
                                Object.keys(selectedDbEq.parameters).map((pKey) => (
                                    <InputGroup 
                                        key={pKey}
                                        label={pKey.toUpperCase()}
                                        value={params[`eq_param_${pKey}`] ?? selectedDbEq.parameters[pKey]}
                                        onChange={(v) => onChange(`eq_param_${pKey}`, v)}
                                        required
                                    />
                                ))
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'params' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputGroup label="Tempo de Residência" value={params.residenceTime || 15} onChange={(v) => onChange('residenceTime', v)} unit="min" required />
                        <InputGroup label="pH Operacional" value={params.ph || 10.5} onChange={(v) => onChange('ph', v)} required />
                        <InputGroup label="Dosagem Coletor" value={params.collectorDosage || 20} onChange={(v) => onChange('collectorDosage', v)} unit="g/t" required />
                        <InputGroup label="Vazão de Ar" value={params.airFlow || 50} onChange={(v) => onChange('airFlow', v)} unit="m³/min" required />
                    </div>
                )}

                {activeTab === 'yield' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                        {minerals.filter(m => m.selected).map(m => (
                            <InputGroup 
                                key={m.id} 
                                label={m.name} 
                                value={params[`mineral_split_${m.id}`] || 0} 
                                onChange={(v) => onChange(`mineral_split_${m.id}`, v)} 
                                unit="%" 
                                required
                            />
                        ))}
                        <InputGroup label="Arraste de Água" value={params.waterSplit || 15} onChange={(v) => onChange('waterSplit', v)} unit="%" required />
                    </div>
                )}
            </div>
        </div>
    );
};
