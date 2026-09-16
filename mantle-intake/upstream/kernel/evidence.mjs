import { contentAddress } from "./canonical.mjs";

export function registerSources(sources) {
  const normalized = sources.map((source) => ({
    id: source.id,
    authority: source.authority ?? "uncontrolled",
    controlled: source.controlled === true,
    valid_from: source.valid_from ?? null,
    valid_to: source.valid_to ?? null,
    claim: source.claim,
    value: source.value,
    source_hash: contentAddress(source.content ?? source)
  }));
  const ids = new Set();
  const errors = [];
  for (const source of normalized) {
    if (!source.id || ids.has(source.id)) {
      errors.push({ source_id: source.id ?? null, reason: "MISSING_OR_DUPLICATE_SOURCE_ID" });
    }
    ids.add(source.id);
  }
  return { sources: normalized, errors };
}

export function detectContradictions(sources) {
  const contradictions = [];
  for (let left = 0; left < sources.length; left += 1) {
    for (let right = left + 1; right < sources.length; right += 1) {
      const a = sources[left];
      const b = sources[right];
      if (a.claim === b.claim && JSON.stringify(a.value) !== JSON.stringify(b.value)) {
        contradictions.push({
          claim: a.claim,
          source_ids: [a.id, b.id].sort(),
          values: [a.value, b.value]
        });
      }
    }
  }
  return contradictions;
}

export function citeOrRefuse({ claims, sources }) {
  const sourceIds = new Set(sources.map((source) => source.id));
  const unsupported = claims.filter(
    (claim) => !claim.citations?.length || claim.citations.some((id) => !sourceIds.has(id))
  );
  return {
    verdict: unsupported.length === 0 ? "VERIFIED" : "REFUSED",
    unsupported_claims: unsupported.map((claim) => claim.id)
  };
}
