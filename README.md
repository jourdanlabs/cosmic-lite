# Intake Decision Core — COSMIC Lite

Prepared for TJ and Marle · COSMIC Lite intake edition 0.1.0 · 16 September 2026

A standalone, executable ten-module decision kernel for already-prioritized application and feature intakes. It produces BUILD, REJECT, DEFER, or NEEDS_EVIDENCE, with evidence lineage, individual challenges, dependency-aware capacity admission, and a replayable receipt.

Start with [Marle's handoff](docs/MARLE-HANDOFF.md), then [the architecture](docs/ARCHITECTURE.md). Read [the contracts](docs/CONTRACTS.md) when connecting an adapter.

This is new, bounded implementation work based on the engine concepts TJ described. No COSMIC repository was accessed or copied. It is not a verified extraction of the current full suite. Historical engine lineups evolved; this edition explicitly selects METEOR, COMET, ASTRAL, NEBULA, QUASAR, NOVA, ECLIPSE, PULSAR, AURORA, and CHRONOS. HEIMDALL and the rest of the broader suite are outside this package.

## Run

Verified runtime: Node 24.19.0, Linux x64. No install or network is needed to run the core.

```sh
node --test test/*.test.mjs
node src/cli.ts examples/intakes.json examples/policy.json > my-receipt.json
node src/cli.ts examples/intakes.json examples/policy.json my-receipt.json
```

Or run `npm test` and `npm run demo`. The package is intended as source to integrate into an internal application. Native Node TypeScript execution does not type-check, and does not execute `.ts` dependencies under `node_modules`. Marle should use the firm's approved TypeScript toolchain when integrating. `npm run typecheck` requires an available TypeScript 5.8+ compiler and Node typings; these development tools are not bundled.

```ts
import { evaluate } from './src/index.ts';
const receipt = evaluate(trustedSnapshot, approvedPolicy);
```

The callable kernel takes a complete snapshot and policy; it reads its own source files to fingerprint its implementation. It has no model calls, telemetry, database writes, web requests, credential loading, or COSMIC suite dependencies. Run it server-side from trusted adapters, not against arbitrary submitter-supplied policies.

## What runs today

- Strict JSON runtime validation and stable ordering.
- Exact intake identity and dependency graph checks.
- Field-specific issuer allowlists, subject binding, and evidence validity windows.
- Explicit KNOWN / UNKNOWN / CONFLICT facts.
- Bounded business-case arithmetic and one deterministic downside scenario.
- Evidence-backed policy disqualification and explainable admission.
- Atomic dependency bundles, aggregate team capacity, conservative elapsed scheduling.
- Snapshot/policy/source/runtime-bound receipts and replay checking.

The synthetic example produces two BUILD decisions, one REJECT, one DEFER, and three NEEDS_EVIDENCE decisions. See `examples/receipt.json` for full engine traces.

## Boundaries

BUILD means admitted to a proposed delivery portfolio under the supplied policy; it does not deploy an application or bypass local decision authority. The reference profile covers discretionary work whose benefits and costs can be expressed in a common unit and horizon. Mandatory obligations and incomparable benefits need separate policy profiles before use.

The kernel trusts its adapter to authenticate evidence issuers and verify source bytes. A `sourceHash` field is a recorded assertion until the adapter verifies it. Receipt hashing detects changes against a trusted recorded digest; it does not authenticate a receipt or make mutable storage append-only. Production identity, authoritative policy distribution, storage, signing, permissions, and workflow integration belong to the local application.

This package has no frontend or JPMC connectors. Those are intentionally left for Marle to design against the real environment. No claim is made about JPMC's current ISR schema, policies, approvals, or deployment stack.

## Files

| Path | Purpose |
|---|---|
| `docs/ARCHITECTURE.md` | Product concept, ten-engine scope, decision rules, and application design |
| `docs/MARLE-HANDOFF.md` | Direct local-agent work order and acceptance gates |
| `docs/CONTRACTS.md` | Data semantics, trust boundary, extension and error contracts |
| `src/engines/` | Ten small engine implementations |
| `src/index.ts` | Pipeline, portfolio admission, and replay |
| `src/contracts.ts` | TypeScript contracts |
| `examples/` | Synthetic intakes, policy, and runnable receipt |
| `test/` | Decision-invariant tests and fixtures |
| `docs/VALIDATION.md` | Actual checks and unverified boundaries |
| `MANIFEST.sha256` | Packaged-file checksums |

Runtime references: [Node TypeScript](https://nodejs.org/api/typescript.html), [Node test runner](https://nodejs.org/api/test.html), [Node crypto](https://nodejs.org/api/crypto.html). The first explains native type stripping and its limits; the others document the runtime facilities used here.
