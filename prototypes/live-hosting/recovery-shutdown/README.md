# Recovery/shutdown arbitration: Close is retained, logical disposal fails

**Disposable experiment. Stage 1 failed/incomplete. Creator verdict pending. No production merge.**

Decision: [Revalidate live workbench hosting after recovery and shutdown arbitration](https://github.com/ejjsharpe/escode/issues/29). The original staged gate and every refinement remain mandatory.

## Verdict for live review

The baseline reproduces the dropped Close. The new candidate remembers Close, coalesces repeated requests and cancels pending recovery. After host shutdown cancels, it destroys the target view, but **logical project disposal fails**. The main process throws while removing an already-destroyed view; the tab registry and lifecycle count retain the dead project. Its `webContents` getter then falls back to the shared shell. The shell shows a stale project link with “Close cancelled / Retry / Close” and initially has a blank content area.

The same outcome occurred in a fresh second run of the candidate. Stop at this required invariant. This is neither a dropped Close nor a resurrected closed tab: it is partial physical teardown with a stale logical identity. The host and neighbouring renderer identities survived; full surviving-resource usability and provider continuity are not established.

Recommend retaining the candidate for a narrow logical-disposal/identity refinement and rerunning the complete staged gate. No Stage 1 or feasibility pass is recorded. The creator must review this scoped failed-experiment verdict separately from any design decision.

## Exact source and runtime

Runtime source: `5d4b3e65bd3180b406c67b561a9ab4d2fd098c76`, on `prototype/recovery-shutdown-arbitration`. Baseline: `4766334b1ae2007d28c8a4ca033c203ae4dd17a2`. Evidence and documentation are committed after that runtime checkpoint without further product changes.

macOS 26.3.1 (25D2128), arm64; Electron 43.8.3, runtime Node 24.22.0; build/inspector Node 24.22.1. `platform.json`, `startup.json`, the snapshots and `compiled-hashes.json` record source/platform/runtime/output identity.

An independent APFS copy of the preceding disposable checkout supplied source, dependencies, Electron and compiled extension outputs. No symlinked dependencies. Changed client outputs were rebuilt with `npm run build-fast -- --client-only`; unchanged extension/Copilot outputs were reused. The final client typecheck passed. `git diff --check`, the saved-evidence self-check and the UI detector passed. No dependencies or production changes were added. These checks do not establish runtime correctness.

All three launches (baseline, candidate, confirmation) used the launch skill and fresh app-owned user-data/extensions/shared-data directories with a nonexistent scratch source profile. No sign-in or old profile import. Normal-profile before/after hashing was not performed, so a comprehensive untouched-profile audit is not claimed. Startup logs begin with Agents; the launcher subsequently opens the single-folder and saved multi-folder scratch workspaces, selecting those explicit targets. Full startup-preference/restoration behavior is unperformed.

## Changes under test

The existing lifecycle service now retains one pending Close per logical project. The existing CodeWindow recovery serial and a standard cancellation token cancel recovery continuations; retired replacement documents cannot bootstrap authority again. The shell and native recovery Close path reach the same service while the host is busy. Healthy outgoing-document access is kept through lifecycle cleanup. The host coordinator records completed cleanup so a pending project Close can avoid repeating those joiners, and exposes interrupted workbenches as failed.

The interface and its single implementing test fixture were updated. No general recovery framework, provider-specific logic, automatic retries or new subsystem. These are candidate changes under test. Successful host shutdown, partial-cleanup interruption, close veto, already-created replacement races, visible shell Close and native recovery Close remain unvalidated in this run.

## Evidence

| Check | Result |
| --- | --- |
| Baseline reported race | Reproduced: `baseline-race.json` records one delayed validation, overlapping host shutdown/recovery, ignored Close and a replacement after host cancellation. |
| Fresh candidate hosting | `startup.json`: one BrowserWindow, real Agents/single-folder/multi-folder documents, distinct logical IDs and current main-owned generations. Switching did not change generations. |
| Caller/target checks | `caller-results.txt`: 18 rejections and six authorized native calls, including claimed Agents/shared roles and nested targets. Diagnostic clients replace ordinary renderer IPC; reloads restored it afterward. |
| Document/connection stale handles | `stale-create.txt`, `stale-check.txt`, `connection-results.txt`: old extension-host handles explicitly rejected after actual reload and reconnect; fresh authorized control returned false for an unstarted scratch host. No inspector was enabled. |
| Worker-port control | `connection-results.txt`: foreign worker target rejected; own scratch worker delivered one port and terminated with code 0 after disposal. Not a delayed-port or provider-continuity matrix. |
| Authorized lifecycle reload | `authorized-reload.txt` and `before.json` contain a real Developer: Reload Window and authorized before/will acknowledgements. An initial UI command timed out before renderer/onboarding settled; the successful retry is the recorded control. |
| Reply ownership | `phases.json`: foreign/wrong-ID replies leave the actual phase listener; authorized replies settle; duplicate old callbacks do not settle the next wait. `replacement.json`: replacement interrupts waits/removes listeners; an old completion cannot settle the new operation. Harness-driven phase requests are transport controls, not real dirty save/backup/joiner acceptance. |
| Retain Close and cancel preparation | `close-race.json`: `pending: true`, `cancelledRecovery: true`, one validation, repeated Close returns the same pending promise. Late validation does not start recovery. These are sampled assertions inside an overall failing test. |
| Logical removal | **FAILED.** `race-state.json` and `repeat-state.json`: one host, two child views, three registered logical workbenches; dead logical project 100002 reports shell WebContents 1 and `unregistered:1`. Pending Close has been cleared despite unsuccessful logical disposal. |
| Persistence/repeat | `race-state.json` captures the state after the failing assertion, excluding a merely premature observation. `repeat-state.json` independently repeats it with all three initial workbenches ready (`repeat-setup.json`). |
| User-visible state | `failed-shell.png` is a renderer screenshot. Exact-path native inspection separately found the blank composed content area and stale Close-cancelled project. Selecting Project 1 showed its existing workbench, with onboarding and a “Closing the window is taking a bit longer” status. Full usability is not claimed. |
| Cleanup | `cleanup.json`, `repeat-cleanup.json`: only disposable instances exited via `app.exit(0)`. Forced cleanup is not a graceful-shutdown acceptance result. |

## Failure mechanism

The race harness forces a replacement bootstrap exception, holds Retry's workspace validation, invokes native host close, and pauses its continuation **after a real authorized before-unload reply**. It requests Close twice through the lifecycle service, verifies one pending promise and invalidated recovery, lets host shutdown cancel, then releases the old validation. It never fabricates a positive lifecycle response.

The resulting destruction emits the WebContents `destroyed` event. `BaseWindow.registerLogicalClose` first calls `removePrototypeWorkbench`. That function deletes the view entry and removes the child, then reads `entry.view.webContents.isDestroyed()`. In this Electron runtime the view no longer supplies `webContents`, so this throws. The remaining logical-close event, disposal, selection fallback and shell refresh are skipped.

The lifecycle service does not receive that asynchronously delivered exception as its own close failure. Its `finally` clears pending Close and publishes “Close cancelled” because the logical window remains registered. `BaseWindow.webContents` uses `this.hostedView?.webContents ?? this._win.webContents`, so an expired hosted view aliases the shared shell. This is an observed identity error, **not evidence that a foreign renderer obtained shell authority or that a subsequent stale action actually destroyed the host**; those consequences were not exercised after the failed invariant.

`failure-runtime.log` and `repeat-failure-runtime.log` contain the stack. Proposed refinement: make logical disposal exactly-once and tolerant of already-destroyed view access; keep hosted workbench identity from falling back to native shell identity; publish final Close outcome only after logical/registry/selection cleanup, and preserve visible failure if that cleanup fails. The next decision must assess this with the inherited safeguards; it is not accepted architecture yet.

## Reproduce

1. Check out the throwaway branch at the runtime checkpoint. Prepare independent dependencies and built extensions following repository instructions, then run `npm run build-fast -- --client-only`.
2. Use `.agents/skills/launch/SKILL.md`. Run `bash prototypes/live-hosting/recovery-shutdown/run.sh` in a retained PTY. Record the returned ports. The script creates only scratch workspaces and fresh isolated app state.
3. Run `node prototypes/live-hosting/lifecycle-replies/inspect.mjs MAIN_PORT prototypes/live-hosting/lifecycle-replies/observe.js`. To reproduce the full captured prefix, attach a unique Playwright CLI session to the returned CDP port; run the caller/connection-worker/create/reload/check controls named above, restoring normal IPC after diagnostic clients, then `recovery-shutdown/reload.js`. Inspect the current renderer after readiness/onboarding. Run `recovery-ownership/observe.js`, `lifecycle-replies/phases.js`, wait for replacement readiness, then `lifecycle-replies/replacement.js`.
4. For the **minimal independent failure confirmation**, run `recovery-shutdown/capture-service.js` through the same inspector runner after installing the observer; verify every window is ready. This temporarily captures the service through the native close listener without beginning shutdown, then restores the listener. It is setup, not a successful shutdown test. Run `recovery-ownership/observe.js` to set the snapshot/target.
5. Run `recovery-shutdown/close-race.js` through the inspector runner. Expected current result: assertion `Accepted Close must cancel recovery and remove only its project`, false versus true. The harness saves the complete result in `globalThis.recoveryProbe.closeRace` before asserting. **Do not invert this assertion to make the product test pass.**
6. Run `recovery-shutdown/race-state.js` through the runner and save its result. It verifies whether the inconsistent registry state persists after the original operation. Inspect the native shell by exact checkout app path, not a shared display name. Stop the acceptance run at this failed invariant.
7. `node prototypes/live-hosting/recovery-shutdown/check-evidence.mjs` checks the **saved evidence**, including both failures. It is not a fresh product acceptance test.
8. Exit only this disposable instance with `recovery-ownership/cleanup.js` through the inspector, then close its named Playwright session. Keep scratch data until review.

## Unperformed gates and limitations

Stage 1 was restarted with fresh hosting and the sampled generic-IPC/document/connection/reply controls above. It did **not** complete the entire first security gate before this failure, nor inherit earlier passes. Still required: full hostile bootstrap/transition/auxiliary/internal-role/named-coordinator matrix; delayed effects, events, replies, resource publication and ports; all current-document crash/disposal sequences; real dirty-save/backup failures and veto/joiner controls; full resource lifetime/leak inspection and provider-owned separation.

The source-only direct-IPC inventory in `../lifecycle-replies/DIRECT-IPC.md` was read. Its diagnostics, shared/PTY/agent-host ports and downstream scopes, restart/policy, auxiliary-parent registration, bootstrap config/environment, zoom/devtools/raw reload and delayed context-menu adapters were **not corrected or tested here**: their gates remain unperformed after the first required runtime failure. The next run must correct them before exercising their requirements. No claim of an exhaustive boundary audit.

Remaining arbitration cases: visible shell and native recovery Close, Close during before-unload consideration versus cleanup, successful coordinated host close/quit, project-close veto/failure, bootstrap-created/late-success/failure/readiness races, interrupted permission collection and partially completed cleanup, exact resource usability, no duplicate/orphan replacement, and final-project close. Only the service-entry preparation race was exercised on the candidate, twice; no broad arbitration pass.

Other Stage 1 profile/theme/storage/trust/shared-settings checks, independent extension-host commands, terminal/task/debug/Git activity and menu routing, recovery/restoration/order/selection, unavailable workspace, startup/opening/CLI/`--wait`, explicit profiles and file/diff/merge combinations remain unperformed. No current crash → native Reopen or dirty-editor backup restoration acceptance from earlier runs is inherited.

All Stage 2 real-provider/exact-chat/draft/attachment/streaming/tool/approval/ownership continuity and all Stage 3 keyboard/IME/VoiceOver/focus/capacity/latency/memory/CPU acceptance remain unperformed. Restricted mode and unsigned-in state were retained; no provider request was deliberately sent. macOS/local evidence only. Windows/Linux and SSH/Dev Containers remain unvalidated. The source retains workspace/remote configuration; that is not a remote-runtime pass.

The ticket remains open for the creator's separate verdict. Transfer this entire inherited gate to an explicit follow-up before closure; final specification approval remains blocked. No production PR or merge.
