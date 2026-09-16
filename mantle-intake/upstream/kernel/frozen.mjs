import { contentAddress } from "./canonical.mjs";

export function freezeOutput(value, manifestHash, nonce) {
  if (!manifestHash || !nonce) {
    throw new TypeError("Frozen output requires manifest hash and explicit nonce");
  }
  return Object.freeze({
    protocol: "jl.frozen.v1",
    manifest_hash: manifestHash,
    commitment: contentAddress({ value, manifest_hash: manifestHash, nonce })
  });
}

export function revealFrozenOutput(commitment, value, nonce) {
  const actual = contentAddress({
    value,
    manifest_hash: commitment.manifest_hash,
    nonce
  });
  return {
    valid: actual === commitment.commitment,
    expected: commitment.commitment,
    actual
  };
}
