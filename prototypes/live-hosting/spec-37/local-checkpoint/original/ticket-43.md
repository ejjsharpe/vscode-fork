## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Host shutdown collects visible safeguards from all relevant owners, respects cancellation, and destroys the shared host only after required cleanup.

## Acceptance criteria

- [ ] Route the ordinary Close Window command, native close button and app quit through the shared host coordinator; only that coordinator intentionally destroys the native host.
- [ ] Collect safeguards from every hosted workbench and the persistent agent owner, making the owning confirmation visible before requesting its decision.
- [ ] A genuine cancellation keeps surviving workbenches and recoverable edits usable; completed save effects remain real and are not described as rolled back.
- [ ] After permission, await required cleanup and propagate genuine cancellation, interruption or cleanup failure without fabricating completion; do not destroy the host while required cleanup is incomplete.
- [ ] Exercise a terminal confirmation, saving one project then cancelling at another, and a later explicit successful attempt through real desktop commands. Verify actual cleanup rather than equating native-window disappearance with every resource having been released.
- [ ] Record interrupted/local execution truthfully after app or owner loss; do not promise local agent survival after app quit. Recovery/Close overlaps are covered by the dedicated arbitration slice.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
