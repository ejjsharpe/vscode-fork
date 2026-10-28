## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Single-folder and saved multi-folder projects open, reuse exact workspace/environment matches, retain editing context, and support ordering, scrolling and path disambiguation.

## Acceptance criteria

- [ ] Open one real single-folder and one saved multi-folder workspace beside Agents, each with independent workspace configuration/storage/trust, profile, extensions and editor context.
- [ ] Identify single-folder projects by exact folder plus environment and saved multi-folder projects by exact workspace file plus environment; overlapping folders, distinct workspace files, worktrees and local/SSH/Dev Container authorities remain distinct.
- [ ] Repeated exact-target requests activate the existing tab, choosing its most recently active exact match if duplicates already exist; new projects append on the right.
- [ ] Switching changes selection, bounds, visibility and focus without recreating or suspending a workbench; dirty editors, layout, sidebar context and focus history remain intact.
- [ ] Support drag reordering, path disambiguation and independently scrolling project/editor strips while Agents remains accessible; hidden views cannot receive keyboard or accessibility interaction.
- [ ] Exercise repeated project-to-Agents-to-project switching and exact-target reuse through the real desktop boundary, with focused identity/service regressions for ambiguous names and overlapping workspaces.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
