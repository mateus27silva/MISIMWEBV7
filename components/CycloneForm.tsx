import React, { useState, useMemo, useEffect } from 'react';
import { Filter, Thermometer, Ruler, ListChecks, BarChart3, Activity } from 'lucide-react';
import { UnitConfig, StreamData } from '../types';
import { InputGroup, FormTabs } from './FormBase';

interface CycloneFormProps {
    params: any;
    onChange: (k: string, v: any) => void;
    minerals: any[];
    units: UnitConfig;
    streamState?: StreamData;
    ofStream?: StreamData;
    ufStream?: StreamData;
}

export const CycloneForm = ({ params, onChange, minerals, units, streamState, ofStream, ufStream }: CycloneFormProps) => {
    const mode = params.interactionMode || 'Standard';
    const isClassic = mode === 'Classic';
    const [activeTab, setActiveTab] = useState('process');

    // Valores para exibição baseados no modo de interação
    const displayOfSolids = isClassic ? (ofStream?.percentSolids || 0).toFixed(1) : params.overflowSolids || 30;
    const displayUfSolids = isClassic ? (ufStream?.percentSolids || 0).toFixed(1) : params.underflowSolids || 75;

    const slurryDensityCalculated = useMemo(() => {
        const S = streamState?.percentSolids || 55; // Prioriza sólidos reais da alimentação
        const rho = params.oreDensity || 2.7;
        const weightFractionSolids = S / 100;
        const weightFractionWater = 1 - weightFractionSolids;
        const den = (weightFractionSolids / rho) + weightFractionWater;
        return den > 0 ? (1 / den).toFixed(2) : '0.00';
    }, [streamState?.percentSolids, params.oreDensity]);

    const cycloneMetrics = useMemo(() => {
        const D = params.diameter || 26.0;
        const Di = params.inletDiameter || 6.5;
        const Do = params.vortexFinderDiameter || 9.1;
        const Du = params.apexDiameter || 4.6;
        const h = params.height || 78.0;
        const P = Math.max(1, params.pressure || 100);
        const phi = streamState?.percentSolids || 70; // Usa live data da alimentação
        const K1 = params.k1 || 9.932;

        const geomNum = Math.pow(D, 0.46) * Math.pow(Di, 0.6) * Math.pow(Do, 1.21);
        const expFactor = Math.exp(0.063 * (phi / 2.7)); 
        const geomDen = Math.pow(Du, 0.71) * Math.pow(h, 0.38) * Math.pow(P, 0.45);
        const predD50c = (K1 * geomNum * expFactor) / geomDen;

        const geomRf = (Du / Do) * (h / D) * 10;
        const predRf = Math.min(90, Math.max(5, 10 + (phi * 0.4) + geomRf)); 

        return {
            d50c: predD50c.toFixed(2),
            rf: predRf.toFixed(2)
        };
    }, [params, streamState?.percentSolids]);

    const tabs = [
        { id: 'process', label: 'PROCESSO & CORRENTES', icon: Thermometer },
        { id: 'operation', label: 'OPERAÇÃO', icon: Filter, hidden: mode === 'Classic' },
        { id: 'geometry', label: 'GEOMETRIA', icon: Ruler, hidden: mode !== 'Advanced' },
        { id: 'constants', label: 'CLASSIFIER CONSTANTS', icon: ListChecks, hidden: mode !== 'Advanced' },
        { id: 'metrics', label: 'MÉTRICAS CALCULADAS', icon: BarChart3, hidden: mode === 'Standard' || mode === 'Classic' }
    ];

    useEffect(() => {
        const currentTabConfig = tabs.find(t => t.id === activeTab);
        if (currentTabConfig?.hidden) {
            setActiveTab('process');
        }
    }, [mode, activeTab]);

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                    <Filter className="w-5 h-5 mr-2 text-indigo-500" /> BATERIA DE CICLONES
                </h3>
                <div className="flex bg-slate-200 p-1 rounded-lg border border-slate-300">
                    {['Classic', 'Standard', 'Parameterized', 'Advanced'].map(m => (
                        <button
                            key={m}
                            onClick={() => onChange('interactionMode', m)}
                            className={`px-4 py-1.5 text-[10px] font-bold rounded-md transition-all ${mode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {m}
                        </button>
                    ))}
                </div>
            </div>

            <FormTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

            <div className="p-8 animate-in fade-in duration-300">
                {activeTab === 'process' && (
                    <div className="space-y-12">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <InputGroup 
                                label="% SÓLIDOS OVERFLOW" 
                                value={displayOfSolids} 
                                onChange={(v) => !isClassic && onChange('overflowSolids', v)} 
                                unit="%" 
                                required={!isClassic} 
                                disabled={isClassic}
                            />
                            <InputGroup 
                                label="% SÓLIDOS UNDERFLOW" 
                                value={displayUfSolids} 
                                onChange={(v) => !isClassic && onChange('underflowSolids', v)} 
                                unit="%" 
                                required={!isClassic} 
                                disabled={isClassic}
                            />
                        </div>
                        <div className="border-t border-slate-100 pt-8">
                            <h4 className="font-bold text-slate-800 mb-6 flex items-center text-xs uppercase tracking-wider">
                                <Activity className="w-4 h-4 mr-2 text-orange-500" /> PROPRIEDADES DO MINÉRIO & FLUIDO
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <InputGroup label="DENSIDADE DO MINÉRIO (SG)" value={params.oreDensity || 2.7} onChange={(v) => onChange('oreDensity', v)} unit={units.solidDensity} required={!isClassic} disabled={isClassic} />
                                <InputGroup 
                                    label="DENSIDADE DO FLUIDO (CALCULADA)" 
                                    value={slurryDensityCalculated} 
                                    onChange={() => {}} 
                                    unit={units.solidDensity} 
                                    disabled 
                                    info="Calculada dinamicamente com base no percentual de sólidos da alimentação atual."
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'operation' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputGroup label="Nº DE CICLONES" value={params.numberOfCyclones} onChange={(v) => onChange('numberOfCyclones', v)} disabled={isClassic} />
                        <InputGroup label="PRESSÃO DE OPERAÇÃO" value={params.pressure} onChange={(v) => onChange('pressure', v)} unit={units.pressure} disabled={isClassic} />
                        <InputGroup label="TAMANHO DE CORTE (D50C)" value={params.d50c} onChange={(v) => onChange('d50c', v)} unit={units.particleSize} disabled={isClassic} />
                        <InputGroup label="RECUP. ÁGUA UF (RF)" value={params.waterRecoveryToUnderflow} onChange={(v) => onChange('waterRecoveryToUnderflow', v)} unit="%" disabled={isClassic} />
                    </div>
                )}

                {activeTab === 'geometry' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputGroup label="DIAMETER (D)" value={params.diameter} onChange={(v) => onChange('diameter', v)} unit="mm" />
                        <InputGroup label="HEIGHT (H)" value={params.height} onChange={(v) => onChange('height', v)} unit="mm" subLabel="Sug: 107.8" />
                        <InputGroup label="INLET (DI)" value={params.inletDiameter} onChange={(v) => onChange('inletDiameter', v)} unit="mm" subLabel="Sug: 8.74" />
                        <InputGroup label="VORTEX (DO)" value={params.vortexFinderDiameter} onChange={(v) => onChange('vortexFinderDiameter', v)} unit="mm" subLabel="Sug: 6.50" />
                        <InputGroup label="APEX (DU)" value={params.apexDiameter} onChange={(v) => onChange('apexDiameter', v)} unit="mm" subLabel="Sug: 5.00" />
                    </div>
                )}

                {activeTab === 'constants' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputGroup label="K1 (CAPACITY CONSTANT)" value={params.k1 || 1.87} onChange={(v) => onChange('k1', v)} />
                        <InputGroup label="K2 (D50 CONSTANT)" value={params.k2 || 50.5} onChange={(v) => onChange('k2', v)} />
                        <InputGroup label="K3 (WATER SPLIT CONSTANT)" value={params.k3 || 3.27} onChange={(v) => onChange('k3', v)} />
                        <InputGroup label="K4 (SHARPNESS CONSTANT)" value={params.k4 || 0.67} onChange={(v) => onChange('k4', v)} />
                        <InputGroup label="λ (LAMBDA CONSTANT)" value={params.lambda || 1.5} onChange={(v) => onChange('lambda', v)} />
                        <InputGroup label="BPC CONSTANT" value={params.bpc || 0.1} onChange={(v) => onChange('bpc', v)} />
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputGroup label="D50C PREDITO" value={cycloneMetrics.d50c} onChange={() => {}} unit={units.particleSize} disabled info="Calculado via Modelo de Plitt (K1, Geometria e Pressão)" />
                        <InputGroup label="RF PREDITO (UNDERFLOW)" value={cycloneMetrics.rf} onChange={() => {}} unit="%" disabled info="Recuperação de água baseada na geometria e densidade de alimentação" />
                    </div>
                )}
            </div>
        </div>
    );
};
