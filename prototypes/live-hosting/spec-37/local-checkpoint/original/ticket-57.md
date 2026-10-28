## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Project indicators and aggregate Agents attention expose approvals, failures and completions—including closed-home chats—without stealing focus. Routine output remains local.

## Acceptance criteria

- [ ] Show project-scoped attention on the relevant project tab and aggregate agent attention on the permanent Agents entry, including conversations whose home project is closed.
- [ ] Represent approval requests, failures and completions distinctly; completion alone is a quiet indicator and normal background output stays in its project/chat.
- [ ] Reserve pop-ups for actionable requests or failures under the accepted interaction rules; background updates never select a tab or steal keyboard focus.
- [ ] Following an attention indicator reaches the owning exact project/chat through the established routing and unavailable-home behaviour.
- [ ] Expose accessible names/states and usable keyboard interaction without making hidden workbenches keyboard or accessibility targets.
- [ ] Test background updates, closed-home chat attention, acknowledgement and navigation through existing presentation tests, plus a bounded native focus check. Capacity and full native usability acceptance remain in #35.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
