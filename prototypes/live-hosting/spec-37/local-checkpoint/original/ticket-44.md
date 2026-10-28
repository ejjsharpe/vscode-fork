## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Retry replaces only the failed project, preserving its exact workspace, environment and profile. Old authority is retired; failed replacements remain identifiable with Retry and Close.

## Acceptance criteria

- [ ] Keep a crashed or unavailable project identifiable while Agents and healthy projects remain usable; offer explicit Retry and Close.
- [ ] Recover the exact workspace/environment/profile with at most one replacement in progress, retiring old registrations, listeners, subscriptions and renderer-owned resources.
- [ ] Assign the replacement fresh main-owned document/connection authority. Old callbacks, replies, readiness and resource handles cannot complete or gain authority over the replacement.
- [ ] Restore recoverable editors/layout and reconnect only work that actually survived; identify interrupted work without replaying commands, sends or approvals.
- [ ] A failed replacement remains actionable without an automatic whole-window restart fallback or intentional teardown of healthy neighbours.
- [ ] Verify project crash/replacement failure, retry deduplication, exact-target restoration and stale-owner rejection using focused tests plus bounded desktop evidence; distinguish actual process/owner loss from intended recovery scope.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
