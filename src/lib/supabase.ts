import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cache do cliente Supabase
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseCredentials(): { url: string; anonKey: string } {
  // 1. Tentar pegar das variáveis de ambiente Vite
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  // 2. Tentar pegar do localStorage caso o usuário tenha configurado na tela de Configurações
  const localUrl = localStorage.getItem('vunweb_supabase_url') || '';
  const localKey = localStorage.getItem('vunweb_supabase_anon_key') || '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseCredentials();
  return Boolean(url && anonKey && url.startsWith('http') && anonKey.length > 20);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseCredentials();

  if (!url || !anonKey) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (err) {
      console.warn('Erro ao inicializar Supabase:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function resetSupabaseClient(url: string, anonKey: string) {
  localStorage.setItem('vunweb_supabase_url', url);
  localStorage.setItem('vunweb_supabase_anon_key', anonKey);
  try {
    supabaseInstance = createClient(url, anonKey);
  } catch (err) {
    console.warn('Erro ao recriar cliente Supabase:', err);
    supabaseInstance = null;
  }
}
