# Marle — build the local intake decision system

From Bulma, for TJ · 16 September 2026

## Objective

TJ already built intake prioritization. Build the decision layer that uses that prioritized input to decide what enters delivery, what is rejected, what is deferred, and what needs evidence. The objective is to remove repeated intake-decision meetings by making the evidence, rules, blockers, and authority explicit.

Use this standalone COSMIC Lite edition as the starting kernel. Architect the real application against the environment you can inspect locally. Do not import the full COSMIC suite.

## First action

Read `README.md`, `docs/ARCHITECTURE.md`, `docs/CONTRACTS.md`, `src/contracts.ts`, and `docs/VALIDATION.md`. Run the included tests and synthetic example. Then inspect the existing prioritization application's actual ingress/egress schema and identify the narrow adapter point that preserves its priority order and stable IDs.

Produce `LOCAL-ADAPTER-MAP.md` recording verified source fields, source systems, evidence authorities, local policy ownership, capacity units, output integration, and the facts you could not establish. Keep that mapping and all real data inside the local environment.

## Established scope

- Ten modules: METEOR, COMET, ASTRAL, NEBULA, QUASAR, NOVA, ECLIPSE, PULSAR, AURORA, CHRONOS.
- Four business dispositions: BUILD, REJECT, DEFER, NEEDS_EVIDENCE.
- Existing priority rank is preserved. This is not a new prioritization exercise.
- All code here is standalone new implementation. The current full COSMIC repositories were not accessed, ported, or validated.
- The synthetic policy is illustrative. It is not institutional decision policy.
- JPMC integrations, deployment, persistence, UI, and local authority are for you to establish.

## Completed here

Runnable TypeScript source; strict runtime schema checks; dependency mapping; claim admission and time checks; uncertainty states; interval synthesis; conditional sensitivity arithmetic; delivery-window checks; adversarial scenario check; policy gate; atomic prerequisite admission; conservative team scheduling; JSON CLI; receipt hashing and replay; seven synthetic intakes; invariant tests; architecture and contract documentation.

Actual gate results and unverified limitations are in `docs/VALIDATION.md`. This package has no remote branch or commit; the archive manifest and source fingerprints identify these files. Do not invent COSMIC repo paths or commits for this handoff.

## Work to perform locally

1. **Map the current system.** Verify what ISR actually covers. Identify which decisions TJ owns, which are delegated, which require another authority, and which are automatic today. Preserve any relevant workflow functions beyond prioritization.
2. **Define supported work classes.** Start by separating discretionary work from obligations. Confirm value units, estimation standards, benefit horizon, dependency representation, team capacity, delivery calendars, and how existing commitments reduce capacity.
3. **Implement trusted adapters.** Authenticate source identities and issuer authority; verify source digests and revisions; admit claims only after the required source/review checks. Never trust a submitter or a model to populate `permitted=true` or an issuer name.
4. **Configure local decision policy.** Replace synthetic authorities and economics. Every hard rejection needs a rule and authority. Unknown controls remain unknown. Unsupported work classes should route to evidence/review without being economically rejected.
5. **Extend contracts where reality requires it.** Add mandatory-work routing, multiple control facts, reuse evidence, multi-team effort, calendars, supersession, and external dependencies as needed. Version semantic changes. Prefer a smaller correct profile over pretending every intake fits v1.
6. **Build the service and persistence.** Preserve immutable input/policy/evidence revisions, decision receipts, exceptions, and commits. Authorize endpoints; select policy server-side; require expected revisions for portfolio commits. Recompute when capacity or dependencies change.
7. **Build the product flow.** Decision desk, case file, portfolio window. Make evidence questions precise and owned. Make assumptions and reopening conditions visible. The UI should lead with the decision and reason; engine internals belong in an optional trace view.
8. **Validate against real local decisions.** Include contested cases, missing evidence, changed policy, overlapping dependencies, scarce capacity, and mandatory obligations. Compare outcomes with the current workflow and investigate disagreements rather than optimizing for agreement alone.
9. **Wire execution authority.** Automatically commit only where local policy authorizes it. Route other decisions to the actual accountable role. Record exceptions alongside original machine receipts.

## Nonnegotiable reasoning invariants

- A claim carries its exact subject, evidence identity, authority, time scope, and limits.
- UNKNOWN cannot become another module's proof. CONFLICT is not averaged away.
- An estimate is not a fact about what will actually happen. NOVA Lite's scenario is conditional.
- Missing evidence is not a negative finding. Capacity failure is not a rejection of merit.
- Rejection needs an admitted disqualifier and explicit policy.
- Dependency bundles consume capacity atomically, and shared prerequisites are not double charged.
- Policy, evidence, source, runtime, time, and capacity changes invalidate old replay/admission assumptions.
- Keep the original receipt when a person overrides a decision.
- A digest is not a signature, and an issuer string is not authentication.
- A required engine failure yields an incomplete evaluation, never a cached or fabricated approval.

## Source-preservation boundary

Work in an isolated local project or branch appropriate to the existing application. Preserve existing prioritization code and history. Bring over only this Lite archive and local integration work; do not mount or copy parent COSMIC repositories, full engine internals, unrelated packages, credentials, or research artifacts. Avoid adding full-suite dependencies while resolving imports. The Lite module names are sufficient conceptual reference.

## Decisions you must establish from local evidence

| Question | Why it matters |
|---|---|
| Who may attest policy eligibility and validity of need? | Defines admissible support for BUILD/REJECT |
| Is the prior priority order strict, or may smaller lower-ranked work fill unused capacity? | Selects allocation behavior; reference permits backfill |
| Which requests are mandatory, and who proves that status? | Prevents discretionary economics from rejecting obligations |
| What counts as a duplicate or acceptable reuse? | Prevents superficial matches from closing legitimate demand |
| Does capacity represent people-days, team-days, sprint points, or money? | Prevents dimensionally invalid portfolio decisions |
| What policy and source revision must be current at commit? | Prevents stale admission and double reservation |
| What exact evidence makes a rejection final or reopenable? | Defines closure and appeal behavior |
| What platform and toolchain are actually available? | Determines adapter, persistence, UI, and build choices |

Resolve what you can by inspecting authoritative local sources. Ask TJ only for decisions or information that cannot be established from those sources. Do not require TJ to mediate routine code work.

## Acceptance gates before operative use

- Existing prioritization identity and order survive the adapter unchanged.
- Runtime tests and local static type checking pass using the approved toolchain.
- An unauthenticated client cannot set authority, operative policy, or admitted evidence.
- Changes to evidence, policies, source/runtime, time, dependencies, and capacity produce new evaluations.
- Real representative intake classes have explicit supported profiles; unsupported classes are visible.
- Local controls are represented by admitted evidence, not a synthetic default eligibility flag.
- Concurrent commits cannot reserve the same capacity twice.
- Reject decisions cite the actual authorized disqualifier; uncertainty and capacity do not masquerade as rejection.
- Receipts and exception events are stored with local access controls and immutable revision semantics.
- Delivery admission is connected only to the local authority actually granted.
- The deployed artifact contains only the Lite core and intended local integration dependencies.

## Return to TJ

Provide the local architecture and adapter map, implemented versus proposed functionality, tested decisions and disagreements, exact local repo/branch/commit or artifact identity, commands and gate results, unresolved decisions, and the next concrete action. Distinguish verified source facts from assumptions.

**Build a system where the next action follows from the evidence. Keep the full COSMIC suite out of the implementation.**
