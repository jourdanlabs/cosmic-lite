import { contentAddress } from "../kernel/canonical.mjs";
import { makeReceipt } from "../kernel/receipt.mjs";
import { selectBitemporalVersion, validateBitemporalVersions } from "../kernel/temporal.mjs";

function matches(row, filters = []) {
  return filters.every((filter) => {
    const value = row[filter.field];
    switch (filter.operator ?? "eq") {
      case "eq":
        return value === filter.value;
      case "neq":
        return value !== filter.value;
      case "in":
        return Array.isArray(filter.value) && filter.value.includes(value);
      case "gte":
        return Number(value) >= Number(filter.value);
      case "lte":
        return Number(value) <= Number(filter.value);
      default:
        throw new TypeError(`Unsupported filter operator: ${filter.operator}`);
    }
  });
}

function finite(values, field) {
  return values.map((row) => {
    const value = Number(row[field]);
    if (!Number.isFinite(value)) {
      throw new TypeError(`Non-numeric ${field}`);
    }
    return value;
  });
}

export function replayDefinition(definition, rows) {
  const selected = rows.filter((row) => matches(row, definition.filters));
  const operation = definition.operation;
  if (operation === "count") {
    return { value: selected.length, rows: selected.length };
  }
  if (operation === "sum") {
    const values = finite(selected, definition.field);
    return { value: values.reduce((sum, value) => sum + value, 0), rows: selected.length };
  }
  if (operation === "average") {
    const values = finite(selected, definition.field);
    return {
      value: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
      rows: selected.length
    };
  }
  if (operation === "ratio") {
    const numerator = finite(selected, definition.numerator).reduce((sum, value) => sum + value, 0);
    const denominator = finite(selected, definition.denominator).reduce((sum, value) => sum + value, 0);
    return {
      value: denominator === 0 ? null : numerator / denominator,
      numerator,
      denominator,
      rows: selected.length
    };
  }
  throw new TypeError(`Unsupported semantic operation: ${operation}`);
}

function structuralDefinition(version) {
  return {
    object_id: version.object_id,
    definition: version.definition,
    scope: version.scope ?? null,
    exclusions: version.exclusions ?? [],
    unit: version.unit ?? null
  };
}

export function compareMeaningVersions(oldVersion, newVersion, replayRows = null) {
  const oldHash = contentAddress(structuralDefinition(oldVersion));
  const newHash = contentAddress(structuralDefinition(newVersion));
  if (oldHash === newHash) {
    return {
      verdict: "EQUIVALENT",
      old_hash: oldHash,
      new_hash: newHash,
      replay: null
    };
  }
  if ((oldVersion.unit ?? null) !== (newVersion.unit ?? null)) {
    return {
      verdict: "BREAKING",
      old_hash: oldHash,
      new_hash: newHash,
      reason: "UNIT_CHANGED",
      replay: null
    };
  }
  if (
    contentAddress(oldVersion.scope ?? null) !== contentAddress(newVersion.scope ?? null) ||
    contentAddress(oldVersion.exclusions ?? []) !== contentAddress(newVersion.exclusions ?? [])
  ) {
    return {
      verdict: "BREAKING",
      old_hash: oldHash,
      new_hash: newHash,
      reason: "SCOPE_OR_EXCLUSIONS_CHANGED",
      replay: null
    };
  }
  if (
    contentAddress(oldVersion.definition?.filters ?? []) !==
    contentAddress(newVersion.definition?.filters ?? [])
  ) {
    return {
      verdict: "BREAKING",
      old_hash: oldHash,
      new_hash: newHash,
      reason: "POPULATION_FILTER_CHANGED",
      replay: null
    };
  }
  if (!replayRows) {
    return {
      verdict: "UNRESOLVED",
      old_hash: oldHash,
      new_hash: newHash,
      reason: "REPLAY_DATA_REQUIRED",
      replay: null
    };
  }
  const oldResult = replayDefinition(oldVersion.definition, replayRows);
  const newResult = replayDefinition(newVersion.definition, replayRows);
  if (oldResult.value == null || newResult.value == null) {
    return {
      verdict: "UNRESOLVED",
      old_hash: oldHash,
      new_hash: newHash,
      reason: "REPLAY_RESULT_NULL",
      replay: { old: oldResult, new: newResult, delta: null }
    };
  }
  return {
    verdict:
      oldResult.value === newResult.value ? "COMPATIBLE_WITH_RESTATEMENT" : "BREAKING",
    old_hash: oldHash,
    new_hash: newHash,
    replay: {
      old: oldResult,
      new: newResult,
      delta:
        oldResult.value == null || newResult.value == null
          ? null
          : newResult.value - oldResult.value
    }
  };
}

export function decomposeChange({ oldVersion, newVersion, priorRows, currentRows }) {
  const priorUnderOld = replayDefinition(oldVersion.definition, priorRows);
  const currentUnderOld = replayDefinition(oldVersion.definition, currentRows);
  const currentUnderNew = replayDefinition(newVersion.definition, currentRows);
  const supported = [priorUnderOld.value, currentUnderOld.value, currentUnderNew.value].every(
    (value) => Number.isFinite(value)
  );
  return {
    verdict: supported ? "VERIFIED" : "UNRESOLVED",
    prior_under_old: priorUnderOld,
    current_under_old: currentUnderOld,
    current_under_new: currentUnderNew,
    data_effect: supported ? currentUnderOld.value - priorUnderOld.value : null,
    definition_effect: supported ? currentUnderNew.value - currentUnderOld.value : null,
    reported_effect: supported ? currentUnderNew.value - priorUnderOld.value : null
  };
}

export function resolveMeaning({ versions, objectId, validAt, knownAt }) {
  const validation = validateBitemporalVersions(versions);
  const selection = validation.valid
    ? selectBitemporalVersion(versions, { validAt, knownAt, id: objectId })
    : { verdict: "REFUSED", reason: "INVALID_VERSION_INTERVAL", version: null };
  const output = {
    engine: "PALIMPSEST",
    object_id: objectId,
    valid_at: validAt,
    known_at: knownAt,
    selection,
    validation
  };
  return {
    ...output,
    receipt: makeReceipt({
      engine: "PALIMPSEST",
      operation: "resolve-meaning",
      input: { versions, objectId, validAt, knownAt },
      output,
      verdict: selection.verdict,
      reasons: selection.reason ? [selection.reason] : [],
      evidence: selection.version ? [selection.version] : []
    })
  };
}
