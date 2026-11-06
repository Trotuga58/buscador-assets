import type { License } from '../../shared/types.ts';

/** Devuelve 'cc0' o 'cc-by'; cualquier otra cosa (NC, SA, ND, vacío, desconocido) es null. */
export function normalizeLicense(raw: string | null | undefined): 'cc0' | 'cc-by' | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase().replace(/[_\s]+/g, '-');
  if (!s) return null;
  if (/(^|[^a-z])(nc|nd|sa)([^a-z]|$)/.test(s) || s.includes('noncommercial') || s.includes('sharealike') || s.includes('noderiv')) {
    return null;
  }
  if (s === 'cc0' || s.startsWith('cc0') || s.includes('creative-commons-0') || s.includes('publicdomain/zero') || s.includes('zero')) {
    return 'cc0';
  }
  if (s === 'by' || s === 'cc-by' || /^cc-by(-[\d.]+)?$/.test(s) || s.startsWith('attribution')) {
    return 'cc-by';
  }
  return null;
}

const LABEL: Record<License, string> = {
  cc0: 'CC0',
  'cc-by': 'CC BY',
  ofl: 'SIL OFL',
  'apache-2.0': 'Apache 2.0',
};

export function buildAttribution(a: {
  title: string; author: string; license: License; sourceName: string; sourceUrl: string;
}): string {
  return `"${a.title}" de ${a.author} (${a.sourceName}, ${a.sourceUrl}), licencia ${LABEL[a.license]}.`;
}
