# Spec #37 partial checkpoint — 28 October 2026

Orchestration stopped at the user's request. Continue one ticket at a time in fresh `/implement` chats. No implementation worker remains active, no newly unblocked ticket was started, and `explore_native` has handed off and will not be resumed.

Integration branch: `integration/spec-37-complete`. Final source commit: [`403375db5f1794d95849d795ceecbf8553d2dfdb`](https://github.com/ejjsharpe/escode/commit/403375db5f1794d95849d795ceecbf8553d2dfdb). [PR #60](https://github.com/ejjsharpe/escode/pull/60) remains draft. Documentation commits after that source commit change no implementation. No production merge is authorized.

## Ticket state and next chat

Only [#38 — Launch the standalone shared shell](https://github.com/ejjsharpe/escode/issues/38) is complete within its bounded ticket scope. [Spec #37](https://github.com/ejjsharpe/escode/issues/37) and #39–#57 remain open. Source integration is not ticket completion or full runtime acceptance.

| Ticket | Preserved work | Remaining work |
| --- | --- | --- |
| [#38](https://github.com/ejjsharpe/escode/issues/38) | Standalone identity/storage; merge `934cea8e878`; current-source first/repeat launch passed | Full staged acceptance remains #35, outside this bounded ticket |
| [#39](https://github.com/ejjsharpe/escode/issues/39) | Exact folder/workspace/environment matching, MRU reuse, retained project tabs; merge `cf36c4a7d2b`; hidden-view repair in #41 | Current-source native exact-reuse, drag/overflow/path-disambiguation and interaction verification |
| [#40](https://github.com/ejjsharpe/escode/issues/40) | Native/shared/utility/PTY/connector scopes; owned profiling including hung extension host; guarded terminal-host restart; Agents workspace identity fix; browser replay fix | Repaired browser GET/render/hidden native subtree rerun; valid-control/native matrix; IPC teardown review finding; minimized/occluded state not established; all other unmet acceptance criteria |
| [#41](https://github.com/ejjsharpe/escode/issues/41) | Selected logical command routing, native callbacks/dialog guards, auxiliary ownership, selected-only view attachment; merge `52f6f8033eeb` | Remaining selected-command/native-control matrix, real auxiliary/dialog UX, keyboard/IME/assistive-technology coverage |
| [#50](https://github.com/ejjsharpe/escode/issues/50) | Agent Host durable exact homes, null/unresolved distinction, deliberate reassignment; merge `8277cf17bf3` | Extension-backed owners lack durable home hooks; project-side presentation still requires #52 broker; protocol metadata reader standards finding |
| [#51](https://github.com/ejjsharpe/escode/issues/51) | Conservative discovery, loading-aware Choose Project, durable assignment/cache; merge `546c7fe98a5` | Same-chat prompt cannot be offered again after dismissal/picker cancellation; extension-backed assignment gap; native/provider validation unperformed |
| [#42](https://github.com/ejjsharpe/escode/issues/42) | [Read-only source/caller/test plan](ticket-42-read-only-plan.md); no source implementation | Entire ticket, after #40 and #41 are complete |
| #43–#49, #52–#57 | Existing baseline and original ticket definitions preserved | No new implementation in this orchestration; follow native GitHub dependencies |

The next unblocked ticket is [#39 — Open and switch independent project tabs](https://github.com/ejjsharpe/escode/issues/39), after #38 closes. Later source slices were explored/integrated before all their prerequisites' runtime criteria were established; that does not remove dependency edges or make the later tickets complete.

## Verification and its limits

- At source `403375db5f1794d95849d795ceecbf8553d2dfdb`: full client typecheck, client fast build and whitespace checks pass. See [typecheck](typecheck-final.log) and [build](build-final.log).
- The existing first/repeat startup batch was rerun with fresh isolated app-owned state at that exact source. Both launches had real Agents, a selected permanent Agents control, zero project tabs and one native BrowserWindow; both test mains exited. [Evidence](startup-results.json). The observed existence/mtime of the listed foreign profile directories was unchanged. This is limited metadata observation, not a complete filesystem/read audit. Provider history/sign-in was not exercised.
- At earlier combined source `1ce038f7de9edbee2133ac100f032034e0c463cc`, a scratch extension command started a real terminal, configured task and Node debugger through normal extension APIs. With Agents selected and both project views detached from the native host, extension/terminal/task/debug counters advanced respectively `90→130`, `69→109`, `70→110`, `70→110` over 40 seconds. The built-in Git extension observed the correct scratch workspace's file changes while inactive. [Evidence](native40-progress.json). This is bounded progress evidence at that source, not a current-source full #40 pass.
- The native browser failed at `1ce038`: optimistic URL/title, blank content and no loopback GET. `4943ba1e163` repairs dropped synchronous initial event replay; merged at `403375`. [19 browser tests pass](browser-snapshot-tests.log), including initial replay and later stale-event rejection. Its actual GET/render/native AX rerun was not performed before stopping. Earlier fixture and runtime failures remain recorded in [attempt 1](native40-attempt-1.json) and [attempt 2](native40-attempt-2.json).
- Earlier native menu/dirty editor/AX checks at `52f6f8033eeb` and all per-slice service checks remain historical evidence. Their exact sources, failures, repairs and unperformed checks are preserved in the ticket handoffs. Counts overlap and must not be summed. Historical samples at different commits are not a combined current-source pass.
- The scratch app and loopback server were stopped. No surviving verified scratch heartbeat process required an additional kill. No graceful multi-project app-quit pass is claimed. Minimized state was not established; no minimized/occluded progress pass is claimed.

## Read-only checkpoint review

Review range: PR base `ec9a1750b4d8b1a8a0ff7de7e722f69c6e1c32e3...403375db5f1794d95849d795ceecbf8553d2dfdb`. Findings were recorded without beginning another repair cycle.

- **Standards:** [report](review-standards.md): IPC server listener/emitter teardown ownership (#40); protocol metadata reader placement (#50); connector lease lifecycle duplication (judgment, #40).
- **Spec:** [report](review-spec.md): Choose Project retry/dismissal defect (#51), missing extension-backed home support (#50/#51), intentionally unfinished ticket work and current-source runtime gaps.

## Preserved handoffs and cleanup

Native #40 ended at clean branch tip `46648985942be15e1da2d581b4b373cdcabe8b69`; its bounded browser patch is integrated. Main milestones are `cf8487873be`, `25f486841b4`, `1c01da8a487`, `2f4bad9cf5d`, `4943ba1e163`. Shared/profiling implementation is `066683cf006`; connectors are `4b4aa044f0b` and `1f65ad1a5e0`; registration wiring is `501a4ae5887`; fixture typing repair is `1ce038f7de9`. All are reachable from integration.

Handoffs: [#38](ticket-38-handoff.md), [#39](ticket-39-handoff.md), [#40 native](ticket-40-handoff.md), [#40 shared/profiling](ticket-40-shared-handoff.md), [#40 connectors](ticket-40-connectors-handoff.md), [#41](ticket-41-handoff.md), [#50](ticket-50-handoff.md), [#51](ticket-51-handoff.md). These retain historical wording and local log pointers; this checkpoint supersedes any suggestion in them to continue orchestration or resume a worker.

All own child worktrees were inspected clean before cleanup. No unfinished source changes require a retained child checkout. Implementation branches and commits are retained; the integration checkout remains available. Local raw logs, scratch fixture files, launch records and the orchestration journal remain under `/Users/elliotsharpe/Documents/Codex/2026-10-28/new-chat-10/work`. Unrelated prior-chat worktrees are untouched. See [manifest](manifest.json).

Provider work/sign-in remains deferred; authorization probes remain paused. Actual remote/provider execution, Windows/Linux, full native UX/capacity/lifecycle matrix, independent-agent active tool/approval continuity, and [#35's staged acceptance and separate creator verdict](https://github.com/ejjsharpe/escode/issues/35) remain unperformed or incomplete. Exact home identity grants no tool or trust permission. Do not lift these restrictions in a continuation without authorization.
