import { createClient } from '@supabase/supabase-js';

/**
 * CONFIGURAÇÃO DO CLIENTE SUPABASE - NOVO PROJETO: cupgzavitvrdhtxhwikx
 */
const SUPABASE_URL = 'https://cupgzavitvrdhtxhwikx.supabase.co'.trim();
const SUPABASE_ANON_KEY = 'sb_publishable_m4F9Fq0FUKNIGvDYzOY5OA_L3WhONgh'.trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});