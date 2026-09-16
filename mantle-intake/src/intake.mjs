import {canonicalize, canonicalClone, contentAddress} from '../upstream/kernel/canonical.mjs';
import {makeReceipt, verifyReceipt} from '../upstream/kernel/receipt.mjs';
import {intervalContains} from '../upstream/kernel/temporal.mjs';
import {resolveMeaning} from '../upstream/semantic/palimpsest.mjs';
import {translateRecords} from '../upstream/semantic/dialectic.mjs';
import {buildEvidencePacket} from '../upstream/semantic/cairn.mjs';
import {verifyApprovalSignature} from '../upstream/semantic/authority.mjs';
import {implementationHash} from './identity.mjs';

const FIELDS = {
  owner: 'string', requestedChange: 'string', applicationRef: 'string',
  regulatoryImpactReported: 'boolean', requestedDueAt: 'date', sizeBand: 'ordinal'
};
const STATES = ['OBSERVED','BLANK','NOT_FETCHED','ABSENT','UNMAPPED','INVALID'];
const assert = (ok, reason) => { if (!ok) throw new TypeError(reason); };
const obj = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const text = v => typeof v === 'string' && v.trim().length > 0;
const keys = (o, names) => assert(obj(o) && Object.keys(o).length === names.length && names.every(k=>Object.hasOwn(o,k)), 'UNEXPECTED_OR_MISSING_FIELDS');
const when = s => {
  assert(typeof s === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(s) &&
    Number.isFinite(Date.parse(s)) && new Date(s).toISOString() === s,'INVALID_UTC_TIMESTAMP');
  return Date.parse(s);
};
const interval = v => {
  const a=when(v.valid_from), b=when(v.known_from);
  assert(v.valid_to === null || when(v.valid_to)>a,'INVALID_VALID_INTERVAL');
  assert(v.known_to === null || when(v.known_to)>b,'INVALID_KNOWN_INTERVAL');
};
function strictJson(v) {
  if (v === null || typeof v === 'string' || typeof v === 'boolean') return;
  if (typeof v === 'number') {assert(Number.isFinite(v),'NON_FINITE_NUMBER');return;}
  if (Array.isArray(v)) {v.forEach(strictJson);return;}
  assert(obj(v) && Object.getPrototypeOf(v)===Object.prototype,'EXPECTED_PLAIN_JSON');
  for(const [k,x] of Object.entries(v)) {
    assert(!['__proto__','constructor','prototype'].includes(k),'RESERVED_KEY'); strictJson(x);
  }
}
function validate(snapshot, contract, trust) {
  strictJson(snapshot); strictJson(contract); strictJson(trust);
  keys(snapshot,['schema','sourceId','sourceRevision','observedAt','validAt','knownAt','sourceSchema','records']);
  assert(snapshot.schema==='intake-observations/v1','UNSUPPORTED_SNAPSHOT');
  assert(text(snapshot.sourceId)&&text(snapshot.sourceRevision),'SOURCE_IDENTITY_REQUIRED');
  assert(when(snapshot.observedAt)<=when(snapshot.knownAt),'SOURCE_NOT_KNOWN_AT_TIME'); when(snapshot.validAt);
  keys(snapshot.sourceSchema,['id','version','fields']);
  assert(text(snapshot.sourceSchema.id)&&text(snapshot.sourceSchema.version)&&obj(snapshot.sourceSchema.fields),'INVALID_SOURCE_SCHEMA');
  for(const [field,type] of Object.entries(snapshot.sourceSchema.fields))
    assert(text(field)&&['string','boolean','number'].includes(type),'UNSUPPORTED_SOURCE_TYPE');
  assert(Array.isArray(snapshot.records)&&snapshot.records.length<=10000,'INVALID_RECORDS');
  const ids=new Set();
  for(const r of snapshot.records) {
    keys(r,['id','priority','projection','values']);
    assert(text(r.id)&&!ids.has(r.id),'DUPLICATE_OR_MISSING_RECORD_ID'); ids.add(r.id);
    assert(Number.isSafeInteger(r.priority)&&r.priority>=0,'INVALID_PRIORITY');
    assert(Array.isArray(r.projection)&&new Set(r.projection).size===r.projection.length&&r.projection.every(k=>Object.hasOwn(snapshot.sourceSchema.fields,k)),'INVALID_PROJECTION');
    assert(obj(r.values)&&Object.keys(r.values).every(k=>r.projection.includes(k)),'VALUE_OUTSIDE_PROJECTION');
    for(const v of Object.values(r.values)) assert(v===null||['string','boolean','number'].includes(typeof v),'NONSCALAR_SOURCE_VALUE');
  }
  keys(contract,['schema','mode','meaningId','meanings','treaty','approvals']);
  assert(contract.schema==='intake-meaning-contract/v1'&&['DISCOVERY','CONTROLLED'].includes(contract.mode),'UNSUPPORTED_CONTRACT');
  assert(text(contract.meaningId)&&Array.isArray(contract.meanings)&&contract.meanings.length>0,'MISSING_MEANINGS');
  const versions=new Set();
  for(const m of contract.meanings) {
    keys(m,['object_id','version','valid_from','valid_to','known_from','known_to','definition']);interval(m);
    assert(m.object_id===contract.meaningId&&text(m.version)&&!versions.has(m.version),'INVALID_MEANING_IDENTITY');versions.add(m.version);
    keys(m.definition,['claimClass','fields']);
    assert(m.definition.claimClass==='SOURCE_ASSERTION'&&obj(m.definition.fields)&&Object.keys(m.definition.fields).length>0,'INVALID_MEANING');
    for(const [f,t] of Object.entries(m.definition.fields)) assert(Object.hasOwn(FIELDS,f)&&FIELDS[f]===t,'UNSUPPORTED_INTAKE_MEANING');
  }
  const t=contract.treaty;
  keys(t,['id','valid_from','valid_to','known_from','known_to','source_semantic_hash','target_semantic_hash','clauses']);interval(t);
  assert(text(t.id)&&Array.isArray(t.clauses)&&t.clauses.length>0,'INVALID_TREATY');
  const targets=new Set();
  for(const c of t.clauses) {
    keys(c,['source_field','target_field','relation','transform']);
    assert(Object.hasOwn(snapshot.sourceSchema.fields,c.source_field)&&Object.hasOwn(FIELDS,c.target_field)&&!targets.has(c.target_field),'INVALID_MAPPING_FIELD');targets.add(c.target_field);
    assert(obj(c.transform),'INVALID_TRANSFORM');
    if(c.transform.kind==='identity') {keys(c.transform,['kind']);assert(c.relation==='IDENTICAL','IDENTITY_RELATION_REQUIRED');}
    else {
      keys(c.transform,['kind','map']);
      assert(c.transform.kind==='enum_map'&&c.relation==='TRANSFORMABLE'&&obj(c.transform.map),'UNSUPPORTED_TRANSFORM');
      for(const v of Object.values(c.transform.map)) assert(v!==null&&validValue(v,FIELDS[c.target_field]),'INVALID_ENUM_TARGET');
    }
  }
  keys(contract.approvals,['meanings','treaty','source']);assert(obj(contract.approvals.meanings),'INVALID_APPROVAL_SET');
  assert(obj(trust)&&Array.isArray(trust.keys),'INVALID_TRUST_POLICY');
  const fingerprints=new Set();
  for(const k of trust.keys) {
    keys(k,['fingerprint','publicPem','actor','purposes','enabled']);
    assert(text(k.fingerprint)&&!fingerprints.has(k.fingerprint)&&text(k.publicPem)&&text(k.actor)&&typeof k.enabled==='boolean'&&Array.isArray(k.purposes),'INVALID_TRUST_KEY');fingerprints.add(k.fingerprint);
    assert(k.purposes.every(p=>['INTAKE_MEANING','INTAKE_TREATY','INTAKE_SOURCE'].includes(p)),'INVALID_KEY_PURPOSE');
  }
}
function validValue(value, type) {
  if(type==='string') return text(value);
  if(type==='boolean') return typeof value==='boolean';
  if(type==='ordinal') return ['S','M','L','XL'].includes(value);
  if(type==='date') {
    try { when(value);return true; } catch {return false;}
  }
  return false;
}
function checkSignature(approval,purpose,target,trust) {
  if(!approval) return 'APPROVAL_MISSING:'+purpose;
  const key=trust.keys.find(k=>k.enabled&&k.fingerprint===approval.public_key_fingerprint&&k.actor===approval.actor&&k.purposes.includes(purpose));
  if(!key) return 'UNTRUSTED_SIGNER:'+purpose;
  const v=verifyApprovalSignature(approval,key.publicPem,{purpose,target});
  return v.valid ? null : v.reason+':'+purpose;
}
function readCell(record, clause, snapshot) {
  const f=clause.source_field;
  if(!record.projection.includes(f)) return {status:'NOT_FETCHED',value:null};
  if(!Object.hasOwn(record.values,f)) return {status:'ABSENT',value:null};
  const value=record.values[f];
  if(value===null||(typeof value==='string'&&value.trim()==='')) return {status:'BLANK',value:null};
  if(typeof value!==snapshot.sourceSchema.fields[f]) return {status:'INVALID',value:null};
  if(clause.transform.kind==='enum_map'&&!Object.hasOwn(clause.transform.map,String(value))) return {status:'UNMAPPED',value:null};
  return {status:'OBSERVED',value};
}

