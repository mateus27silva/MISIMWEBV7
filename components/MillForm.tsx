import React, { useState, useMemo, useEffect } from 'react';
import { Settings2, Ruler, Zap, BarChart3, Thermometer, Atom, Target, Activity } from 'lucide-react';
import { UnitConfig } from '../types';
import { InputGroup, FormTabs } from './FormBase';

export const MillForm = ({ params, onChange, units }: { params: any, onChange: (k: string, v: any) => void, units: UnitConfig }) => {
    const mode = params.interactionMode || 'Standard';
    const [activeTab, setActiveTab] = useState('process');

    useEffect(() => {
        if (mode === 'Classic' && (activeTab === 'geometry' || activeTab === 'charge' || activeTab === 'metrics' || activeTab === 'pbm')) {
            setActiveTab('process');
        } else if (mode === 'Standard' && (activeTab === 'metrics' || activeTab === 'pbm')) {
            setActiveTab('process');
        } else if (mode === 'Parameterized' && activeTab === 'pbm') {
            setActiveTab('process');
        }
    }, [mode, activeTab]);

    const calculatedSlurryDensity = useMemo(() => {
        const S = params.targetDischargeSolids || 70;
        const rho = params.oreDensity || 2.7;
        const weightFractionSolids = S / 100;
        const weightFractionWater = 1 - weightFractionSolids;
        const den = (weightFractionSolids / rho) + weightFractionWater;
        return den > 0 ? (1 / den).toFixed(2) : '0.00';
    }, [params.targetDischargeSolids, params.oreDensity]);

    const millMetrics = useMemo(() => {
        const J = params.fillingBallsPct || 35;
        const G = params.fillingDegreePct || 40;
        const U = params.slurryFillingPct || 100;
        const D = params.diameter || 4.5;
        const L = params.length || 6.0;
        const rhoBall = params.ballDensity || 7.8;
        const rhoOre = params.oreDensity || 2.7;
        const targetS = params.targetDischargeSolids || 70;
        const estSlurryDen = 1 / ((targetS / 100) / rhoOre + (1 - targetS / 100));
        const vMill = Math.PI * Math.pow(D * 0.305, 2) * (L * 0.305) / 4;
        const loadVol = (J / 100) * vMill;
        const ballCharge = (1 - 0.4) * rhoBall * (G / 100) * vMill;
        const slurryInterstitial = estSlurryDen * (U / 100) * 0.4 * (G / 100) * vMill;
        const aboveBalls = estSlurryDen * (J / 100 - G / 100) * vMill;
        const appDen = loadVol > 0 ? (aboveBalls + slurryInterstitial + ballCharge) / loadVol : 0;

        return {
            loadVol: loadVol.toFixed(2),
            ballCharge: ballCharge.toFixed(2),
            slurryInterstitial: slurryInterstitial.toFixed(2),
            aboveBalls: aboveBalls.toFixed(2),
            appDen: appDen.toFixed(2)
        };
    }, [params.fillingBallsPct, params.fillingDegreePct, params.slurryFillingPct, params.diameter, params.length, params.ballDensity, params.oreDensity, params.targetDischargeSolids]);

    const tabs = [
        { id: 'process', label: 'PROCESSO & BALANÇO', icon: Thermometer },
        { id: 'geometry', label: 'GEOMETRIA & VELOCIDADE', icon: Ruler, hidden: mode === 'Classic' },
        { id: 'charge', label: 'CARGA', icon: Zap, hidden: mode === 'Classic' },
        { id: 'metrics', label: 'MÉTRICAS CALCULADAS', icon: BarChart3, hidden: mode === 'Standard' || mode === 'Classic' },
        { id: 'pbm', label: 'CINÉTICA PBM', icon: Atom, hidden: mode !== 'Advanced' }
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                    <Settings2 className="w-5 h-5 mr-2 text-blue-500" /> Moinho de Bolas
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
                {activeTab === 'geometry' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputGroup label="Diâmetro (Interno)" value={params.diameter || 4.5} onChange={v => onChange('diameter', v)} unit="ft" required />
                        <InputGroup label="Comprimento (EGL)" value={params.length || 6.0} onChange={v => onChange('length', v)} unit="ft" required />
                        <InputGroup label="Velocidade (% Crítica)" value={params.speedPctCrit || 75} onChange={v => onChange('speedPctCrit', v)} unit="%" />
                        <InputGroup label="Densidade Bolas" value={params.ballDensity || 7.8} onChange={v => onChange('ballDensity', v)} unit={units.solidDensity} />
                        <InputGroup label="Ângulo Lifter" value={params.linerAngle || 45} onChange={v => onChange('linerAngle', v)} unit="°" />
                        <InputGroup label="Fator de Perda Pot." value={params.powerLossFactor || 0.05} onChange={v => onChange('powerLossFactor', v)} />
                    </div>
                )}

                {activeTab === 'charge' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <InputGroup label="Carga de bolas (%)" value={params.fillingBallsPct || 35} onChange={v => onChange('fillingBallsPct', v)} unit="%" />
                        <InputGroup label="Grau de enchimento (%)" value={params.fillingDegreePct || 40} onChange={v => onChange('fillingDegreePct', v)} unit="%" />
                        <InputGroup label="Slurry Filling, %" value={params.slurryFillingPct || 100} onChange={v => onChange('slurryFillingPct', v)} unit="%" />
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <InputGroup label="Volume da carga (m³)" value={millMetrics.loadVol} onChange={() => {}} unit="m³" disabled info="J / 100 * PI() * (D*0.305)^2 * (L*0.305)/4" />
                        <InputGroup label="Carga de bolas (m³)" value={millMetrics.ballCharge} onChange={() => {}} unit="m³" disabled info="(1-0.4) * BallDensity * (G/100) * PI() * (D*0.305)^2 * (L*0.305)/4" />
                        <InputGroup label="Slurry Interstitial,%" value={millMetrics.slurryInterstitial} onChange={() => {}} unit="val" disabled info="SlurryDensity * (U/100) * 0.4 * (G/100) * PI() * (D*0.305)^2 * (L*0.305)/4" />
                        <InputGroup label="Above Balls (m³)" value={millMetrics.aboveBalls} onChange={() => {}} unit="m³" disabled info="SlurryDensity * (J/100 - G/100) * PI() * (D*0.305)^2 * (L*0.305)/4" />
                        <InputGroup label="Apparent Density" value={millMetrics.appDen} onChange={() => {}} unit="ton/m³" disabled info="(Above Balls + Slurry Interstitial + Carga de bolas) / Volume da carga" />
                    </div>
                )}

                {activeTab === 'process' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="col-span-full">
                            <h4 className="font-bold text-slate-800 mb-6 flex items-center text-xs uppercase">
                                <Activity className="w-4 h-4 mr-2 text-blue-500" /> Parâmetros de Alimentação
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <InputGroup 
                                    label="Vazão de Sólidos" 
                                    value={params.feedTph || ''} 
                                    onChange={v => onChange('feedTph', v)} 
                                    unit={units.massFlow} 
                                    disabled={mode === 'Classic'}
                                />
                                <InputGroup 
                                    label="% Sólidos (p/p)" 
                                    value={params.feedSolidsPct || ''} 
                                    onChange={v => onChange('feedSolidsPct', v)} 
                                    unit="%" 
                                    disabled={mode === 'Classic'}
                                />
                                <InputGroup 
                                    label="Densidade do fluido" 
                                    value={params.oreDensity || 2.7} 
                                    onChange={v => onChange('oreDensity', v)} 
                                    unit={units.solidDensity} 
                                    required 
                                    disabled={mode === 'Classic'} 
                                />
                                <InputGroup 
                                    label="Vazão Volumétrica" 
                                    value={params.feedVolumetricFlow || ''} 
                                    onChange={v => onChange('feedVolumetricFlow', v)} 
                                    unit={units.volumeFlow} 
                                    disabled={mode === 'Classic'}
                                />
                            </div>
                        </div>

                        <div className="col-span-full border-t border-slate-100 pt-6 mt-4">
                            <h4 className="font-bold text-slate-800 mb-6 flex items-center text-xs uppercase">
                                <Target className="w-4 h-4 mr-2 text-blue-500" /> Controle de Balanço
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <InputGroup 
                                    label="Target Discharge Solids" 
                                    value={params.targetDischargeSolids || 70} 
                                    onChange={v => onChange('targetDischargeSolids', v)} 
                                    unit="%" 
                                    required 
                                    disabled={mode === 'Classic'}
                                />
                                <InputGroup 
                                    label="Densidade do fluido" 
                                    value={calculatedSlurryDensity} 
                                    onChange={() => {}} 
                                    unit={units.solidDensity} 
                                    disabled 
                                    info="1 / [ (S_alvo/100)/ρ_min + (1 - S_alvo/100) ]"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pbm' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-4 block tracking-wider">Função de Seleção (S)</span>
                            <div className="grid grid-cols-2 gap-4">
                                <InputGroup label="Alpha 0 (Scale)" value={params.alpha0 || 1.2} onChange={v => onChange('alpha0', v)} />
                                <InputGroup label="Alpha 1 (Rise)" value={params.alpha1 || 1.5} onChange={v => onChange('alpha1', v)} />
                                <InputGroup label="Alpha 2 (Falloff)" value={params.alpha2 || 0.5} onChange={v => onChange('alpha2', v)} />
                                <InputGroup label="D_crit (µm)" value={params.dCrit || 1200} onChange={v => onChange('dCrit', v)} unit="µm" />
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase mb-4 block tracking-wider">Função de Quebra Austin (B)</span>
                            <div className="grid grid-cols-1 gap-2">
                                <InputGroup label="Beta 0 (Phi)" value={params.beta0 || 0.6} onChange={v => onChange('beta0', v)} subLabel="Fines Fraction" />
                                <InputGroup label="Beta 1 (Gamma)" value={params.beta1 || 1.1} onChange={v => onChange('beta1', v)} />
                                <InputGroup label="Beta 2 (Beta)" value={params.beta2 || 4.5} onChange={v => onChange('beta2', v)} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};