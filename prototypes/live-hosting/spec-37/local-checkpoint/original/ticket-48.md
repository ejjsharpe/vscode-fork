## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Workspace, shared-profile and application settings retain their scopes. An existing exact workspace requested with another profile reuses its tab, with project-only safeguards and cancellation preserving the original profile.

## Acceptance criteria

- [ ] Preserve each project's workspace-associated profile, settings, extensions and theme while the shell and Agents keep stable profiles/themes.
- [ ] Workspace settings remain workspace-local; profile-scoped changes propagate to projects sharing that profile; application settings retain their existing global scope.
- [ ] An explicit request for profile B on an exact workspace/environment already open under profile A reuses that tab and honours profile B through project-scoped safeguards.
- [ ] Any required profile reload affects only that project and preserves independent provider execution permissions/lifetimes; healthy neighbours and shell/Agents are unchanged.
- [ ] Cancellation preserves the original tab and profile and reports the request incomplete, without ignoring the requested profile, opening a duplicate or queuing an automatic retry.
- [ ] Cover shared-profile propagation and explicit-profile reuse success/cancellation using focused service tests and a bounded desktop scenario tied to the approved profile clarification.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
