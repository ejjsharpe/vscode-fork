## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Waiting ends when the requested files/workbench condition completes, independently of tab switching, unrelated project closure or the persistent shell.

## Acceptance criteria

- [ ] Associate each CLI wait request with its relevant file/editing work or logical workbench completion condition, preserving existing file, diff and merge semantics.
- [ ] Switching to another project or Agents, closing an unrelated project, or keeping the shared shell alive neither completes the wait early nor keeps it pending after the relevant work is finished.
- [ ] Cancelled, interrupted or failed Close/reload cannot falsely report the relevant work as completed.
- [ ] Clean up the wait marker/registration once at the correct completion boundary, without duplicate notifications or leaked waits.
- [ ] Exercise CLI waits with two independent project tabs through the real desktop process, backed by focused tests of relevant versus unrelated lifecycle outcomes.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
