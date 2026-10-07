import { Followup, Interaction, Lead, SearchHistory } from '../types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase';

const LEADS_STORAGE_KEY = 'vunweb_leads_v1';
const INTERACTIONS_STORAGE_KEY = 'vunweb_interactions_v1';
const FOLLOWUPS_STORAGE_KEY = 'vunweb_followups_v1';
const SEARCHES_STORAGE_KEY = 'vunweb_searches_v1';

// Helper local storage
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

// ----------------- LEADS -----------------

export async function fetchLeads(): Promise<Lead[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Mapear colunas do banco se necessário
        const leads: Lead[] = data.map((d: any) => ({
          ...d,
          formatted_phone: d.phone,
          score_potential: d.score >= 70 ? 'high' : d.score >= 40 ? 'medium' : 'low',
        }));
        // Sincroniza localmente para cache
        setLocal(LEADS_STORAGE_KEY, leads);
        return leads;
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase leads, usando cache local:', e);
    }
  }

  return getLocal<Lead[]>(LEADS_STORAGE_KEY, []);
}

export async function saveLeads(newLeads: Lead[]): Promise<{ added: number; existing: number }> {
  const currentLeads = await fetchLeads();
  const existingPlaceIds = new Set(currentLeads.map((l) => l.place_id).filter(Boolean));
  const existingPhones = new Set(
    currentLeads
      .map((l) => (l.phone ? l.phone.replace(/\D/g, '') : null))
      .filter((p): p is string => Boolean(p && p.length >= 8))
  );

  const leadsToAdd: Lead[] = [];
  let existingCount = 0;

  for (const lead of newLeads) {
    const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
    const hasPhoneMatch = cleanPhone.length >= 8 && existingPhones.has(cleanPhone);
    const hasPlaceMatch = lead.place_id && existingPlaceIds.has(lead.place_id);

    if (hasPlaceMatch || hasPhoneMatch) {
      existingCount++;
    } else {
      leadsToAdd.push(lead);
      if (lead.place_id) existingPlaceIds.add(lead.place_id);
      if (cleanPhone.length >= 8) existingPhones.add(cleanPhone);
    }
  }

  if (leadsToAdd.length === 0) {
    return { added: 0, existing: existingCount };
  }

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      // Inserção em lote no Supabase
      const payload = leadsToAdd.map((l) => ({
        place_id: l.place_id,
        name: l.name,
        niche: l.niche,
        phone: l.phone,
        email: l.email,
        address: l.address,
        city: l.city,
        state: l.state,
        country: l.country || 'Brasil',
        website_url: l.website_url,
        google_maps_url: l.google_maps_url,
        instagram_url: l.instagram_url,
        has_website: l.has_website,
        rating: l.rating,
        rating_count: l.rating_count,
        business_status: l.business_status,
        primary_type: l.primary_type,
        status: l.status,
        source: l.source,
        notes: l.notes,
        created_at: l.created_at,
        updated_at: l.updated_at,
      }));

      await supabase.from('leads').insert(payload);
    } catch (e) {
      console.warn('Erro ao inserir leads no Supabase, salvando localmente:', e);
    }
  }

  // Atualiza localmente
  const updated = [...leadsToAdd, ...currentLeads];
  setLocal(LEADS_STORAGE_KEY, updated);

  // Adiciona interação inicial de 'LEAD_ENCONTRADO'
  for (const lead of leadsToAdd) {
    await addInteraction({
      lead_id: lead.id,
      type: 'LEAD_ENCONTRADO',
      description: `Lead adicionado ao CRM a partir da pesquisa "${lead.niche}"`,
    });
  }

  return { added: leadsToAdd.length, existing: existingCount };
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const currentLeads = await fetchLeads();
  const index = currentLeads.findIndex((l) => l.id === id || l.place_id === id);

  if (index === -1) return null;

  const updatedLead: Lead = {
    ...currentLeads[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };

  currentLeads[index] = updatedLead;
  setLocal(LEADS_STORAGE_KEY, currentLeads);

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from('leads')
        .update({
          status: updatedLead.status,
          notes: updatedLead.notes,
          phone: updatedLead.phone,
          email: updatedLead.email,
          website_url: updatedLead.website_url,
          instagram_url: updatedLead.instagram_url,
          last_contact_at: updatedLead.last_contact_at,
          next_followup_at: updatedLead.next_followup_at,
          updated_at: updatedLead.updated_at,
        })
        .match({ id });
    } catch (e) {
      console.warn('Erro ao atualizar lead no Supabase:', e);
    }
  }

  return updatedLead;
}

