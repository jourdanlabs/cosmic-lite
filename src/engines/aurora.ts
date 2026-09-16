import type { Intake, Facts, Policy, Problem, Decision, Resolution } from '../contracts.ts';
export function aurora(item: Intake, facts: Facts, policy: Policy, unresolved: {engine:string; problem:Problem}[], timing: string) {
  const reasons: Resolution[] = [];
  // A decisive admitted disqualifier may reject even if irrelevant estimates are missing.
  for (const field of policy.rejectWhen) {
    const f = facts[field];
    if (f.status === 'KNOWN' && f.value === false) reasons.push({owner:item.owner,engine:'AURORA',code:'POLICY_DISQUALIFIER',field,
      evidenceIds:f.evidenceIds,question:`Policy ${policy.version} rejects because ${field}=false. Reopen with new authoritative evidence or a versioned policy change.`});
  }
  if (reasons.length) return {decision:'REJECT' as Decision,reasons};
  for (const {engine,problem:p} of unresolved) reasons.push({owner:item.owner,engine,code:p.code,question:p.detail,
    ...(p.field ? {field:p.field} : {}),...(p.evidenceIds ? {evidenceIds:p.evidenceIds} : {})});
  // No policy may silently approve a false eligibility predicate merely by disabling rejection.
  for (const field of ['permitted','need'] as const) {
    const f = facts[field];
    if (f.status === 'KNOWN' && f.value !== true) reasons.push({owner:item.owner,engine:'AURORA',code:'NOT_ELIGIBLE',field,
      evidenceIds:f.evidenceIds,question:`Resolve ${field}=false before admission.`});
  }
  if (reasons.length) return {decision:'NEEDS_EVIDENCE' as Decision,reasons};
  if (timing !== 'FITS') return {decision:'DEFER' as Decision,reasons:[{owner:item.owner,engine:'ECLIPSE',code:'MISSES_WINDOW',question:'Revise the delivery scope or planning window.'}]};
  return {decision:'BUILD' as Decision,reasons};
}
