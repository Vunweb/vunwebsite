/**
 * Arquitetura de serviço para futuro enriquecimento de perfis sociais
 * (Instagram, LinkedIn, Facebook).
 *
 * REGRA FUNDAMENTAL:
 * A Google Places API não fornece perfil oficial do Instagram.
 * Não inventar URLs, não adivinhar @ e não gerar dados fictícios.
 * Se nenhuma fonte externa legítima estiver conectada, retorna null ("Não encontrado").
 */

export interface SocialEnrichmentProvider {
  name: string;
  isConfigured: boolean;
  findInstagram?: (businessName: string, website?: string) => Promise<string | null>;
}

class SocialProfileService {
  private providers: SocialEnrichmentProvider[] = [];

  registerProvider(provider: SocialEnrichmentProvider) {
    this.providers.push(provider);
  }

  async getInstagram(businessName: string, website?: string): Promise<string | null> {
    const activeProvider = this.providers.find((p) => p.isConfigured && p.findInstagram);
    if (!activeProvider || !activeProvider.findInstagram) {
      // Nenhuma fonte externa configurada: retornar estritamente null
      return null;
    }

    try {
      return await activeProvider.findInstagram(businessName, website);
    } catch {
      return null;
    }
  }

  isInstagramAvailable(): boolean {
    return this.providers.some((p) => p.isConfigured);
  }
}

export const socialProfileService = new SocialProfileService();
