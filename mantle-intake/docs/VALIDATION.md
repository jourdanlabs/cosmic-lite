# Validation and source preservation

Executed in the preparation environment on 16 September 2026, Node 24.19.0 / Linux x64.

## New intake module

`node --test test/*.test.mjs`: **29 passed, 0 failed, 0 skipped**. Full output: `TEST-OUTPUT.txt`.

25 new tests exercise discovery without approval; controlled signatures; blank/omitted/absent/unmapped/invalid separation; explicit false mapping; preserved overdue dates and priority; coverage denominators; ordinal semantics; missing/future/overlapping meanings; expired treaties; source-schema drift; missing and changed approvals; changed source/mapping/meaning; revoked and wrong-purpose signers; edited output; stable replay and input preservation; unsupported transforms; malformed inputs; future source knowledge; per-record claim scope; empty populations; and exact target coverage.

Four original kernel tests run with import paths adjusted to the copied directory. The kernel source files themselves are unchanged. An initial packaging test found that the original kernel test additionally imports `frozen.mjs`; that sixth kernel file was included unchanged, then all 29 tests passed.

`node examples/run.mjs` successfully generated discovery and controlled outputs and replay-checked context using an in-memory synthetic Ed25519 key. `examples/demo-output.json` records that run and is synthetic only. This is not local policy or production authority.

## Original MANTLE suite

`node --test tests/kernel.test.mjs tests/semantic.test.mjs tests/semantic-full-v1.test.mjs` against the untouched uploaded source: **9 passed, 10 failed**. The ten failures reach `ERR_MODULE_NOT_FOUND` for the vendored `node_modules/tsx/dist/loader.mjs`. Full output: `UPSTREAM-TEST-OUTPUT.txt`.

The upload explicitly excluded node_modules. Dependencies were not substituted, downloaded, or bypassed to manufacture a green original gate. The full STRATA execution and checkpoint lifecycle have not been reverified here.

## Supplied baseline file hashes

These are direct hashes of the supplied artifacts, not fresh execution claims:

| Case | Bytes | SHA-256 |
|---|---:|---|
| certified | 5094 | f50ee511e3975cf89ecf6f4cb8e0e0343037ec2e81296f86eb40606c9c3ebbe3 |
| refused | 3833 | 6ede6a89bb6b0b863b01e8abd4aebee3fc7f8b176798b8af1b70b1991bb451b2 |
| unapproved | 3854 | 19d9e0e459249799aa78f0cc8cc633bb4726aa693b8b8df368c0ba783033d02a |

All match the supplied handoff. No after-extraction byte-identity claim is made, because this module has a deliberately new input/output contract and does not invoke the original numeric stack.

## Upstream source check

The ten files under `upstream/` were compared byte-for-byte against `git show 34684bcb527d0cfc83911c7b62d37ac1b3abfb3a:<source path>` from the supplied Git bundle. All match. See `UPSTREAM-PROVENANCE.json`.

Included: six kernel files (canonical, receipt, temporal, gate, evidence, frozen) and four semantic files (palimpsest, dialectic, cairn, authority). The extra frozen file is needed by the original kernel tests. Source authorship is preserved; no relicense is asserted.

Excluded: the full STRATA clone, other foundry engines, all existing application data, deployment outputs, original Git history bundle, web/MCP/desktop proving-room surfaces, existing keys, workspace store/checkpoint services, and portfolio-release tooling.

## Not established

Live Jira integration, actual custom-field identities and population rates, institutional signer authority, real business policies, source historical correctness/freshness, operational authorization, capacity feasibility, signed output issuance, append-only persistence, independent checkpoint operation, workload performance, and the proving-room 16-check protocol are not verified by these synthetic tests.
