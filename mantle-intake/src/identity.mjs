import {readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,relative} from 'node:path';
import {contentAddress} from '../upstream/kernel/canonical.mjs';
export function implementationHash() {
  const root=fileURLToPath(new URL('../',import.meta.url)),files=[];
  const walk=dir=>{
    for(const e of readdirSync(dir,{withFileTypes:true})) {
      const p=join(dir,e.name);
      if(e.isDirectory()) walk(p);
      else if(e.name.endsWith('.mjs')) files.push({path:relative(root,p).replaceAll('\\','/'),content:readFileSync(p,'utf8')});
    }
  };
  walk(join(root,'src'));walk(join(root,'upstream'));
  files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);return contentAddress(files);
}
