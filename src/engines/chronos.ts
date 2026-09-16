import type { Evidence } from '../contracts.ts';
export function chronos(e: Evidence, asOf: string): 'CURRENT' | 'STALE' | 'FUTURE' {
  const now = Date.parse(asOf);
  if (Date.parse(e.observedAt) > now) return 'FUTURE';
  return now >= Date.parse(e.expiresAt) ? 'STALE' : 'CURRENT';
}
