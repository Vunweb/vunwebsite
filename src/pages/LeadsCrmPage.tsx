import React, { useState } from 'react';
import {
  Calendar,
  Check,
  Clock,
  Download,
  Filter,
  Globe,
  Kanban,
  ListFilter,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  Table as TableIcon,
  Trash2,
  Users,
} from 'lucide-react';
import { KanbanBoard } from '../components/KanbanBoard';
import { LeadDetailModal } from '../components/LeadDetailModal';
import { LeadScoreBadge } from '../components/LeadScoreBadge';
import { LEAD_STATUS_CONFIG } from '../lib/constants';
import { deleteLead, updateLead } from '../lib/db';
import { Lead, LeadStatus } from '../types';
import { formatBrazilianPhone, getWhatsAppUrl } from '../utils/phone';

interface LeadsCrmPageProps {
  leads: Lead[];
  onRefreshLeads: () => void;
  onOpenExportModal: () => void;
}

export const LeadsCrmPage: React.FC<LeadsCrmPageProps> = ({
  leads,
  onRefreshLeads,
  onOpenExportModal,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const [websiteFilter, setWebsiteFilter] = useState<'ALL' | 'NO_SITE' | 'HAS_SITE'>('ALL');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Seleção múltipla
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredLeads = leads.filter((lead) => {
    // Filtro de texto (nome, nicho, cidade, telefone)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = lead.name.toLowerCase().includes(q);
      const matchNiche = lead.niche.toLowerCase().includes(q);
      const matchCity = (lead.city || '').toLowerCase().includes(q);
      const matchPhone = (lead.phone || '').includes(q);
      if (!matchName && !matchNiche && !matchCity && !matchPhone) return false;
    }

    // Filtro de status
    if (statusFilter !== 'ALL' && lead.status !== statusFilter) {
      return false;
    }

    // Filtro de website
    if (websiteFilter === 'NO_SITE' && lead.has_website) return false;
    if (websiteFilter === 'HAS_SITE' && !lead.has_website) return false;

    return true;
  });

  const handleUpdateStatus = async (leadId: string, newStatus: LeadStatus) => {
    await updateLead(leadId, { status: newStatus });
    onRefreshLeads();
  };

  const handleDeleteLead = async (leadId: string) => {
    await deleteLead(leadId);
    onRefreshLeads();
    setSelectedLead(null);
  };

  const handleBulkStatusChange = async (newStatus: LeadStatus) => {
    for (const id of selectedIds) {
      await updateLead(id, { status: newStatus });
    }
    setSelectedIds(new Set());
    onRefreshLeads();
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} leads do CRM?`)) return;
    for (const id of selectedIds) {
      await deleteLead(id);
    }
    setSelectedIds(new Set());
    onRefreshLeads();
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Meus Leads</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gerencie contatos, histórico e pipeline comercial dos clientes prospectados.
          </p>
        </div>

        {/* View toggle & actions */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabela
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Funil Kanban
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenExportModal}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search text */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, nicho, cidade ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status filter */}
          <div className="md:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
            >
              <option value="ALL">Todos os status ({leads.length})</option>
              {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((st) => (
                <option key={st} value={st}>
                  {LEAD_STATUS_CONFIG[st].label} (
                  {leads.filter((l) => l.status === st).length})
                </option>
              ))}
            </select>
          </div>

          {/* Website filter */}
          <div className="md:col-span-3">
            <select
              value={websiteFilter}
              onChange={(e) => setWebsiteFilter(e.target.value as any)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium"
            >
              <option value="ALL">Qualquer presença web</option>
              <option value="NO_SITE">❌ Sem site ({leads.filter((l) => !l.has_website).length})</option>
              <option value="HAS_SITE">🌐 Com site ({leads.filter((l) => l.has_website).length})</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs flex-wrap animate-in fade-in">
            <span className="font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {selectedIds.size} selecionados
            </span>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Mudar status para:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) handleBulkStatusChange(e.target.value as LeadStatus);
                }}
                defaultValue=""
                className="py-1 px-2.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="" disabled>
                  Selecione...
                </option>
                {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {LEAD_STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {leads.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Seu CRM ainda está vazio</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Use a ferramenta de busca para encontrar empresas pelo Google Places API e adicione-as ao seu CRM com 1 clique.
          </p>
        </div>
      ) : viewMode === 'kanban' ? (
        <KanbanBoard
          leads={filteredLeads}
          onOpenDetails={(lead) => setSelectedLead(lead)}
          onUpdateStatus={handleUpdateStatus}
        />
      ) : (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === filteredLeads.length && filteredLeads.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded-sm text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3.5">Nome / Nicho</th>
                  <th className="p-3.5">Cidade / UF</th>
                  <th className="p-3.5">Telefone</th>
                  <th className="p-3.5">Site</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Último Contato</th>
                  <th className="p-3.5">Próximo Follow-up</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedIds.has(lead.id);
                  const stConfig = LEAD_STATUS_CONFIG[lead.status];
                  const whatsAppUrl = getWhatsAppUrl(lead.phone);

                  return (
                    <tr
                      key={lead.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-indigo-50/30' : ''
                      }`}
                    >
                      <td className="p-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            const next = new Set(selectedIds);
                            if (next.has(lead.id)) next.delete(lead.id);
                            else next.add(lead.id);
                            setSelectedIds(next);
                          }}
                          className="w-4 h-4 rounded-sm text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-3.5">
                        <div
                          onClick={() => setSelectedLead(lead)}
                          className="font-bold text-slate-900 hover:text-indigo-600 cursor-pointer text-xs"
                        >
                          {lead.name}
                        </div>
                        <span className="text-[11px] text-slate-400 block">{lead.niche}</span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {lead.city ? `${lead.city} - ${lead.state || 'BR'}` : 'Não informado'}
                      </td>

                      <td className="p-3.5 whitespace-nowrap font-mono">
                        {lead.phone ? formatBrazilianPhone(lead.phone) : 'Sem tel'}
                      </td>

                      <td className="p-3.5 max-w-[170px]">
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

                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-[11px] border ${stConfig.bg} ${stConfig.color} ${stConfig.border}`}
                        >
                          {stConfig.label}
                        </span>
                      </td>

                      <td className="p-3.5 whitespace-nowrap text-slate-500">
                        {lead.last_contact_at ? (
                          new Date(lead.last_contact_at).toLocaleDateString('pt-BR')
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="p-3.5 whitespace-nowrap">
                        {lead.next_followup_at ? (
                          <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1 w-max">
                            <Clock className="w-3 h-3" />
                            {new Date(lead.next_followup_at).toLocaleDateString('pt-BR')}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {whatsAppUrl && (
                            <a
                              href={whatsAppUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                              title="Abrir WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => setSelectedLead(lead)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                          >
                            Detalhes
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {selectedLead && (
        <LeadDetailModal
          isOpen={Boolean(selectedLead)}
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onLeadUpdated={(updated) => {
            setSelectedLead(updated);
            onRefreshLeads();
          }}
          onDeleteLead={handleDeleteLead}
        />
      )}
    </div>
  );
};
