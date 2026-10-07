/**
 * Formata e normaliza telefones brasileiros para WhatsApp e exibição
 */
export function normalizePhoneForWhatsApp(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;

  // Remove todos os caracteres não numéricos
  const digits = rawPhone.replace(/\D/g, '');

  if (digits.length < 8) {
    return null;
  }

  // Se já começar com 55 (DDI Brasil)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tem DDD + número (10 ou 11 dígitos, ex: 11999999999 ou 1133334444)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Se tem apenas 8 ou 9 dígitos (sem DDD, não é seguro determinar DDD)
  if (digits.length === 8 || digits.length === 9) {
    return null;
  }

  // Se for internacional com mais de 11 dígitos
  if (digits.length >= 11) {
    return digits;
  }

  return null;
}

export function getWhatsAppUrl(rawPhone: string | null | undefined, defaultMessage?: string): string | null {
  const normalized = normalizePhoneForWhatsApp(rawPhone);
  if (!normalized) return null;

  let url = `https://wa.me/${normalized}`;
  if (defaultMessage) {
    url += `?text=${encodeURIComponent(defaultMessage)}`;
  }
  return url;
}

export function formatBrazilianPhone(rawPhone: string | null | undefined): string {
  if (!rawPhone) return 'Não informado';

  const digits = rawPhone.replace(/\D/g, '');

  // Tratar número com DDI 55
  let cleanDigits = digits;
  if (cleanDigits.startsWith('55') && cleanDigits.length > 11) {
    cleanDigits = cleanDigits.substring(2);
  }

  if (cleanDigits.length === 11) {
    // (XX) 9XXXX-XXXX
    return `(${cleanDigits.substring(0, 2)}) ${cleanDigits.substring(2, 7)}-${cleanDigits.substring(7)}`;
  }

  if (cleanDigits.length === 10) {
    // (XX) XXXX-XXXX
    return `(${cleanDigits.substring(0, 2)}) ${cleanDigits.substring(2, 6)}-${cleanDigits.substring(6)}`;
  }

  // Caso seja internacional ou formato diferente, retornar como veio
  return rawPhone;
}
