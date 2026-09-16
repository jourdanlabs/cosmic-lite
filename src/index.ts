import { VERSION } from './contracts.ts';
import type { Evaluation, Facts, Receipt, Resolution } from './contracts.ts';
import { hash, canonical } from './canonical.ts';
import { sourceIdentity } from './source-identity.ts';
import { astral } from './engines/astral.ts';
import { meteor } from './engines/meteor.ts';
import { comet } from './engines/comet.ts';
import { nebula, numberFact } from './engines/nebula.ts';
import { quasar } from './engines/quasar.ts';
import { nova } from './engines/nova.ts';
import { eclipse } from './engines/eclipse.ts';
import { pulsar } from './engines/pulsar.ts';
import { aurora } from './engines/aurora.ts';

export function evaluate(input: unknown, rules: unknown): Receipt {
  const {snapshot,policy} = astral(input,rules);
  const graph = meteor(snapshot.items);
  const result = new Map<string,Evaluation>();
  const allFacts = new Map<string,Facts>();
  for (const item of snapshot.items) {
    const lineage = comet(item,policy,snapshot.asOf);
    const uncertainty = nebula(lineage.admitted); allFacts.set(item.id,uncertainty.facts);
    const business = quasar(uncertainty.facts,policy);
    const scenario = nova(uncertainty.facts,policy,business.case);
    const timing = eclipse(item,uncertainty.facts,policy);
    const challenge = pulsar(uncertainty.facts,policy,scenario.scenario);
    const unresolved = [
      ...graph.problems.get(item.id)!.map(problem => ({engine:'METEOR',problem})),
      ...uncertainty.gaps.map(problem => ({engine:'NEBULA',problem})),
      ...business.problems.map(problem => ({engine:'QUASAR',problem})),
      ...challenge.challenges.map(problem => ({engine:'PULSAR',problem})),
      ...(!Object.hasOwn(policy.capacityDaysByTeam,item.team) ? [{engine:'AURORA',problem:{code:'UNKNOWN_TEAM_CAPACITY',detail:`Supply capacity for team ${item.team}.`}}] : [])
    ];
    const gate = aurora(item,uncertainty.facts,policy,unresolved,timing.status);
    result.set(item.id,{id:item.id,priority:item.priority,...gate,facts:uncertainty.facts,trace:{
      ASTRAL:{schema:snapshot.schema}, METEOR:{dependencyIds:item.dependencyIds},
      COMET:lineage, NEBULA:uncertainty.coverage, QUASAR:business, NOVA:scenario,
      ECLIPSE:timing, PULSAR:challenge, CHRONOS:{asOf:snapshot.asOf},
      AURORA:{policyVersion:policy.version,localDecision:gate.decision}
    }});
  }
  // Priority-ordered, dependency-closed admission. It makes no optimality claim.
  const remaining = {...policy.capacityDaysByTeam};
  const selected = new Set<string>(); const finishes = new Map<string,number>();
  const teamAvailable = new Map<string,number>();
  for (const item of snapshot.items) {
    const ev = result.get(item.id)!;
    if (ev.decision !== 'BUILD' || selected.has(item.id)) continue;
    const bundle: string[] = []; const visited = new Set<string>();
    const collect = (id:string) => {
      if (selected.has(id) || visited.has(id)) return;
      visited.add(id);
      const i = graph.byId.get(id); if (!i) return;
      i.dependencyIds.forEach(collect); bundle.push(id);
    };
    collect(item.id);
    const blocked = bundle.filter(id => result.get(id)!.decision !== 'BUILD');
    const problem = (code:string,question:string):Resolution => ({owner:item.owner,engine:'AURORA',code,question});
    if (blocked.length) {
      ev.decision = 'DEFER'; ev.reasons.push(problem('DEPENDENCY_BLOCKED',`Resolve dependency cases: ${blocked.join(', ')}.`)); continue;
    }
    const demand = new Map<string,number>();
    for (const id of bundle) {
      const i = graph.byId.get(id)!;
      demand.set(i.team,(demand.get(i.team) ?? 0)+numberFact(allFacts.get(id)!,'effortDays')!);
    }
    const shortfall = [...demand].filter(([team,days]) => days > remaining[team]);
    if (shortfall.length) {
      ev.decision = 'DEFER'; ev.reasons.push(problem('CAPACITY',`Bundle needs additional team-days: ${shortfall.map(([t,d]) => `${t}=${d-remaining[t]}`).join(', ')}.`));
      ev.trace.PORTFOLIO = {bundle,demand:Object.fromEntries(demand),committed:false}; continue;
    }
    // Conservative schedule: each team serializes whole delivery durations;
    // dependencies finish before dependents start. All times are relative days.
    const proposedFinish = new Map(finishes), proposedTeams = new Map(teamAvailable);
    const late: string[] = [];
    for (const id of bundle) {
      const i = graph.byId.get(id)!;
      const start = Math.max(proposedTeams.get(i.team) ?? 0,0,...i.dependencyIds.map(d => proposedFinish.get(d) ?? 0));
      const finish = start+numberFact(allFacts.get(id)!,'deliveryDays')!;
      proposedFinish.set(id,finish); proposedTeams.set(i.team,finish);
      if (finish > Math.min(policy.horizonDays,i.deadlineDays ?? policy.horizonDays)) late.push(id);
    }
    if (late.length) {
      ev.decision = 'DEFER'; ev.reasons.push(problem('BUNDLE_WINDOW',`Conservative schedule misses the window for: ${late.join(', ')}. Revise schedule or scope.`));
      ev.trace.PORTFOLIO = {bundle,committed:false}; continue;
    }
    for (const [team,days] of demand) remaining[team] -= days;
    for (const id of bundle) {
      selected.add(id); finishes.set(id,proposedFinish.get(id)!);
      result.get(id)!.trace.PORTFOLIO = {committed:true,admittedFor:item.id,finishDay:proposedFinish.get(id),bundle};
    }
    for (const [team,day] of proposedTeams) teamAvailable.set(team,day);
  }
  const payload = {
    schema:'decision-receipt/v1' as const,engineVersion:VERSION,
    runtime:`node/${process.versions.node}/${process.platform}/${process.arch}`,
    sourceTreeHash:sourceIdentity(),asOf:snapshot.asOf,
    inputHash:hash(snapshot),policyHash:hash(policy),evaluations:[...result.values()],remainingCapacityDays:remaining
  };
  return {...payload,receiptHash:hash(payload)};
}
// Integrity check only; a party able to alter content can also recompute a hash.
export function verifyHash(receipt: Receipt): boolean {
  try { const {receiptHash,...payload} = receipt; return hash(payload) === receiptHash; } catch { return false; }
}
export function replay(input:unknown, policy:unknown, receipt:Receipt): boolean {
  return verifyHash(receipt) && canonical(evaluate(input,policy)) === canonical(receipt);
}
