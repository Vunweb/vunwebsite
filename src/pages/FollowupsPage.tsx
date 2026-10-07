import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { LEAD_STATUS_CONFIG } from '../lib/constants';
import { completeFollowup, fetchFollowups } from '../lib/db';
import { Followup } from '../types';
import { formatBrazilianPhone, getWhatsAppUrl } from '../utils/phone';

interface FollowupsPageProps {
  onRefreshStats: () => void;
}

export const FollowupsPage: React.FC<FollowupsPageProps> = ({ onRefreshStats }) => {
  const [followups, setFollowups] = useState<Followup[]>([]);
  const [activeTab, setActiveTab] = useState<'hoje' | 'atrasados' | 'proximos' | 'concluidos'>('hoje');
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    loadFollowups();
  }, []);

  const loadFollowups = async () => {
    const data = await fetchFollowups();
    setFollowups(data);
  };

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfToday = startOfToday + 24 * 60 * 60 * 1000 - 1;

  const atrasados = followups.filter(
    (f) =>
      f.status === 'PENDING' &&
      new Date(f.scheduled_at).getTime() < startOfToday
  );

  const hoje = followups.filter((f) => {
    if (f.status !== 'PENDING') return false;
    const time = new Date(f.scheduled_at).getTime();
    return time >= startOfToday && time <= endOfToday;
  });

  const proximos = followups.filter(
    (f) =>
      f.status === 'PENDING' &&
      new Date(f.scheduled_at).getTime() > endOfToday
  );

  const concluidos = followups.filter((f) => f.status === 'COMPLETED');

  const handleComplete = async (id: string) => {
    setCompletingId(id);
    await completeFollowup(id, 'Follow-up concluído com sucesso');
    await loadFollowups();
    setCompletingId(null);
    onRefreshStats();
  };

  const getListForActiveTab = (): Followup[] => {
    switch (activeTab) {
      case 'atrasados':
        return atrasados;
      case 'hoje':
        return hoje;
      case 'proximos':
        return proximos;
      case 'concluidos':
        return concluidos;
    }
  };

  const currentList = getListForActiveTab();

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Follow-ups Agendados</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Não perca nenhuma oportunidade: acompanhe compromissos e tarefas de contato.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('hoje')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'hoje'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Para Hoje</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'hoje' ? 'bg-white/20' : 'bg-slate-200'
            }`}
          >
            {hoje.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('atrasados')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'atrasados'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Atrasados</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'atrasados' ? 'bg-white/20' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {atrasados.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('proximos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'proximos'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Próximos Dias</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'proximos' ? 'bg-white/20' : 'bg-slate-200'
            }`}
          >
            {proximos.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('concluidos')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'concluidos'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Concluídos</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              activeTab === 'concluidos' ? 'bg-white/20' : 'bg-slate-200'
            }`}
          >
            {concluidos.length}
          </span>
        </button>
      </div>

      {/* List */}
      {currentList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">
            Tudo em dia! Nenhum follow-up nesta categoria.
          </h4>
          <p className="text-xs text-slate-500">
            Você pode agendar novos contatos diretamente na ficha de detalhes de qualquer lead.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentList.map((item) => {
            const whatsAppUrl = getWhatsAppUrl(
              item.lead_phone,
              `Olá ${item.lead_name || ''}! Gostaria de dar continuidade à nossa conversa anterior.`
            );
            const statusConfig = item.lead_status ? LEAD_STATUS_CONFIG[item.lead_status] : null;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-slate-300 transition-all"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-sm">{item.lead_name}</h4>
                    {statusConfig && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-mono">
                      {item.lead_phone ? formatBrazilianPhone(item.lead_phone) : 'Sem telefone'}
                    </span>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      "{item.notes}"
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Agendado para:{' '}
                      <strong className="text-slate-700">
                        {new Date(item.scheduled_at).toLocaleDateString('pt-BR')} às{' '}
                        {new Date(item.scheduled_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {whatsAppUrl && (
                    <a
                      href={whatsAppUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}

                  {item.status === 'PENDING' ? (
                    <button
                      type="button"
                      disabled={completingId === item.id}
                      onClick={() => handleComplete(item.id)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {completingId === item.id ? 'Concluindo...' : 'Concluir follow-up'}
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      ✓ Concluído em{' '}
                      {item.completed_at
                        ? new Date(item.completed_at).toLocaleDateString('pt-BR')
                        : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
