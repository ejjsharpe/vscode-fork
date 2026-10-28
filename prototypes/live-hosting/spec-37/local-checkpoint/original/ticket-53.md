## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Drafts, attachments, model choice, reading position, streaming and approvals survive rapid switching, including before draft persistence. Both surfaces send, cancel and approve through the same authority without duplication.

## Acceptance criteria

- [ ] Agents and the project's chat editor project the same provider/session/exact-chat identity and provider-owned transcript/execution state without a competing persistent store.
- [ ] Preserve unsent input, attachments, model choice and reading position across repeated cross-renderer switches, including a switch before a debounced draft write completes.
- [ ] Streaming and pending approvals remain current and operable from either presentation; presentation attachment/detachment does not restart a run or claim execution.
- [ ] Sequential sends, cancellation and approval responses from either surface reach the same authoritative owner; navigation/recovery cannot duplicate a send, tool execution or approval response.
- [ ] Reuse the existing provider registry, model-management, visible-session and observable responsibilities rather than replacing the Sessions architecture.
- [ ] Add deterministic state/handoff regressions and specify counted send/approval/tool controls for real provider validation under #35. Record deferred provider work as unperformed; mocked presentation tests are not provider-continuity proof.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
