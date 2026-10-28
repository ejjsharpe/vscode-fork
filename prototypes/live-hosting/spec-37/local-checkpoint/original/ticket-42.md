## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Project Close/reload honours saves, backups, active-work confirmation and cancellation; completes real cleanup; reports interruption or failure accurately; and applies the agreed neighbour-selection rules.

## Acceptance criteria

- [ ] Expose project-tab Close separately from whole-window Close; reload affects only the selected project, leaving the host, Agents and healthy neighbours usable.
- [ ] Use real Save/Don't Save/Cancel, Hot Exit/backups, terminal/task/debug confirmation and unload joiners. Failed save/backup or a genuine veto prevents destructive teardown and preserves recoverable state.
- [ ] Accept lifecycle replies only from the exact authenticated current document for the pending operation and phase. Invalid replies leave the legitimate wait intact; outgoing authority remains usable through cleanup and is revoked after valid final acknowledgement.
- [ ] Treat readiness as the exact current document's ability to receive safeguards. Not-ready startup/replacement or a crash during permission/cleanup reports interruption promptly and never grants implicit permission or triggers an automatic retry.
- [ ] Complete actual view/resource teardown, registry/count/listener/restoration cleanup, routing repair and logical-close notification before reporting success. Preserve distinct completed, cancelled, interrupted and cleanup-failed outcomes, including already-destroyed resources and safe remaining bookkeeping.
- [ ] Closing the active tab selects its right neighbour, then left, then Agents; closing an inactive tab preserves selection, and final-project Close leaves Agents usable. Reopen recoverable editors/layout without restarting ended work.
- [ ] Add focused regressions and bounded real save/cancel/backup/cleanup checks. Preserve the independent-agent contract; full active tool/approval continuity is completed and evidenced in its dedicated approved slice and #35, not inferred from idle-project Close.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
