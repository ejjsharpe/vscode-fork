## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Missing folders, workspace files, worktrees and unavailable environments remain identifiable with appropriate recovery actions. Conversations and backups remain accessible; replacement targets require explicit reassignment.

## Acceptance criteria

- [ ] Keep an unavailable saved project/home identifiable with Retry and Close while healthy projects and its conversation in Agents remain usable.
- [ ] Offer reconnect/sign-in for unavailable remote environments and Locate/Restore for missing folders, workspace files or worktrees where supported; actual provider sign-in remains deferred.
- [ ] Preserve backups and the exact saved target; do not substitute a local copy, similar repository, main checkout or another environment.
- [ ] Changing to a replacement workspace/environment requires explicit reassignment of the existing conversation, with no copy, resend or approval replay.
- [ ] Retry respects existing recovery ownership, current authority and Close precedence; repeated or late results cannot create duplicate views or resurrect closed projects.
- [ ] Cover missing folder/workspace/worktree and unavailable-environment outcomes with focused recovery/navigation tests and bounded local scenarios; distinguish synthetic authority tests from actual remote support and do not promise reconstruction of a deleted worktree.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
