import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Instagram,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Save,
  Send,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { INTERACTION_TYPE_LABELS, LEAD_STATUS_CONFIG } from '../lib/constants';
import { addInteraction, fetchInteractions, saveFollowup, updateLead } from '../lib/db';
import { Interaction, InteractionType, Lead, LeadStatus } from '../types';
import { formatBrazilianPhone, getWhatsAppUrl } from '../utils/phone';
import { LeadScoreBadge } from './LeadScoreBadge';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onLeadUpdated: (updated: Lead) => void;
  onDeleteLead?: (id: string) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onLeadUpdated,
  onDeleteLead,
}) => {
  if (!isOpen || !lead) return null;

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<LeadStatus>(lead.status);
  const [leadNotes, setLeadNotes] = useState(lead.notes || '');

  // Novo follow-up
  const [showFollowupForm, setShowFollowupForm] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [followupNotes, setFollowupNotes] = useState('');

  // Nova interação
  const [interactionType, setInteractionType] = useState<InteractionType>('MENSAGEM_ENVIADA');
  const [interactionDescription, setInteractionDescription] = useState('');
  const [savingInteraction, setSavingInteraction] = useState(false);

  useEffect(() => {
    setCurrentStatus(lead.status);
    setLeadNotes(lead.notes || '');
    loadInteractions();
  }, [lead.id]);

  const loadInteractions = async () => {
    setLoadingHistory(true);
    const data = await fetchInteractions(lead.id);
    setInteractions(data);
    setLoadingHistory(false);
  };

  const handleStatusChange = async (newStatus: LeadStatus) => {
    setCurrentStatus(newStatus);
    const updated = await updateLead(lead.id, { status: newStatus });
    if (updated) {
      onLeadUpdated(updated);
      await addInteraction({
        lead_id: lead.id,
        type: 'OBSERVACAO',
        description: `Status alterado para "${LEAD_STATUS_CONFIG[newStatus].label}"`,
      });
      loadInteractions();
    }
  };

  const handleSaveNotes = async () => {
    const updated = await updateLead(lead.id, { notes: leadNotes });
    if (updated) {
      onLeadUpdated(updated);
    }
  };

  const handleCreateInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interactionDescription.trim()) return;

    setSavingInteraction(true);
    await addInteraction({
      lead_id: lead.id,
      type: interactionType,
      description: interactionDescription.trim(),
    });

    setInteractionDescription('');
    setSavingInteraction(false);
    await loadInteractions();

    // Atualiza status se for mensagem inicial ou cliente fechado
    if (interactionType === 'MENSAGEM_ENVIADA' && currentStatus === 'NOVO') {
      handleStatusChange('CONTATADO');
    } else if (interactionType === 'CLIENTE_FECHADO') {
      handleStatusChange('FECHADO');
    }
  };

  const handleScheduleFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupDate) return;

    await saveFollowup({
      lead_id: lead.id,
      scheduled_at: new Date(followupDate).toISOString(),
      completed_at: null,
      status: 'PENDING',
      notes: followupNotes.trim() || null,
    });

    setShowFollowupForm(false);
    setFollowupDate('');
    setFollowupNotes('');
    loadInteractions();
  };

  const whatsAppUrl = getWhatsAppUrl(
    lead.phone,
    `Olá! Sou da equipe da Vunweb. Notei que a ${lead.name} é referência no segmento e gostaria de compartilhar uma oportunidade para aumentar a captação de clientes.`
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-slate-900">{lead.name}</h2>
              <LeadScoreBadge lead={lead} size="sm" />
              <span className="text-xs bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                {lead.niche}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{lead.address}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna Esquerda: Informações & Ações Principais */}
          <div className="lg:col-span-7 space-y-6">
            {/* Status Selector */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                Status no CRM
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((st) => {
                  const cfg = LEAD_STATUS_CONFIG[st];
                  const isSelected = currentStatus === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleStatusChange(st)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg font-medium border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-2 ring-indigo-500/20 shadow-xs font-bold`
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{cfg.label}</span>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions (WhatsApp, Maps, Site) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {whatsAppUrl ? (
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  <MessageSquare className="w-4 h-4" />
                  Abrir WhatsApp
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed border border-slate-200"
                >
                  <MessageSquare className="w-4 h-4" />
                  Sem WhatsApp
                </button>
              )}

              {lead.google_maps_url ? (
                <a
                  href={lead.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition-all hover:scale-[1.02]"
                >
                  <MapPin className="w-4 h-4 text-rose-500" />
                  Google Maps
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ) : null}

              {lead.website_url ? (
                <a
                  href={lead.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-xs shadow-xs transition-all hover:scale-[1.02]"
                >
                  <Globe className="w-4 h-4 text-blue-500" />
                  Visitar Site
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              ) : (
                <div className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-50/60 border border-rose-200 text-rose-700 text-xs font-semibold">
                  <Globe className="w-4 h-4 text-rose-500" />
                  Site não encontrado
                </div>
              )}
            </div>

            {/* Dados Cadastrais */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Dados Detalhados
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Telefone</span>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.phone ? formatBrazilianPhone(lead.phone) : 'Não informado'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Avaliação Google</span>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>
                      {lead.rating ? `${lead.rating} (${lead.rating_count} avaliações)` : 'Sem avaliações'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Instagram</span>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" />
                    {lead.instagram_url ? (
                      <a
                        href={lead.instagram_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        Ver Perfil
                      </a>
                    ) : (
                      <span>Não encontrado</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Cidade / UF</span>
                  <span className="font-medium text-slate-800">
                    {lead.city ? `${lead.city} - ${lead.state || 'BR'}` : 'Não informado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Notas Internas */}
            <div className="bg-white rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Observações Internas
                </label>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar Notas
                </button>
              </div>
              <textarea
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                placeholder="Ex: Contato prefere mensagem de manhã. Apresentar proposta de landing page..."
                rows={3}
                className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-none text-slate-700"
              />
            </div>
          </div>

          {/* Coluna Direita: Histórico & Follow-ups */}
          <div className="lg:col-span-5 space-y-6 flex flex-col">
            {/* Follow-up Section */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Próximo Follow-up
                </span>
                <button
                  type="button"
                  onClick={() => setShowFollowupForm(!showFollowupForm)}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800"
                >
                  {showFollowupForm ? 'Cancelar' : '+ Agendar'}
                </button>
              </div>

              {lead.next_followup_at ? (
                <div className="bg-indigo-50 border border-indigo-200/80 rounded-lg p-2.5 text-xs text-indigo-900 flex items-center justify-between">
                  <div>
                    <span className="font-semibold block">
                      {new Date(lead.next_followup_at).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(lead.next_followup_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <Clock className="w-4 h-4 text-indigo-600" />
                </div>
              ) : (
                <p className="text-xs text-slate-400">Nenhum follow-up agendado no momento.</p>
              )}

              {showFollowupForm && (
                <form onSubmit={handleScheduleFollowup} className="mt-3 space-y-2 pt-2 border-t border-slate-200">
                  <input
                    type="datetime-local"
                    required
                    value={followupDate}
                    onChange={(e) => setFollowupDate(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Motivo (ex: Enviar mensagem de acompanhamento)"
                    value={followupNotes}
                    onChange={(e) => setFollowupNotes(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Confirmar Agendamento
                  </button>
                </form>
              )}
            </div>

            {/* Novo Registro de Interação */}
            <form
              onSubmit={handleCreateInteraction}
              className="bg-white rounded-xl p-4 border border-slate-200 space-y-2.5"
            >
              <h3 className="text-xs font-semibold text-slate-700">Registrar Contato / Evento</h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={interactionType}
                  onChange={(e) => setInteractionType(e.target.value as InteractionType)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-slate-50 font-medium"
                >
                  {(Object.keys(INTERACTION_TYPE_LABELS) as InteractionType[]).map((t) => (
                    <option key={t} value={t}>
                      {INTERACTION_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={savingInteraction || !interactionDescription.trim()}
                  className="py-2 px-3 bg-slate-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  Salvar
                </button>
              </div>
              <input
                type="text"
                placeholder="Descreva o que ocorreu (ex: Cliente respondeu interessado na proposta)"
                value={interactionDescription}
                onChange={(e) => setInteractionDescription(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </form>

            {/* Histórico Timeline */}
            <div className="flex-1 bg-white rounded-xl p-4 border border-slate-200 overflow-y-auto max-h-[280px]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Linha do Tempo
              </h3>

              {loadingHistory ? (
                <p className="text-xs text-slate-400">Carregando histórico...</p>
              ) : interactions.length === 0 ? (
                <p className="text-xs text-slate-400">Nenhum evento registrado ainda.</p>
              ) : (
                <div className="space-y-3 relative before:absolute before:inset-0 before:left-2 before:w-0.5 before:bg-slate-100">
                  {interactions.map((int) => (
                    <div key={int.id} className="relative pl-6 text-xs">
                      <div className="absolute left-1 top-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-white" />
                      <div className="flex items-center justify-between text-slate-400 text-[10px]">
                        <span className="font-semibold text-slate-700">
                          {INTERACTION_TYPE_LABELS[int.type] || int.type}
                        </span>
                        <span>{new Date(int.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{int.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {onDeleteLead && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja remover este lead do CRM?')) {
                  onDeleteLead(lead.id);
                  onClose();
                }
              }}
              className="text-rose-600 hover:text-rose-700 text-xs font-semibold flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover lead
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
