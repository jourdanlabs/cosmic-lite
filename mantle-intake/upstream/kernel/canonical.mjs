import { createHash } from "node:crypto";

function normalize(value, path = "$") {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Non-finite number at ${path}`);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => normalize(item, `${path}[${index}]`));
  }
  if (typeof value === "object") {
    const output = {};
    for (const key of Object.keys(value).sort()) {
      const item = value[key];
      if (item === undefined) {
        throw new TypeError(`Undefined value at ${path}.${key}`);
      }
      output[key] = normalize(item, `${path}.${key}`);
    }
    return output;
  }
  throw new TypeError(`Unsupported canonical value at ${path}: ${typeof value}`);
}

export function canonicalize(value) {
  return JSON.stringify(normalize(value));
}

export function sha256(value) {
  const bytes =
    typeof value === "string" || Buffer.isBuffer(value) || value instanceof Uint8Array
      ? value
      : canonicalize(value);
  return createHash("sha256").update(bytes).digest("hex");
}

export function contentAddress(value, prefix = "sha256") {
  return `${prefix}:${sha256(value)}`;
}

export function canonicalClone(value) {
  return JSON.parse(canonicalize(value));
}
