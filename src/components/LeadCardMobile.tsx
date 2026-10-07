import React from 'react';
import { ExternalLink, Globe, MapPin, MessageSquare, Phone, Plus, Star } from 'lucide-react';
import { Lead } from '../types';
import { formatBrazilianPhone, getWhatsAppUrl } from '../utils/phone';
import { LeadScoreBadge } from './LeadScoreBadge';

interface LeadCardMobileProps {
  lead: Lead;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenDetails: (lead: Lead) => void;
  isAlreadyInCrm?: boolean;
  onAddToCrm?: (lead: Lead) => void;
}

export const LeadCardMobile: React.FC<LeadCardMobileProps> = ({
  lead,
  isSelected,
  onToggleSelect,
  onOpenDetails,
  isAlreadyInCrm,
  onAddToCrm,
}) => {
  const whatsAppUrl = getWhatsAppUrl(
    lead.phone,
    `Olá! Me chamo da equipe Vunweb, tudo bem? Notei o trabalho da ${lead.name} e gostaria de compartilhar uma solução para aquisição de clientes.`
  );

  return (
    <div
      className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/20'
          : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(lead.id)}
            className="mt-1 w-4 h-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4
                onClick={() => onOpenDetails(lead)}
                className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer"
              >
                {lead.name}
              </h4>
              {isAlreadyInCrm && (
                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                  No CRM
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">{lead.niche}</span>
          </div>
        </div>

        <LeadScoreBadge lead={lead} size="sm" />
      </div>

      <div className="mt-3 space-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{lead.address}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{lead.phone ? formatBrazilianPhone(lead.phone) : 'Telefone não informado'}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {lead.has_website && lead.website_url ? (
            <a
              href={lead.website_url}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline truncate max-w-[200px]"
            >
              {lead.website_url.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span className="text-rose-600 font-medium">Site não encontrado</span>
          )}
        </div>

        {lead.rating !== null && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span className="font-semibold text-slate-800">{lead.rating}</span>
            <span className="text-slate-400">({lead.rating_count} avaliações)</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {whatsAppUrl && (
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Abrir WhatsApp"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
          )}
          {lead.google_maps_url && (
            <a
              href={lead.google_maps_url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              title="Ver no Google Maps"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        <div className="flex items-center gap-2">
          {onAddToCrm && !isAlreadyInCrm && (
            <button
              type="button"
              onClick={() => onAddToCrm(lead)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenDetails(lead)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Detalhes
          </button>
        </div>
      </div>
    </div>
  );
};
