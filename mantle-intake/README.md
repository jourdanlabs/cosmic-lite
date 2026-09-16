# Intake Meaning Core — MANTLE adaptation

Prepared for TJ and Marle · 16 September 2026 · v0.1.0

A narrow, executable intake adaptation of MANTLE's meaning, translation, signature-verification, and evidence components. It separates what a source reports from what the institution has approved. It preserves existing intake priorities and emits context for GAUNTLET without manufacturing COSMIC's missing economic fields.

**Start with [MARLE-HANDOFF.md](docs/MARLE-HANDOFF.md).** The [architecture](docs/ARCHITECTURE.md) explains the exact boundary. [Validation](docs/VALIDATION.md) separates the new module's results from the original archive's gates.

## Run without installing dependencies

```sh
node --test test/*.test.mjs
node src/cli.mjs examples/snapshot.json examples/contract.json
node examples/run.mjs
```

Tested on Node 24.19.0 / Linux x64. The core has no external runtime dependencies. `examples/run.mjs` demonstrates discovery and controlled mapping with an ephemeral synthetic authority. Its private key is held only in memory. Each invocation creates a new synthetic key, so receipt hashes across separate demo invocations are not expected to match. Repeating an evaluation with the same complete inputs does match.

```js
import { interpretIntake, gauntletContext } from './src/intake.mjs';
const result = interpretIntake(snapshot, contract, serverOwnedTrustPolicy);
const context = gauntletContext(result, snapshot, contract, serverOwnedTrustPolicy);
// context is null unless a controlled mapping passes full replay verification.
```

## Two explicit modes

| Mode | Purpose | Output |
|---|---|---|
| DISCOVERY | Inspect field availability and proposed interpretations without inventing approvals | DRAFT_INTERPRETATION; source-linked cells and coverage; no controlled context |
| CONTROLLED | Verify trusted signatures over selected meaning, full treaty, and exact snapshot | VERIFIED_MAPPING; replay-checked GAUNTLET context |

Neither verdict means BUILD, permitted, mandatory, financially justified, or scheduled. `businessDecision` is null; authorization and capacity are NOT_ASSESSED; `strata` is null. No numeric STRATA executor runs in this edition.

Malformed inputs throw through the library API; the CLI emits REFUSED and exits 2. Semantic/signature refusal returns a receipted REFUSED result and CLI exit 2. Discovery success exits 0 but remains explicitly draft.

## What is implemented

- Meaning selection at both valid time and knowledge time, refusing overlapping definitions.
- Full-object signature checks with explicit actor, purpose, key fingerprint, and enabled-key checks in controlled mode.
- Source-schema and target-definition hash binding; treaty time bounds and exact target-field coverage.
- Strict identity and enumerated mappings; no implicit boolean or numeric conversions.
- OBSERVED, BLANK, NOT_FETCHED, ABSENT, UNMAPPED, and INVALID cell states.
- Exact source values and references retained with each observation; evidence claims scoped to record and target field.
- Coverage denominators, requested-date overdue detection, and targeted source-resolution questions.
- Original row order and priority unchanged; full replay before emitting controlled GAUNTLET context.
- Receipt metadata binds implementation bytes and runtime; receipt input binds snapshot, contract, signatures, and trust configuration.

The selected field vocabulary is deliberately limited to owner, requestedChange, applicationRef, regulatoryImpactReported, requestedDueAt, and sizeBand. Date values must already be normalized by the adapter to explicit UTC instants; dates and source timezone policy remain auditable local-adapter work. Ordinals remain S/M/L/XL, never fabricated days or currency.

## Transfer boundary

Ten upstream source files are copied byte-for-byte from foundry commit `34684bcb527d0cfc83911c7b62d37ac1b3abfb3a`, verified against the supplied Git bundle. New intake behavior lives in `src/`; upstream internals remain unchanged. The archive includes no full STRATA clone, other foundry engines, application databases, deployment assets, original Git bundle, or existing private keys. No license grant or ownership determination is added.

This is a new intake integration module, not completion of Pan's separate standalone MANTLE extraction/publication handoff. No remote repository was created or modified. No live JPMC data or connectors were accessed. The synthetic field names must be mapped locally; they are not asserted to be actual Jira custom-field IDs.

The original engine's 19-test suite ran separately: 9 passed; 10 failed at the missing vendored `tsx` loader. The new adaptation's 29 tests passed. Those are different gates; neither result is substituted for the other.
