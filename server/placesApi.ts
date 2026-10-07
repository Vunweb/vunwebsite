import { calculateLeadScore } from '../src/lib/score';
import { Lead, SearchParams, SearchResponse } from '../src/types';

const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';
const DEFAULT_MAPS_KEY = 'AIzaSyA7Y1L-BPa0vXMjSX8lIoeLZPyA2A27p2U';

export function getApiKey(overrideKey?: string): string {
  return (
    overrideKey?.trim() ||
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.VITE_GOOGLE_MAPS_API_KEY ||
    DEFAULT_MAPS_KEY
  );
}

interface RawGooglePlace {
  id?: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
  primaryType?: string;
  primaryTypeDisplayName?: { text?: string; languageCode?: string };
}

interface TextSearchResponse {
  places?: RawGooglePlace[];
  nextPageToken?: string;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

/**
 * Extrai cidade e estado de um endereço formatado brasileiro
 * Ex: "Av. Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100, Brasil"
 */
function extractCityAndState(address: string): { city: string | null; state: string | null } {
  if (!address) return { city: null, state: null };

  // Procura padrão Cidade - UF com as siglas oficiais brasileiras
  const ufPattern = /,\s*([^,-]+?)\s*-\s*(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i;
  const match = address.match(ufPattern);
  if (match) {
    return {
      city: match[1].trim(),
      state: match[2].trim().toUpperCase(),
    };
  }

  // Fallback: busca por hífen seguido de duas letras
  const fallbackMatch = /([A-Za-zÀ-ÿ\s]+)\s*-\s*([A-Z]{2})/i.exec(address);
  if (fallbackMatch) {
    const candidateCity = fallbackMatch[1].split(',').pop()?.trim();
    return {
      city: candidateCity || null,
      state: fallbackMatch[2].toUpperCase(),
    };
  }

  return { city: null, state: null };
}

/**
 * Normaliza dados do Google Places para a interface de Lead
 */
function normalizePlace(raw: RawGooglePlace, niche: string): Lead {
  const { city, state } = extractCityAndState(raw.formattedAddress || '');
  const phone = raw.nationalPhoneNumber || raw.internationalPhoneNumber || null;
  const hasWebsite = Boolean(raw.websiteUri && raw.websiteUri.trim().length > 0);
  const websiteUrl = hasWebsite ? raw.websiteUri!.trim() : null;

  const scoreResult = calculateLeadScore({
    phone,
    hasWebsite,
    address: raw.formattedAddress,
    rating: raw.rating,
    ratingCount: raw.userRatingCount,
  });

  return {
    id: `lead_${raw.id || Math.random().toString(36).substring(2, 9)}`,
    place_id: raw.id || '',
    name: raw.displayName?.text?.trim() || 'Estabelecimento sem nome',
    niche: niche.trim(),
    phone,
    formatted_phone: phone,
    email: null,
    address: raw.formattedAddress || 'Não informado',
    city,
    state,
    country: 'Brasil',
    website_url: websiteUrl,
    google_maps_url: raw.googleMapsUri || (raw.id ? `https://www.google.com/maps/place/?q=place_id:${raw.id}` : null),
    instagram_url: null, // Google Places não fornece Instagram verificado; não inventar
    has_website: hasWebsite,
    rating: raw.rating ?? null,
    rating_count: raw.userRatingCount ?? 0,
    business_status: raw.businessStatus || 'OPERATIONAL',
    primary_type: raw.primaryType || null,
    primary_type_display_name: raw.primaryTypeDisplayName?.text || null,
    status: 'NOVO',
    source: 'Google Places API (New)',
    score: scoreResult.score,
    score_potential: scoreResult.scorePotential,
    score_breakdown: scoreResult.breakdown,
    first_contact_at: null,
    last_contact_at: null,
    next_followup_at: null,
    notes: null,
    tags: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Remove duplicatas com base em place_id, telefone e nome + endereço
 */
function deduplicateLeads(leads: Lead[]): Lead[] {
  const seenPlaceIds = new Set<string>();
  const seenPhones = new Set<string>();
  const seenNames = new Set<string>();
  const result: Lead[] = [];

  for (const lead of leads) {
    if (lead.place_id && seenPlaceIds.has(lead.place_id)) {
      continue;
    }

    if (lead.phone) {
      const cleanPhone = lead.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 8 && seenPhones.has(cleanPhone)) {
        continue;
      }
      if (cleanPhone.length >= 8) {
        seenPhones.add(cleanPhone);
      }
    }

    const nameKey = `${lead.name.toLowerCase()}_${lead.address.toLowerCase().substring(0, 20)}`;
    if (seenNames.has(nameKey)) {
      continue;
    }

    if (lead.place_id) {
      seenPlaceIds.add(lead.place_id);
    }
    seenNames.add(nameKey);
    result.push(lead);
  }

  return result;
}

/**
 * Aplica filtros de negócio
 */
function applyFilters(lead: Lead, filters: SearchParams): boolean {
  // Filtro de site
  if (filters.hasWebsite === 'without_site' && lead.has_website) {
    return false;
  }
  if (filters.hasWebsite === 'with_site' && !lead.has_website) {
    return false;
  }

  // Filtro de telefone
  if (filters.hasPhone === 'with_phone' && !lead.phone) {
    return false;
  }
  if (filters.hasPhone === 'without_phone' && lead.phone) {
    return false;
  }

  // Avaliação mínima
  if (filters.minRating > 0) {
    if (!lead.rating || lead.rating < filters.minRating) {
      return false;
    }
  }

  // Volume mínimo de avaliações
  if (filters.minReviews && filters.minReviews > 0) {
    if (lead.rating_count < filters.minReviews) {
      return false;
    }
  }

  // Status de funcionamento
  if (filters.businessStatus && filters.businessStatus !== 'ALL') {
    if (lead.business_status !== filters.businessStatus) {
      return false;
    }
  }

  return true;
}

/**
 * Executa uma chamada à Google Places API (New) Text Search
 */
async function fetchTextSearchPage(
  query: string,
  apiKey: string,
  pageSize: number = 20,
  pageToken?: string
): Promise<TextSearchResponse> {
  const url = 'https://places.googleapis.com/v1/places:searchText';

  const body: Record<string, unknown> = {
    textQuery: query,
    pageSize: Math.min(20, Math.max(1, pageSize)),
    languageCode: 'pt-BR',
    regionCode: 'BR',
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const fieldMask = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.internationalPhoneNumber',
    'places.websiteUri',
    'places.googleMapsUri',
    'places.rating',
    'places.userRatingCount',
    'places.businessStatus',
    'places.primaryType',
    'places.primaryTypeDisplayName',
    'nextPageToken',
  ].join(',');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': fieldMask,
      'X-Goog-Maps-Solution-ID': GMP_ATTRIBUTION_ID,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError;
    try {
      parsedError = JSON.parse(errorText);
    } catch {
      // not JSON
    }
    const message = parsedError?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Google Places API Error: ${message}`);
  }

  return (await response.json()) as TextSearchResponse;
}

/**
 * Função principal server-side: searchPlaces
 */
export async function searchPlaces(
  params: SearchParams,
  overrideApiKey?: string
): Promise<SearchResponse> {
  const apiKey = getApiKey(overrideApiKey);

  if (!apiKey) {
    return {
      success: false,
      totalFound: 0,
      requested: params.quantity,
      places: [],
      searchedQuery: '',
      sourcesConsulted: [],
      attributionId: GMP_ATTRIBUTION_ID,
      error: 'A chave de API da Google Places API (New) não está configurada.',
    };
  }

  const queries: string[] = [];

  // Se múltiplos estados foram selecionados para busca nacional
  if (params.states && params.states.length > 0) {
    for (const state of params.states) {
      queries.push(`${params.niche} em ${state}, Brasil`);
    }
  } else {
    // Busca padrão de nicho + localização
    queries.push(`${params.niche} em ${params.location}`);
  }

  const rawPlacesAccumulator: RawGooglePlace[] = [];
  const targetQuantity = Math.min(100, Math.max(1, params.quantity || 20));

  for (const query of queries) {
    let currentPageToken: string | undefined = undefined;
    let keepPaging = true;
    let pageCount = 0;
    const maxPages = Math.ceil(targetQuantity / 20) + 1; // permitimos páginas extras para compensar filtros

    while (keepPaging && pageCount < maxPages && rawPlacesAccumulator.length < targetQuantity * 2.5) {
      try {
        const pageResult = await fetchTextSearchPage(query, apiKey, 20, currentPageToken);
        pageCount++;

        if (pageResult.places && pageResult.places.length > 0) {
          rawPlacesAccumulator.push(...pageResult.places);
        }

        if (pageResult.nextPageToken && rawPlacesAccumulator.length < targetQuantity * 2.5) {
          currentPageToken = pageResult.nextPageToken;
          // Pequena pausa recomendada para nextPageToken propagar
          await new Promise((res) => setTimeout(res, 500));
        } else {
          keepPaging = false;
        }
      } catch (err: unknown) {
        keepPaging = false;
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`Erro ao consultar Places API para "${query}":`, msg);
        if (rawPlacesAccumulator.length === 0) {
          return {
            success: false,
            totalFound: 0,
            requested: params.quantity,
            places: [],
            searchedQuery: query,
            sourcesConsulted: ['Google Places API (New)'],
            attributionId: GMP_ATTRIBUTION_ID,
            error: `Não foi possível realizar a pesquisa: ${msg}`,
          };
        }
      }
    }
  }

  // 1. Normalizar
  const normalized = rawPlacesAccumulator.map((p) => normalizePlace(p, params.niche));

  // 2. Desduplicar
  const deduplicated = deduplicateLeads(normalized);

  // 3. Aplicar filtros
  const filtered = deduplicated.filter((lead) => applyFilters(lead, params));

  // 4. Ordenar por score decrescente (leads com maior potencial de prospecção no topo)
  filtered.sort((a, b) => b.score - a.score);

  // 5. Limitar à quantidade solicitada
  const finalLeads = filtered.slice(0, targetQuantity);

  let warning: string | undefined = undefined;
  if (finalLeads.length < targetQuantity) {
    warning = `Encontramos ${finalLeads.length} leads que correspondem aos seus filtros específicos.`;
  }

  return {
    success: true,
    totalFound: finalLeads.length,
    requested: params.quantity,
    places: finalLeads,
    searchedQuery: queries.join(' | '),
    sourcesConsulted: ['Google Places API (New) - Text Search'],
    attributionId: GMP_ATTRIBUTION_ID,
    warning,
  };
}
