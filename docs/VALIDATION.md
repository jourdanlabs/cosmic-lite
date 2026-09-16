# Validation record

Executed 16 September 2026 in the preparation environment.

| Check | Result |
|---|---|
| Runtime | Node 24.19.0, Linux x64 |
| `node --test test/*.test.mjs` | 26 tests passed; 0 failed, skipped, or cancelled |
| Synthetic CLI evaluation | Successful receipt generated for 7 intakes |
| Synthetic decisions | BUILD 2; REJECT 1; DEFER 1; NEEDS_EVIDENCE 3 |
| Replay of generated receipt | MATCH; exit 0 |
| Modified receipt replay through CLI | REFUSED; exit 1 |
| Invalid input through CLI | REFUSED; exit 2 |
| External runtime packages | None required for evaluation or tests |
| Static TypeScript checking | Not run: compiler unavailable in preparation environment |
| JPMC data / source systems / authorities | Not accessed or verified |
| Full COSMIC engine parity | Not assessed; this is new standalone scoped code |

`test-results.txt` contains the actual test output. Tests cover sufficient evidence, explicit rejection, missing facts, contradictions, issuer and subject binding, expiration/future evidence, historical exclusions, capacity, missing team capacity, atomic bundles, shared prerequisites, blocked dependencies, graph cycles, elapsed scheduling, downside challenges, inverted estimates, false eligibility with rejection disabled, replay, input ordering, changed evidence/policy/time/output, malformed input, conservative rounding, and dependency-driven reevaluation.

The included example receipt binds this source implementation and this runtime identity. On a different OS, architecture, Node version, or changed source tree, replay of that example is expected to refuse. Generate a new local receipt and replay that receipt to validate the local runtime. This does not establish cross-platform byte equivalence.

These checks validate the implemented decision behavior on synthetic cases. They do not establish institutional suitability, calibration, globally optimal allocation, production readiness, source authenticity, signed receipt authenticity, or local authorization to commit decisions.

Open local gates: static type checking with the approved toolchain; authenticated evidence adapters; policy mapping and mandatory-work profiles; representative intake validation; persistent revision control; concurrent capacity commit handling; permission enforcement; storage/signing design; and actual application integration.
