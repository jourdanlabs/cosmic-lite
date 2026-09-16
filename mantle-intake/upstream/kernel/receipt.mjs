import { canonicalClone, contentAddress, sha256 } from "./canonical.mjs";

export const RECEIPT_VERSION = "jl.receipt.v1";

export function makeReceipt({
  engine,
  operation,
  input,
  output,
  verdict,
  reasons = [],
  evidence = [],
  authority = null,
  previous = null,
  metadata = {}
}) {
  if (!engine || !operation || !verdict) {
    throw new TypeError("Receipt requires engine, operation, and verdict");
  }
  const inputHash = contentAddress(input);
  const outputHash = contentAddress(output);
  const evidenceHashes = evidence.map((item) => contentAddress(item)).sort();
  const body = {
    receipt_version: RECEIPT_VERSION,
    engine,
    operation,
    input_hash: inputHash,
    output_hash: outputHash,
    verdict,
    reasons: [...new Set(reasons)].sort(),
    evidence_hashes: evidenceHashes,
    authority_hash: authority ? contentAddress(authority) : null,
    previous_receipt_hash: previous?.receipt_hash ?? null,
    metadata: canonicalClone(metadata)
  };
  return Object.freeze({
    ...body,
    receipt_hash: contentAddress(body)
  });
}

export function verifyReceipt(receipt) {
  if (!receipt || receipt.receipt_version !== RECEIPT_VERSION) {
    return { valid: false, reason: "UNSUPPORTED_RECEIPT_VERSION" };
  }
  const { receipt_hash: claimed, ...body } = receipt;
  const actual = contentAddress(body);
  return claimed === actual
    ? { valid: true, receipt_hash: actual }
    : { valid: false, reason: "RECEIPT_HASH_MISMATCH", claimed, actual };
}

export function verifyReceiptChain(receipts) {
  const errors = [];
  for (let index = 0; index < receipts.length; index += 1) {
    const receipt = receipts[index];
    const verification = verifyReceipt(receipt);
    if (!verification.valid) {
      errors.push({ index, ...verification });
    }
    const expectedPrevious = index === 0 ? null : receipts[index - 1].receipt_hash;
    if (receipt.previous_receipt_hash !== expectedPrevious) {
      errors.push({
        index,
        reason: "PREVIOUS_RECEIPT_HASH_MISMATCH",
        expected: expectedPrevious,
        actual: receipt.previous_receipt_hash
      });
    }
  }
  return {
    valid: errors.length === 0,
    length: receipts.length,
    head: receipts.at(-1)?.receipt_hash ?? null,
    chain_hash: sha256(receipts.map((item) => item.receipt_hash)),
    errors
  };
}
