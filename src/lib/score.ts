import { ScoreBreakdown } from '../types';

export function calculateLeadScore(data: {
  phone?: string | null;
  hasWebsite?: boolean;
  address?: string | null;
  rating?: number | null;
  ratingCount?: number | null;
}): {
  score: number;
  scorePotential: 'high' | 'medium' | 'low';
  breakdown: ScoreBreakdown;
} {
  let hasPhone = 0;
  let noWebsite = 0;
  let goodRating = 0;
  let reviewVolume = 0;
  let addressClear = 0;

  // 1. Telefone disponível (+30 pontos): Essencial para contato direto via WhatsApp / ligação
  if (data.phone && data.phone.trim().length > 0) {
    hasPhone = 30;
  }

  // 2. Sem site informado (+35 pontos): Principal oportunidade de venda para Vunweb (criação de novo website)
  if (!data.hasWebsite) {
    noWebsite = 35;
  }

  // 3. Avaliação positiva (+15 pontos): Negócio ativo e com boa reputação
  if (data.rating && data.rating >= 4.0) {
    goodRating = 15;
  } else if (data.rating && data.rating >= 3.0) {
    goodRating = 8;
  }

  // 4. Volume de avaliações (+10 pontos): Negócio consolidado com clientes reais
  const count = data.ratingCount || 0;
  if (count >= 30) {
    reviewVolume = 10;
  } else if (count >= 10) {
    reviewVolume = 6;
  } else if (count > 0) {
    reviewVolume = 3;
  }

  // 5. Localização/endereço estruturado (+10 pontos): Endereço físico confiável
  if (data.address && data.address.trim().length > 15 && data.address !== 'Não informado') {
    addressClear = 10;
  }

  const total = Math.min(100, hasPhone + noWebsite + goodRating + reviewVolume + addressClear);

  let scorePotential: 'high' | 'medium' | 'low' = 'low';
  if (total >= 70) {
    scorePotential = 'high';
  } else if (total >= 40) {
    scorePotential = 'medium';
  }

  return {
    score: total,
    scorePotential,
    breakdown: {
      hasPhone,
      noWebsite,
      goodRating,
      reviewVolume,
      addressClear,
      total,
    },
  };
}
