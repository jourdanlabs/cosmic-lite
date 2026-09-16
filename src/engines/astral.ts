import { FIELDS } from '../contracts.ts';
import type { Snapshot, Policy } from '../contracts.ts';
import { canonical, compare } from '../canonical.ts';

function requireThat(ok: unknown, message: string): asserts ok { if (!ok) throw new Error('INVALID_INPUT: ' + message); }
function obj(v: unknown): asserts v is Record<string, any> {
  requireThat(v !== null && typeof v === 'object' && !Array.isArray(v), 'expected object');
  requireThat(Object.getPrototypeOf(v) === Object.prototype, 'expected plain JSON object');
}
function keys(v: Record<string, any>, names: string[]) {
  requireThat(Object.keys(v).length === names.length && names.every(n => Object.hasOwn(v,n)), 'unexpected or missing fields: ' + names.join(','));
}
function str(v: unknown) { requireThat(typeof v === 'string' && v.trim().length > 0, 'nonempty string required'); }
function num(v: unknown) { requireThat(Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= 1_000_000_000, 'nonnegative bounded integer required'); }
export function timestamp(v: unknown): number {
  requireThat(typeof v === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v), 'UTC millisecond timestamp required');
  const n = Date.parse(v); requireThat(Number.isFinite(n) && new Date(n).toISOString() === v, 'invalid timestamp'); return n;
}
export function astral(input: unknown, rules: unknown): { snapshot: Snapshot; policy: Policy } {
  // Force JSON-only data before cloning, including rejection of undefined/NaN.
  canonical(input); canonical(rules);
  obj(input); keys(input,['schema','asOf','items']);
  requireThat(input.schema === 'intake/v1', 'snapshot schema'); timestamp(input.asOf);
  requireThat(Array.isArray(input.items) && input.items.length <= 1000, 'items array, max 1000');
  const ids = new Set<string>(); const evidenceIds = new Set<string>();
  for (const i of input.items) {
    obj(i); keys(i,['id','title','owner','team','priority','dependencyIds','deadlineDays','evidence']);
    for (const k of ['id','title','owner','team']) str(i[k]);
    requireThat(!ids.has(i.id), 'duplicate intake id'); ids.add(i.id); num(i.priority);
    requireThat(Array.isArray(i.dependencyIds) && i.dependencyIds.every((d: unknown) => typeof d === 'string' && d.trim()), 'dependency ids');
    requireThat(new Set(i.dependencyIds).size === i.dependencyIds.length, 'duplicate dependency');
    if (i.deadlineDays !== null) num(i.deadlineDays);
    requireThat(Array.isArray(i.evidence) && i.evidence.length <= 200, 'evidence array, max 200 per intake');
    for (const e of i.evidence) {
      obj(e); keys(e,['id','subjectId','field','value','sourceRef','sourceHash','issuer','observedAt','expiresAt']);
      for (const k of ['id','subjectId','sourceRef','issuer']) str(e[k]);
      requireThat(!evidenceIds.has(e.id), 'duplicate evidence id'); evidenceIds.add(e.id);
      requireThat(FIELDS.includes(e.field), 'unknown fact field');
      requireThat(typeof e.sourceHash === 'string' && /^[a-f0-9]{64}$/.test(e.sourceHash), 'source SHA-256 format');
      requireThat(timestamp(e.expiresAt) > timestamp(e.observedAt), 'empty evidence validity interval');
      if (e.field === 'permitted' || e.field === 'need') requireThat(typeof e.value === 'boolean', 'boolean claim required');
      else if (e.field === 'mechanism' || e.field === 'outcomeMetric') str(e.value);
      else num(e.value);
    }
  }
  obj(rules); keys(rules,['schema','version','authorityByField','capacityDaysByTeam','horizonDays','benefitRealizationBps','costStressBps','minNetBenefit','valueUnit','benefitHorizon','rejectWhen']);
  requireThat(rules.schema === 'intake-policy/v1', 'policy schema');
  for (const k of ['version','valueUnit','benefitHorizon']) str(rules[k]);
  for (const k of ['horizonDays','benefitRealizationBps','costStressBps','minNetBenefit']) num(rules[k]);
  requireThat(rules.benefitRealizationBps <= 10000, 'benefit realization 0..10000 bps');
  requireThat(rules.costStressBps >= 10000 && rules.costStressBps <= 100000, 'cost stress 10000..100000 bps');
  obj(rules.authorityByField); keys(rules.authorityByField,[...FIELDS]);
  for (const f of FIELDS) {
    requireThat(Array.isArray(rules.authorityByField[f]) && rules.authorityByField[f].length > 0, 'field authorities required');
    rules.authorityByField[f].forEach(str);
  }
  obj(rules.capacityDaysByTeam);
  for (const [team, capacity] of Object.entries(rules.capacityDaysByTeam)) { str(team); num(capacity); }
  requireThat(Array.isArray(rules.rejectWhen) && rules.rejectWhen.every((x: unknown) => x === 'permitted' || x === 'need'), 'rejection predicate not supported');
  const snapshot = structuredClone(input) as Snapshot; const policy = structuredClone(rules) as Policy;
  snapshot.items.sort((a,b) => a.priority-b.priority || compare(a.id,b.id));
  for (const i of snapshot.items) { i.dependencyIds.sort(compare); i.evidence.sort((a,b) => compare(a.id,b.id)); }
  return {snapshot,policy};
}
