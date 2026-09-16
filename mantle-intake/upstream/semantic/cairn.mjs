import { citeOrRefuse, detectContradictions, registerSources } from "../kernel/evidence.mjs";
import { makeReceipt } from "../kernel/receipt.mjs";

export function buildEvidencePacket({ sources, claims }) {
  const registry = registerSources(sources);
  const contradictions = detectContradictions(registry.sources);
  const citation = citeOrRefuse({ claims, sources: registry.sources });
  const uncontrolled = registry.sources.filter((source) => !source.controlled);
  const reasons = [
    ...registry.errors.map((error) => error.reason),
    ...contradictions.map((item) => `CONTRADICTION:${item.claim}`),
    ...citation.unsupported_claims.map((id) => `UNSUPPORTED_CLAIM:${id}`),
    ...uncontrolled.map((source) => `UNCONTROLLED_SOURCE:${source.id}`)
  ];
  const verdict = reasons.length ? "REFUSED" : "VERIFIED";
  const output = {
    engine: "CAIRN",
    verdict,
    reasons: [...new Set(reasons)].sort(),
    sources: registry.sources,
    claims,
    contradictions
  };
  return {
    ...output,
    receipt: makeReceipt({
      engine: "CAIRN",
      operation: "evidence-packet",
      input: { sources, claims },
      output,
      verdict,
      reasons: output.reasons,
      evidence: registry.sources
    })
  };
}
