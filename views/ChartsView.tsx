import React, { useState, useMemo } from 'react';
import { 
    BarChart, 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer, 
    Legend, 
    Bar, 
    Cell, 
    ScatterChart, 
    Scatter 
} from 'recharts';
import { SimulationResult } from '../services/flowsheetSolver';
import { UnitConfig, Connection, StreamData } from '../types';
import { Waves, BarChart as BarChartIcon, Activity, PieChart, BarChart3 } from 'lucide-react';

interface ChartsViewProps {
    results: SimulationResult | null;
    connections: Connection[];
    units: UnitConfig;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ results, connections, units }) => {
    const [selectedStreams, setSelectedStreams] = useState<string[]>([]);

    const throughputData = useMemo(() => {
        if (!results) return [];
        return Object.entries(results.streams)
            .map(([id, s]) => {
                const stream = s as StreamData;
                const conn = connections.find(c => c.id === id);
                return {
                    name: conn?.label || id,
                    solids: stream.solidsTph,
                    water: stream.waterTph,
                    total: stream.totalTph
                };
            })
            .filter(d => d.total > 0)
            .sort((a, b) => b.total - a.total);
    }, [results, connections]);

    const psdComparisonData = useMemo(() => {
        if (!results) return [];
        const available = Object.entries(results.streams)
            .map(([k, v]) => [k, v as StreamData] as [string, StreamData])
            .filter(([_, s]) => s.psd && s.psd.length > 0);
        const sizes = new Set<number>();
        available.forEach(([_, s]) => s.psd?.forEach(p => sizes.add(p.size)));
        const sortedSizes = Array.from(sizes).sort((a, b) => a - b);

        return sortedSizes.map(size => {
            const entry: any = { size };
            available.forEach(([id, s]) => {
                const conn = connections.find(c => c.id === id);
                const label = conn?.label || id;
                const point = s.psd?.find(p => p.size === size);
                if (point) entry[label] = point.passing;
            });
            return entry;
        });
    }, [results, connections]);

    if (!results) {
        return (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in duration-500 bg-slate-50/50 rounded-2xl">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-md border border-slate-100">
                    <BarChart3 className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Análise Gráfica do Circuito</h2>
                <p className="text-slate-500 max-w-md mb-8">
                    Simule o circuito para visualizar as curvas granulométricas (PSD) comparadas e o carregamento de massa entre as correntes de processo.
                </p>
                <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg opacity-50 cursor-default font-bold shadow-sm">
                    Aguardando execução...
                </button>
            </div>
        );
    }

    const availableStreamLabels = Object.entries(results.streams)
        .map(([k, v]) => [k, v as StreamData] as [string, StreamData])
        .filter(([_, s]) => s.psd && s.psd.length > 0)
        .map(([id, _]) => connections.find(c => c.id === id)?.label || id);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header>
                <h2 className="text-2xl font-bold text-slate-900 flex items-center">
                    <BarChart3 className="w-7 h-7 mr-2 text-orange-600" /> ANÁLISE GRÁFICA DO CIRCUITO
                </h2>
                <p className="text-slate-500 text-sm">Visualização de distribuições granulométricas e balanços de massa.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Distribuição Granulométrica (PSD) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[500px]">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
                        <Waves className="w-4 h-4 mr-2 text-cyan-500" /> COMPARAÇÃO DE CURVAS (PSD)
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={psdComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="size" 
                                    type="number" 
                                    scale="log" 
                                    domain={['auto', 'auto']}
                                    label={{ value: `TAMANHO (${units.particleSize})`, position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold' }}
                                    tick={{ fontSize: 10 }}
                                />
                                <YAxis 
                                    label={{ value: '% PASSANTE ACUM.', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }}
                                    tick={{ fontSize: 10 }}
                                />
                                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                                {availableStreamLabels.map((label, idx) => (
                                    <Line 
                                        key={label}
                                        type="monotone" 
                                        dataKey={label} 
                                        stroke={`hsl(${idx * 45}, 70%, 50%)`} 
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Balanço de Massa por Corrente */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[500px]">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center">
                        <BarChartIcon className="w-4 h-4 mr-2 text-blue-500" /> CARREGAMENTO POR CORRENTE
                    </h3>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={throughputData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                <XAxis type="number" tick={{ fontSize: 10 }} label={{ value: `VAZÃO (${units.massFlow})`, position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }} />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ fontSize: '12px', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Legend wrapperStyle={{ fontSize: '10px' }} />
                                <Bar dataKey="solids" name="SÓLIDOS" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                                <Bar dataKey="water" name="ÁGUA" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};