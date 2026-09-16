import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,controlled} from '../examples/fixture.mjs';
import {interpretIntake,gauntletContext} from '../src/intake.mjs';
import {contentAddress,canonicalize} from '../upstream/kernel/canonical.mjs';
const run=f=>interpretIntake(f.snapshot,f.contract,f.trust);

test('discovery works without invented approvals; cannot emit GAUNTLET controlled context',()=>{
  const f=fixture(),r=run(f);assert.equal(r.verdict,'DRAFT_INTERPRETATION');
  assert.equal(r.observations[0].fields.owner.admission,'DRAFT_INTERPRETATION');
  assert.equal(gauntletContext(r,f.snapshot,f.contract,f.trust),null);
});
test('signed complete mapping emits typed context without business authorization',()=>{
  const f=controlled(),r=run(f),context=gauntletContext(r,f.snapshot,f.contract,f.trust);
  assert.equal(r.verdict,'VERIFIED_MAPPING');assert.ok(context);
  assert.equal(context.authorization,'NOT_ASSESSED');assert.equal(context.businessDecision,null);
  assert.equal(context.capacity,'NOT_ASSESSED');assert.equal(r.strata,null);
});
test('bulk omission, fetched blank, absent key and unmapped answer remain distinct',()=>{
  const r=run(fixture());assert.equal(r.observations[1].fields.owner.status,'NOT_FETCHED');
  assert.equal(r.observations[2].fields.owner.status,'BLANK');
  assert.equal(r.observations[2].fields.requestedChange.status,'ABSENT');
  assert.equal(r.observations[2].fields.regulatoryImpactReported.status,'UNMAPPED');
  assert.equal(r.observations[2].fields.requestedDueAt.status,'INVALID');
});
test('unmapped regulatory response never silently becomes false',()=>{
  const r=run(fixture());assert.equal(r.observations[0].fields.regulatoryImpactReported.value,true);
  assert.equal(r.observations[2].fields.regulatoryImpactReported.value,null);
  assert.ok(!('mandatory' in r.observations[0].fields));
});
test('requested dates retain overdue values and priority is unchanged',()=>{
  const r=run(fixture());assert.deepEqual(r.assessment.overdueRequestedIds,['SYN-1']);
  assert.equal(r.observations[0].fields.requestedDueAt.value,'2026-09-10T00:00:00.000Z');
  assert.deepEqual(r.observations.map(o=>o.priority),[7,2,11]);
});
test('coverage counts have explicit denominator and exhaust mutually exclusive statuses',()=>{
  const c=run(fixture()).assessment.coverage.owner;
  assert.deepEqual(c,{denominator:3,OBSERVED:1,BLANK:1,NOT_FETCHED:1,ABSENT:0,UNMAPPED:0,INVALID:0});
});
test('ordinal stays ordinal, requested change never becomes mechanism',()=>{
  const r=run(fixture());assert.equal(r.observations[0].fields.sizeBand.value,'S');
  assert.ok(!('effortDays' in r.observations[0].fields));assert.ok(!('mechanism' in r.observations[0].fields));
});
test('no version at requested time short-circuits',()=>{
  const f=fixture();f.snapshot.validAt='2025-01-01T00:00:00.000Z';
  const r=run(f);assert.equal(r.verdict,'REFUSED');assert.equal(r.assessment,null);assert.deepEqual(r.observations,[]);
});
test('future knowledge definition cannot be used retrospectively',()=>{
  const f=fixture();f.contract.meanings[0].known_from='2026-09-17T00:00:00.000Z';
  assert.equal(run(f).reasons[0],'NO_VERSION_AT_REQUESTED_TIME');
});
test('overlapping meanings short-circuit instead of choosing first',()=>{
  const f=fixture();f.contract.meanings.push({...structuredClone(f.contract.meanings[0]),version:'2'});
  assert.equal(run(f).reasons[0],'OVERLAPPING_CONTROLLED_VERSIONS');
});
test('treaty expiry is exclusive and semantic drift refuses',()=>{
  const f=fixture();f.contract.treaty.valid_to=f.snapshot.validAt;assert.equal(run(f).verdict,'REFUSED');
  const g=fixture();g.snapshot.sourceSchema.version='2';assert.equal(run(g).reasons[0],'SEMANTIC_HASH_MISMATCH');
});
test('controlled mode requires all three approval classes',()=>{
  const f=fixture();f.contract.mode='CONTROLLED';assert.equal(run(f).verdict,'REFUSED');
  const g=controlled();g.contract.approvals.source=null;assert.equal(run(g).reasons[0],'APPROVAL_MISSING:INTAKE_SOURCE');
});
test('changed source bytes cannot retain source approval',()=>{
  const f=controlled();f.snapshot.records[0].values.productOwner='Different';
  assert.ok(run(f).reasons.includes('APPROVAL_TARGET_MISMATCH:INTAKE_SOURCE'));
});
test('changed mapping cannot retain treaty approval',()=>{
  const f=controlled();f.contract.treaty.clauses[2].transform.map.Yes=false;
  assert.ok(run(f).reasons.includes('APPROVAL_TARGET_MISMATCH:INTAKE_TREATY'));
});
test('changing meaning dates invalidates full-object signature',()=>{
  const f=controlled();f.contract.meanings[0].valid_from='2026-02-01T00:00:00.000Z';
  assert.ok(run(f).reasons.includes('APPROVAL_TARGET_MISMATCH:INTAKE_MEANING'));
});
test('revoked or wrong-purpose signer is not trusted',()=>{
  const f=controlled();f.trust.keys[0].enabled=false;assert.equal(run(f).verdict,'REFUSED');
  const g=controlled();g.trust.keys[0].purposes=['INTAKE_SOURCE'];assert.equal(run(g).verdict,'REFUSED');
});
test('replay rejects edited output even with an untouched receipt',()=>{
  const f=controlled(),r=run(f);r.observations[0].fields.owner.value='Forged';
  assert.throws(()=>gauntletContext(r,f.snapshot,f.contract,f.trust),/REPLAY_MISMATCH/);
});
test('same complete inputs replay deterministically without mutation',()=>{
  const f=controlled(),before=canonicalize(f);assert.deepEqual(run(f),run(f));assert.equal(canonicalize(f),before);
});
test('missing field never becomes false or zero through boolean/scale transforms',()=>{
  const f=fixture();f.contract.treaty.clauses[2].transform={kind:'boolean',truthy:['Yes']};
  assert.throws(()=>run(f));
});
test('duplicate ids, unknown fields, source type mismatch and malformed dates fail explicitly',()=>{
  const f=fixture();f.snapshot.records.push(f.snapshot.records[0]);assert.throws(()=>run(f),/DUPLICATE/);
  const g=fixture();g.snapshot.records[0].values.productOwner=true;assert.equal(run(g).observations[0].fields.owner.status,'INVALID');
  const h=fixture();h.snapshot.validAt='2026-02-30T00:00:00.000Z';assert.throws(()=>run(h),/TIMESTAMP/);
  const j=fixture();j.contract.meanings[0].definition.fields.permitted='boolean';assert.throws(()=>run(j),/UNSUPPORTED_INTAKE_MEANING/);
});
test('source snapshot not yet known refuses',()=>{
  const f=fixture();f.snapshot.observedAt='2026-09-17T00:00:00.000Z';assert.throws(()=>run(f),/SOURCE_NOT_KNOWN/);
});
test('receipt binds otherwise unused raw fields as well as mapping rules',()=>{
  const f=fixture(),r=run(f);f.snapshot.records[0].values.want='Another request';
  assert.notEqual(run(f).receipt.input_hash,r.receipt.input_hash);
});
test('conflicting outputs on different intakes are not global contradictions',()=>{
  const f=fixture();f.snapshot.records[2].values.regulatory='No';const c=controlled(f),r=run(c);
  assert.equal(r.verdict,'VERIFIED_MAPPING');assert.equal(r.observations[2].fields.regulatoryImpactReported.value,false);
});
test('empty population is explicit zero denominator, never a percentage',()=>{
  const f=fixture();f.snapshot.records=[];assert.equal(run(f).assessment.coverage.owner.denominator,0);
});
test('every target field must be mapped exactly once',()=>{
  const f=fixture();f.contract.treaty.clauses.pop();assert.equal(run(f).reasons[0],'TARGET_FIELD_SET_MISMATCH');
});
