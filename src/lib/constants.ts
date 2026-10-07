import { InteractionType, LeadStatus } from '../types';

export const BRAZIL_STATES = [
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'TO', name: 'Tocantins' },
  { uf: 'AC', name: 'Acre' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'RR', name: 'Roraima' },
];

export const LEAD_STATUS_CONFIG: Record<
  LeadStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  NOVO: {
    label: 'Novo',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  CONTATADO: {
    label: 'Contatado',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  RESPONDEU: {
    label: 'Respondeu',
    color: 'text-teal-700',
    bg: 'bg-teal-50',
    border: 'border-teal-200',
  },
  INTERESSADO: {
    label: 'Interessado',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  PROPOSTA_ENVIADA: {
    label: 'Proposta enviada',
    color: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  NEGOCIACAO: {
    label: 'Negociação',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  FECHADO: {
    label: 'Fechado',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
  },
  PERDIDO: {
    label: 'Perdido',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  SEM_RESPOSTA: {
    label: 'Sem resposta',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  LEAD_ENCONTRADO: 'Lead encontrado',
  MENSAGEM_ENVIADA: 'Mensagem enviada',
  RESPONDEU: 'Respondeu',
  LIGACAO: 'Ligação realizada',
  AUDIO_ENVIADO: 'Áudio enviado',
  DEMONSTRACAO_ENVIADA: 'Demonstração enviada',
  PROPOSTA_ENVIADA: 'Proposta enviada',
  FOLLOW_UP: 'Follow-up realizado',
  REUNIAO: 'Reunião agendada/realizada',
  CLIENTE_FECHADO: 'Cliente fechado',
  OBSERVACAO: 'Observação interna',
};

export const COMMON_NICHES = [
  'Psicólogos',
  'Dentistas',
  'Personal Trainers',
  'Advogados',
  'Clínicas de Estética',
  'Médicos e Clínicas',
  'Arquitetos',
  'Contadores',
  'Consultórios Veterinários',
  'Restaurantes e Buffets',
  'Imobiliárias',
  'Academias',
];
