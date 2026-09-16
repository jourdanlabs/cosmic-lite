import type { Intake, Problem } from '../contracts.ts';
export function meteor(items: Intake[]) {
  const byId = new Map(items.map(i => [i.id,i]));
  const problems = new Map<string, Problem[]>();
  for (const item of items) {
    const list: Problem[] = [];
    for (const d of item.dependencyIds) if (!byId.has(d)) list.push({code:'MISSING_DEPENDENCY',detail:`Resolve dependency ${d}.`});
    const completed = new Set<string>();
    const visit = (id: string, path: Set<string>): boolean => {
      if (path.has(id)) return true;
      if (completed.has(id)) return false;
      const next = byId.get(id); if (!next) return false;
      const p = new Set(path); p.add(id);
      const cyclic = next.dependencyIds.some(d => visit(d,p));
      if (!cyclic) completed.add(id);
      return cyclic;
    };
    if (visit(item.id,new Set())) list.push({code:'DEPENDENCY_CYCLE',detail:'Resolve the dependency cycle before scheduling.'});
    problems.set(item.id,list);
  }
  return {byId, problems};
}
