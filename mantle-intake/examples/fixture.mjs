import {generateKeyPairSync,sign} from 'node:crypto';
import {canonicalize,contentAddress,sha256} from '../upstream/kernel/canonical.mjs';
import {AUTHORITY_PROTOCOL} from '../upstream/semantic/authority.mjs';
export function fixture() {
  const sourceSchema={id:'synthetic-jira-projection',version:'1',fields:{
    productOwner:'string',want:'string',regulatory:'string',due:'string',application:'string',sizing:'string'
  }};
  const time={valid_from:'2026-01-01T00:00:00.000Z',valid_to:null,known_from:'2026-01-01T00:00:00.000Z',known_to:null};
  const fields={owner:'string',requestedChange:'string',regulatoryImpactReported:'boolean',requestedDueAt:'date',applicationRef:'string',sizeBand:'ordinal'};
  const meaning={object_id:'intake-source-assertions',version:'1',...time,definition:{claimClass:'SOURCE_ASSERTION',fields}};
  const clause=(source_field,target_field,map=null)=>({source_field,target_field,
    relation:map?'TRANSFORMABLE':'IDENTICAL',transform:map?{kind:'enum_map',map}:{kind:'identity'}});
  const treaty={id:'synthetic-intake-map-1',...time,source_semantic_hash:contentAddress(sourceSchema),target_semantic_hash:contentAddress(meaning.definition),clauses:[
    clause('productOwner','owner'),clause('want','requestedChange'),clause('regulatory','regulatoryImpactReported',{Yes:true,No:false}),
    clause('due','requestedDueAt'),clause('application','applicationRef'),clause('sizing','sizeBand',{Small:'S',Medium:'M',Large:'L',ExtraLarge:'XL'})
  ]};
  const snapshot={schema:'intake-observations/v1',sourceId:'SYNTHETIC-NOT-JPMC',sourceRevision:'revision-1',
    observedAt:'2026-09-16T00:00:00.000Z',validAt:'2026-09-16T00:00:00.000Z',knownAt:'2026-09-16T00:00:00.000Z',sourceSchema,
    records:[
      {id:'SYN-1',priority:7,projection:Object.keys(sourceSchema.fields),values:{productOwner:'Demo owner',want:'Reduce repeat data entry',regulatory:'Yes',due:'2026-09-10T00:00:00.000Z',application:'APP-DEMO',sizing:'Small'}},
      {id:'SYN-2',priority:2,projection:['want','due','sizing'],values:{want:'',due:null,sizing:'Medium'}},
      {id:'SYN-3',priority:11,projection:['regulatory','productOwner','due','want'],values:{regulatory:'Maybe',productOwner:'',due:'yesterday'}}
    ]};
  const contract={schema:'intake-meaning-contract/v1',mode:'DISCOVERY',meaningId:meaning.object_id,meanings:[meaning],treaty,
    approvals:{meanings:{},treaty:null,source:null}};
  return {snapshot,contract,trust:{keys:[]}};
}
// TEST/DEMO ONLY. Private key stays in memory and is never exported.
export function controlled(f=fixture()) {
  const {privateKey,publicKey}=generateKeyPairSync('ed25519');
  const publicPem=publicKey.export({format:'pem',type:'spki'}).toString();
  const fingerprint='sha256:'+sha256(publicPem),actor='SYNTHETIC-TEST-AUTHORITY';
  const approve=(purpose,target)=>{
    const payload={protocol:AUTHORITY_PROTOCOL,actor,purpose,target_hash:contentAddress(target)};
    return {...payload,public_key_fingerprint:fingerprint,signature:sign(null,Buffer.from(canonicalize(payload)),privateKey).toString('base64')};
  };
  f.contract.mode='CONTROLLED';
  f.trust={keys:[{fingerprint,publicPem,actor,purposes:['INTAKE_MEANING','INTAKE_TREATY','INTAKE_SOURCE'],enabled:true}]};
  for(const m of f.contract.meanings) f.contract.approvals.meanings[m.version]=approve('INTAKE_MEANING',m);
  f.contract.approvals.treaty=approve('INTAKE_TREATY',f.contract.treaty);
  f.contract.approvals.source=approve('INTAKE_SOURCE',f.snapshot);
  return f;
}
