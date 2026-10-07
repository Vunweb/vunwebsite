import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Database,
  ExternalLink,
  Key,
  RefreshCw,
  Save,
  Shield,
  Trash2,
} from 'lucide-react';
import { getSupabaseCredentials, isSupabaseConfigured, resetSupabaseClient } from '../lib/supabase';

interface SettingsPageProps {
  onRefreshAppState: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshAppState }) => {
  const currentCredentials = getSupabaseCredentials();
  const [supabaseUrl, setSupabaseUrl] = useState(currentCredentials.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(currentCredentials.anonKey);
  const [customPlacesKey, setCustomPlacesKey] = useState(
    localStorage.getItem('vunweb_custom_places_key') || ''
  );
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSaveSupabase = (e: React.FormEvent) => {
    e.preventDefault();
    resetSupabaseClient(supabaseUrl.trim(), supabaseAnonKey.trim());
    setSavedMessage('Configurações do Supabase atualizadas com sucesso!');
    setTimeout(() => setSavedMessage(null), 3000);
    onRefreshAppState();
  };

  const handleSavePlacesKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (customPlacesKey.trim()) {
      localStorage.setItem('vunweb_custom_places_key', customPlacesKey.trim());
    } else {
      localStorage.removeItem('vunweb_custom_places_key');
    }
    setSavedMessage('Chave da Google Places API atualizada!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const handleCopySql = () => {
    const sqlScript = `-- Schema completo disponível em /supabase/schema.sql no repositório do projeto
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Execute o arquivo supabase/schema.sql para criar tabelas profiles, leads, interactions, followups, searches e RLS.`;
    navigator.clipboard.writeText(sqlScript);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleClearCache = () => {
    if (
      window.confirm(
        'Tem certeza que deseja limpar os dados de cache local? Seus dados salvos no Supabase permanecerão intactos.'
      )
    ) {
      localStorage.removeItem('vunweb_leads_v1');
      localStorage.removeItem('vunweb_interactions_v1');
      localStorage.removeItem('vunweb_followups_v1');
      localStorage.removeItem('vunweb_searches_v1');
      alert('Cache local limpo com sucesso.');
      onRefreshAppState();
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Configurações & Integrações</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie as integrações da Google Places API (New) e conexão com banco de dados Supabase.
        </p>
      </div>

      {savedMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Google Places API Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Google Places API (New)</h3>
              <p className="text-xs text-slate-500">
                Text Search oficial da Google Maps Platform para busca de leads
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ativo
          </span>
        </div>

        <form onSubmit={handleSavePlacesKey} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Chave de API Personalizada (Opcional)
            </label>
            <input
              type="password"
              placeholder="AIzaSy... (Deixe em branco para usar a chave padrão provisionada)"
              value={customPlacesKey}
              onChange={(e) => setCustomPlacesKey(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Por segurança, a chave da API é consumida exclusivamente pelo backend em ambiente isolado.
            </p>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Chave
          </button>
        </form>
      </div>

      {/* Supabase Section */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Supabase Database & Auth</h3>
              <p className="text-xs text-slate-500">
                Armazenamento em nuvem PostgreSQL com Row Level Security (RLS)
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
              isConfigured
                ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : 'text-amber-700 bg-amber-50 border-amber-200'
            }`}
          >
            {isConfigured ? 'Conectado à Nuvem' : 'Modo Armazenamento Local'}
          </span>
        </div>

        <form onSubmit={handleSaveSupabase} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              VITE_SUPABASE_URL
            </label>
            <input
              type="text"
              placeholder="https://sua-instancia.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              VITE_SUPABASE_ANON_KEY
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Credenciais
            </button>

            <button
              type="button"
              onClick={handleCopySql}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              {copiedSql ? 'Copiado!' : 'Copiar DDL (schema.sql)'}
            </button>
          </div>
        </form>
      </div>

      {/* Data Management */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm">Gerenciamento de Cache Local</h3>
        <p className="text-xs text-slate-500">
          Caso queira resetar o histórico de testes locais deste navegador.
        </p>
        <button
          type="button"
          onClick={handleClearCache}
          className="px-4 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar cache local
        </button>
      </div>
    </div>
  );
};
