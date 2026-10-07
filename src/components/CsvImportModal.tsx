import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FileSpreadsheet, Upload, X } from 'lucide-react';
import { calculateLeadScore } from '../lib/score';
import { parseCsvContent, CsvParsedRow } from '../services/csvService';
import { Lead } from '../types';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportCompleted: (importedCount: number, existingCount: number) => void;
  onSaveLeads: (leads: Lead[]) => Promise<{ added: number; existing: number }>;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onImportCompleted,
  onSaveLeads,
}) => {
  if (!isOpen) return null;

  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<CsvParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      processContent(text);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const processContent = (content: string) => {
    try {
      const rows = parseCsvContent(content);
      if (rows.length === 0) {
        setErrorMsg('Nenhuma linha válida encontrada no CSV. Verifique o cabeçalho (nome, telefone, etc.)');
      } else {
        setErrorMsg(null);
        setParsedRows(rows);
      }
    } catch (err) {
      setErrorMsg('Falha ao processar arquivo CSV.');
    }
  };

  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setIsProcessing(true);
    try {
      const leadsToCreate: Lead[] = parsedRows.map((row, idx) => {
        const hasWebsite = Boolean(row.website && row.website.trim().length > 0);
        const scoreData = calculateLeadScore({
          phone: row.phone,
          hasWebsite,
          address: row.address,
        });

        return {
          id: `imp_${Date.now()}_${idx}`,
          place_id: `imported_${Date.now()}_${idx}`,
          name: row.name,
          niche: row.niche || 'Geral',
          phone: row.phone || null,
          formatted_phone: row.phone || null,
          email: row.email || null,
          address: row.address || 'Não informado',
          city: row.city || null,
          state: row.state || null,
          country: 'Brasil',
          website_url: hasWebsite ? row.website! : null,
          google_maps_url: row.google_maps || null,
          instagram_url: row.instagram || null,
          has_website: hasWebsite,
          rating: null,
          rating_count: 0,
          business_status: 'OPERATIONAL',
          primary_type: null,
          status: 'NOVO',
          source: 'Importação CSV Manual',
          score: scoreData.score,
          score_potential: scoreData.scorePotential,
          score_breakdown: scoreData.breakdown,
          first_contact_at: null,
          last_contact_at: null,
          next_followup_at: null,
          notes: row.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });

      const result = await onSaveLeads(leadsToCreate);
      onImportCompleted(result.added, result.existing);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Erro ao salvar leads: ${msg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Importar Leads via CSV</h3>
              <p className="text-xs text-slate-500">Adicione planilhas externas diretamente ao CRM</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {/* File Picker */}
          <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csvFileInput"
            />
            <label htmlFor="csvFileInput" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
              <span className="font-semibold text-sm text-slate-800 block">
                Selecione ou arraste seu arquivo CSV
              </span>
              <span className="text-xs text-slate-500 block mt-1">
                Colunas aceitas: nome, nicho, telefone, email, endereco, cidade, estado, site, notas
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Pré-visualização: {parsedRows.length} leads prontos para importar
                </span>
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> CSV válido
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-48 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Nome</th>
                      <th className="p-2">Nicho</th>
                      <th className="p-2">Telefone</th>
                      <th className="p-2">Cidade/UF</th>
                      <th className="p-2">Site</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-medium">{row.name}</td>
                        <td className="p-2">{row.niche || '-'}</td>
                        <td className="p-2">{row.phone || '-'}</td>
                        <td className="p-2">{row.city ? `${row.city}/${row.state || ''}` : '-'}</td>
                        <td className="p-2">{row.website || 'Sem site'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p className="text-[11px] text-slate-400 text-center">
                  ...e mais {parsedRows.length - 5} contatos encontrados
                </p>
              )}
            </div>
          )}
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
            disabled={parsedRows.length === 0 || isProcessing}
            onClick={handleConfirmImport}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {isProcessing ? 'Importando...' : `Confirmar Importação (${parsedRows.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
