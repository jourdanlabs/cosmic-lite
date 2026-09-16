import { createHash } from 'node:crypto';

// Internal JSON encoding, not a claim of RFC 8787 compliance. Arrays preserve order.
export function canonical(value: unknown): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype) {
    return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k])).join(',') + '}';
  }
  throw new Error('NON_JSON_VALUE');
}
export const hash = (value: unknown): string => createHash('sha256').update(canonical(value)).digest('hex');
export const compare = (a: string, b: string): number => a < b ? -1 : a > b ? 1 : 0;
