import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, replay, verifyHash } from '../src/index.ts';
import { canonical } from '../src/canonical.ts';
import { item, policy, snapshot, claim } from './fixtures.mjs';
const verdict = (s,p=policy()) => evaluate(s,p).evaluations[0].decision;

test('complete robust case builds, preserving supplied priority',()=>{
  const r = evaluate(snapshot([item('A',40)]),policy());
  assert.equal(r.evaluations[0].decision,'BUILD'); assert.equal(r.evaluations[0].priority,40);
  assert.equal(r.remainingCapacityDays.alpha,15);
});
test('explicit authoritative disqualifier rejects despite missing estimates',()=>{
  const i=claim(item('A'),'permitted',false); i.evidence=i.evidence.filter(e=>e.field==='permitted');
  assert.equal(verdict(snapshot([i])),'REJECT');
});
test('missing evidence cannot become rejection or build',()=>{
  const i=item('A'); i.evidence=i.evidence.filter(e=>e.field!=='need');
  assert.equal(verdict(snapshot([i])),'NEEDS_EVIDENCE');
});
test('authoritative contradiction never becomes known false or proof',()=>{
  const i=item('A'); const e=structuredClone(i.evidence.find(e=>e.field==='permitted'));
  i.evidence.push({...e,id:'contradiction',value:false});
  const r=evaluate(snapshot([i]),policy()); assert.equal(r.evaluations[0].decision,'NEEDS_EVIDENCE');
  assert.equal(r.evaluations[0].facts.permitted.status,'CONFLICT');
});
test('untrusted issuer cannot supply a rejection',()=>{
  const i=claim(item('A'),'need',false); i.evidence.find(e=>e.field==='need').issuer='untrusted';
  assert.equal(verdict(snapshot([i])),'NEEDS_EVIDENCE');
});
test('wrong-subject evidence cannot supply an approval',()=>{
  const i=item('A'); i.evidence.find(e=>e.field==='permitted').subjectId='OTHER';
  assert.equal(verdict(snapshot([i])),'NEEDS_EVIDENCE');
});
test('expiration boundary is stale; future evidence is excluded',()=>{
  const i=item('A'); i.evidence.find(e=>e.field==='need').expiresAt='2026-09-16T00:00:00.000Z';
  assert.equal(verdict(snapshot([i])),'NEEDS_EVIDENCE');
  const j=item('B'); j.evidence.find(e=>e.field==='need').observedAt='2026-09-17T00:00:00.000Z';
  assert.equal(verdict(snapshot([j])),'NEEDS_EVIDENCE');
});
test('fresh matching claims remain usable when historical claims are stale',()=>{
  const i=item('A'); const e=structuredClone(i.evidence[0]);
  i.evidence.push({...e,id:'old',value:false,expiresAt:'2026-09-02T00:00:00.000Z'});
  assert.equal(verdict(snapshot([i])),'BUILD');
});
test('capacity causes defer and no overspend',()=>{
  const p=policy(); p.capacityDaysByTeam.alpha=4;
  const r=evaluate(snapshot(),p); assert.equal(r.evaluations[0].decision,'DEFER'); assert.equal(r.remainingCapacityDays.alpha,4);
});
test('missing team capacity requests evidence',()=>{
  assert.equal(verdict(snapshot([item('A',1,{team:'unknown'})])),'NEEDS_EVIDENCE');
});
test('priority admission admits dependency bundle and charges shared prerequisite once',()=>{
  const a=item('A',1,{dependencyIds:['C']}), b=item('B',2,{dependencyIds:['C']}), c=item('C',100);
  const r=evaluate(snapshot([c,b,a]),policy());
  assert.deepEqual(r.evaluations.map(e=>[e.id,e.decision]),[['A','BUILD'],['B','BUILD'],['C','BUILD']]);
  assert.equal(r.remainingCapacityDays.alpha,5);
  assert.equal(r.evaluations[2].trace.PORTFOLIO.admittedFor,'A');
});
test('failed bundle does not partially consume capacity',()=>{
  const p=policy(); p.capacityDaysByTeam.alpha=5;
  const a=item('A',1,{dependencyIds:['B']}),b=item('B',2);
  const r=evaluate(snapshot([a,b]),p);
  assert.deepEqual(r.evaluations.map(e=>e.decision),['DEFER','BUILD']); assert.equal(r.remainingCapacityDays.alpha,0);
});
test('rejected prerequisite defers dependent without rejecting the dependent',()=>{
  const a=item('A',1,{dependencyIds:['B']}),b=claim(item('B',2),'need',false);
  assert.deepEqual(evaluate(snapshot([a,b]),policy()).evaluations.map(e=>e.decision),['DEFER','REJECT']);
});
test('unknown dependency and cycle cannot build',()=>{
  assert.equal(verdict(snapshot([item('A',1,{dependencyIds:['missing']})])),'NEEDS_EVIDENCE');
  const r=evaluate(snapshot([item('A',1,{dependencyIds:['B']}),item('B',2,{dependencyIds:['A']})]),policy());
  assert.ok(r.evaluations.every(e=>e.decision==='NEEDS_EVIDENCE'));
});
test('bundle elapsed time respects dependency critical path and deadline',()=>{
  const a=item('A',1,{dependencyIds:['B'],deadlineDays:8}),b=item('B',2,{team:'beta'});
  const r=evaluate(snapshot([a,b]),policy());
  assert.equal(r.evaluations[0].decision,'DEFER'); assert.equal(r.evaluations[0].reasons[0].code,'BUNDLE_WINDOW');
});
test('same-team selected cases cannot overlap in conservative schedule',()=>{
  const a=item('A',1),b=item('B',2,{deadlineDays:8});
  const r=evaluate(snapshot([a,b]),policy()); assert.deepEqual(r.evaluations.map(e=>e.decision),['BUILD','DEFER']);
});
test('failing downside case requests stronger evidence or revised scope',()=>{
  const i=claim(item('A'),'benefitLow',300);
  assert.equal(verdict(snapshot([i])),'NEEDS_EVIDENCE');
});
test('inverted bounds and zero effort cannot build',()=>{
  assert.equal(verdict(snapshot([claim(item('A'),'benefitLow',2000)])),'NEEDS_EVIDENCE');
  assert.equal(verdict(snapshot([claim(item('A'),'effortDays',0)])),'NEEDS_EVIDENCE');
});
test('turning off reject predicate cannot approve known ineligible case',()=>{
  const p=policy(); p.rejectWhen=[];
  assert.equal(verdict(snapshot([claim(item('A'),'permitted',false)]),p),'NEEDS_EVIDENCE');
});
test('exact replay is deterministic and leaves inputs unchanged',()=>{
  const s=snapshot(),p=policy(), before=canonical({s,p}); const r=evaluate(s,p);
  assert.equal(canonical({s,p}),before); assert.ok(verifyHash(r)); assert.ok(replay(s,p,r));
  assert.deepEqual(evaluate(s,p),r);
});
test('object insertion order and input item order do not alter receipt',()=>{
  const a=snapshot([item('Z',1),item('A',1)]),b=structuredClone(a); b.items.reverse();
  b.items.forEach(i=>i.evidence.reverse());
  assert.deepEqual(evaluate(a,policy()),evaluate(b,policy()));
  const p=Object.fromEntries(Object.entries(policy()).reverse()); assert.deepEqual(evaluate(a,p),evaluate(a,policy()));
});
test('changed evidence, policy, asOf, or output breaks replay',()=>{
  const s=snapshot(),p=policy(),r=evaluate(s,p);
  const edited=structuredClone(r); edited.evaluations[0].decision='REJECT'; assert.equal(verifyHash(edited),false);
  const changed=structuredClone(s); claim(changed.items[0],'costHigh',201); assert.equal(replay(changed,p,r),false);
  assert.equal(replay(s,{...p,version:'changed'},r),false);
  assert.equal(replay({...s,asOf:'2026-09-17T00:00:00.000Z'},p,r),false);
});
test('invalid schema, NaN, fractional estimates, and duplicate ids refuse input',()=>{
  assert.throws(()=>evaluate({...snapshot(),unexpected:1},policy()),/INVALID_INPUT/);
  assert.throws(()=>evaluate(snapshot([item('A'),item('A')]),policy()),/duplicate/);
  assert.throws(()=>evaluate(snapshot([claim(item('A'),'costHigh',NaN)]),policy()),/NON_JSON_VALUE/);
  assert.throws(()=>evaluate(snapshot([claim(item('A'),'effortDays',1.2)]),policy()),/integer/);
});
test('invalid calendar timestamps and boolean strings refuse input',()=>{
  assert.throws(()=>evaluate({...snapshot(),asOf:'2026-02-30T00:00:00.000Z'},policy()),/timestamp/);
  assert.throws(()=>evaluate(snapshot([claim(item('A'),'need','false')]),policy()),/boolean/);
});
test('numeric stress is conservatively rounded',()=>{
  const i=claim(claim(item('A'),'benefitLow',1001),'costHigh',201);
  const r=evaluate(snapshot([i]),policy()); const x=r.evaluations[0].trace.NOVA.scenario;
  assert.equal(x.realizedBenefit,800); assert.equal(x.stressedCost,252); assert.equal(x.net,548);
});
test('changing prerequisite invalidates dependent admission',()=>{
  const a=item('A',1,{dependencyIds:['B']}),b=item('B',2),s=snapshot([a,b]),p=policy();
  const old=evaluate(s,p); assert.equal(old.evaluations[0].decision,'BUILD');
  b.evidence=b.evidence.filter(e=>e.field!=='permitted');
  assert.equal(evaluate(s,p).evaluations[0].decision,'DEFER'); assert.equal(replay(s,p,old),false);
});
