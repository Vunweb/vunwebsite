import { Lead } from '../types';

export function exportLeadsToCsv(leads: Lead[], filename: string = 'leads_vunweb.csv'): void {
  if (leads.length === 0) return;

  const headers = [
    'ID',
    'Nome',
    'Nicho',
    'Telefone',
    'Site',
    'Tem Site',
    'Endereco',
    'Cidade',
    'Estado',
    'Avaliacao',
    'Num Avaliacoes',
    'Score',
    'Potencial',
    'Status',
    'Google Maps',
    'Instagram',
    'Ultimo Contato',
    'Proximo Followup',
    'Notas',
    'Criado Em',
  ];

  const rows = leads.map((l) => [
    l.id,
    escapeCsv(l.name),
    escapeCsv(l.niche),
    escapeCsv(l.phone || ''),
    escapeCsv(l.website_url || 'Site não encontrado'),
    l.has_website ? 'Sim' : 'Não',
    escapeCsv(l.address || ''),
    escapeCsv(l.city || ''),
    escapeCsv(l.state || ''),
    l.rating !== null ? l.rating.toString() : '',
    l.rating_count.toString(),
    l.score.toString(),
    l.score_potential,
    escapeCsv(l.status),
    escapeCsv(l.google_maps_url || ''),
    escapeCsv(l.instagram_url || 'Não informado'),
    escapeCsv(l.last_contact_at ? new Date(l.last_contact_at).toLocaleDateString('pt-BR') : ''),
    escapeCsv(l.next_followup_at ? new Date(l.next_followup_at).toLocaleDateString('pt-BR') : ''),
    escapeCsv(l.notes || ''),
    escapeCsv(new Date(l.created_at).toLocaleDateString('pt-BR')),
  ]);

  const csvContent =
    '\uFEFF' + // UTF-8 BOM para Excel ler acentos em português corretamente
    [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCsv(str: string): string {
  if (str === null || str === undefined) return '""';
  const text = String(str).replace(/"/g, '""');
  return `"${text}"`;
}

export interface CsvParsedRow {
  name: string;
  niche?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  website?: string;
  instagram?: string;
  google_maps?: string;
  notes?: string;
}

export function parseCsvContent(content: string): CsvParsedRow[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  // Detect delimiter (, or ;)
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const rawHeaders = splitCsvLine(firstLine, delimiter).map((h) =>
    h.trim().toLowerCase().replace(/["']/g, '')
  );

  const results: CsvParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], delimiter);
    if (values.length === 0) continue;

    const row: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      row[h] = values[idx]?.trim().replace(/^["']|["']$/g, '') || '';
    });

    const name = row['nome'] || row['name'] || row['empresa'] || row['razao_social'];
    if (!name) continue;

    results.push({
      name,
      niche: row['nicho'] || row['segmento'] || row['niche'] || 'Geral',
      phone: row['telefone'] || row['phone'] || row['celular'] || row['whatsapp'] || '',
      email: row['email'] || row['e-mail'] || '',
      address: row['endereco'] || row['address'] || row['rua'] || '',
      city: row['cidade'] || row['city'] || '',
      state: row['estado'] || row['state'] || row['uf'] || '',
      website: row['site'] || row['website'] || row['website_url'] || '',
      instagram: row['instagram'] || row['instagram_url'] || '',
      google_maps: row['google_maps'] || row['maps'] || '',
      notes: row['notas'] || row['observacao'] || row['notes'] || '',
    });
  }

  return results;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
