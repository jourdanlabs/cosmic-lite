# Contracts and integration boundaries

Edition 0.1.0 · contract versions `intake/v1`, `intake-policy/v1`, `decision-receipt/v1`

## Public entrypoints

`evaluate(snapshot: unknown, policy: unknown): Receipt` validates JSON and returns a fresh receipt. Invalid shape or types throw; the CLI emits REFUSED and exits 2. A REJECT business decision is a successful evaluation, not a process error.

`verifyHash(receipt): boolean` checks content against its embedded digest. It does not establish origin.

`replay(snapshot, policy, receipt): boolean` reexecutes and compares the full canonical receipt, including source and runtime identity. Invalid input can throw; the CLI handles this. A nonmatching valid replay exits 1. A matching replay exits 0.

Individual engine exports are internal trusted-data functions. Call ASTRAL first if using them separately. Only `evaluate` performs the whole validation boundary.

## Snapshot semantics

| Field | Semantics |
|---|---|
| `schema` | Exactly `intake/v1` |
| `asOf` | Explicit UTC timestamp with milliseconds; no ambient clock |
| `items[].id` | Stable source identity; unique within snapshot |
| `title` | Human-readable label; no free-text decision inference |
| `owner` | Accountable recipient identifier for evidence questions; adapter validates it |
| `team` | Exact key into policy capacity map |
| `priority` | Existing priority rank, lower first; ties by ID |
| `dependencyIds` | Prerequisite intakes that must also be admitted; no inferred edges |
| `deadlineDays` | Integer relative elapsed-day limit from `asOf`, or null for policy horizon |
| `evidence` | Explicit claims with provenance and validity windows |

No fields are optional except through their specified nullability. Extra fields are rejected. Empty snapshots are allowed. Maximum 1,000 intakes and 200 evidence records per intake; these are input bounds, not measured performance guarantees. Numeric values must be safe nonnegative integers at most 1,000,000,000. IDs and labels must be nonempty strings. Duplicate evidence IDs are rejected globally.

## Evidence semantics

Every evidence record has `id`, `subjectId`, `field`, `value`, `sourceRef`, `sourceHash`, `issuer`, `observedAt`, and `expiresAt`.

The adapter must bind `subjectId` to the intake it actually describes. It must authenticate `issuer` and check that source bytes match `sourceHash` before supplying trusted records. The kernel validates hash format, subject equality, field authority, and timestamp validity; it cannot fetch the referenced source or verify an issuer's real identity.

Only current authorized claims resolve a field. Evidence is current when `observedAt <= asOf < expiresAt`. Expired/future/unauthorized/wrong-subject records remain in the exclusion trace but cannot support approval or rejection.

| Field | Value type | Unit / meaning |
|---|---|---|
| `permitted` | Boolean | Consolidated eligibility attestation under local controls |
| `need` | Boolean | Authoritative determination that the need remains valid |
| `benefitLow`, `benefitHigh` | Integer | Comparable benefit bounds in policy value unit/horizon |
| `costLow`, `costHigh` | Integer | Cost bounds in the same unit/horizon, including costs required by local policy |
| `effortDays` | Integer | Aggregate capacity consumption in team-person-days |
| `deliveryDays` | Integer | Conservative elapsed duration for the scoped request |
| `mechanism` | String | Declared explanation of how work changes the outcome |
| `outcomeMetric` | String | Named observable measure of the intended outcome |

The consolidated `permitted` flag is a narrow reference interface. In a real deployment, expand it into evidence for required local controls or compute it in an adapter that proves all those controls have been satisfied. Never default the flag to true. “A request exists” must not be interpreted as `need=true`.

Source changes must create new evidence revisions. The core has no latest-wins or supersedes semantics. Two different current authorized values yield CONFLICT even if one is newer. Withdraw or expire obsolete claims in the authoritative snapshot, preserving history in the event store, or add a new explicit versioned supersession contract.

Repeated identical values do not increase confidence. UNKNOWN cannot be promoted to KNOWN by another module. Evidence readiness is reported as known fields / required fields, not a probability that the business case is correct.

## Policy semantics

`authorityByField` lists allowed issuer identifiers for every field. It is server-controlled. `capacityDaysByTeam` supplies available effort capacity after any existing commitments. Missing capacity is unknown; zero is known exhausted capacity.

`horizonDays` and `deadlineDays` are elapsed-day limits. `benefitRealizationBps` ranges from 0 to 10,000. `costStressBps` ranges from 10,000 to 100,000. `minNetBenefit` is a nonnegative integer. Rounding is conservative: benefits down, costs up. The input bounds keep the defined intermediate arithmetic within safe integer range.

`rejectWhen` may contain `permitted`, `need`, both, or neither. A configured field equal to known false yields REJECT. Removing it from `rejectWhen` does not make false eligible for BUILD; it routes to NEEDS_EVIDENCE. Contract changes are required for other predicates.

## Decision ordering

1. ASTRAL validates and normalizes the input.
2. METEOR maps dependencies; COMET/CHRONOS admit claims.
3. NEBULA resolves facts; QUASAR builds intervals; NOVA evaluates the conditional scenario; ECLIPSE checks the local time window; PULSAR challenges the case.
4. AURORA checks admitted explicit disqualifiers first. A decisive rejection does not require unrelated fields to be complete.
5. Without a decisive disqualifier, unresolved facts/challenges yield NEEDS_EVIDENCE. Local time failure yields DEFER.
6. Locally admissible requests enter priority-ordered atomic bundle allocation. Blocked dependencies, insufficient capacity, or missed bundle windows yield DEFER.
7. The receipt preserves the local decision in its trace and the final portfolio disposition separately.

## Trust and persistence boundary

Trusted server policy + authenticated source adapter → validated snapshot → deterministic kernel → immutable receipt → revision-checked portfolio commit.

Submitter text, model-extracted JSON, browser flags, and user-provided authority names are untrusted before admission. Neither the JSON schema nor a valid SHA-256 string turns them into proof.

The receipt includes intake/evidence content and can contain sensitive details after local integration. Store and expose it under the same local access rules as its sources. Do not send internal data back to this conversation to complete the adapter work.

## Extending the engine contracts

Add new fields or semantics under a new schema or explicitly versioned migration. Keep the old evaluator available for historical replay. Unknown enum values and unsupported contracts must refuse, not silently coerce.

Recommended future evidence envelope additions: source revision, verification method, evidence classification, review authority, policy applicability, supersession/revocation, and claim-specific units. Add them when the local trust model is known, with runtime validation and invariants.

Recommended application entities: IntakeRevision, EvidenceRevision, PolicyVersion, CapacitySnapshot, EvaluationReceipt, EvidenceQuestion, ExceptionEvent, PortfolioCommit. Links should use stable IDs and immutable revisions. An authenticated event write must not overwrite earlier history.

If a signed receipt is added, sign the canonical digest with a locally controlled approved key. Retain algorithm, key ID, and verification context. Signing the receipt authenticates its issuance; it does not establish that the underlying business estimates were true.