export async function deleteLead(id: string): Promise<boolean> {
  const currentLeads = await fetchLeads();
  const filtered = currentLeads.filter((l) => l.id !== id && l.place_id !== id);
  setLocal(LEADS_STORAGE_KEY, filtered);

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('leads').delete().match({ id });
    } catch (e) {
      console.warn('Erro ao deletar lead no Supabase:', e);
    }
  }

  return true;
}

export async function checkDuplicatePlaceIds(placeIds: string[]): Promise<Set<string>> {
  const currentLeads = await fetchLeads();
  const existingSet = new Set<string>();

  for (const lead of currentLeads) {
    if (lead.place_id && placeIds.includes(lead.place_id)) {
      existingSet.add(lead.place_id);
    }
  }

  return existingSet;
}

// ----------------- INTERACTIONS -----------------

export async function fetchInteractions(leadId: string): Promise<Interaction[]> {
  const all = getLocal<Interaction[]>(INTERACTIONS_STORAGE_KEY, []);
  return all
    .filter((i) => i.lead_id === leadId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function addInteraction(
  interaction: Omit<Interaction, 'id' | 'created_at'>
): Promise<Interaction> {
  const newInteraction: Interaction = {
    ...interaction,
    id: `int_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  const all = getLocal<Interaction[]>(INTERACTIONS_STORAGE_KEY, []);
  all.unshift(newInteraction);
  setLocal(INTERACTIONS_STORAGE_KEY, all);

  // Atualizar last_contact_at no lead
  if (
    interaction.type !== 'OBSERVACAO' &&
    interaction.type !== 'LEAD_ENCONTRADO'
  ) {
    await updateLead(interaction.lead_id, {
      last_contact_at: newInteraction.created_at,
    });
  }

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('interactions').insert([newInteraction]);
    } catch (e) {
      console.warn('Erro ao salvar interação no Supabase:', e);
    }
  }

  return newInteraction;
}

// ----------------- FOLLOW-UPS -----------------

export async function fetchFollowups(): Promise<Followup[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('followups')
        .select('*, leads(name, phone, status)')
        .order('scheduled_at', { ascending: true });

      if (!error && data) {
        const mapped: Followup[] = data.map((d: any) => ({
          ...d,
          lead_name: d.leads?.name,
          lead_phone: d.leads?.phone,
          lead_status: d.leads?.status,
        }));
        setLocal(FOLLOWUPS_STORAGE_KEY, mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase followups, usando cache local:', e);
    }
  }

  const current = getLocal<Followup[]>(FOLLOWUPS_STORAGE_KEY, []);
  const leads = await fetchLeads();
  const leadsMap = new Map(leads.map((l) => [l.id, l]));

  return current.map((f) => ({
    ...f,
    lead_name: leadsMap.get(f.lead_id)?.name || f.lead_name || 'Lead',
    lead_phone: leadsMap.get(f.lead_id)?.phone || f.lead_phone,
    lead_status: leadsMap.get(f.lead_id)?.status || f.lead_status,
  }));
}

export async function saveFollowup(
  followup: Omit<Followup, 'id' | 'created_at' | 'updated_at'>
): Promise<Followup> {
  const newFollowup: Followup = {
    ...followup,
    id: `fol_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const all = getLocal<Followup[]>(FOLLOWUPS_STORAGE_KEY, []);
  all.push(newFollowup);
  setLocal(FOLLOWUPS_STORAGE_KEY, all);

  // Atualizar next_followup_at no Lead
  await updateLead(followup.lead_id, {
    next_followup_at: followup.scheduled_at,
  });

  // Criar registro de interação
  await addInteraction({
    lead_id: followup.lead_id,
    type: 'FOLLOW_UP',
    description: `Follow-up agendado para ${new Date(followup.scheduled_at).toLocaleDateString('pt-BR')}${followup.notes ? `: ${followup.notes}` : ''}`,
  });

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('followups').insert([newFollowup]);
    } catch (e) {
      console.warn('Erro ao salvar followup no Supabase:', e);
    }
  }

  return newFollowup;
}

export async function completeFollowup(id: string, notes?: string): Promise<Followup | null> {
  const all = getLocal<Followup[]>(FOLLOWUPS_STORAGE_KEY, []);
  const index = all.findIndex((f) => f.id === id);
  if (index === -1) return null;

  const completedAt = new Date().toISOString();
  all[index] = {
    ...all[index],
    status: 'COMPLETED',
    completed_at: completedAt,
    notes: notes || all[index].notes,
    updated_at: completedAt,
  };

  setLocal(FOLLOWUPS_STORAGE_KEY, all);

  // Registrar interação automática
  await addInteraction({
    lead_id: all[index].lead_id,
    type: 'FOLLOW_UP',
    description: `Follow-up concluído com sucesso${notes ? `. Obs: ${notes}` : '.'}`,
  });

  // Limpar next_followup_at no lead
  await updateLead(all[index].lead_id, {
    next_followup_at: null,
  });

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from('followups')
        .update({
          status: 'COMPLETED',
          completed_at: completedAt,
          notes: all[index].notes,
          updated_at: completedAt,
        })
        .match({ id });
    } catch (e) {
      console.warn('Erro ao atualizar followup no Supabase:', e);
    }
  }

  return all[index];
}

