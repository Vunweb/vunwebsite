import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, DollarSign, ShieldAlert } from 'lucide-react';

interface CostBannerProps {
  quotaWarning?: boolean;
}

export const CostBanner: React.FC<CostBannerProps> = ({ quotaWarning }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full mb-6">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-xl p-4 shadow-xs text-amber-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-700 shrink-0 mt-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm text-amber-950">
                  Google Places API (New) em Produção
                </span>
                <span className="text-[11px] font-medium bg-amber-200/70 text-amber-800 px-2 py-0.5 rounded-full">
                  Text Search Oficial
                </span>
              </div>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                Esta pesquisa utiliza uma API externa oficial da Google Maps Platform e pode gerar custos conforme o uso.
                A Vunweb aplica FieldMask estrito para otimizar custos e desduplica chamadas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="text-amber-700 hover:text-amber-900 p-1 rounded-md transition-colors shrink-0 text-xs flex items-center gap-1 font-medium"
          >
            {expanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-amber-200/60 text-xs text-amber-900 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-white/60 p-2.5 rounded-lg border border-amber-200/50">
              <span className="font-semibold block text-amber-950">FieldMask Ativo</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Apenas campos estritamente necessários (nome, telefone, endereço, site e avaliações) são solicitados.
              </p>
            </div>
            <div className="bg-white/60 p-2.5 rounded-lg border border-amber-200/50">
              <span className="font-semibold block text-amber-950">Limite por Busca</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Por padrão, máximo de 100 resultados por pesquisa para controle e previsibilidade orçamentária.
              </p>
            </div>
            <div className="bg-white/60 p-2.5 rounded-lg border border-amber-200/50">
              <span className="font-semibold block text-amber-950">Proteção de Chave</span>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Chamadas intermediadas por camada server-side segura sem exposição de credenciais no navegador.
              </p>
            </div>
          </div>
        )}
      </div>

      {quotaWarning && (
        <div className="mt-2 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
          <span>
            Atenção: A cota atual da API pode estar próxima do limite. Verifique suas credenciais em <strong>Configurações</strong>.
          </span>
        </div>
      )}
    </div>
  );
};
