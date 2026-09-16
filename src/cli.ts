import { readFileSync } from 'node:fs';
import { evaluate, replay } from './index.ts';
try {
  const [inputPath,policyPath,receiptPath,...extra] = process.argv.slice(2);
  if (!inputPath || !policyPath || extra.length) throw new Error('Usage: node src/cli.ts snapshot.json policy.json [receipt-to-replay.json]');
  const input = JSON.parse(readFileSync(inputPath,'utf8'));
  const policy = JSON.parse(readFileSync(policyPath,'utf8'));
  if (receiptPath) {
    const ok = replay(input,policy,JSON.parse(readFileSync(receiptPath,'utf8')));
    process.stdout.write(JSON.stringify({replay:ok ? 'MATCH' : 'REFUSED'})+'\n'); process.exitCode = ok ? 0 : 1;
  } else process.stdout.write(JSON.stringify(evaluate(input,policy),null,2)+'\n');
} catch (error) {
  process.stderr.write(JSON.stringify({status:'REFUSED',error:error instanceof Error ? error.message : String(error)})+'\n');
  process.exitCode = 2;
}
