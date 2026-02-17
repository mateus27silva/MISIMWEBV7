import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO CLIENTE SUPABASE - PROJETO ATUAL: gdqwtjmhmilxxintkurn
 */
const SUPABASE_URL = 'https://gdqwtjmhmilxxintkurn.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'sb_publishable_Tg7zgTyTzLKolmzYiIaLGg_8zQ697F6'.trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});