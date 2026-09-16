import type { Facts, Policy, Problem } from '../contracts.ts';
import { numberFact } from './nebula.ts';
import { nova } from './nova.ts';
export function pulsar(facts: Facts, policy: Policy, scenario: ReturnType<typeof nova>['scenario']) {
  const challenges: Problem[] = [];
  if (numberFact(facts,'effortDays') === 0 || numberFact(facts,'deliveryDays') === 0)
    challenges.push({code:'ZERO_ESTIMATE',detail:'Validate nonzero implementation effort and elapsed delivery time.'});
  if (scenario && scenario.net < policy.minNetBenefit)
    challenges.push({code:'FRAGILE_CASE',detail:`Downside net ${scenario.net} is below policy minimum ${policy.minNetBenefit}; revise scope or obtain better estimates.`});
  return {status:!scenario ? 'UNKNOWN' : challenges.length ? 'CHALLENGED' : 'WITHIN_DECLARED_SCENARIO',challenges,
    testedScenarios:scenario ? 1 : 0, limitation:'One deterministic downside scenario; not exhaustive adversarial analysis.'};
}
