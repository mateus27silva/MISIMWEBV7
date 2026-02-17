
import React, { useState } from 'react';
import { Info, ChevronDown, Check } from 'lucide-react';

export const InputGroup: React.FC<{
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  unit?: string;
  placeholder?: string;
  subLabel?: string;
  disabled?: boolean;
  info?: string;
  required?: boolean;
}> = ({ label, value, onChange, unit, placeholder, subLabel, disabled, info, required }) => (
    <div className={`mb-4 ${disabled ? 'opacity-80' : ''}`}>
        <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center">
                <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-tight truncate mr-1" title={label}>
                    {label} {required && <span className="text-red-500 font-black">*</span>}
                </label>
                {info && (
                    <div className="group relative inline-block">
                        <Info className="w-3.5 h-3.5 text-blue-500 cursor-help hover:text-blue-600 transition-colors" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 text-white text-[10px] rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-mono text-left">
                            <span className="text-blue-400 font-bold block mb-1">Fórmula de Cálculo:</span>
                            {info}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                        </div>
                    </div>
                )}
            </div>
            {subLabel && (
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                    {subLabel}
                </span>
            )}
        </div>
        <div className="flex items-stretch h-11 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all shadow-inner">
            <input 
                type="text" 
                value={value ?? ''} 
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className="flex-1 bg-transparent px-4 py-2 text-white placeholder-slate-500 outline-none font-mono text-sm disabled:cursor-not-allowed"
            />
            {unit && (
                <div className="bg-slate-700 px-3 flex items-center border-l border-slate-600 min-w-[60px] justify-center">
                    <span className="text-white text-[11px] font-bold whitespace-nowrap">
                        {unit}
                    </span>
                </div>
            )}
        </div>
    </div>
);

export const CustomSelect: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string; description?: string }[];
    onChange: (val: string) => void;
    icon?: React.ElementType;
    placeholder?: string;
    required?: boolean;
}> = ({ label, value, options, onChange, icon: Icon, placeholder, required }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <div className="relative mb-4">
            <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-tight mb-1.5 flex items-center">
                {Icon && <Icon className="w-3.5 h-3.5 mr-1.5" />}
                {label} {required && <span className="text-red-500 font-black ml-1">*</span>}
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm text-left flex items-center justify-between shadow-sm transition-all"
                >
                    <span className={`truncate ${!selected ? 'text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {selected ? selected.label : (placeholder || 'Selecione...')}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                            {options.length > 0 ? options.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                    className={`w-full text-left px-4 py-3 text-sm hover:bg-slate-50 flex flex-col items-start transition-colors border-b last:border-0 border-slate-50 ${value === opt.value ? 'bg-blue-50/50' : ''}`}
                                >
                                    <span className={`font-bold ${value === opt.value ? 'text-blue-700' : 'text-slate-800'}`}>
                                        {opt.label}
                                    </span>
                                    {opt.description && (
                                        <span className="text-[11px] text-slate-400 mt-1 leading-tight">{opt.description}</span>
                                    )}
                                </button>
                            )) : (
                                <div className="px-4 py-3 text-sm text-slate-400 italic">Nenhum elemento disponível.</div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export const FormTabs: React.FC<{
    tabs: { id: string; label: string; icon: any; hidden?: boolean }[];
    activeTab: string;
    onChange: (id: string) => void;
}> = ({ tabs, activeTab, onChange }) => {
    const visibleTabs = tabs.filter(t => !t.hidden);
    return (
        <div className="flex border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar scroll-smooth">
            {visibleTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => onChange(tab.id)}
                        className={`flex items-center px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap
                            ${isActive 
                                ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};
