import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';
import { hash, compare } from './canonical.ts';
export function sourceIdentity(): string {
  const root = fileURLToPath(new URL('.',import.meta.url));
  const entries: {path:string;content:string}[] = [];
  const walk = (dir:string) => {
    for (const e of readdirSync(dir,{withFileTypes:true})) {
      const path = join(dir,e.name);
      if (e.isDirectory()) walk(path);
      else if (e.name.endsWith('.ts')) entries.push({path:relative(root,path).replaceAll('\\','/'),content:readFileSync(path,'utf8')});
    }
  };
  walk(root); entries.sort((a,b) => compare(a.path,b.path)); return hash(entries);
}
