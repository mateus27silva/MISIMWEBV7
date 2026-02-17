
export * from './FormBase';
export * from './MillForm';
export * from './CycloneForm';
export * from './FlotationForm';
export * from './StreamForm';

import React from 'react';
import { Settings2, Hammer, Shuffle, Sliders } from 'lucide-react';
import { UnitConfig } from '../types';
import { InputGroup } from './FormBase';

// Formulários menores agrupados aqui por conveniência, ou exportados individualmente se crescerem
export const SagMillForm = ({ params, onChange, units }: { params: any, onChange: (k: string, v: any) => void, units: UnitConfig }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                <Settings2 className="w-5 h-5 mr-2 text-indigo-500" /> Moinho SAG
            </h3>
        </div>
        
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <InputGroup label="Work Index (Wi)" value={params.workIndex} onChange={(v) => onChange('workIndex', v)} unit={units.specificEnergy} required />
            <InputGroup label="Diâmetro" value={params.diameter} onChange={(v) => onChange('diameter', v)} unit={units.diameter} required />
            <InputGroup label="Comprimento (EGL)" value={params.length} onChange={(v) => onChange('length', v)} unit={units.length} required />
            <InputGroup label="Enchimento Total (Jc)" value={params.fillingTotal} onChange={(v) => onChange('fillingTotal', v)} unit="%" />
            <InputGroup label="Enchimento Bolas (Jb)" value={params.fillingBalls} onChange={(v) => onChange('fillingBalls', v)} unit="%" />
            <InputGroup label="% Velocidade Crítica" value={params.criticalSpeed} onChange={(v) => onChange('criticalSpeed', v)} unit="%" />
        </div>
    </div>
);

export const HPGRForm = ({ params, onChange, units }: { params: any, onChange: (k: string, v: any) => void, units: UnitConfig }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                <Settings2 className="w-5 h-5 mr-2 text-stone-500" /> HPGR (Rolos de Alta Pressão)
            </h3>
        </div>
        
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <InputGroup label="Força Específica" value={params.specificForce} onChange={(v) => onChange('specificForce', v)} unit="N/mm²" required />
            <InputGroup label="Velocidade Periférica" value={params.rollSpeed} onChange={(v) => onChange('rollSpeed', v)} unit="m/s" required />
            <InputGroup label="Diâmetro Rolo" value={params.rollDiameter} onChange={(v) => onChange('rollDiameter', v)} unit={units.diameter} required />
            <InputGroup label="Largura Rolo" value={params.rollWidth} onChange={(v) => onChange('rollWidth', v)} unit={units.length} required />
            <InputGroup label="Working Gap" value={params.workingGap} onChange={(v) => onChange('workingGap', v)} unit="mm" />
        </div>
    </div>
);

export const GyratoryForm = ({ params, onChange, units }: { params: any, onChange: (k: string, v: any) => void, units: UnitConfig }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                <Hammer className="w-5 h-5 mr-2 text-yellow-600" /> Britador Giratório
            </h3>
        </div>
        
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <InputGroup label="Capacidade" value={params.capacity} onChange={(v) => onChange('capacity', v)} unit={units.massFlow} />
            <InputGroup label="OSS (Open Side Setting)" value={params.oss} onChange={(v) => onChange('oss', v)} unit="mm" />
            <InputGroup label="CSS (Closed Side Setting)" value={params.css} onChange={(v) => onChange('css', v)} unit="mm" required />
            <InputGroup label="Potência Instalada" value={params.power} onChange={(v) => onChange('power', v)} unit={units.power} />
        </div>
    </div>
);

export const JawCrusherForm = ({ params, onChange, units }: { params: any, onChange: (k: string, v: any) => void, units: UnitConfig }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                <Hammer className="w-5 h-5 mr-2 text-stone-600" /> Britador Mandíbula
            </h3>
        </div>
        
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <InputGroup label="Capacidade" value={params.capacity} onChange={(v) => onChange('capacity', v)} unit={units.massFlow} />
            <InputGroup label="OSS" value={params.oss} onChange={(v) => onChange('oss', v)} unit="mm" />
            <InputGroup label="CSS" value={params.css} onChange={(v) => onChange('css', v)} unit="mm" required />
            <InputGroup label="Potência" value={params.power} onChange={(v) => onChange('power', v)} unit={units.power} />
            <InputGroup label="Throw (Curso)" value={params.throw} onChange={(v) => onChange('throw', v)} unit="mm" />
        </div>
    </div>
);

export const MixerForm = ({ params, onChange, units }: { params: any, onChange: (k: string, v: any) => void, units: UnitConfig }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        <div className="p-8 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center text-sm uppercase tracking-wide">
                <Shuffle className="w-5 h-5 mr-2 text-purple-500" /> Misturador / Caixa de Polpa
            </h3>
        </div>

        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <InputGroup label="Número de Entradas" value={params.inputCount || 3} onChange={(v) => onChange('inputCount', v)} />
            <InputGroup label="Número de Saídas" value={params.outputCount || 1} onChange={(v) => onChange('outputCount', v)} />
        </div>
    </div>
);

export const DefaultForm = ({ params, onChange }: { params: any, onChange: (k: string, v: any) => void }) => (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h3 className="font-bold text-slate-900 mb-8 flex items-center text-sm uppercase tracking-wide">
            <Sliders className="w-5 h-5 mr-2 text-slate-500" /> Parâmetros Genéricos
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.entries(params || {}).map(([key, value]) => {
                if (typeof value === 'object') return null;
                return (
                    <InputGroup 
                        key={key} 
                        label={key} 
                        value={value as any} 
                        onChange={(v) => onChange(key, v)} 
                    />
                );
            })}
            {Object.keys(params || {}).length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-400 italic text-sm bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    Nenhum parâmetro configurável disponível.
                </div>
            )}
        </div>
    </div>
);
