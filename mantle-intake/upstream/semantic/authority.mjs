import { generateKeyPairSync, sign, verify } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { canonicalClone, canonicalize, contentAddress, sha256 } from "../kernel/canonical.mjs";

export const AUTHORITY_PROTOCOL = "jl.semantic-authority.v1";

export async function initializeAuthority(controlDir, actor) {
  if (!actor?.trim()) throw new TypeError("Authority actor is required");
  const keysDir = join(controlDir, "keys");
  const privatePath = join(keysDir, "owner-private.pem");
  const publicPath = join(keysDir, "owner-public.pem");
  await mkdir(keysDir, { recursive: true, mode: 0o700 });
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const privatePem = privateKey.export({ type: "pkcs8", format: "pem" });
  const publicPem = publicKey.export({ type: "spki", format: "pem" });
  await writeFile(privatePath, privatePem, { flag: "wx", mode: 0o600 });
  await writeFile(publicPath, publicPem, { flag: "wx", mode: 0o644 });
  return {
    protocol: AUTHORITY_PROTOCOL,
    actor: actor.trim(),
    public_key_fingerprint: `sha256:${sha256(publicPem)}`,
    private_key_path: privatePath,
    public_key_path: publicPath
  };
}

export async function loadAuthority(controlDir, actor = null) {
  const privatePath = join(controlDir, "keys", "owner-private.pem");
  const publicPath = join(controlDir, "keys", "owner-public.pem");
  const [privatePem, publicPem] = await Promise.all([
    readFile(privatePath, "utf8"),
    readFile(publicPath, "utf8")
  ]);
  return {
    protocol: AUTHORITY_PROTOCOL,
    actor,
    public_key_fingerprint: `sha256:${sha256(publicPem)}`,
    private_key_path: privatePath,
    public_key_path: publicPath,
    private_pem: privatePem,
    public_pem: publicPem
  };
}

export async function signApproval(controlDir, actor, purpose, target) {
  const authority = await loadAuthority(controlDir, actor);
  const payload = {
    protocol: AUTHORITY_PROTOCOL,
    actor,
    purpose,
    target_hash: contentAddress(target)
  };
  const signature = sign(null, Buffer.from(canonicalize(payload)), authority.private_pem);
  return Object.freeze({
    ...payload,
    public_key_fingerprint: authority.public_key_fingerprint,
    signature: signature.toString("base64")
  });
}

export function verifyApprovalSignature(approval, publicPem, expected = {}) {
  if (!approval || approval.protocol !== AUTHORITY_PROTOCOL) {
    return { valid: false, reason: "UNSUPPORTED_APPROVAL_PROTOCOL" };
  }
  const payload = {
    protocol: approval.protocol,
    actor: approval.actor,
    purpose: approval.purpose,
    target_hash: approval.target_hash
  };
  if (expected.purpose && approval.purpose !== expected.purpose) {
    return { valid: false, reason: "APPROVAL_PURPOSE_MISMATCH" };
  }
  if (expected.target && approval.target_hash !== contentAddress(expected.target)) {
    return { valid: false, reason: "APPROVAL_TARGET_MISMATCH" };
  }
  if (approval.public_key_fingerprint !== `sha256:${sha256(publicPem)}`) {
    return { valid: false, reason: "APPROVAL_KEY_FINGERPRINT_MISMATCH" };
  }
  let valid = false;
  try {
    valid = verify(
      null,
      Buffer.from(canonicalize(payload)),
      publicPem,
      Buffer.from(approval.signature, "base64")
    );
  } catch {
    valid = false;
  }
  return valid
    ? { valid: true, payload: canonicalClone(payload) }
    : { valid: false, reason: "APPROVAL_SIGNATURE_INVALID" };
}
