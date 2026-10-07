import React from 'react';
import { ExternalLink, Globe, MapPin, MessageSquare, Phone, Plus } from 'lucide-react';
import { LEAD_STATUS_CONFIG } from '../lib/constants';
import { Lead, LeadStatus } from '../types';
import { formatBrazilianPhone, getWhatsAppUrl } from '../utils/phone';
import { LeadScoreBadge } from './LeadScoreBadge';

interface KanbanBoardProps {
  leads: Lead[];
  onOpenDetails: (lead: Lead) => void;
  onUpdateStatus: (id: string, newStatus: LeadStatus) => void;
}

const PIPELINE_COLUMNS: LeadStatus[] = [
  'NOVO',
  'CONTATADO',
  'RESPONDEU',
  'INTERESSADO',
  'PROPOSTA_ENVIADA',
  'NEGOCIACAO',
  'FECHADO',
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onOpenDetails,
  onUpdateStatus,
}) => {
  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((l) => l.status === status);
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2">
      {PIPELINE_COLUMNS.map((status) => {
        const columnLeads = getLeadsByStatus(status);
        const config = LEAD_STATUS_CONFIG[status];

        return (
          <div
            key={status}
            className="w-72 shrink-0 bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col max-h-[75vh]"
          >
            {/* Header da Coluna */}
            <div className="flex items-center justify-between pb-3 px-1 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.bg} border ${config.border}`} />
                <h4 className="font-bold text-xs text-slate-800">{config.label}</h4>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                {columnLeads.length}
              </span>
            </div>

            {/* Lista de Cards */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pt-3 pr-1">
              {columnLeads.length === 0 ? (
                <div className="h-24 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                  Nenhum lead nesta etapa
                </div>
              ) : (
                columnLeads.map((lead) => {
                  const whatsAppUrl = getWhatsAppUrl(lead.phone);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => onOpenDetails(lead)}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h5 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                            {lead.name}
                          </h5>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {lead.niche}
                          </span>
                        </div>
                        <LeadScoreBadge lead={lead} size="sm" />
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-1">
                        {lead.city && (
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{lead.city} - {lead.state || 'BR'}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                          {lead.has_website ? (
                            <span className="text-slate-700 truncate max-w-[170px]">
                              {lead.website_url?.replace(/^https?:\/\//, '')}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold">Site não encontrado</span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">
                          {lead.phone ? formatBrazilianPhone(lead.phone) : 'Sem tel'}
                        </span>

                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {whatsAppUrl && (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50"
                              title="WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
