## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Discovery waits for metadata, preserves recorded homes and offers non-blocking Choose Project for ambiguity. Assignment keeps the existing conversation and survives weaker later metadata.

## Acceptance criteria

- [ ] Expose connected providers' existing history normally despite fresh app-owned state, without importing another editor's chat database.
- [ ] Preserve recorded homes and intentional No Workspace; wait while required metadata is loading instead of treating incomplete metadata as a settled home.
- [ ] Automatic association requires one exact home; folder containment, repository similarity and session membership cannot justify assignment.
- [ ] Missing or ambiguous ownership leaves the conversation accessible in Agents and offers non-blocking Choose Project when opened or project navigation is requested; do not introduce a startup bulk wizard.
- [ ] Choosing a home associates the existing conversation without copying, sending or claiming execution, and weaker later discovery cannot overwrite the explicit choice.
- [ ] Test loading-to-resolved, ambiguous, explicit-assignment and later-weaker-metadata flows through the existing provider-neutral service/presentation boundary; keep unavailable provider access recorded as unperformed.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
