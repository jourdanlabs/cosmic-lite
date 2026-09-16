import { FIELDS } from '../contracts.ts';
import type { Evidence, Facts, Problem } from '../contracts.ts';
import { canonical } from '../canonical.ts';
export function nebula(evidence: Evidence[]) {
  const facts = {} as Facts; const gaps: Problem[] = [];
  for (const field of FIELDS) {
    const claims = evidence.filter(e => e.field === field);
    const values = new Set(claims.map(c => canonical(c.value)));
    const evidenceIds = claims.map(c => c.id);
    facts[field] = values.size === 1 ? {status:'KNOWN',value:claims[0].value,evidenceIds} :
      {status:values.size === 0 ? 'UNKNOWN' : 'CONFLICT',evidenceIds};
    if (facts[field].status !== 'KNOWN') gaps.push({code:facts[field].status,field,evidenceIds,detail:`Resolve ${field}: ${facts[field].status}.`});
  }
  return {facts,gaps,coverage:{known: FIELDS.length-gaps.length, required:FIELDS.length}};
}
export function numberFact(f: Facts, field: keyof Facts): number | null {
  const fact = f[field]; return fact.status === 'KNOWN' && typeof fact.value === 'number' ? fact.value : null;
}
