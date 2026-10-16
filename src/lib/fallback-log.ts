/**
 * The single fallback log format. One line, greppable in Vercel logs:
 *   [d1-fallback] scope=<search|content> reason=<reason> [key=value ...]
 * Never include query text, IPs, ids-with-secrets or the Worker URL.
 */

export type FallbackScope = 'search' | 'content';

export function formatFallbackLine(
  scope: FallbackScope,
  reason: string,
  detail: Record<string, string | number> = {}
): string {
  const extras = Object.entries(detail)
    .map(([k, v]) => `${k}=${String(v).replace(/\s+/g, '_')}`)
    .join(' ');
  return `[d1-fallback] scope=${scope} reason=${reason.replace(/\s+/g, '_')}${extras ? ' ' + extras : ''}`;
}

export function logD1Fallback(scope: FallbackScope, reason: string, detail?: Record<string, string | number>): void {
  console.warn(formatFallbackLine(scope, reason, detail));
}
