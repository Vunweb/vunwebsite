import React, { useState } from 'react';
import { Flame, HelpCircle, Info } from 'lucide-react';
import { Lead } from '../types';

interface LeadScoreBadgeProps {
  lead: Lead;
  size?: 'sm' | 'md';
}

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({ lead, size = 'md' }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBadgeStyle = () => {
    if (lead.score >= 70) {
      return {
        bg: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
        label: '🔥 Alto potencial',
        accent: 'text-orange-600',
      };
    }
    if (lead.score >= 40) {
      return {
        bg: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
        label: '🟡 Potencial médio',
        accent: 'text-amber-600',
      };
    }
    return {
      bg: 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
      label: '⚪ Baixo potencial',
      accent: 'text-slate-500',
    };
  };

  const style = getBadgeStyle();
  const b = lead.score_breakdown;

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 font-medium border rounded-lg transition-all cursor-pointer ${
          size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
        } ${style.bg}`}
      >
        <span>{style.label}</span>
        <span className="font-bold text-[11px] opacity-90">({lead.score} pts)</span>
        <Info className="w-3 h-3 opacity-60 ml-0.5" />
      </button>

      {showTooltip && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-900 text-white rounded-xl p-3 shadow-xl text-xs space-y-2 border border-slate-700 animate-in fade-in zoom-in-95 pointer-events-none"
        >
          <div className="font-semibold text-slate-100 flex items-center justify-between border-b border-slate-700 pb-1.5">
            <span>Critérios do Lead Score</span>
            <span className="text-amber-400 font-bold">{lead.score}/100</span>
          </div>

          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span>{lead.phone ? '✓' : '✕'} Telefone para contato direto</span>
              <span className="font-mono text-slate-400">{b?.hasPhone ?? (lead.phone ? 30 : 0)}/30 pts</span>
            </div>
            <div className="flex justify-between">
              <span>{!lead.has_website ? '✓' : '✕'} Sem website (oportunidade web)</span>
              <span className="font-mono text-slate-400">{b?.noWebsite ?? (!lead.has_website ? 35 : 0)}/35 pts</span>
            </div>
            <div className="flex justify-between">
              <span>{(lead.rating ?? 0) >= 4.0 ? '✓' : '✕'} Boa avaliação no Maps</span>
              <span className="font-mono text-slate-400">{b?.goodRating ?? 0}/15 pts</span>
            </div>
            <div className="flex justify-between">
              <span>{lead.rating_count >= 10 ? '✓' : '✕'} Volume de avaliações</span>
              <span className="font-mono text-slate-400">{b?.reviewVolume ?? 0}/10 pts</span>
            </div>
            <div className="flex justify-between">
              <span>{lead.address !== 'Não informado' ? '✓' : '✕'} Localização física clara</span>
              <span className="font-mono text-slate-400">{b?.addressClear ?? 10}/10 pts</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800 italic">
            O score prioriza oportunidades reais para criação de sites e contato direto.
          </p>
        </div>
      )}
    </div>
  );
};
