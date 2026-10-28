## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

First launch opens real Agents in the shared shell, using distinct app-owned identity and storage without importing another editor's state.

## Acceptance criteria

- [x] Launch the real desktop app into the permanent Agents entry and shared shell using the retained BrowserWindow/WebContentsView candidate and the existing Agents interior.
- [x] Use distinct application/runtime identity and app-owned user data, preferences, extensions/shared storage and recovery state; do not read another installation's window records, backups or chat database as this app's state.
- [x] Opening an existing source folder remains permitted, and connected providers can discover their own history normally without a transcript importer.
- [x] Preserve main-owned authenticated bootstrap and the existing sandbox, preload, origin/frame and payload boundaries; shell and Agents have stable configuration ownership.
- [x] Verify first launch and repeat launch with isolated app-owned state and record checks showing other editor installations and development profiles remain untouched.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
