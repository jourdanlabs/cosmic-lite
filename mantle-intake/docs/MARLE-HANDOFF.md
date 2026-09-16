# Marle — MANTLE intake adaptation

From Bulma for TJ · 16 September 2026

## Objective and current status

Use this module to make GAUNTLET reason explicitly about available source meaning, field availability, mapping ambiguity, and provenance. Preserve the existing priority order. Keep assessment, business recommendation, authorization, and resource admission as distinct conclusions.

This is a runnable, narrowly scoped intake adaptation, not a completed JPMC integration. The demo has no real Jira records, field IDs, signers, or local policies. It does not yet make BUILD/REJECT decisions.

Read `README.md`, `docs/ARCHITECTURE.md`, `src/intake.mjs`, and `docs/VALIDATION.md`. Run:

```sh
node --test test/*.test.mjs
node src/cli.mjs examples/snapshot.json examples/contract.json
node examples/run.mjs
```

The first command passed 29 tests here. The third creates an ephemeral synthetic authority for demonstration only; do not treat its signatures as firm approval.

## Why this addresses your handoff

Your 1,153-ticket finding showed that the original economic profile cannot be populated from the inspected intake sources. The correction is not to turn unknowns into defaults. It is to assess supported source-level questions independently of missing economic fields.

The bulk-versus-detail distinction you found is now explicit in the contract. A source field outside a record's projection is NOT_FETCHED; it is not counted as a blank form answer. A fetched empty field is BLANK. A fetched projection with a missing value key is ABSENT. Unknown enumerated values are UNMAPPED and never become false.

## What to implement locally next

1. Compare the actual local code/revision with this package and the source provenance. Preserve your GAUNTLET and prioritization work in an isolated integration branch.
2. Finish the bounded detail-field survey for the 239 discretionary tickets. Record per-field projection, values, fetch errors, record IDs, response revision/time, and denominator. Do not extrapolate the five sampled blank templates into a measured whole-backlog field rate.
3. Map actual field IDs and select-value shapes. The synthetic names in `examples/fixture.mjs` are examples only. For multi-select application/owner fields, extend and version the scalar contract rather than coercing a list into one value.
4. Emit `intake-observations/v1` snapshots from trusted local fetches. Preserve record identity, priority, source revision, capture time, and actual projection. Keep raw source evidence/revisions available locally.
5. Write proposed meaning definitions and identity/enum treaties for the real sources. Start in DISCOVERY. Render the resulting observations and coverage alongside GAUNTLET's existing draft candidates, with visible draft status.
6. Correct the user-story mapping: “I want to” becomes `requestedChange`. Preserve existing mechanism drafts as proposals if useful, but do not silently rename a requested change into a validated mechanism. Add `outcomeMetric` only when a source or explicit assessment actually supports it.
7. Preserve requested dates, including past dates. Define timezone semantics for date-only Jira values. Do not turn overdue requests into null. Keep requested and authoritative dates distinct.
8. Resolve local authority and source-capture attestation separately from discovery. Configure trusted keys and purposes server-side only when the actual governance owner and source-adapter identity are established. No generated key can establish institutional authority on its own.
9. Use the CONTROLLED path only with valid signatures over the exact meaning, treaty, and snapshot. The source signature means the capture is authenticated under that trust policy; it does not mean every requester claim is objectively true.
10. Feed `gauntletContext` to a new decision-specific profile adapter. Do not cast it directly into the earlier ten-field economic evidence schema. Retain your prioritization and existing scoped gates.

## Data contract

Snapshot keys: schema, sourceId, sourceRevision, observedAt, validAt, knownAt, sourceSchema, records. Each record contains id, priority, projection, and values. See the complete runnable JSON examples.

Contract keys: schema, mode, meaningId, meanings, treaty, approvals. Meanings and treaty have explicit valid and knowledge intervals. The treaty binds the actual source-schema digest and selected target-definition digest. Targets currently supported: owner, requestedChange, applicationRef, regulatoryImpactReported, requestedDueAt, sizeBand.

Trust configuration contains externally selected public keys, fingerprints, actors, permitted signature purposes, and enabled status. Signature purposes are INTAKE_MEANING, INTAKE_TREATY, and INTAKE_SOURCE. The demo signer lives under examples, not the core.

Source signatures bind the entire supplied snapshot, including priority and projection. The API only returns controlled context after checking result replay against the current complete inputs. A changed result, trust configuration, definition, source, or implementation requires new evaluation.

## Decisions still needed

- Which real field identifies routing ownership, and does it differ from decision authority?
- Which actual source tells us a request is an obligation rather than merely reports impact?
- What timezone and due-date interpretation apply to the intake source?
- Which mapping/version authority already exists locally, if any?
- Which source assertions may support which advisory decisions?
- Where do immutable source snapshots and decision receipts live locally?
- What capacity-free recommendation vocabulary is appropriate before authorization or scheduling exists?

Resolve these from authoritative local sources where possible. Do not ask submitters to fill every missing field before discovery can produce a useful report.

## Gates for your integration

- Bulk omission produces NOT_FETCHED, never false/zero/BLANK.
- Detail fetch population rates retain exact denominator and failures.
- Unknown answer strings remain UNMAPPED; no catch-all false mapping.
- Missing, blank, invalid, and conflicting states cannot establish permission, need, or mandatory status.
- Priority and record IDs remain unchanged through the adapter.
- No matching or overlapping meaning, stale treaty, or failed controlled signature stops interpretation/context emission.
- Specific requested dates survive even when overdue.
- Changing source bytes, mapping clauses, definition, or trusted key invalidates the old controlled result.
- A claimed signed result cannot be used after its observations are edited.
- A future numeric STRATA execution must be bound to the actual admitted dataset, not just an unrelated certified metric receipt.
- Discovery output remains visibly provisional; no automatic insertion into COSMIC v1 evidence.
- Authorization and capacity remain NOT_ASSESSED unless separately evaluated by an appropriate profile.

## Scope and provenance

The uploaded archive's `README-PBB.md` concerns a separate standalone MANTLE repository extraction, rename, proving-room migration, and publication. That task has not been claimed complete here. No remote was created, pushed, renamed, or published; no local proving-room surface was changed.

This package preserves ten upstream files byte-for-byte from foundry commit `34684bcb527d0cfc83911c7b62d37ac1b3abfb3a`, checked against the included Git bundle. `docs/UPSTREAM-PROVENANCE.json` records each hash. New behavior is isolated under `src/`. The full STRATA vendor tree and other engines are intentionally excluded.

Original baseline artifacts match Pan's three listed byte hashes. Reexecuting the original suite here produced 9 passes and 10 failures, all reaching the missing vendored tsx loader. Neither the original 19/19 gate nor the 16-check live proving-room gate has been reestablished in this environment. Keep those gates separate from the new module's 29/29 result.

## Return to TJ

Provide the actual local field map, supported meanings, discovery coverage and concrete changes from the prior report, representative refusal/draft/controlled cases, integrated tests, exact repo/branch/commit, and unresolved policy decisions. State which results are source observations and which are business conclusions. Retain existing source and priority history.
