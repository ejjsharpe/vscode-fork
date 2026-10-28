# Lifecycle replies: sampled authorization passes; shared-host crash recovery fails

**Throwaway evidence. Stage 1 incomplete. Creator verdict review pending. No production merge.**

Decision: [Revalidate live workbench hosting after lifecycle reply authorization](https://github.com/ejjsharpe/escode/issues/27). All original gates and refinements remain required.

## Verdict

The foreign lifecycle cancellation reproduction now rejects without consuming the target's listener. Legitimate native Cancel and Save during reload work in the sampled case. However, crashing the multi-folder renderer and selecting **Reopen** destroys the shared BrowserWindow, leaving Agents and the other project without their native host and terminating their extension hosts. Stop at this required isolation/recovery failure. This does not establish full feasibility or disprove retained-view composition.

`crash-results.json` records distinct renderer PIDs before the crash, the target WebContents 4, interrupted completion wait and zero remaining callback listeners. After the actual native Reopen action, `recovery-state.json` records **zero BrowserWindows** while surviving Agents (WebContents 2) and single-folder project (3), crashed project (4), and a newly opened replacement (5) remain. `neighbour-extension-hosts.log` maps PID 4691 to Agents/logical workbench 100000 and PID 4759 to the other project/100001, and records both exits at recovery. Do not describe this as the renderer crash itself taking out all renderer processes: the observed wider damage followed recovery.

Source explains the recovery path: `CodeWindow.destroyWindow()` opens a replacement through `windowsMainService`, then `this._win?.destroy()` destroys the native window. In this adapter `_win` is the shared host, and `prototypeWorkbenchHost` still retains that host reference. Utility processes bound to native `closed` then terminate across logical workbenches. This source tracing supports, but is distinguished from, the runtime observations.

## Changed scope

The main-owned lifetime registry now emits document revocation; lifecycle waits own a document generation and random phase callback channels, validate sender/frame/current credential and window payload before consuming, and retire as interrupted on revocation. The isolated preload adds its main-issued document credential to lifecycle replies. Before-unload veto and will-unload joiners retain current access until authorized completion; `doUnload` revokes after final acknowledgement. Interrupted shutdown stops the pending action through the existing cancellation path and logs interruption; it does not manufacture approval or completion.

No renderer lifecycle logic, save handling, backup handling or shutdown joiners were replaced. `observe.js` wraps the actual wait only to capture its window/service and results. `phases.js`, `replacement.js` and `crash.js` deliberately suppress request delivery for **synthetic pending transport waits**, using real Electron sender messages/navigation/crash. They test wait ownership and retirement, not actual cleanup behavior. Actual UI reload/save/cancel are separate controls.

## Results

| Check | Status and evidence |
| --- | --- |
| Real host | Agents, single-folder and saved multi-folder workbenches rendered in retained views; screenshots inspected. All use fresh throwaway app-owned locations. |
| Foreign before-unload OK/cancel | Passed bounded reproduction. Foreign WebContents 3 sent the real pending channels with the target's logical ID. Target listener remained 1 before/after; rejection logs captured. `foreign-results.json`. |
| Guessed channels | Sampled foreign `ok0`/`reply0` did not consume the pending wait. Does not prove an exhaustive guessing or malformed-payload matrix. |
| Authorized native Cancel | Passed. Clicked Cancel in actual save dialog; main received `cancel`, same generation 4 stayed live and dirty editor remained. `authorized-cancel.json`. |
| Save during before-unload | Passed sampled real save. Native Save → in-app Save As wrote exact scratch bytes; own OK and will-unload completion arrived; generation became 5 and saved editor reappeared. `saved-file.json`, `authorized-save.json`, `saved-reloaded.png`. |
| Completion, wrong ID, duplicate | Passed bounded transport cases in both phases using real sender IPC; duplicate old callback did not settle a fresh wait. `phase-results.json`. |
| Unexpected document replacement | Pending before/will transport waits ended `interrupted`; listeners removed; an old completion could not affect a fresh wait. `phase-results.json`, `replacement-results.json`. |
| Crash during pending completion | Pending transport wait ended `interrupted`, listener removed. This is not actual save/backup interruption acceptance. `crash-results.json`. |
| Reopen after crash | **FAILED required invariant:** shared host destroyed and neighbours' extension hosts exited. `recovery-state.json`, `neighbour-extension-hosts.log`. |
| Direct Electron IPC | Source inventory captured in [DIRECT-IPC.md](DIRECT-IPC.md); remaining corrections/runtime checks unperformed after stop. |

## Reproduce

Runtime source is `df8a96ab0c2` on `prototype/lifecycle-reply-authorization`, based on `1c66e15dd53`. `build.json` captures source/build/OS; `recovery-state.json` captures full runtime versions (Electron 43.8.3, Node 24.22.0, arm64). Build Node is 24.22.1. Client typecheck and full `npm run build-fast` passed. The first full build hit sandbox EPERM creating a tsx socket; the unsandboxed retry passed. Dependencies/Electron were independent filesystem copies, and all client/extensions/Copilot outputs were rebuilt. No new dependency.

1. Check out the disposable branch. Use repository launch skill; build with `npm run build-fast`. Run `bash prototypes/live-hosting/run.sh` and **retain the parent terminal** (e.g. follow with `exec zsh -f` in a PTY). The initial launcher-only attempt lost its processes when the parent finished; its results are not used.
2. Use the returned ports/profile paths; never hardcode captured PIDs. Set `files.hotExit` to `off` only in the returned scratch profile. Attach a unique `npx @playwright/cli -s=NAME attach --cdp=http://127.0.0.1:PORT` session; select the visible multi-folder workbench, capture and inspect its rendered screenshot. Continue without sign-in for these Stage 1 checks.
3. Run `node prototypes/live-hosting/lifecycle-replies/inspect.mjs MAIN_PORT prototypes/live-hosting/lifecycle-replies/observe.js` before invoking reload. It only observes waits; import uses `createRequire` because inspector dynamic import lacks a callback.
4. A clean UI Developer: Reload Window captures authorized OK/completion. Then use `prepare.js` through Playwright `run-code --filename=...` to create actual dirty text (Command Palette: File: New Untitled Text File). The earlier Meta+N attempt opened a chat draft, not a text editor, and was not counted as a dirty-editor case. No chat was sent.
5. Invoke Developer: Reload Window (the previous `lifetime-revocation/request-reload.js` helper is reusable). With the native dirty prompt open, run `foreign.js` via `inspect.mjs`. Then click Cancel in that exact disposable app's native prompt. Capture `state.js`.
6. Request reload again, click Save, choose a scratch filename in Save As. Verify actual file bytes, both lifecycle results, new generation, and the rendered editor. Capture `state.js`.
7. Run `phases.js`, wait for the replacement workbench to render, then `replacement.js`. These are explicitly bounded transport tests, not a replacement for actual lifecycle checks.
8. Once the workbench is ready again, run `crash.js`. In the actual native crash prompt choose Reopen, leaving “Don't restore editors” unchecked. Run `recovery-state.js`. Observe the host count and correlate neighbouring extension-host starts/exits with their per-workbench logs. **Stop here on the failure.**
9. Cleanup only this isolated instance. Recorded cleanup uses `app.exit(0)` after evidence capture, not a successful graceful-close acceptance test; close only the named Playwright session. The scratch profile can be deleted after review.
10. `node prototypes/live-hosting/lifecycle-replies/check-evidence.mjs` checks consistency of captured observations, including the failure. It is not an independent full acceptance run.

## Unperformed and limits

No full Stage 1 pass. Not exercised: auxiliary replies; queued old-document credentials or transition spoofing; destruction during both phases; crash during actual before-unload; real pending save/backup failures and slow joiners; Hot Exit; full asynchronous resource/effect/event/port cancellation; provider-owned resource separation; direct IPC runtime inventory; complete extension-host lifecycle isolation; newly authorized provider attachment without competing ownership. Prior probes' successes are not inherited as passes.

Remaining original Stage 1 checks (profile/trust/storage isolation, shared settings, background terminals/tasks/debugging, menu routing, active/inactive close, host quit safeguards, restoration, CLI/opening/`--wait` compatibility) are unperformed. All Stage 2 exact-chat/tool/approval continuity and Stage 3 accessibility/IME/capacity/performance acceptance are unperformed. The narrow crash probe above does not stand in for Stage 3. No provider, Windows/Linux, SSH or Dev Container acceptance. Restricted mode stayed enabled; no provider sign-in or profile seeding occurred. Other-profile before/after auditing was not performed, so absence of intentional access is not an audit result.

Native save and crash dialogs were inspected via accessibility text; no native-dialog screenshot is claimed. The post-Reopen UI call timed out; the failure evidence comes independently from main-process enumeration and per-workbench logs. The candidate still has known incomplete direct IPC and host-coordinator adapters, described in the inventory. Correct these before their corresponding runtime gates.

Keep this decision open for creator verdict review and transfer the complete inherited gate to an explicit follow-up before closure. Production shipping and merging remain outside this map.
