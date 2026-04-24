/**
 * Normalize slug from API or DB (handles legacy values where `slug` held a full URL).
 */
export function normalizedPoetSlug(slug?: string | null): string {
  if (!slug) return '';
  const s = slug.trim();
  if (!s) return '';
  if (/^https?:\/\//i.test(s) || s.includes('ganjoor.net')) {
    return slugFromGanjoorFullUrl(s);
  }
  return s.replace(/^\/+|\/+$/g, '').split('/')[0].toLowerCase();
}

/**
 * Derive the Ganjoor archive path segment (e.g. "hafez") from fullUrl or legacy slug strings.
 */
export function slugFromGanjoorFullUrl(fullUrl?: string | null): string {
  if (!fullUrl) return '';
  const trimmed = fullUrl.trim();
  if (!trimmed) return '';

  try {
    const url = trimmed.includes('://')
      ? new URL(trimmed)
      : new URL(trimmed.startsWith('/') ? `https://ganjoor.net${trimmed}` : `https://ganjoor.net/${trimmed}`);
    const segment = url.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
    return (segment || '').toLowerCase();
  } catch {
    const cleaned = trimmed.replace(/^https?:\/\//i, '').replace(/^[^/]+\//, '');
    const segment = cleaned.split('/')[0] || '';
    return segment.toLowerCase();
  }
}
