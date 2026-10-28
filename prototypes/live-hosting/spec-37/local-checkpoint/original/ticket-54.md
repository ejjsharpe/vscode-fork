## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Tools, client connections and approval observation remain operable in Agents after home-project Close/reload. The project workbench is released, permissions stay bounded, and reopening returns to the same conversation.

## Acceptance criteria

- [ ] Before project teardown, the persistent owner retains or acquires the active conversation's necessary tools/client connections and approval observation under existing permissions.
- [ ] Actual home-project Close/reload releases that project's workbench and resources while the same provider-owned run and pending approval remain usable from Agents.
- [ ] Do not satisfy continuity by retaining the whole closed workbench, leaving a backend without its executor/observer, broadening trust/permissions or creating a new execution owner.
- [ ] Reopening selects the exact home and chat, reconnecting to the surviving run without replaying sends, tools, approvals or execution claims.
- [ ] Account explicitly for execution-owner loss: app/host/provider loss is distinct from project presentation teardown, and interrupted work must not be represented as still running.
- [ ] Provide focused ownership-transfer/teardown regressions and hand off the counted real Agent Host client-tool/approval Close/reload scenario to #35. Extension-backed Copilot Cloud remains separate coverage; provider work/sign-in stays deferred until separately authorized.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