// ----------------- SEARCHES -----------------

export async function fetchSearches(): Promise<SearchHistory[]> {
  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('searches')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLocal(SEARCHES_STORAGE_KEY, data);
        return data;
      }
    } catch (e) {
      console.warn('Erro ao consultar Supabase searches:', e);
    }
  }

  return getLocal<SearchHistory[]>(SEARCHES_STORAGE_KEY, []);
}

export async function saveSearchHistory(
  search: Omit<SearchHistory, 'id' | 'created_at'>
): Promise<SearchHistory> {
  const newSearch: SearchHistory = {
    ...search,
    id: `sea_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    created_at: new Date().toISOString(),
  };

  const all = getLocal<SearchHistory[]>(SEARCHES_STORAGE_KEY, []);
  all.unshift(newSearch);
  setLocal(SEARCHES_STORAGE_KEY, all);

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase.from('searches').insert([
        {
          niche: newSearch.niche,
          location: newSearch.location,
          quantity_requested: newSearch.quantity_requested,
          filters: newSearch.filters,
          results_found: newSearch.results_found,
          is_saved_favorite: newSearch.is_saved_favorite,
          saved_title: newSearch.saved_title,
          created_at: newSearch.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Erro ao salvar busca no Supabase:', e);
    }
  }

  return newSearch;
}

export async function toggleFavoriteSearch(id: string, title?: string): Promise<boolean> {
  const all = getLocal<SearchHistory[]>(SEARCHES_STORAGE_KEY, []);
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return false;

  all[index].is_saved_favorite = !all[index].is_saved_favorite;
  if (title) {
    all[index].saved_title = title;
  }
  setLocal(SEARCHES_STORAGE_KEY, all);

  const supabase = getSupabaseClient();
  if (supabase && isSupabaseConfigured()) {
    try {
      await supabase
        .from('searches')
        .update({
          is_saved_favorite: all[index].is_saved_favorite,
          saved_title: all[index].saved_title,
        })
        .match({ id });
    } catch (e) {
      console.warn('Erro ao atualizar favorito no Supabase:', e);
    }
  }

  return all[index].is_saved_favorite || false;
}
