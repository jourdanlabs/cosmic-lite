import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize, contentAddress } from "../upstream/kernel/canonical.mjs";
import { freezeOutput, revealFrozenOutput } from "../upstream/kernel/frozen.mjs";
import { makeReceipt, verifyReceipt, verifyReceiptChain } from "../upstream/kernel/receipt.mjs";
import { selectBitemporalVersion } from "../upstream/kernel/temporal.mjs";

test("canonicalization is key-order independent and rejects undefined", () => {
  assert.equal(canonicalize({ b: 2, a: 1 }), canonicalize({ a: 1, b: 2 }));
  assert.throws(() => canonicalize({ a: undefined }), /Undefined/);
});

test("receipt chain detects tampering and reordering", () => {
  const first = makeReceipt({
    engine: "TEST",
    operation: "one",
    input: { a: 1 },
    output: { b: 2 },
    verdict: "VERIFIED"
  });
  const second = makeReceipt({
    engine: "TEST",
    operation: "two",
    input: { b: 2 },
    output: { c: 3 },
    verdict: "VERIFIED",
    previous: first
  });
  assert.equal(verifyReceipt(first).valid, true);
  assert.equal(verifyReceiptChain([first, second]).valid, true);
  assert.equal(verifyReceiptChain([second, first]).valid, false);
  assert.equal(verifyReceipt({ ...first, verdict: "FAILED" }).valid, false);
});

test("frozen output reveals only the committed payload", () => {
  const manifestHash = contentAddress({ suite: "test" });
  const commitment = freezeOutput({ score: 0.8 }, manifestHash, "fixture-nonce");
  assert.equal(revealFrozenOutput(commitment, { score: 0.8 }, "fixture-nonce").valid, true);
  assert.equal(revealFrozenOutput(commitment, { score: 0.9 }, "fixture-nonce").valid, false);
});

test("bitemporal selection uses valid time and knowledge time", () => {
  const versions = [
    {
      object_id: "revenue",
      version: "1",
      valid_from: "2025-01-01T00:00:00Z",
      valid_to: "2026-01-01T00:00:00Z",
      known_from: "2025-01-01T00:00:00Z",
      known_to: null
    },
    {
      object_id: "revenue",
      version: "2",
      valid_from: "2026-01-01T00:00:00Z",
      valid_to: null,
      known_from: "2026-02-01T00:00:00Z",
      known_to: null
    }
  ];
  const selected = selectBitemporalVersion(versions, {
    id: "revenue",
    validAt: "2026-03-01T00:00:00Z",
    knownAt: "2026-03-01T00:00:00Z"
  });
  assert.equal(selected.version.version, "2");
});
