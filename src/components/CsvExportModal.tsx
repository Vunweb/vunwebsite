import React, { useState } from 'react';
import { Download, FileDown, Filter, X } from 'lucide-react';
import { exportLeadsToCsv } from '../services/csvService';
import { Lead } from '../types';

interface CsvExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  selectedLeadIds?: string[];
}

export const CsvExportModal: React.FC<CsvExportModalProps> = ({
  isOpen,
  onClose,
  leads,
  selectedLeadIds = [],
}) => {
  if (!isOpen) return null;

  const [filterType, setFilterType] = useState<
    'all' | 'selected' | 'no_website' | 'interested' | 'closed'
  >('all');

  const getFilteredLeads = (): Lead[] => {
    switch (filterType) {
      case 'selected':
        return leads.filter((l) => selectedLeadIds.includes(l.id));
      case 'no_website':
        return leads.filter((l) => !l.has_website);
      case 'interested':
        return leads.filter((l) => l.status === 'INTERESSADO' || l.status === 'NEGOCIACAO');
      case 'closed':
        return leads.filter((l) => l.status === 'FECHADO');
      case 'all':
      default:
        return leads;
    }
  };

  const filtered = getFilteredLeads();

  const handleExport = () => {
    const filename = `vunweb_leads_${filterType}_${new Date().toISOString().substring(0, 10)}.csv`;
    exportLeadsToCsv(filtered, filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <FileDown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Exportar Leads (CSV)</h3>
              <p className="text-xs text-slate-500">Planilha formatada para Excel & Google Sheets</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Escolha o filtro para exportação:
          </label>

          <div className="space-y-2">
            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="exportFilter"
                  checked={filterType === 'all'}
                  onChange={() => setFilterType('all')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Todos os leads salvos</span>
              </div>
              <span className="text-slate-400 font-mono">({leads.length})</span>
            </label>

            {selectedLeadIds.length > 0 && (
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <div className="flex items-center gap-2.5">
                  <input
                    type="radio"
                    name="exportFilter"
                    checked={filterType === 'selected'}
                    onChange={() => setFilterType('selected')}
                    className="text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-800">Apenas leads selecionados</span>
                </div>
                <span className="text-slate-400 font-mono">({selectedLeadIds.length})</span>
              </label>
            )}

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="exportFilter"
                  checked={filterType === 'no_website'}
                  onChange={() => setFilterType('no_website')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Leads sem site informado</span>
              </div>
              <span className="text-slate-400 font-mono">
                ({leads.filter((l) => !l.has_website).length})
              </span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="exportFilter"
                  checked={filterType === 'interested'}
                  onChange={() => setFilterType('interested')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Leads interessados & em negociação</span>
              </div>
              <span className="text-slate-400 font-mono">
                ({leads.filter((l) => l.status === 'INTERESSADO' || l.status === 'NEGOCIACAO').length})
              </span>
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
              <div className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="exportFilter"
                  checked={filterType === 'closed'}
                  onChange={() => setFilterType('closed')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold text-slate-800">Clientes fechados</span>
              </div>
              <span className="text-slate-400 font-mono">
                ({leads.filter((l) => l.status === 'FECHADO').length})
              </span>
            </label>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={filtered.length === 0}
            onClick={handleExport}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar CSV ({filtered.length})
          </button>
        </div>
      </div>
    </div>
  );
};