export function interpretIntake(snapshot, contract, trust={keys:[]}) {
  validate(snapshot,contract,trust);
  const meaning=resolveMeaning({versions:contract.meanings,objectId:contract.meaningId,validAt:snapshot.validAt,knownAt:snapshot.knownAt});
  const selected=meaning.selection.version;
  const base={schema:'intake-interpretation/v1',mode:contract.mode,validAt:snapshot.validAt,knownAt:snapshot.knownAt,
    sourceId:snapshot.sourceId,sourceRevision:snapshot.sourceRevision,meaningVersion:selected?.version??null,
    treatyId:contract.treaty.id,businessDecision:null,authorization:'NOT_ASSESSED',capacity:'NOT_ASSESSED',strata:null};
  const finish=(body,evidence=[])=>{
    const output={...base,...body};
    return {...output,receipt:makeReceipt({engine:'INTAKE_MEANING_CORE',operation:'interpret-source-assertions',
      input:{snapshot,contract,trust},output,verdict:body.verdict,reasons:body.reasons,evidence,
      metadata:{implementationHash:implementationHash(),runtime:`${process.version}/${process.platform}/${process.arch}`,product:'intake-meaning-core'}})};
  };
  const fail=reasons=>finish({verdict:'REFUSED',reasons,observations:[],assessment:null,evidence:null},[meaning.receipt]);
  // Meaning ambiguity stops translation, assessment, and any downstream handoff.
  if(meaning.selection.verdict!=='VERIFIED') return fail([meaning.selection.reason]);
  const treaty=contract.treaty;
  if(!intervalContains(treaty,snapshot.validAt,snapshot.knownAt)) return fail(['TREATY_OUTSIDE_TIME_SCOPE']);
  const sourceHash=contentAddress(snapshot.sourceSchema),targetHash=contentAddress(selected.definition);
  if(treaty.source_semantic_hash!==sourceHash||treaty.target_semantic_hash!==targetHash) return fail(['SEMANTIC_HASH_MISMATCH']);
  if(canonicalize(treaty.clauses.map(c=>c.target_field).sort())!==canonicalize(Object.keys(selected.definition.fields).sort())) return fail(['TARGET_FIELD_SET_MISMATCH']);
  const approvalReasons=[
    checkSignature(contract.approvals.meanings[selected.version],'INTAKE_MEANING',selected,trust),
    checkSignature(contract.approvals.treaty,'INTAKE_TREATY',treaty,trust),
    checkSignature(contract.approvals.source,'INTAKE_SOURCE',snapshot,trust)
  ].filter(Boolean);
  if(contract.mode==='CONTROLLED'&&approvalReasons.length) return fail(approvalReasons);
  const admitted=contract.mode==='CONTROLLED';
  const observations=[];const sources=[];const claims=[];const mappingReceipts=[];
  for(const row of snapshot.records) {
    const fields={};
    for(const c of treaty.clauses) {
      let cell=readCell(row,c,snapshot),translation=null;
      if(cell.status==='OBSERVED') {
        // Low-level scope flag is constructed only after signature checks in CONTROLLED.
        // DISCOVERY uses the same transform strictly as an explicitly unapproved preview.
        const scoped={id:treaty.id,source_semantic_hash:sourceHash,target_semantic_hash:targetHash,clauses:[c],
          approval:{approved:true,scope_hash:contentAddress([c])}};
        translation=translateRecords({treaty:scoped,records:[{[c.source_field]:cell.value}],semanticHashes:{source:sourceHash,target:targetHash}});
        if(translation.verdict!=='VERIFIED') return fail(['TRANSLATION_REFUSED']);
        const mapped=translation.translated[0][c.target_field];
        cell=validValue(mapped,selected.definition.fields[c.target_field]) ? {status:'OBSERVED',value:mapped} : {status:'INVALID',value:null};
        mappingReceipts.push(translation.receipt);
      }
      const id=contentAddress({source:snapshot.sourceId,revision:snapshot.sourceRevision,record:row.id,field:c.target_field});
      fields[c.target_field]={...cell,claimClass:'SOURCE_ASSERTION',admission:admitted?'CONTROLLED_MAPPING':'DRAFT_INTERPRETATION',
        source:{id,recordId:row.id,field:c.source_field,rawValue:Object.hasOwn(row.values,c.source_field)?row.values[c.source_field]:null,
          projected:row.projection.includes(c.source_field),sourceHash:contentAddress(snapshot),mappingReceiptHash:translation?.receipt.receipt_hash??null}};
      sources.push({id,controlled:admitted,authority:snapshot.sourceId,claim:canonicalize([row.id,c.target_field]),
        value:cell,content:{row,sourceSchema:snapshot.sourceSchema,revision:snapshot.sourceRevision,treatyHash:contentAddress(treaty)}});
      claims.push({id,citations:[id]});
    }
    observations.push({id:row.id,priority:row.priority,fields});
  }
  const evidence=buildEvidencePacket({sources,claims});
  if(admitted&&evidence.verdict!=='VERIFIED') return fail(evidence.reasons);
  const coverage={};
  for(const field of Object.keys(selected.definition.fields)) {
    const counts=Object.fromEntries(STATES.map(s=>[s,0]));
    for(const o of observations) counts[o.fields[field].status]++;
    coverage[field]={denominator:observations.length,...counts};
  }
  const questions=observations.flatMap(o=>Object.entries(o.fields).filter(([,v])=>v.status!=='OBSERVED').map(([field,v])=>({
    recordId:o.id,field,status:v.status,action:v.status==='NOT_FETCHED'?'FETCH_DETAIL':v.status==='UNMAPPED'?'REVIEW_MAPPING':'RESOLVE_SOURCE_VALUE'
  })));
  const overdue=observations.filter(o=>o.fields.requestedDueAt?.status==='OBSERVED'&&Date.parse(o.fields.requestedDueAt.value)<Date.parse(snapshot.validAt)).map(o=>o.id);
  const assessment={scope:'SOURCE_OBSERVATIONS_ONLY',coverage,overdueRequestedIds:overdue,questions,
    limitations:['Reported regulatory impact is not mandatory status.','Owner identification is not approval.',
      'Requested change is not a validated causal mechanism.','Absent capacity and economics are not estimated.']};
  return finish({verdict:admitted?'VERIFIED_MAPPING':'DRAFT_INTERPRETATION',reasons:admitted?[]:approvalReasons,
    observations,assessment,evidence:{verdict:evidence.verdict,receipt:evidence.receipt}},[meaning.receipt,...mappingReceipts,evidence.receipt]);
}

// This boundary validates complete replay against the caller's current trusted inputs.
// It never emits COSMIC v1 Intake.evidence[] or a BUILD/REJECT decision.
export function gauntletContext(result,snapshot,contract,trust={keys:[]}) {
  assert(verifyReceipt(result.receipt).valid,'INVALID_RECEIPT');
  const expected=interpretIntake(snapshot,contract,trust);
  assert(canonicalize(result)===canonicalize(expected),'REPLAY_MISMATCH');
  if(result.mode!=='CONTROLLED'||result.verdict!=='VERIFIED_MAPPING') return null;
  return canonicalClone({schema:'gauntlet-semantic-context/v1',sourceReceiptHash:result.receipt.receipt_hash,
    observations:result.observations,assessment:result.assessment,
    businessDecision:null,authorization:'NOT_ASSESSED',capacity:'NOT_ASSESSED'});
}
