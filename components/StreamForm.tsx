import React, { useState, useMemo, useEffect } from 'react';
import { Waves, Beaker, BarChart3, Plus, Trash2, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Component, UnitConfig, StreamData, PSDPoint } from '../types';
import { InputGroup, FormTabs } from './FormBase';

const CollapsibleSection = ({ title, isOpen, onToggle, children }: { title: string, isOpen: boolean, onToggle: () => void, children?: React.ReactNode }) => (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
        <button 
            onClick={onToggle}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors text-left border-b border-slate-100"
        >
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">{title}</span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
            <div className="animate-in slide-in-from-top-1 duration-200">
                {children}
            </div>
        )}
    </div>
);

export const StreamForm = ({ 
    params, 
    onChange, 
    minerals, 
    units, 
    streamState, 
    isFeed,
    isClassicOutput 
}: { 
    params: any, 
    onChange: (k: string, v: any) => void, 
    minerals: Component[], 
    units: UnitConfig, 
    streamState?: StreamData, 
    isFeed?: boolean,
    isClassicOutput?: boolean
}) => {
    const [activeTab, setActiveTab] = useState('properties');
    const [expandedSections, setExpandedSections] = useState({
        temp: false,
        attr: false,
        flow: false
    });

    const activeMinerals = minerals.filter(m => m.selected);
    const [newPsdSize, setNewPsdSize] = useState('');
    const [newPsdPassing, setNewPsdPassing] = useState('');

    const isEditable = isFeed || isClassicOutput;

    const mineralTotals = useMemo(() => {
        let totalPct = 0;
        let harmonicSum = 0;
        
        activeMinerals.forEach(m => {
            const val = isEditable ? (params[`mineral_${m.id}`] || 0) : (streamState?.mineralFlows?.[m.id] || 0);
            const numVal = typeof val === 'string' ? parseFloat(val) : val;
            const safeVal = isNaN(numVal) ? 0 : numVal;
            if (safeVal > 0) {
                totalPct += safeVal;
                // Use a safe density (fallback to 2.7 if missing or 0)
                const density = (m.density && m.density > 0) ? m.density : 2.7;
                harmonicSum += safeVal / density;
            }
        });

        // Calculo da densidade mineral aparente (considerando restante como ganga a 2.7)
        // Se a soma for < 100, o restante é assumido como quartzo/ganga (2.7 t/m³)
        const remainingPct = Math.max(0, 100 - totalPct);
        const finalHarmonicSum = harmonicSum + (remainingPct / 2.7);
        const avgDensity = 100 / finalHarmonicSum;
        
        return {
            total: totalPct.toFixed(2),
            avgDensity: avgDensity.toFixed(3)
        };
    }, [activeMinerals, params, streamState, isEditable]);

    // Sync SG with calculated mineral density
    useEffect(() => {
        if (isEditable && activeMinerals.length > 0) {
            const currentSg = parseFloat(params.sg || '0');
            const targetSg = parseFloat(mineralTotals.avgDensity);
            if (Math.abs(currentSg - targetSg) > 0.001) {
                onChange('sg', mineralTotals.avgDensity);
            }
        }
    }, [mineralTotals.avgDensity, isEditable, activeMinerals.length, params.sg, onChange]);

    const handleAddPsd = () => {
        if (!newPsdSize || !newPsdPassing) return;
        const currentPsd = (params.psd || []) as PSDPoint[];
        const updated = [...currentPsd, { size: parseFloat(newPsdSize), passing: parseFloat(newPsdPassing) }]
            .sort((a, b) => a.size - b.size);
        onChange('psd', updated);
        setNewPsdSize('');
        setNewPsdPassing('');
    };

    const handleRemovePsd = (idx: number) => {
        const currentPsd = (params.psd || []) as PSDPoint[];
        const updated = currentPsd.filter((_, i) => i !== idx);
        onChange('psd', updated);
    };

    const toggleSection = (key: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const tabs = [
        { id: 'properties', label: 'PROPRIEDADES FÍSICAS', icon: Waves },
        { id: 'composition', label: 'COMPONENTES', icon: Beaker },
        { id: 'psd', label: 'GRANULOMETRIA (PSD)', icon: BarChart3 }
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                    <Waves className="w-5 h-5 mr-2 text-cyan-500" /> {isFeed ? 'CORRENTE DE ALIMENTAÇÃO' : 'CORRENTE DE PROCESSO'}
                </h3>
                {!isEditable && (
                    <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Somente Leitura</span>
                )}
                {isClassicOutput && !isFeed && (
                    <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">Entrada Manual (Modo Classic)</span>
                )}
            </div>

            <FormTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="p-8 animate-in fade-in duration-300">
                {activeTab === 'properties' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            <InputGroup label="Vazão de Sólidos" value={isEditable ? params.solidsTph : (streamState?.solidsTph || 0)} onChange={(v) => onChange('solidsTph', v)} unit={units.massFlow} disabled={!isEditable} required={isEditable} />
                            <InputGroup label="% Sólidos (p/p)" value={isEditable ? params.percentSolids : (streamState?.percentSolids || 0)} onChange={(v) => onChange('percentSolids', v)} unit="%" disabled={!isEditable} />
                            <div className="flex flex-col">
                                <InputGroup 
                                    label="Densidade Mineral" 
                                    value={isEditable ? params.sg : (streamState?.sgSolids || 0)} 
                                    onChange={(v) => onChange('sg', v)} 
                                    unit={units.solidDensity} 
                                    disabled={true} 
                                    required={false} 
                                    info="Densidade do sólido seco (ρ_s). Sincronizada automaticamente com a composição mineral." 
                                />
                                <p className="text-[10px] text-blue-400 font-medium -mt-3 mb-4 px-1">
                                    o usuario nao pode editar esse numero
                                </p>
                            </div>
                            
                            <InputGroup 
                                label="Densidade da Polpa" 
                                value={isEditable ? params.slurryDensity : (streamState?.slurryDensity || 0)} 
                                onChange={(v) => onChange('slurryDensity', v)} 
                                unit={units.solidDensity} 
                                disabled={!isEditable} 
                                info="Relacionado a %S e ρ_s pela fórmula de balanço." 
                            />
                            
                            <InputGroup label="Vazão Volumétrica" value={isEditable ? params.volumetricFlow : (streamState ? streamState.totalTph / (streamState.slurryDensity || 1) : 0)} onChange={(v) => onChange('volumetricFlow', v)} unit={units.volumeFlow} disabled={!isEditable} />
                        </div>

                        <div className="space-y-3 pt-2">
                            <CollapsibleSection title="Referência de Temperatura" isOpen={expandedSections.temp} onToggle={() => toggleSection('temp')}>
                                <div className="p-6 bg-slate-50/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <InputGroup label="Temperatura" value={params.temperature ?? 25} onChange={(v) => onChange('temperature', v)} unit="°C" disabled={!isEditable} />
                                        <InputGroup label="Pressão" value={params.pressure ?? 1} onChange={(v) => onChange('pressure', v)} unit="atm" disabled={!isEditable} />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection title="Referência de Atributos" isOpen={expandedSections.attr} onToggle={() => toggleSection('attr')}>
                                <div className="p-6 bg-slate-50/50 text-sm text-slate-500">
                                    <p className="italic mb-4">Atributos adicionais para componentes (não estequiométricos).</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <InputGroup label="Umidade de Equilíbrio" value={params.moisture ?? 0} onChange={(v) => onChange('moisture', v)} unit="%" disabled={!isEditable} />
                                        <InputGroup label="Fator de Forma" value={params.shapeFactor ?? 1} onChange={(v) => onChange('shapeFactor', v)} disabled={!isEditable} />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection title="Referência de Fluxo" isOpen={expandedSections.flow} onToggle={() => toggleSection('flow')}>
                                <div className="p-6 bg-slate-50/50">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <InputGroup label="Base de Fluxo" value={params.flowBasis || 'Mass'} onChange={(v) => onChange('flowBasis', v)} disabled={!isEditable} />
                                        <InputGroup label="Solvente" value={params.solvent || 'Water'} onChange={(v) => onChange('solvent', v)} disabled={!isEditable} />
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </div>
                    </div>
                )}

                {activeTab === 'composition' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {activeMinerals.length > 0 ? (
                            <>
                                {activeMinerals.map(m => (
                                    <InputGroup 
                                        key={m.id} 
                                        label={m.name} 
                                        value={isEditable ? (params[`mineral_${m.id}`] || 0) : (streamState?.mineralFlows?.[m.id] || 0)} 
                                        onChange={(v) => onChange(`mineral_${m.id}`, v)} 
                                        subLabel={m.formula}
                                        disabled={!isEditable}
                                        unit={!isEditable ? units.massFlow : undefined}
                                        required={isEditable}
                                    />
                                ))}
                                <div className="col-span-full border-t border-slate-100 pt-8 mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <InputGroup 
                                        label="DENSIDADE APARENTE DO MINERAL" 
                                        value={mineralTotals.avgDensity} 
                                        onChange={() => {}} 
                                        unit={units.solidDensity} 
                                        disabled 
                                        info="Média ponderada da densidade baseada na participação de cada mineral."
                                    />
                                    <InputGroup 
                                        label="SOMA PERCENTUAL" 
                                        value={mineralTotals.total} 
                                        onChange={() => {}} 
                                        unit={isEditable ? "% / total" : units.massFlow} 
                                        disabled 
                                        info="Soma total dos valores inseridos para os componentes minerais."
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="col-span-full py-12 text-center text-slate-400 italic text-sm">
                                Nenhum mineral ativo no database do projeto.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'psd' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-5 space-y-6">
                            {isEditable && (
                                <div className="flex gap-2 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Abertura ({units.particleSize})</label>
                                        <input type="number" value={newPsdSize} onChange={e => setNewPsdSize(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ex: 105" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">% Passante</label>
                                        <input type="number" value={newPsdPassing} onChange={e => setNewPsdPassing(e.target.value)} className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-sm outline-none focus:ring-1 focus:ring-blue-500" placeholder="Ex: 80" />
                                    </div>
                                    <button onClick={handleAddPsd} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4" /></button>
                                </div>
                            )}

                            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto bg-white">
                                <table className="w-full text-xs text-left border-collapse">
                                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-2 font-bold uppercase">Abertura ({units.particleSize})</th>
                                            <th className="px-4 py-2 font-bold uppercase">% Passante</th>
                                            {isEditable && <th className="px-4 py-2 w-10"></th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {((isEditable ? params.psd : streamState?.psd) || []).map((pt: PSDPoint, i: number) => (
                                            <tr key={i} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-2 font-mono">{pt.size}</td>
                                                <td className="px-4 py-2 font-mono">{pt.passing.toFixed(2)}%</td>
                                                {isEditable && (
                                                    <td className="px-4 py-2 text-center">
                                                        <button onClick={() => handleRemovePsd(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="lg:col-span-7 h-80 bg-slate-50 rounded-xl border border-slate-200 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={(isEditable ? params.psd : streamState?.psd) || []}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                                    <XAxis dataKey="size" type="number" scale="log" domain={['auto', 'auto']} label={{ value: `Tamanho (${units.particleSize})`, position: 'insideBottom', offset: -5, fontSize: 10, fill: '#64748b' }} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <YAxis domain={[0, 100]} label={{ value: '% Passante', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} tick={{ fontSize: 10, fill: '#64748b' }} />
                                    <RechartsTooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Line type="monotone" dataKey="passing" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};