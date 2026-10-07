export type LeadStatus =
  | 'NOVO'
  | 'CONTATADO'
  | 'RESPONDEU'
  | 'INTERESSADO'
  | 'PROPOSTA_ENVIADA'
  | 'NEGOCIACAO'
  | 'FECHADO'
  | 'PERDIDO'
  | 'SEM_RESPOSTA';

export interface ScoreBreakdown {
  hasPhone: number;
  noWebsite: number;
  goodRating: number;
  reviewVolume: number;
  addressClear: number;
  total: number;
}

export interface Lead {
  id: string;
  user_id?: string;
  place_id: string;
  name: string;
  niche: string;
  phone: string | null;
  formatted_phone?: string | null;
  email: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  website_url: string | null;
  google_maps_url: string | null;
  instagram_url: string | null;
  has_website: boolean;
  rating: number | null;
  rating_count: number;
  business_status: string;
  primary_type: string | null;
  primary_type_display_name?: string | null;
  status: LeadStatus;
  source: string;
  score: number;
  score_potential: 'high' | 'medium' | 'low';
  score_breakdown?: ScoreBreakdown;
  first_contact_at: string | null;
  last_contact_at: string | null;
  next_followup_at: string | null;
  notes: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export type WebsiteFilter = 'all' | 'with_site' | 'without_site';
export type PhoneFilter = 'all' | 'with_phone' | 'without_phone';

export interface SearchParams {
  niche: string;
  location: string;
  states?: string[];
  quantity: number;
  hasWebsite: WebsiteFilter;
  hasPhone: PhoneFilter;
  minRating: number;
  minReviews?: number;
  businessStatus: string;
}

export interface SearchResponse {
  success: boolean;
  totalFound: number;
  requested: number;
  places: Lead[];
  searchedQuery: string;
  sourcesConsulted: string[];
  attributionId: string;
  warning?: string;
  error?: string;
}

export type InteractionType =
  | 'LEAD_ENCONTRADO'
  | 'MENSAGEM_ENVIADA'
  | 'RESPONDEU'
  | 'LIGACAO'
  | 'AUDIO_ENVIADO'
  | 'DEMONSTRACAO_ENVIADA'
  | 'PROPOSTA_ENVIADA'
  | 'FOLLOW_UP'
  | 'REUNIAO'
  | 'CLIENTE_FECHADO'
  | 'OBSERVACAO';

export interface Interaction {
  id: string;
  lead_id: string;
  user_id?: string;
  type: InteractionType;
  description: string;
  created_at: string;
}

export type FollowupStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Followup {
  id: string;
  lead_id: string;
  user_id?: string;
  lead_name?: string;
  lead_phone?: string | null;
  lead_status?: LeadStatus;
  scheduled_at: string;
  completed_at: string | null;
  status: FollowupStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchHistory {
  id: string;
  user_id?: string;
  niche: string;
  location: string;
  quantity_requested: number;
  filters: SearchParams;
  results_found: number;
  is_saved_favorite?: boolean;
  saved_title?: string;
  cached_places?: Lead[];
  created_at: string;
}

export interface Tag {
  id: string;
  user_id?: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}
