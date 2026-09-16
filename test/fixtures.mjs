import { FIELDS } from '../src/contracts.ts';
import { hash } from '../src/canonical.ts';
export function policy() {
  return {schema:'intake-policy/v1',version:'SYNTHETIC-ONLY-1',
    authorityByField:Object.fromEntries(FIELDS.map(f => [f,['synthetic-reviewed-adapter']])),
    capacityDaysByTeam:{alpha:20,beta:10},horizonDays:60,
    benefitRealizationBps:8000,costStressBps:12500,minNetBenefit:100,
    valueUnit:'synthetic value units',benefitHorizon:'12 months',rejectWhen:['permitted','need']};
}
export function item(id, priority=1, changes={}) {
  const values = {permitted:true,need:true,benefitLow:1000,benefitHigh:1400,costLow:100,costHigh:200,
    effortDays:5,deliveryDays:5,mechanism:'Remove repeated manual re-entry',outcomeMetric:'Minutes of re-entry per completed case'};
  return {id,title:`Synthetic ${id}`,owner:'synthetic-owner',team:'alpha',priority,dependencyIds:[],deadlineDays:null,
    evidence:Object.entries(values).map(([field,value]) => ({id:`${id}:${field}`,subjectId:id,field,value,
      sourceRef:`synthetic://${id}/${field}`,sourceHash:hash({id,field,value}),issuer:'synthetic-reviewed-adapter',
      observedAt:'2026-09-01T00:00:00.000Z',expiresAt:'2026-10-01T00:00:00.000Z'})),...changes};
}
export function snapshot(items=[item('A')]) { return {schema:'intake/v1',asOf:'2026-09-16T00:00:00.000Z',items}; }
export function claim(i,field,value) {
  const e = i.evidence.find(e=>e.field===field); e.value=value; e.sourceHash=hash({id:i.id,field,value}); return i;
}
