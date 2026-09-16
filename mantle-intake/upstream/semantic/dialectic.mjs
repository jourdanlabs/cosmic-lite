import { canonicalClone, contentAddress } from "../kernel/canonical.mjs";
import { makeReceipt } from "../kernel/receipt.mjs";

const RELATIONS = new Set([
  "IDENTICAL",
  "SUBSET",
  "SUPERSET",
  "OVERLAP",
  "TRANSFORMABLE",
  "INCOMMENSURATE",
  "UNRESOLVED"
]);

function applyTransform(value, transform) {
  switch (transform.kind) {
    case "identity":
      return value;
    case "scale": {
      const numeric = Number(value);
      return Number.isFinite(numeric) ? numeric * Number(transform.factor) : null;
    }
    case "enum_map":
      return Object.hasOwn(transform.map, String(value))
        ? transform.map[String(value)]
        : transform.unmapped ?? null;
    case "boolean":
      return transform.truthy.includes(value);
    default:
      throw new TypeError(`Unsupported treaty transform: ${transform.kind}`);
  }
}

function clauseBySource(clause, sourceField) {
  return clause.source_field === sourceField ? clause : null;
}

export function qualifyTreaty(treaty, semanticHashes) {
  const reasons = [];
  if (!treaty.approval?.approved || treaty.approval.scope_hash !== contentAddress(treaty.clauses)) {
    reasons.push("TREATY_NOT_APPROVED_FOR_CURRENT_CLAUSES");
  }
  if (
    treaty.source_semantic_hash !== semanticHashes.source ||
    treaty.target_semantic_hash !== semanticHashes.target
  ) {
    reasons.push("SEMANTIC_HASH_MISMATCH");
  }
  for (const clause of treaty.clauses) {
    if (!RELATIONS.has(clause.relation)) {
      reasons.push(`UNKNOWN_RELATION:${clause.source_field}`);
    }
    if (clause.relation === "IDENTICAL" && clause.transform?.kind !== "identity") {
      reasons.push(`IDENTICAL_REQUIRES_IDENTITY_TRANSFORM:${clause.source_field}`);
    }
    if (
      ["INCOMMENSURATE", "UNRESOLVED"].includes(clause.relation) &&
      clause.transform
    ) {
      reasons.push(`NONTRANSLATABLE_CLAUSE_HAS_TRANSFORM:${clause.source_field}`);
    }
  }
  return {
    verdict: reasons.length ? "REFUSED" : "VERIFIED",
    reasons: reasons.sort(),
    treaty_hash: contentAddress(treaty)
  };
}

export function translateRecords({ treaty, records, semanticHashes }) {
  const qualification = qualifyTreaty(treaty, semanticHashes);
  const unresolved = treaty.clauses.filter((clause) =>
    ["INCOMMENSURATE", "UNRESOLVED"].includes(clause.relation)
  );
  const reasons = [...qualification.reasons];
  if (unresolved.length) {
    reasons.push(
      ...unresolved.map((clause) => `UNTRANSLATABLE:${clause.source_field}`)
    );
  }
  let translated = [];
  const losses = [];
  if (reasons.length === 0) {
    translated = records.map((record) => {
      const output = {};
      for (const clause of treaty.clauses) {
        const value = record[clause.source_field];
        output[clause.target_field] = applyTransform(value, clause.transform);
        if (["SUBSET", "SUPERSET", "OVERLAP"].includes(clause.relation)) {
          losses.push({
            source_field: clause.source_field,
            target_field: clause.target_field,
            relation: clause.relation,
            note: clause.loss_note ?? "Directional mapping; reverse equivalence prohibited"
          });
        }
      }
      return output;
    });
  }
  const verdict = reasons.length ? "REFUSED" : losses.length ? "CONDITIONAL" : "VERIFIED";
  const output = {
    engine: "DIALECTIC",
    treaty_id: treaty.id,
    verdict,
    reasons: [...new Set(reasons)].sort(),
    translated: canonicalClone(translated),
    information_losses: canonicalClone(losses),
    qualification
  };
  return {
    ...output,
    receipt: makeReceipt({
      engine: "DIALECTIC",
      operation: "translate-records",
      input: { treaty, records, semanticHashes },
      output,
      verdict,
      reasons: output.reasons,
      evidence: [treaty, semanticHashes]
    })
  };
}

export function roundTripIdentity({ treaty, records, semanticHashes }) {
  const nonIdentity = treaty.clauses.filter((clause) => clause.relation !== "IDENTICAL");
  if (nonIdentity.length) {
    return { verdict: "NOT_TESTABLE", reason: "ROUND_TRIP_REQUIRES_IDENTICAL_CLAUSES" };
  }
  const translated = translateRecords({ treaty, records, semanticHashes });
  if (translated.verdict !== "VERIFIED") {
    return { verdict: translated.verdict, reason: translated.reasons.join(",") };
  }
  const reconstructed = translated.translated.map((record) => {
    const output = {};
    for (const targetField of Object.keys(record)) {
      const clause = treaty.clauses.find((item) => item.target_field === targetField);
      output[clause.source_field] = record[targetField];
    }
    return output;
  });
  const pass = contentAddress(reconstructed) === contentAddress(records);
  return { verdict: pass ? "VERIFIED" : "FAILED", reconstructed };
}

export function treatyClause(treaty, sourceField) {
  return treaty.clauses.map((clause) => clauseBySource(clause, sourceField)).find(Boolean) ?? null;
}
