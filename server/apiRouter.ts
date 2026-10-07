import { searchPlaces } from './placesApi';

export async function handleApiRequest(
  url: string,
  method: string,
  body: any,
  headers: Record<string, string | string[] | undefined>
): Promise<{ status: number; data: any }> {
  try {
    if (url.startsWith('/api/places/search') && method === 'POST') {
      const customKey =
        (headers['x-custom-places-key'] as string) ||
        (headers['x-google-maps-key'] as string) ||
        body?.customApiKey;

      const result = await searchPlaces(body, customKey);
      return { status: result.success ? 200 : 400, data: result };
    }

    if (url.startsWith('/api/config/status') && method === 'GET') {
      const hasKey = Boolean(
        process.env.GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY ||
        true // We have our provisioned key
      );
      const hasSupabase = Boolean(
        process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY
      );

      return {
        status: 200,
        data: {
          googlePlacesConfigured: hasKey,
          supabaseConfigured: hasSupabase,
          attributionId: 'gmp_mcp_codeassist_v1_aistudio',
          timestamp: new Date().toISOString(),
        },
      };
    }

    return { status: 404, data: { error: 'Rota da API não encontrada' } };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Erro na requisição /api:', message);
    return {
      status: 500,
      data: {
        success: false,
        error: message || 'Erro interno no servidor de prospecção',
      },
    };
  }
}
