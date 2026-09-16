function instant(value, field) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new TypeError(`Invalid ${field}: ${value}`);
  }
  return parsed;
}

export function intervalContains(version, validAt, knownAt) {
  const valid = instant(validAt, "validAt");
  const known = instant(knownAt, "knownAt");
  const validFrom = instant(version.valid_from, "valid_from");
  const validTo = version.valid_to ? instant(version.valid_to, "valid_to") : Number.POSITIVE_INFINITY;
  const knownFrom = instant(version.known_from, "known_from");
  const knownTo = version.known_to ? instant(version.known_to, "known_to") : Number.POSITIVE_INFINITY;
  return valid >= validFrom && valid < validTo && known >= knownFrom && known < knownTo;
}

export function selectBitemporalVersion(versions, { validAt, knownAt, id }) {
  const candidates = versions
    .filter((version) => (!id || version.object_id === id) && intervalContains(version, validAt, knownAt))
    .sort((a, b) => a.version.localeCompare(b.version));
  if (candidates.length === 0) {
    return { verdict: "UNRESOLVED", reason: "NO_VERSION_AT_REQUESTED_TIME", version: null };
  }
  if (candidates.length > 1) {
    return {
      verdict: "REFUSED",
      reason: "OVERLAPPING_CONTROLLED_VERSIONS",
      candidates: candidates.map((item) => item.version),
      version: null
    };
  }
  return { verdict: "VERIFIED", reason: null, version: candidates[0] };
}

export function validateBitemporalVersions(versions) {
  const errors = [];
  for (const version of versions) {
    try {
      const validFrom = instant(version.valid_from, "valid_from");
      const knownFrom = instant(version.known_from, "known_from");
      if (version.valid_to && instant(version.valid_to, "valid_to") <= validFrom) {
        errors.push({ version: version.version, reason: "INVALID_VALID_INTERVAL" });
      }
      if (version.known_to && instant(version.known_to, "known_to") <= knownFrom) {
        errors.push({ version: version.version, reason: "INVALID_KNOWN_INTERVAL" });
      }
    } catch (error) {
      errors.push({ version: version.version, reason: error.message });
    }
  }
  return { valid: errors.length === 0, errors };
}
