## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

New Window, Reuse Window, Open Agents and explicit workspace requests follow the accepted tab rules, preserving remote targets, file locations and diff/merge arguments. Extension-development exceptions remain separate.

## Acceptance criteria

- [ ] Route ordinary folder/workspace opening into the shared shell; New Window creates a project tab, an untargeted request creates an empty tab, and an exact existing target reuses its tab.
- [ ] Reuse Window sends file operations to the active project; explicit workspace requests select/open that exact target without replacing an unrelated project. Open Agents selects Agents.
- [ ] Preserve explicit remote authority and profile arguments, file and line/column destinations, and diff/merge arguments through every relevant entry point; do not substitute a similar workspace.
- [ ] Keep extension-development host windows separate as required by the accepted contract.
- [ ] Opening/reload callers respect interrupted or failed permission/cleanup and cannot proceed with unsafe replacement. The explicit-profile-change slice completes the accepted different-profile reuse behaviour.
- [ ] Add focused opening/argument-routing regressions and bounded desktop checks covering single-folder, saved multi-folder, empty and exact-reuse requests; list unavailable remote combinations explicitly.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
