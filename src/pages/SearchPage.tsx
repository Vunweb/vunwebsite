import React, { useState } from 'react';
import {
  AlertCircle,
  BookmarkPlus,
  Check,
  CheckSquare,
  ChevronDown,
  Download,
  ExternalLink,
  Flame,
  Globe,
  HelpCircle,
  Info,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { CostBanner } from '../components/CostBanner';
import { LeadCardMobile } from '../components/LeadCardMobile';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { LeadScoreBadge } from '../components/LeadScoreBadge';
import { SearchPipelineProgress } from '../components/SearchPipelineProgress';
import { BRAZIL_STATES, COMMON_NICHES } from '../lib/constants';
import { checkDuplicatePlaceIds, saveLeads, saveSearchHistory } from '../lib/db';
import { exportLeadsToCsv } from '../services/csvService';
import { searchPlacesApi, SearchStage } from '../services/placeSearchService';
import { Lead, SearchParams, SearchResponse } from '../types';
import { formatBrazilianPhone, getWhatsAppUrl } from '../utils/phone';

interface SearchPageProps {
  onLeadsAddedToCrm: (count: number) => void;
  crmLeadPlaceIds: Set<string>;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  onLeadsAddedToCrm,
  crmLeadPlaceIds,
}) => {
  // Form State
  const [niche, setNiche] = useState('Psicólogos');
  const [location, setLocation] = useState('São Paulo, SP');
  const [quantity, setQuantity] = useState<number>(30);
  const [hasWebsite, setHasWebsite] = useState<'all' | 'with_site' | 'without_site'>('without_site');
  const [hasPhone, setHasPhone] = useState<'all' | 'with_phone' | 'without_phone'>('all');
  const [minRating, setMinRating] = useState<number>(0);
  const [minReviews, setMinReviews] = useState<number | undefined>(undefined);
  const [businessStatus, setBusinessStatus] = useState<string>('OPERATIONAL');

  // Modo Nacional por Estados
  const [isMultiStateMode, setIsMultiStateMode] = useState(false);
  const [selectedStates, setSelectedStates] = useState<string[]>(['SP']);

  // Search execution state
  const [searchStage, setSearchStage] = useState<SearchStage>('idle');
  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());

  // Modal
  const [activeModalLead, setActiveModalLead] = useState<Lead | null>(null);

  // Duplicates in current results
  const [existingPlaceIds, setExistingPlaceIds] = useState<Set<string>>(new Set(crmLeadPlaceIds));

  // Saving state
  const [isSavingToCrm, setIsSavingToCrm] = useState(false);
  const [savedSuccessMessage, setSavedSuccessMessage] = useState<string | null>(null);

  const handleStateToggle = (uf: string) => {
    setSelectedStates((prev) =>
      prev.includes(uf) ? prev.filter((s) => s !== uf) : [...prev, uf]
    );
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!niche.trim()) return;

    setErrorMessage(null);
    setSavedSuccessMessage(null);
    setSelectedLeadIds(new Set());

    const params: SearchParams = {
      niche: niche.trim(),
      location: isMultiStateMode ? 'Brasil' : location.trim(),
      states: isMultiStateMode ? selectedStates : undefined,
      quantity,
      hasWebsite,
      hasPhone,
      minRating,
      minReviews: minReviews ? Number(minReviews) : undefined,
      businessStatus,
    };

    try {
      const response = await searchPlacesApi(params, (stage) => setSearchStage(stage));
      setSearchResponse(response);

      // Checa duplicados contra o CRM atual
      const duplicateSet = await checkDuplicatePlaceIds(
        response.places.map((p) => p.place_id).filter(Boolean)
      );
      setExistingPlaceIds(duplicateSet);

      // Salva no histórico de buscas
      await saveSearchHistory({
        niche: params.niche,
        location: isMultiStateMode ? `Estados: ${selectedStates.join(', ')}` : params.location,
        quantity_requested: params.quantity,
        filters: params,
        results_found: response.places.length,
        cached_places: response.places,
      });

      // Seleciona automaticamente os que ainda não estão no CRM
      const newIds = new Set<string>();
      response.places.forEach((p) => {
        if (!duplicateSet.has(p.place_id)) {
          newIds.add(p.id);
        }
      });
      setSelectedLeadIds(newIds);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setSearchResponse(null);
    }
  };

  const toggleSelectLead = (id: string) => {
    const next = new Set(selectedLeadIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedLeadIds(next);
  };

  const handleSelectAll = () => {
    if (!searchResponse) return;
    if (selectedLeadIds.size === searchResponse.places.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(searchResponse.places.map((p) => p.id)));
    }
  };

  const handleAddSelectedToCrm = async () => {
    if (!searchResponse || selectedLeadIds.size === 0) return;

    setIsSavingToCrm(true);
    const leadsToAdd = searchResponse.places.filter((p) => selectedLeadIds.has(p.id));

    try {
      const result = await saveLeads(leadsToAdd);
      onLeadsAddedToCrm(result.added);

      // Atualiza lista de duplicados
      const updatedDuplicates = new Set(existingPlaceIds);
      leadsToAdd.forEach((l) => {
        if (l.place_id) updatedDuplicates.add(l.place_id);
      });
      setExistingPlaceIds(updatedDuplicates);

      setSavedSuccessMessage(
        `${result.added} leads foram adicionados com sucesso ao seu CRM!${
          result.existing > 0 ? ` (${result.existing} já estavam cadastrados)` : ''
        }`
      );
    } catch (err) {
      setErrorMessage('Erro ao salvar leads no CRM.');
    } finally {
      setIsSavingToCrm(false);
    }
  };

  const handleAddSingleToCrm = async (lead: Lead) => {
    const result = await saveLeads([lead]);
    if (result.added > 0) {
      onLeadsAddedToCrm(1);
      const nextDupes = new Set(existingPlaceIds);
      if (lead.place_id) nextDupes.add(lead.place_id);
      setExistingPlaceIds(nextDupes);
      setSavedSuccessMessage(`"${lead.name}" adicionado ao CRM.`);
    } else {
      alert('Este lead já está no seu CRM.');
    }
  };

  const handleExportCurrentSearch = () => {
    if (!searchResponse || searchResponse.places.length === 0) return;
    exportLeadsToCsv(
      searchResponse.places,
      `busca_${niche.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().substring(0, 10)}.csv`
    );
  };

  const isSearching = searchStage !== 'idle' && searchStage !== 'completed' && searchStage !== 'error';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Header */}
      <div className="text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
          <img
            src="https://i.postimg.cc/02TwmPZ5/Favicon-Vunweb.png"
            alt="Vunweb"
            className="w-3.5 h-3.5 object-contain"
          />
          Prospecção Inteligente para Vunweb
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Encontre seus próximos clientes
        </h2>
        <p className="text-slate-500 text-sm mt-1 max-w-2xl">
          Pesquise empresas e profissionais reais por nicho e localização utilizando a Google Places API (New).
        </p>
      </div>

      {/* Cost Notice */}
      <CostBanner />

      {/* Form Container */}
      <form
        onSubmit={handleSearch}
        className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
          {/* Nicho */}
          <div className="lg:col-span-5 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nicho ou Profissão *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                required
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="Ex: psicólogos, dentistas, personal trainers, advogados"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
              />
            </div>
            {/* Quick Niches pills */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-medium">Sugestões:</span>
              {COMMON_NICHES.slice(0, 5).map((cn) => (
                <button
                  key={cn}
                  type="button"
                  onClick={() => setNiche(cn)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  {cn}
                </button>
              ))}
            </div>
          </div>

          {/* Localização */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Localização *
              </label>
              <button
                type="button"
                onClick={() => setIsMultiStateMode(!isMultiStateMode)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                {isMultiStateMode ? 'Modo Cidade' : 'Pesquisa por Estado'}
              </button>
            </div>

            {!isMultiStateMode ? (
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required={!isMultiStateMode}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: São Paulo, SP ou Curitiba, PR"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
                />
              </div>
            ) : (
              <div className="p-2 border border-slate-200 rounded-xl max-h-24 overflow-y-auto flex flex-wrap gap-1 bg-slate-50">
                {BRAZIL_STATES.map((st) => {
                  const isSel = selectedStates.includes(st.uf);
                  return (
                    <button
                      key={st.uf}
                      type="button"
                      onClick={() => handleStateToggle(st.uf)}
                      className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition-all ${
                        isSel
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.uf}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-slate-400">
              {isMultiStateMode
                ? `${selectedStates.length} estados selecionados. A busca nacional será dividida.`
                : 'Pode ser cidade, bairro, estado ou região.'}
            </p>
          </div>

          {/* Quantidade */}
          <div className="lg:col-span-3 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Quantidade de Leads
            </label>
            <select
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
            >
              <option value={10}>10 leads</option>
              <option value={20}>20 leads</option>
              <option value={30}>30 leads (Recomendado)</option>
              <option value={50}>50 leads</option>
              <option value={100}>100 leads (Máximo)</option>
            </select>
          </div>
        </div>

        {/* Linha de Filtros de Qualidade */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Filtros Avançados de Qualificação
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Possui Site? */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-700 block">
                Possui site?
                <span className="ml-1 text-[10px] text-indigo-600 font-semibold">(Foco Vunweb)</span>
              </label>
              <select
                value={hasWebsite}
                onChange={(e) => setHasWebsite(e.target.value as any)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="without_site">❌ Sem site (Alta Oportunidade)</option>
                <option value="with_site">🌐 Com site</option>
                <option value="all">Qualquer</option>
              </select>
            </div>

            {/* Possui Telefone? */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-700 block">Possui telefone?</label>
              <select
                value={hasPhone}
                onChange={(e) => setHasPhone(e.target.value as any)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="all">Qualquer</option>
                <option value="with_phone">Sim (Com telefone)</option>
                <option value="without_phone">Não</option>
              </select>
            </div>

            {/* Avaliação Mínima */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-700 block">Avaliação mínima</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value={0}>Qualquer</option>
                <option value={3}>⭐ 3.0+</option>
                <option value={4}>⭐ 4.0+</option>
                <option value={4.5}>⭐ 4.5+</option>
              </select>
            </div>

            {/* Status do Estabelecimento */}
            <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <label className="text-xs font-bold text-slate-700 block">Status de operação</label>
              <select
                value={businessStatus}
                onChange={(e) => setBusinessStatus(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              >
                <option value="OPERATIONAL">Aberto / Operando</option>
                <option value="CLOSED_TEMPORARILY">Fechado temporariamente</option>
                <option value="ALL">Qualquer status</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            type="submit"
            disabled={isSearching}
            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            {isSearching ? 'Executando busca real...' : '🔎 Buscar leads'}
          </button>
        </div>
      </form>

      {/* Pipeline Progress Indicator */}
      {isSearching && (
        <SearchPipelineProgress
          currentStage={searchStage}
          totalFound={searchResponse?.totalFound}
        />
      )}

      {/* Error State */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Não foi possível realizar a pesquisa</h4>
            <p className="text-xs text-rose-800/90 leading-relaxed">{errorMessage}</p>
            <div className="text-xs text-rose-700 pt-2 flex items-center gap-2">
              <span>Sugestões:</span>
              <span className="underline cursor-pointer" onClick={() => setHasWebsite('all')}>
                Remover filtro de site
              </span>
              <span>•</span>
              <span className="underline cursor-pointer" onClick={() => setMinRating(0)}>
                Zerar avaliação mínima
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Saved Success Notification */}
      {savedSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedSuccessMessage}</span>
        </div>
      )}

      {/* Results Section */}
      {searchResponse && searchResponse.places.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          {/* Action Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-lg">
                  {searchResponse.places.length} leads encontrados
                </h3>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {selectedLeadIds.size} selecionados
                </span>
              </div>
              {searchResponse.warning ? (
                <p className="text-xs text-amber-700 mt-1 font-medium flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  {searchResponse.warning}
                </p>
              ) : (
                <p className="text-xs text-slate-500 mt-0.5">
                  Resultados ordenados automaticamente pelo Lead Score de potencial comercial.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5 text-slate-500" />
                {selectedLeadIds.size === searchResponse.places.length
                  ? 'Desmarcar todos'
                  : 'Selecionar todos'}
              </button>

              <button
                type="button"
                onClick={handleExportCurrentSearch}
                className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Exportar esta lista de resultados para planilha"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                Exportar CSV
              </button>

              <button
                type="button"
                disabled={selectedLeadIds.size === 0 || isSavingToCrm}
                onClick={handleAddSelectedToCrm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                {isSavingToCrm
                  ? 'Salvando...'
                  : `Adicionar selecionados ao CRM (${selectedLeadIds.size})`}
              </button>
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          selectedLeadIds.size === searchResponse.places.length &&
                          searchResponse.places.length > 0
                        }
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded-sm text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3.5">Nome do Estabelecimento</th>
                    <th className="p-3.5">Localização</th>
                    <th className="p-3.5">Telefone</th>
                    <th className="p-3.5">Site</th>
                    <th className="p-3.5">Avaliação</th>
                    <th className="p-3.5">Lead Score</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {searchResponse.places.map((lead) => {
                    const isSelected = selectedLeadIds.has(lead.id);
                    const isAlreadyInCrm = existingPlaceIds.has(lead.place_id);
                    const whatsAppUrl = getWhatsAppUrl(lead.phone);

                    return (
                      <tr
                        key={lead.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          isSelected ? 'bg-indigo-50/30' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLead(lead.id)}
                            className="w-4 h-4 rounded-sm text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>

                        {/* Nome */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => setActiveModalLead(lead)}
                              className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer text-xs"
                            >
                              {lead.name}
                            </span>
                            {isAlreadyInCrm && (
                              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-sm">
                                No CRM
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 block">{lead.niche}</span>
                        </td>

                        {/* Localização */}
                        <td className="p-3.5 max-w-xs">
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{lead.address}</span>
                          </div>
                        </td>

                        {/* Telefone */}
                        <td className="p-3.5 whitespace-nowrap">
                          {lead.phone ? (
                            <span className="font-mono text-slate-800">
                              {formatBrazilianPhone(lead.phone)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Não informado</span>
                          )}
                        </td>

                        {/* Site */}
                        <td className="p-3.5 max-w-[180px]">
                          {lead.has_website && lead.website_url ? (
                            <a
                              href={lead.website_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline truncate block"
                            >
                              {lead.website_url.replace(/^https?:\/\//, '')}
                            </a>
                          ) : (
                            <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                              Site não encontrado
                            </span>
                          )}
                        </td>

                        {/* Avaliação */}
                        <td className="p-3.5 whitespace-nowrap">
                          {lead.rating !== null ? (
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              <span className="font-bold text-slate-800">{lead.rating}</span>
                              <span className="text-[11px] text-slate-400">
                                ({lead.rating_count})
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Sem avaliação</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="p-3.5 whitespace-nowrap">
                          <LeadScoreBadge lead={lead} size="sm" />
                        </td>

                        {/* Ações */}
                        <td className="p-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {whatsAppUrl && (
                              <a
                                href={whatsAppUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                                title="Abrir conversa no WhatsApp"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {lead.google_maps_url && (
                              <a
                                href={lead.google_maps_url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                title="Ver no Google Maps"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {!isAlreadyInCrm ? (
                              <button
                                type="button"
                                onClick={() => handleAddSingleToCrm(lead)}
                                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                + CRM
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveModalLead(lead)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold"
                              >
                                Ver
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="lg:hidden space-y-3">
            {searchResponse.places.map((lead) => (
              <LeadCardMobile
                key={lead.id}
                lead={lead}
                isSelected={selectedLeadIds.has(lead.id)}
                onToggleSelect={toggleSelectLead}
                onOpenDetails={setActiveModalLead}
                isAlreadyInCrm={existingPlaceIds.has(lead.place_id)}
                onAddToCrm={handleAddSingleToCrm}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty Results State */}
      {searchResponse && searchResponse.places.length === 0 && !isSearching && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">
            Nenhum lead encontrado com esses critérios
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            A Google Places API não retornou estabelecimentos para essa combinação específica de nicho e filtros.
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setHasWebsite('all');
                setMinRating(0);
                handleSearch();
              }}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors"
            >
              Ampliar filtros e buscar novamente
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {activeModalLead && (
        <LeadDetailModal
          isOpen={Boolean(activeModalLead)}
          lead={activeModalLead}
          onClose={() => setActiveModalLead(null)}
          onLeadUpdated={(updated) => {
            setActiveModalLead(updated);
          }}
        />
      )}
    </div>
  );
};
