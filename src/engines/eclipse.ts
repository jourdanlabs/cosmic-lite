import type { Facts, Intake, Policy } from '../contracts.ts';
import { numberFact } from './nebula.ts';
export function eclipse(item: Intake, facts: Facts, policy: Policy) {
  const days = numberFact(facts,'deliveryDays');
  const availableDays = Math.min(policy.horizonDays,item.deadlineDays ?? policy.horizonDays);
  if (days === null) return {status:'UNKNOWN',deliveryDays:null,availableDays};
  return {status:days <= availableDays ? 'FITS' : 'MISSES_WINDOW',deliveryDays:days,availableDays};
}
