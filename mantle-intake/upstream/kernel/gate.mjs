export const VERDICTS = Object.freeze([
  "VERIFIED",
  "CERTIFIED",
  "SATISFIED",
  "REVIEW",
  "WATCH",
  "PARTIAL",
  "CONDITIONAL",
  "INSUFFICIENT",
  "NOT_TESTABLE",
  "UNRESOLVED",
  "HOLD",
  "REFUSED",
  "FAILED",
  "ESCALATE"
]);

const BLOCKING = new Set([
  "INSUFFICIENT",
  "NOT_TESTABLE",
  "UNRESOLVED",
  "HOLD",
  "REFUSED",
  "FAILED",
  "ESCALATE"
]);

export function gate({ pass, passVerdict = "VERIFIED", failVerdict = "REFUSED", reasons = [], details = {} }) {
  if (!VERDICTS.includes(passVerdict) || !VERDICTS.includes(failVerdict)) {
    throw new TypeError("Unknown gate verdict");
  }
  return Object.freeze({
    verdict: pass ? passVerdict : failVerdict,
    passed: Boolean(pass),
    reasons: [...new Set(reasons)].sort(),
    details
  });
}

export function combineGates(gates, passVerdict = "VERIFIED") {
  const failed = gates.filter((item) => !item.passed || BLOCKING.has(item.verdict));
  return gate({
    pass: failed.length === 0,
    passVerdict,
    failVerdict: failed.some((item) => item.verdict === "ESCALATE") ? "ESCALATE" : "REFUSED",
    reasons: failed.flatMap((item) => item.reasons),
    details: { gates }
  });
}

export function requireHumanApproval(approval, scopeHash) {
  const valid = Boolean(
    approval &&
      approval.approved === true &&
      approval.actor &&
      approval.scope_hash === scopeHash
  );
  return gate({
    pass: valid,
    passVerdict: "VERIFIED",
    failVerdict: "HOLD",
    reasons: valid ? [] : ["HUMAN_APPROVAL_MISSING_OR_SCOPE_MISMATCH"]
  });
}
