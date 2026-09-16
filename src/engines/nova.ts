import type { Facts, Policy } from '../contracts.ts';
import { quasar } from './quasar.ts';
export function nova(facts: Facts, policy: Policy, businessCase: ReturnType<typeof quasar>['case']) {
  // A declared intervention model: sensitivity arithmetic, not identified causality.
  if (!businessCase || facts.mechanism.status !== 'KNOWN' || facts.outcomeMetric.status !== 'KNOWN') return {status:'UNSUPPORTED',scenario:null};
  const realizedBenefit = Math.floor(businessCase.benefitLow * policy.benefitRealizationBps / 10000);
  const stressedCost = Math.ceil(businessCase.costHigh * policy.costStressBps / 10000);
  return {status:'CONDITIONAL',scenario:{mechanism:facts.mechanism.value, outcomeMetric:facts.outcomeMetric.value,
    realizedBenefit,stressedCost,net:realizedBenefit-stressedCost,
    limitation:'Arithmetic conditional on admitted estimates; no causal identification or probability claim.'}};
}
