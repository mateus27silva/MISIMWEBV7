
import { supabase } from './supabaseClient';
import { UnitDefinition, UnitConfig } from '../types';

export const fetchUnitDefinitions = async (): Promise<UnitDefinition[]> => {
    try {
        const { data, error } = await supabase
            .from('unit_definitions')
            .select('*')
            .order('category', { ascending: true });

        if (error) throw error;
        return data as UnitDefinition[];
    } catch (err) {
        console.error("Erro ao buscar definições de unidades:", err);
        return [];
    }
};

/**
 * Converte um valor de uma unidade qualquer para a unidade base da categoria.
 * Ex: 1 kg/s -> 3.6 t/h (se t/h for a base)
 */
export const convertToBase = (value: number, symbol: string, definitions: UnitDefinition[]): number => {
    const unit = definitions.find(u => u.symbol === symbol);
    if (!unit) return value;
    return value * Number(unit.to_base_factor);
};

/**
 * Converte um valor da unidade base para uma unidade de destino.
 * Ex: 3.6 t/h -> 1 kg/s
 */
export const convertFromBase = (value: number, targetSymbol: string, definitions: UnitDefinition[]): number => {
    const unit = definitions.find(u => u.symbol === targetSymbol);
    if (!unit || Number(unit.to_base_factor) === 0) return value;
    return value / Number(unit.to_base_factor);
};

/**
 * Helper para formatar valores com base na configuração atual do usuário.
 */
export const formatUnitValue = (
    baseValue: number, 
    category: keyof UnitConfig, 
    userConfig: UnitConfig, 
    definitions: UnitDefinition[]
): string => {
    const targetSymbol = userConfig[category];
    const converted = convertFromBase(baseValue, targetSymbol, definitions);
    return `${converted.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${targetSymbol}`;
};
