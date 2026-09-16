import {readFileSync} from 'node:fs';
import {interpretIntake} from './intake.mjs';
try {
  const [s,c,t,...rest]=process.argv.slice(2);
  if(!s||!c||rest.length) throw new Error('Usage: node src/cli.mjs snapshot.json contract.json [trust.json]');
  const load=p=>JSON.parse(readFileSync(p,'utf8'));
  const result=interpretIntake(load(s),load(c),t?load(t):{keys:[]});
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
  process.exitCode=result.verdict==='REFUSED'?2:0;
} catch(e) {process.stderr.write(JSON.stringify({verdict:'REFUSED',reason:e.message})+'\n');process.exitCode=2;}
