import {fixture,controlled} from './fixture.mjs';
import {interpretIntake,gauntletContext} from '../src/intake.mjs';
const f=fixture(),draft=interpretIntake(f.snapshot,f.contract,f.trust);
const c=controlled(),mapped=interpretIntake(c.snapshot,c.contract,c.trust);
console.log(JSON.stringify({syntheticOnly:true,discovery:draft,controlled:mapped,
  gauntletContext:gauntletContext(mapped,c.snapshot,c.contract,c.trust)},null,2));
