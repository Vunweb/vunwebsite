import { SearchParams, SearchResponse } from '../types';

export type SearchStage =
  | 'idle'
  | 'preparing'
  | 'querying_sources'
  | 'processing_results'
  | 'applying_filters'
  | 'removing_duplicates'
  | 'finalizing'
  | 'completed'
  | 'error';

export const SEARCH_STAGE_MESSAGES: Record<SearchStage, string> = {
  idle: 'Pronto para buscar',
  preparing: 'Preparando pesquisa...',
  querying_sources: 'Consultando fontes (Google Places API New)...',
  processing_results: 'Processando resultados recebidos...',
  applying_filters: 'Aplicando filtros selecionados...',
  removing_duplicates: 'Removendo duplicados...',
  finalizing: 'Finalizando e calculando Lead Score...',
  completed: 'Pesquisa concluída!',
  error: 'Ocorreu um erro na busca',
};

export async function searchPlacesApi(
  params: SearchParams,
  onStageChange?: (stage: SearchStage) => void
): Promise<SearchResponse> {
  onStageChange?.('preparing');

  const customKey = localStorage.getItem('vunweb_custom_places_key') || '';

  try {
    // Stage: Consultando fontes
    onStageChange?.('querying_sources');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (customKey) {
      headers['x-custom-places-key'] = customKey;
    }

    const response = await fetch('/api/places/search', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...params,
        customApiKey: customKey || undefined,
      }),
    });

    onStageChange?.('processing_results');

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const msg = errorJson?.error || `Falha na requisição HTTP: ${response.status}`;
      onStageChange?.('error');
      throw new Error(msg);
    }

    onStageChange?.('applying_filters');
    // Pequena transição para UI
    await new Promise((r) => setTimeout(r, 200));

    onStageChange?.('removing_duplicates');
    await new Promise((r) => setTimeout(r, 200));

    onStageChange?.('finalizing');
    const data: SearchResponse = await response.json();

    onStageChange?.('completed');
    return data;
  } catch (err: unknown) {
    onStageChange?.('error');
    throw err;
  }
}
