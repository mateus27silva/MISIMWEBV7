import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Zap, Droplets, Target, BarChart3, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';
import { SimulationResult } from '../services/flowsheetSolver';
import { UnitConfig, Component, StreamData } from '../types';

interface EconomicsViewProps {
    results: SimulationResult | null;
    units: UnitConfig;
}

export const EconomicsView: React.FC<EconomicsViewProps> = ({ results, units }) => {
    // Valores de mercado mockados para cálculo
    const PRICES = {
        Cu: 8500, // USD/t
        Au: 65000000, // USD/t (65k per kg)
        energy: 0.12, // USD/kWh
        water: 0.85, // USD/m³
        reagents: 2.50 // USD/t treated
    };

    const ecoStats = useMemo(() => {
        if (!results) return null;

        let totalPower = 0;
        let totalWater = 0;
        let feedTph = 0;
        let revenue = 0;

        // Calcular custos baseados nos metadados dos equipamentos
        Object.values(results.nodeResults).forEach((node: any) => {
            if (node.netPower) totalPower += node.netPower;
            if (node.waterRecovered) totalWater += node.waterRecovered;
        });

        // Calcular receita baseada em correntes de saída (concentrados)
        Object.entries(results.streams).forEach(([id, s]) => {
            const stream = s as StreamData;
            // Heurística simples: se é uma saída e tem alto teor de cobre, é concentrado
            if (stream.elementalAssays && stream.elementalAssays.Cu > 10) {
                const cuTons = (stream.solidsTph * (stream.elementalAssays.Cu / 100));
                revenue += cuTons * PRICES.Cu;
            }
        });

        // Estimar alimentação total para custos de reagentes
        const inputs = Object.values(results.streams).map(s => s as StreamData).filter(s => s.solidsTph > 0); 
        feedTph = inputs[0]?.solidsTph || 0;

        const energyCost = totalPower * PRICES.energy;
        const reagentCost = feedTph * PRICES.reagents;
        const opex = energyCost + reagentCost + (totalWater * PRICES.water);
        const margin = revenue - opex;

        return {
            totalPower,
            opex,
            revenue,
            margin,
            energyCost,
            reagentCost
        };
    }, [results]);

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in duration-500 bg-slate-50/50 rounded-2xl">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-slate-100">
                    <Coins className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Análise Econômica (IA)</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Execute a simulação no fluxograma para gerar o balanço financeiro, estimativas de OPEX e projeção de receita baseada na metalurgia.
                </p>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg opacity-50 cursor-default font-bold shadow-sm">
                    Aguardando execução...
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                        <DollarSign className="w-7 h-7 mr-2 text-green-600" /> ANÁLISE ECONÔMICA (ESTIMATIVA)
                    </h2>
                    <p className="text-slate-500 text-sm">Cálculo de custos operacionais e receita projetada com base no balanço de massa.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">OPEX TOTAL (ESTIMADO)</p>
                    <p className="text-3xl font-black text-slate-900">US$ {ecoStats?.opex.toLocaleString(undefined, { maximumFractionDigits: 0 })}/h</p>
                    <div className="mt-4 flex items-center text-xs text-rose-600 font-bold">
                        <ArrowDownRight className="w-3 h-3 mr-1" /> CONSUMO ATIVO
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">RECEITA BRUTA (ESTIMADA)</p>
                    <p className="text-3xl font-black text-slate-900">US$ {ecoStats?.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}/h</p>
                    <div className="mt-4 flex items-center text-xs text-emerald-600 font-bold">
                        <ArrowUpRight className="w-3 h-3 mr-1" /> VALOR METALÚRGICO
                    </div>
                </div>
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-slate-500">MARGEM OPERACIONAL</p>
                    <p className="text-3xl font-black text-emerald-400">US$ {ecoStats?.margin.toLocaleString(undefined, { maximumFractionDigits: 0 })}/h</p>
                    <p className="text-[10px] text-slate-500 mt-4 uppercase font-bold">LUCRO ANTES DE TAXAS (EBITDA ESTIMADO)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                            <Zap className="w-4 h-4 mr-2 text-yellow-500" /> DECOMPOSIÇÃO DE CUSTOS (OPEX)
                        </h3>
                    </div>
                    <div className="p-8 space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold text-slate-600 uppercase">ENERGIA ELÉTRICA</span>
                                <span className="text-xs font-mono font-bold text-slate-900">US$ {ecoStats?.energyCost.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-yellow-400 h-full" style={{ width: `${(ecoStats!.energyCost / ecoStats!.opex) * 100}%` }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-bold text-slate-600 uppercase">REAGENTES & CONSUMÍVEIS</span>
                                <span className="text-xs font-mono font-bold text-slate-900">US$ {ecoStats?.reagentCost.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{ width: `${(ecoStats!.reagentCost / ecoStats!.opex) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center">
                            <Target className="w-4 h-4 mr-2 text-blue-500" /> KPIs DE EFICIÊNCIA
                        </h3>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-8">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">CUSTO POR TONELADA</p>
                            <p className="text-xl font-bold text-slate-800">US$ {(ecoStats!.opex / (results.globalBalance.inputs || 1)).toFixed(2)} /t</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">INTENSIDADE ENERGÉTICA</p>
                            <p className="text-xl font-bold text-slate-800">{(ecoStats!.totalPower / (results.globalBalance.inputs || 1)).toFixed(2)} kWh/t</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};