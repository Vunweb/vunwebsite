import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  Flame,
  Globe,
  HelpCircle,
  MessageSquare,
  Percent,
  PhoneCall,
  PieChart,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { Lead } from '../types';

interface DashboardPageProps {
  leads: Lead[];
  totalSearchedCount: number;
  pendingFollowupsToday: number;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  leads,
  totalSearchedCount,
  pendingFollowupsToday,
}) => {
  const totalSalvos = leads.length;

  const contatados = leads.filter(
    (l) =>
      l.status !== 'NOVO' &&
      l.status !== 'SEM_RESPOSTA'
  ).length;

  const respostas = leads.filter(
    (l) =>
      l.status === 'RESPONDEU' ||
      l.status === 'INTERESSADO' ||
      l.status === 'PROPOSTA_ENVIADA' ||
      l.status === 'NEGOCIACAO' ||
      l.status === 'FECHADO'
  ).length;

  const interessados = leads.filter(
    (l) =>
      l.status === 'INTERESSADO' ||
      l.status === 'PROPOSTA_ENVIADA' ||
      l.status === 'NEGOCIACAO' ||
      l.status === 'FECHADO'
  ).length;

  const propostas = leads.filter(
    (l) =>
      l.status === 'PROPOSTA_ENVIADA' ||
      l.status === 'NEGOCIACAO' ||
      l.status === 'FECHADO'
  ).length;

  const fechados = leads.filter((l) => l.status === 'FECHADO').length;
  const perdidos = leads.filter((l) => l.status === 'PERDIDO').length;
  const semSite = leads.filter((l) => !l.has_website).length;

  // Taxas
  const taxaResposta =
    contatados > 0 ? Math.round((respostas / contatados) * 100) : 0;
  const taxaConversao =
    contatados > 0 ? Math.round((fechados / contatados) * 100) : 0;

  // Funil steps
  const funnelSteps = [
    { label: 'Novo', count: leads.filter((l) => l.status === 'NOVO').length, color: 'bg-blue-500' },
    { label: 'Contatado', count: contatados, color: 'bg-indigo-500' },
    { label: 'Respondeu', count: respostas, color: 'bg-teal-500' },
    { label: 'Interessado', count: interessados, color: 'bg-amber-500' },
    { label: 'Proposta', count: propostas, color: 'bg-purple-500' },
    { label: 'Fechado', count: fechados, color: 'bg-emerald-500' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard & Métricas</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Performance do funil de vendas e prospecção da Vunweb.
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Leads Salvos</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{totalSalvos}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">No banco do CRM</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Contatados</span>
            <PhoneCall className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{contatados}</div>
          <span className="text-[10px] text-indigo-600 font-semibold mt-0.5 block">Abordados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Respostas</span>
            <MessageSquare className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{respostas}</div>
          <span className="text-[10px] text-teal-600 font-semibold mt-0.5 block">Engajaram</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Interessados</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{interessados}</div>
          <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">Quentes</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Propostas</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{propostas}</div>
          <span className="text-[10px] text-purple-600 font-semibold mt-0.5 block">Enviadas</span>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-md shadow-emerald-500/20">
          <div className="flex items-center justify-between text-emerald-100 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fechados</span>
            <Award className="w-4 h-4 text-white" />
          </div>
          <div className="text-2xl font-extrabold text-white">{fechados}</div>
          <span className="text-[10px] text-emerald-100 font-medium mt-0.5 block">Clientes Vunweb</span>
        </div>
      </div>

      {/* Taxas de Conversão e Oportunidades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Taxa de Resposta */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Resposta
            </span>
            <span className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{taxaResposta}%</div>
          <p className="text-xs text-slate-500">
            {respostas} respostas de {contatados} leads contatados.
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, taxaResposta)}%` }}
            />
          </div>
        </div>

        {/* Taxa de Conversão */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Taxa de Conversão
            </span>
            <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{taxaConversao}%</div>
          <p className="text-xs text-slate-500">
            {fechados} clientes fechados de {contatados} contatados.
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, taxaConversao)}%` }}
            />
          </div>
        </div>

        {/* Oportunidades Sem Site */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Oportunidades Sem Site
            </span>
            <span className="p-1.5 bg-rose-50 text-rose-700 rounded-lg">
              <Globe className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{semSite}</div>
          <p className="text-xs text-slate-500">
            Negócios com site não encontrado (público ideal para Vunweb).
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${totalSalvos > 0 ? (semSite / totalSalvos) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Visual Funnel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Funil de Prospecção</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Visualização progressiva do pipeline desde o lead novo até o fechamento.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
            {totalSalvos} no pipeline
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {funnelSteps.map((step, idx) => (
            <div
              key={step.label}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 relative text-center"
            >
              <div className="text-xs font-semibold text-slate-500 mb-1">{step.label}</div>
              <div className="text-2xl font-extrabold text-slate-900 mb-2">{step.count}</div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`${step.color} h-full rounded-full`}
                  style={{
                    width: `${totalSalvos > 0 ? Math.max(8, (step.count / totalSalvos) * 100) : 0}%`,
                  }}
                />
              </div>

              {idx < funnelSteps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-slate-300">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
