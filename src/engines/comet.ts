import type { Intake, Policy, Evidence, Problem } from '../contracts.ts';
import { chronos } from './chronos.ts';
export function comet(item: Intake, policy: Policy, asOf: string) {
  const admitted: Evidence[] = []; const excluded: Problem[] = [];
  for (const e of item.evidence) {
    const state = chronos(e,asOf);
    const code = e.subjectId !== item.id ? 'WRONG_SUBJECT' :
      !policy.authorityByField[e.field].includes(e.issuer) ? 'UNAUTHORIZED_ISSUER' :
      state !== 'CURRENT' ? state : null;
    if (code) excluded.push({code,field:e.field,evidenceIds:[e.id],detail:`Replace ${e.id}: ${code}.`});
    else admitted.push(e);
  }
  return {admitted,excluded};
}
