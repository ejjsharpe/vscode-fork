## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Extensions, terminals, tasks and debugging remain usable while inactive. Native services, events and resource ports stay bound to their authenticated project and lifetime.

## Acceptance criteria

- [ ] Demonstrate genuine extension-host commands, terminal heartbeat, task/debug progress and Git/workspace context continuing while their project is inactive, including hidden/minimized/occluded conditions where exercised.
- [x] Derive native authority from main-owned actual-sender, workbench, role, document and connection bindings; selection, caller IDs and generic handshake context cannot grant authority.
- [ ] Complete the relevant generic/direct service, event, reply and utility/shared/PTY/agent-host port adapters and downstream scopes, including agent-host restart/policy, without unrestricted cross-project access.
- [ ] Give replacement documents fresh main-owned generations; bind handles and asynchronous work to their originating authority, recheck before later effects/publication/delivery, and clean up late renderer-owned resources after expiry.
- [ ] Reject stale, foreign and unknown selectors or resources explicitly while valid current-owner controls work; tab switching and same-document activity do not revoke authority.
- [x] Add focused observable service/resource-ownership regressions and a bounded desktop progress check. Record the remaining native-boundary matrix under #35; existing authorization probes stay paused.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
