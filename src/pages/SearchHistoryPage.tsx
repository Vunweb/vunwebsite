import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  Calendar,
  Clock,
  Eye,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { fetchSearches, toggleFavoriteSearch } from '../lib/db';
import { Lead, SearchHistory } from '../types';

interface SearchHistoryPageProps {
  onReExecuteSearch: (history: SearchHistory) => void;
}

export const SearchHistoryPage: React.FC<SearchHistoryPageProps> = ({ onReExecuteSearch }) => {
  const [searches, setSearches] = useState<SearchHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [viewingPlacesModal, setViewingPlacesModal] = useState<Lead[] | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadSearches();
  }, []);

  const loadSearches = async () => {
    const data = await fetchSearches();
    setSearches(data);
  };

  const handleToggleFavorite = async (id: string) => {
    await toggleFavoriteSearch(id);
    await loadSearches();
  };

  const favorites = searches.filter((s) => s.is_saved_favorite);
  const displayList = activeTab === 'favorites' ? favorites : searches;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pesquisas & Histórico</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Revise consultas anteriores ou reexecute buscas frequentes com um clique.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>Todas as Pesquisas ({searches.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('favorites')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Pesquisas Salvas / Frequentes ({favorites.length})</span>
        </button>
      </div>

      {/* List */}
      {displayList.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-2">
          <Search className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-800 text-sm">Nenhuma pesquisa registrada</h4>
          <p className="text-xs text-slate-500">
            Realize sua primeira busca na aba "Encontrar Leads" para que o histórico apareça aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayList.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-slate-900 text-sm">
                    {item.saved_title || `${item.niche} em ${item.location}`}
                  </h4>
                  {item.is_saved_favorite && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Frequente
                    </span>
                  )}
                  <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                    {item.results_found} leads encontrados
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span>Solicitado: {item.quantity_requested}</span>
                  <span>•</span>
                  <span>
                    Filtro site:{' '}
                    {item.filters.hasWebsite === 'without_site'
                      ? 'Sem site'
                      : item.filters.hasWebsite === 'with_site'
                      ? 'Com site'
                      : 'Qualquer'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(item.created_at).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(item.created_at).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleToggleFavorite(item.id)}
                  className={`p-2 rounded-xl border transition-colors ${
                    item.is_saved_favorite
                      ? 'bg-amber-50 border-amber-300 text-amber-600'
                      : 'border-slate-200 text-slate-400 hover:text-amber-500 hover:bg-slate-50'
                  }`}
                  title={item.is_saved_favorite ? 'Remover dos favoritos' : 'Salvar como frequente'}
                >
                  <Star className={`w-4 h-4 ${item.is_saved_favorite ? 'fill-current' : ''}`} />
                </button>

                {item.cached_places && item.cached_places.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setViewingPlacesModal(item.cached_places || [])}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver resultados
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onReExecuteSearch(item)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-600/20"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Executar novamente
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Resultados em Cache */}
      {viewingPlacesModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">
                Resultados desta pesquisa ({viewingPlacesModal.length} leads)
              </h3>
              <button
                type="button"
                onClick={() => setViewingPlacesModal(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                Fechar
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 divide-y divide-slate-100">
              {viewingPlacesModal.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="pt-2 flex items-center justify-between hover:bg-slate-50 p-2 rounded-lg cursor-pointer"
                >
                  <div>
                    <h5 className="font-bold text-xs text-slate-900">{lead.name}</h5>
                    <p className="text-[11px] text-slate-500">{lead.address}</p>
                  </div>
                  <span className="text-xs font-mono text-slate-700">
                    {lead.phone || 'Sem telefone'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes de um Lead do histórico */}
      {selectedLead && (
        <LeadDetailModal
          isOpen={Boolean(selectedLead)}
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={(updated) => setSelectedLead(updated)}
        />
      )}
    </div>
  );
};
