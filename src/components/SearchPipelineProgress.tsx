import React from 'react';
import { CheckCircle2, CircleDashed, Loader2 } from 'lucide-react';
import { SearchStage } from '../services/placeSearchService';

interface SearchPipelineProgressProps {
  currentStage: SearchStage;
  totalFound?: number;
}

const STAGES: { key: SearchStage; label: string }[] = [
  { key: 'preparing', label: 'Preparando pesquisa' },
  { key: 'querying_sources', label: 'Consultando fontes (Google Places API New)' },
  { key: 'processing_results', label: 'Processando resultados' },
  { key: 'applying_filters', label: 'Aplicando filtros' },
  { key: 'removing_duplicates', label: 'Removendo duplicados' },
  { key: 'finalizing', label: 'Finalizando' },
];

export const SearchPipelineProgress: React.FC<SearchPipelineProgressProps> = ({
  currentStage,
  totalFound,
}) => {
  const stageOrder: SearchStage[] = [
    'idle',
    'preparing',
    'querying_sources',
    'processing_results',
    'applying_filters',
    'removing_duplicates',
    'finalizing',
    'completed',
  ];

  const currentIndex = stageOrder.indexOf(currentStage);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm mb-8 animate-in fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            Buscando estabelecimentos em tempo real...
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Processando requisição de Text Search na Google Places API
          </p>
        </div>
        {totalFound !== undefined && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
            {totalFound} encontrados
          </span>
        )}
      </div>

      <div className="space-y-3">
        {STAGES.map((s, idx) => {
          const stageIndex = stageOrder.indexOf(s.key);
          const isDone = currentIndex > stageIndex;
          const isCurrent = currentIndex === stageIndex;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 text-xs transition-colors p-2 rounded-lg ${
                isCurrent
                  ? 'bg-indigo-50/70 text-indigo-900 font-medium'
                  : isDone
                  ? 'text-slate-600'
                  : 'text-slate-400'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : isCurrent ? (
                <CircleDashed className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
                  {idx + 1}
                </div>
              )}
              <span className="flex-1">{s.label}</span>
              {isDone && <span className="text-[11px] text-emerald-600 font-medium">Concluído</span>}
              {isCurrent && (
                <span className="text-[11px] text-indigo-600 font-medium animate-pulse">
                  Em execução...
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
