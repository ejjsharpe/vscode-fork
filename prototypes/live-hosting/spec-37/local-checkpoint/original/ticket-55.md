## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Links preserve supplied conversation identity and provider redirects. Draft links preserve occupied input and attachments, never send automatically, and retain intentional No Workspace semantics.

## Acceptance criteria

- [ ] Carry provider, session, exact chat when supplied, and workspace/environment context through conversation-link routing to the intended presentation.
- [ ] Resolve provider redirects through the owning provider; do not infer identity from provider URI formats or promise an exact chat from a session-only legacy link.
- [ ] Opening a draft link never sends and cannot overwrite an occupied draft or its attachments; preserve existing work while applying the accepted link behaviour.
- [ ] Omitting workspace from an agents/new link retains intentional No Workspace rather than adopting the active or last-used project.
- [ ] Exact-home opening follows normal tab reuse and safeguards; unavailable targets remain explicit rather than silently selecting a similar repository or environment.
- [ ] Add link-routing and occupied-draft regression cases, including provider redirects, session-only links and navigation before pending draft persistence, with no duplicate mutation.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
