## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Startup preferences restore the permitted tabs, order, selection and recoverable edits—including untitled work. Explicit launch targets take priority, deliberately closed tabs stay closed, and ended work is not replayed.

## Acceptance criteria

- [ ] Persist and restore this app's permitted project set, order, selected view and recoverable presentation state, preserving exact workspace/environment/profile identities.
- [ ] Implement the accepted startup modes: preserve restores the saved set even with an explicit target; all restores on ordinary startup; folders restores folder/workspace tabs; one restores the previously selected view; none opens Agents without prior projects. Preserve existing explicit-launch behaviour for all/folders/one and always honour explicitly requested targets.
- [ ] Explicit launch targets receive selection priority; unknown saved selection falls back to Agents.
- [ ] No startup mode discards recoverable unsaved work, including untitled and empty workspaces. A deliberately closed project stays closed unless explicitly reopened, regardless of provider chat history.
- [ ] After restart/crash, reconnect only work that actually survived and identify interrupted work; do not restart ended terminals/tasks/debugging or replay agent actions.
- [ ] Keep unavailable saved targets identifiable without silently substituting another environment; the unavailable-home slice supplies the complete recovery interaction.
- [ ] Reuse restoration/lifecycle fixtures and add focused mode/selection/backup regressions plus bounded real restart checks with isolated app-owned state.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
