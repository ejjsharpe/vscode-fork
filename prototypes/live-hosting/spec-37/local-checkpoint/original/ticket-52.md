## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Project Chats lists exact-home conversations and opens central chat editors. Go to project and Show in Agents preserve provider, session and selected-chat identity, including worktrees and mixed-home sessions.

## Acceptance criteria

- [ ] Provide Project Chats alongside Files and Source Control, listing only chats whose recorded exact home matches that project's workspace and environment.
- [ ] Selecting a chat opens/reveals a central chat editor beside file editors using the existing editor service and provider-neutral presentation contract.
- [ ] Carry provider, session resource, exact selected chat resource when supplied and home through navigation; resolve redirects with the owning provider rather than parsing provider URI formats.
- [ ] Go to project selects/reuses or opens the exact home and reveals that exact chat; a worktree chat reaches its worktree and mixed-home session navigation follows the selected chat.
- [ ] Show in Agents returns to the same provider-owned conversation. Navigation alone creates no conversation, persistent transcript, send or execution claim, and a session-only legacy reference does not promise an unidentified exact chat.
- [ ] Keep existing editor/Agents interiors and independent sidebar/editor context, provide useful path disambiguation and accessible controls, and preserve Workbench-to-Sessions layering direction.
- [ ] Test exact-chat reveal, overlapping workspace files, different environments, closed-home opening and both navigation directions through the existing handoff/editor test boundaries.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
