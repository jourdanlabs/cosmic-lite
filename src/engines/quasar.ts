import type { Facts, Policy, Problem } from '../contracts.ts';
import { numberFact } from './nebula.ts';
export function quasar(facts: Facts, policy: Policy) {
  const benefitLow = numberFact(facts,'benefitLow'), benefitHigh = numberFact(facts,'benefitHigh');
  const costLow = numberFact(facts,'costLow'), costHigh = numberFact(facts,'costHigh');
  const problems: Problem[] = [];
  if (benefitLow === null || benefitHigh === null || costLow === null || costHigh === null) return {status:'UNKNOWN',problems,case:null};
  if (benefitLow > benefitHigh || costLow > costHigh) problems.push({code:'INVALID_RANGE',detail:'Correct the benefit/cost bounds.'});
  return {status: problems.length ? 'CONFLICT' : 'KNOWN',problems,
    case:problems.length ? null : {benefitLow,benefitHigh,costLow,costHigh,
      netLow:benefitLow-costHigh,netHigh:benefitHigh-costLow,
      valueUnit:policy.valueUnit,benefitHorizon:policy.benefitHorizon}};
}
