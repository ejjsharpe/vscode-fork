# Recovery ownership: local recovery works; overlapping Close is lost

**Disposable experiment. Stage 1 incomplete. Creator verdict review pending. No production merge.**

Decision: [Revalidate live workbench hosting after recovery ownership refinement](https://github.com/ejjsharpe/escode/issues/28). This report does not waive any requirement inherited from the preceding experiments.

## Verdict for live review

Native **Reopen** after crashing the multi-folder renderer now preserves the shared BrowserWindow, Agents, the neighbouring project and their extension hosts in the sampled case. It replaces the failed WebContents, preserves the logical project ID and workspace/profile/environment/backup identity, and restores an actual unsaved editor from backup.

**Required race failure:** Close is silently lost when requested while host shutdown and project recovery overlap. After host shutdown cancels, the pending retry continues and opens a replacement. The project was never marked closed: this is a dropped Close request, **not evidence that a successfully closed tab was resurrected**. The main close API returns normally without a result indicating rejection; the shell also silently ignores actions while host coordination is busy. A user-facing Close must be coordinated with recovery and shutdown rather than apparently accepted and forgotten.

Stop at this gate. Recommend retaining the candidate and making the Close/recovery/host-shutdown precedence explicit, then rerunning the entire staged contract. The bounded split has useful evidence, but neither this run nor any earlier run is a Stage 1 pass.

## Source and scope

Runtime source: `1504132ca61` on `prototype/recovery-ownership`, based on `e227996f44b1c0b1876278ef09249deeaa7b9629`. OS: macOS 26.3.1 (25D2128), arm64. Runtime: Electron 43.8.3, Node 24.22.0; build Node 24.22.1. `platform.json`, `runtime.json` and captured runtime snapshots record the details.

The experiment changes the existing host adapter, CodeWindow, lifecycle service, WindowsMainService renderer listeners, window-bound utility lifetime listeners and the lifecycle test service. It keeps a stable logical project and swaps only its view. Renderer listeners move to a disposable store; the replaced document is revoked and the old WebContents closed. The logical close event now follows the hosted document rather than shared native `closed`. Window-bound utilities observe their owning document and logical close; repeated termination notifications are deduplicated. The shared native window has one close coordinator, which asks every live child for veto before requesting cleanup. Project Close uses existing unload safeguards. These are implementation changes under test, not accepted production architecture.

Fresh scratch user-data, extensions and shared-data directories were used without seeding an existing profile. Dependencies, build outputs and Electron were independently copied from the preceding disposable checkout; `npm run build-fast` rebuilt the changed client inputs. Unchanged extension/Copilot outputs were reused. No added dependency. The original project checkout was not edited. A display-name lookup initially reached an unrelated default Electron window; it was not used for test actions. All test interactions used the exact experiment app path.

## Captured results

| Check | Result and evidence |
| --- | --- |
| Real hosting | One native host, real Agents, single-folder and saved multi-folder workbenches. IDs/processes in `before.json`; initial renderer screenshot inspected. |
| Authorized clean reload | Real Developer: Reload Window produced own before-unload OK and will-unload completion. `reload-control.txt`, `before.json`. Not a dirty save/veto matrix. |
| Crash → actual native Reopen | **Sampled pass.** `crash.json` separates crash from recovery; `recovered.json` asserts one unchanged native host, unchanged neighbouring renderer IDs/PIDs/generations, a destroyed old view, a new target view/generation, three retained children and the same target workspace/profile/environment hash/backup path. |
| Neighbour extension hosts | PIDs 9774 (single-folder) and 9792 (Agents) remain in post-recovery metrics. `extension-hosts.log` maps them to logical windows and shows the target's exits/restarts. No neighbouring exit is recorded in this bounded capture. This is not proof of agent/tool continuity. |
| Unsaved state | Real File: New Untitled Text File with `Disposable lifecycle reply test`; a backup existed before crash. Reopen restored its dirty tab; `backups.json` records the scratch backup bytes. The active editor returned to Welcome, so exact active-editor/cursor/layout restoration is not claimed. No deliberate chat send or approval occurred. |
| Replacement bootstrap failure | **Sampled pass.** `failure.js` makes the target's load method throw, then restores it. `failure.json` shows a failed, unauthorized target with Retry/Close and three retained children; the neighbouring project remained navigable. This is main-side fault injection, not an actual network/bootstrap timeout. |
| Retry | Actual shell Retry returned the same logical project with a fresh view/document; `retry.json`. |
| Repeated retry | Two calls share one delayed validation/recovery operation (`validations: 1`). This assertion holds in the failing race; it is not complete duplicate/orphan acceptance. |
| Close during recovery + host shutdown | **FAILED.** `close-race.json`: `hostClosing: true`, `recovering: true`, Close returns, `closed: false`; host shutdown cancels, then retry produces ready WebContents 11/generation 8 under logical ID 100002. Three children remain. |
| Compile / layers / evidence | Client TypeScript check, incremental build, layer checks, diff whitespace and `check-evidence.mjs` passed. The UI detector returned no findings. These checks do not substitute for runtime acceptance. |

### Race methodology and diagnosis

`races.js` first found the problem using a one-second overlap; its expected child count of two was actually three. `race-state.json` captured the persistent state afterward, ruling out merely observing the asynchronous close too soon. `initial-race-failure.txt` records the assertion.

`close-race.js` reproduces it deterministically. It first injects bootstrap failure to establish the failed-project state. It delays workspace validation for Retry and issues Retry twice. It starts actual native host close, lets the first renderer produce its **real authorized before-unload response**, then delays the coordinator's continuation. While that continuation is held, it calls the same lifecycle service Close used by CodeWindow. It releases host shutdown, waits until coordination has ended/vetoed, and only then releases Retry. The project becomes ready again instead of closing.

The host response delay and validation delay are test instrumentation; no sender authentication result or cleanup acknowledgement is fabricated. This is a main-service race test using real workbenches, not a claim that a human clicked Close at that timing. The actual native Reopen and shell Retry are separate UI controls.

Source confirms the gap: `LifecycleMainService.close` returns immediately for `prototypeHostClosing`, without recording the Close request or canceling pending recovery. When the coordinator reaches the not-ready project it vetoes, clears the host flag, and the still-live recovery continues. The shell's busy guard likewise ignores Close. This is an incomplete arbitration boundary in the prototype, not proof that retained views are fundamentally infeasible.

## Reproduce

1. Check out the disposable branch. Install dependencies if absent using the repository workflow; build with `npm run build-fast`. Use `.agents/skills/launch/SKILL.md`. Run `bash prototypes/live-hosting/run.sh` in a retained PTY (e.g. follow with `exec zsh -f`). Use the returned ports and directories; captured PIDs are observations, not reusable selectors.
2. Attach a unique Playwright session to the returned CDP port. Inspect the rendered multi-folder workbench. Native dialogs must target the app at this checkout's `.build/electron/Code - OSS.app`, not a display-name match shared with other instances.
3. Install `lifecycle-replies/observe.js` with `node prototypes/live-hosting/lifecycle-replies/inspect.mjs MAIN_PORT FILE`. Run the actual Developer: Reload Window control (`lifetime-revocation/request-reload.js` through the launch skill's Playwright runner). Wait for the real workbench to become ready. Run this directory's `observe.js` through the main inspector.
4. Run `lifecycle-replies/prepare.js` through Playwright to create real unsaved text. Confirm a backup exists in the scratch profile. Run this directory's `crash.js`; choose native **Reopen**, leaving **Don't restore editors** unchecked. Wait for the replacement to be ready, then run `recovered.js`. It asserts the bounded isolation/configuration observations.
5. Run `failure.js`. Inspect Recovery failed / Retry / Close; switch to the neighbour to check it remains available. Click shell Retry and capture `snapshot.js` after ready. Preserve the target project and scratch backups.
6. Run `close-race.js`. It records the states and asserts the observed defect; a corrected implementation must instead require `closeHonored: true` and two remaining project/Agents views. Stop at this required failure. The older `races.js` is the initial timing-sensitive discovery, not the recommended reproducible harness.
7. Run `node prototypes/live-hosting/recovery-ownership/check-evidence.mjs` to verify the **saved evidence**, including the failure. It is not a fresh product acceptance run.
8. Cleanup terminates only this disposable app via `app.exit(0)` after capture and closes its named automation session. Forced cleanup is not a graceful-shutdown acceptance result. Keep scratch backups until evidence has been reviewed.

## Unperformed requirements and limits

**Stage 1 remains incomplete.** This run prioritised the selected recovery refinement after fresh startup and the authorized clean-reload control. It did not re-run the full prior authentication/generation/reply matrix before reaching the recovery race. No earlier pass is inherited. Full document/connection spoofing, stale handles, delayed deliveries/effects/ports, auxiliary ownership, reply phases, save/backup failures and provider-owned resource separation remain required.

The existing [direct IPC inventory](../lifecycle-replies/DIRECT-IPC.md) remains source-only starting evidence. Diagnostics, shared/PTY/agent-host port ownership and downstream scopes, restart/policy roles, auxiliary registration, bootstrap configuration/environment, zoom/devtools/raw reload and delayed context-menu callbacks were **not corrected or tested in this run**. The experiment stopped before their gates; those adapters must be corrected before testing them.

Still unperformed: complete project close/reload/profile reload; final-project close; successful coordinated host close/quit; actual dirty save/Cancel/veto and slow joiners during recovery; destructive-load and crash-phase matrices; full leak/resource audit; shell/Agents/native-host failure coverage; unavailable-workspace UI; profile/trust/storage isolation and shared settings; terminal/task/debug progress and command/menu routing; startup/opening/CLI/`--wait`; restoration of tabs/order/selection. No exact-active-editor/cursor restoration pass. Source retains workspace/remote authority, but independent SSH/Dev Container behavior is unvalidated. Other-profile before/after auditing was not performed, so no comprehensive untouched-profile audit is claimed.

All **Stage 2** real provider/exact-chat/draft/attachment/tool/approval continuity and **Stage 3** accessibility/IME/capacity/latency/memory/CPU checks are unperformed. Restricted mode remained enabled. No provider sign-in. Healthy renderer or extension-host survival does not prove provider work survives. Windows/Linux and remote-runtime support remain unvalidated. UI screenshots capture individual renderer surfaces, not the composed native window; native composition and native dialogs were separately inspected through the computer-use tool.

This ticket stays open for the creator's separate live verdict. A follow-up must retain the complete inherited gate before this failed experiment is closed. No production PR or merge.
