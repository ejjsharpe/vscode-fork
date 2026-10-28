# Replacement readiness — lifecycle repair checkpoint

**Disposable prototype. Full gate incomplete. Creator verdict not obtained. No production merge. Keep the experiment open.**

Ticket: [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33). Accepted design: [exact-document readiness and explicit Close](https://github.com/ejjsharpe/escode/issues/20#issuecomment-6473367697).

## Result

The inherited bootstrap Close failure reproduces. The baseline trace records before-unload dispatch at `1793202227483`, followed by the replacement's lifecycle receiver installation at `1793202230961`: **3,478 ms later**. The generation is already 4, inherited window readiness is true, and Close stays pending after loading finishes. This establishes dispatch/registration order in this injected scheduling case; it is no longer merely a source explanation. The earlier held request deliberately triggers document interruption; no safeguard reply is fabricated.

The candidate stores lifecycle readiness on the current main-owned document record, clears it on revocation, and sets it through the authenticated native-service `notifyReady` call. Existing renderer startup invokes that call after its lifecycle service/listeners exist. Bootstrap/DOM readiness and the inherited window flag cannot satisfy the unload guard. Project unload and host coordination return interruption when the current document is not lifecycle-ready. Readiness does not retry Close.

Workspace reuse also had an inspected bypass: `isReady === false` skipped unload entirely. Existing configured windows now always pass through unload; only an unconfigured new window bypasses it. Actual approved reload followed by reload and reuse requests at replacement `dom-ready` yields no second load, and the original replacement becomes ready normally.

These are sampled local lifecycle results. They do not establish the full inherited IPC, provider, usability or capacity contract. The user explicitly chose **“Continue lifecycle checks without sign-in for now.”** No authentication bootstrap or provider request was made. No architectural decision was changed or declared resolved, and no follow-up ticket replaces or weakens the inherited gate.

## Source, environment and validation

Runtime source: `239561ce6cd` on `prototype/replacement-readiness`, based on `afd60160b1a`. Later commits capture probes/evidence only. The first repaired run used the same source except the subsequently added workspace-reuse guard; the final runs include that guard. Baseline used `afd60160b1a` with only the sender/receiver timestamp logging present in the final diff. All runs use an independent APFS copy of dependencies, Electron and built-in extension outputs; no dependency symlinks or added packages.

macOS 26.3.1 / build 25D2128, arm64; build Node 24.22.1; runtime Electron 43.8.3, Chromium 150.0.7871.250, Node 24.22.0 (full versions in `evidence/reload-opening-late.json`). `npm run build-fast -- --client-only`, `npm run typecheck-client`, and `git diff --check` passed. The scripts contain runtime assertions. `check-evidence.mjs` validates the saved observations; it does not rerun the product.

Each run used the repository launch skill, a nonexistent source profile, isolated app-owned user-data/extensions/shared-data and scratch single-folder plus saved multi-folder workspaces. Trust was disabled for these trusted scratch workspaces; distinct trust/profile behavior is not validated. Native screenshots were not captured; retained-workbench screenshots were visually inspected before interaction. `candidate-initial.png` is the final fresh shutdown-control workbench capture, not every run's screenshot. Existing profile before/after hashes and first-selection acceptance were not performed. Normal provider discovery still occurs and is not profile import.

## Evidence ledger

| Case | Result and evidence |
| --- | --- |
| Baseline startup Close | **Fails**: `baseline-retry.json`, `baseline.log`. Close dispatch precedes receiver registration; it remains pending after load. |
| Replacement startup, overlapping Close and direct disposal | **Pass, sampled**: `startup-close.json`. Three callers share the promise and reject with `Close interrupted`; no before-unload dispatch to the unready replacement, no pending Close after readiness, project remains. |
| Stale readiness and host startup | **Pass, sampled**: `host-startup.json`. An old authenticated connection context is rejected by the readiness entry point. Direct unload returns interruption; host coordination plus joined Close/disposal reject, retain three workbenches and leave no pending Close after readiness. This is a main-side stale-context injection, not the complete hostile-wire/queued-message matrix. |
| Later explicit Close: genuine Cancel | **Pass, sampled**: `dirty-editor.txt`, `real-cancel.json`. Created a real dirty untitled editor, set `files.hotExit: off` in the isolated profile, requested Close, clicked native Cancel. Renderer reports `cancel`; dirty editor and project remain. |
| Later explicit Close: genuine Save | **Pass, sampled**: `real-save-close.json`, `saved-content.json`, `candidate.log`. A separate Close shows the real Save prompt. Save As writes the scratch file, then real before/will replies complete and only the target project is removed. Native UI was read and operated through computer use, not replaced with fake lifecycle responses. |
| Will-unload interruption | **Pass, sampled**: `will-interruption.json`. Hold real will-unload delivery after real permission, replace the document, then joined Close/direct disposal reject without logical-close notification; replacement eventually ready, no pending Close. This does not establish interruption in every real joiner. |
| Cleanup failure/reentry and explicit retry | **Pass, sampled**: `detach-error.json`. Injected view-detachment error reaches Close and reentrant direct disposal; independent logger cleanup and one notification occur. A later explicit retry finishes remaining disposal with zero repeated unload phases or notifications. Error is injected, not naturally observed. |
| Reload and workspace reuse | **Pass on rerun**: `reload-opening.json`. Real approved reload; at bootstrap both readiness indicators are false. Further reload/reuse calls produce zero extra open operations; current replacement becomes ready. Initial fixed five-second assertion failed; later state was ready. `reload-opening-first-attempt.txt`, `reload-opening-late.json`, `final.log` record that harness limitation and repair. |
| Host interruption after some cleanup | **Pass, sampled**: `partial-host.json`. Agents and the first project complete cleanup; replacement interrupts the final workbench's will phase. Joined Close rejects, host survives, all affected workbenches expose recovery state. Explicit closes of completed entries replay zero phases; explicit Retry recovers the remaining project, then Close completes. The probe deliberately closes Agents via the service too; this is a cleanup test, not approval for a product affordance to remove permanent Agents. |
| Normal native host Close | **Pass, idle control**: `host-success.json`, `shutdown.log`. Native `host.close()` drives three actual before/will acknowledgements, one close notification per workbench, all logical disposals and native host destruction. Not an active terminal/task/debug or dirty-host-veto test, nor app-quit/restoration acceptance. |

Four isolated runs: traced baseline, initial readiness repair, final caller/partial-host run, final idle shutdown control. Their log files remain separate. Non-shutdown runs were stopped with scoped `app.exit(0)` (`*-cleanup.json`), not counted as graceful shutdown. Scratch state remains local for review.

Logs include no-auth/provider warnings, a buffered-event leak warning, and an extension inspector port-collision warning in the final caller run. Complete warning classification, process/resource leak inspection and extension-host health are **not** established. The shutdown control records protocol/logical disposal, not a proof that every independent process retired. Do not extrapolate the healthy neighbouring view observations to provider continuity.

## Reproduce

1. Check out `prototype/replacement-readiness`; prepare independent dependencies and built-in outputs according to repository instructions, then `npm run build-fast -- --client-only`.
2. Run `bash prototypes/live-hosting/replacement-readiness/run.sh` in a retained terminal. Read dynamic `mainPort`/`cdpPort` from `scratch/launch.json`; do not reuse recorded ports. Every run creates a fresh profile. Inspect a capture from `inspect-start.js` before continuing.
3. Use `node prototypes/live-hosting/replacement-readiness/inspect.mjs MAIN_PORT PROBE_FILE`. Install `../lifecycle-replies/observe.js`, then `../recovery-shutdown/capture-service.js`; verify all three real workbenches are ready.
4. Run `startup-close.js`, then `host-startup.js`. The latter checks a stale context and host coordination. Both assert the actual outcome, not an inverted failure expectation.
5. For real safeguards, select the multi-folder project via the shell, complete optional onboarding without sign-in, set `files.hotExit: off` in the isolated settings, use `../lifecycle-replies/prepare.js` through the launch skill's Playwright session to create a dirty editor, then run `request-close.js`. Click native Cancel and capture `read-close.js`. Request again, choose Save, and save inside `scratch/multi-a/`; capture `read-close.js` and inspect the file. This closes that project.
6. Run `will-interruption.js` against the remaining single-folder project. After readiness, `detach-error.js` exercises injected cleanup failure plus explicit retry and closes it.
7. On a fresh run, install the observer/capture again. Run `capture-windows.js`, then `node prototypes/live-hosting/replacement-readiness/open-existing.mjs` to capture the actual windows service without replacing normal renderer IPC. Run `reload-opening.js`, followed by `partial-host.js`.
8. On another fresh run, install observer/capture and run `host-success.js`. It initiates native Close and writes evidence from the `window-all-closed` event so inspector disconnection cannot lose the outcome.
9. Stop only the remaining isolated process with `../recovery-ownership/cleanup.js`; close only the named Playwright session. Run `node prototypes/live-hosting/replacement-readiness/check-evidence.mjs` for saved-record consistency.

## Still required — ticket stays open

The complete inherited gate in the ticket remains authoritative. This checkpoint is not a Stage 1 pass and is not ready for a full feasibility verdict. Direct-IPC adapters in `../lifecycle-replies/DIRECT-IPC.md` remain incomplete: diagnostics, shared/PTY/agent-host ports and downstream scopes, restart/policy, auxiliary ownership, bootstrap configuration/environment, raw reload and delayed context-menu callbacks. They were read but not corrected/tested here. The new lifecycle guard does not fix the separate raw Electron reload bypass.

Remaining Stage 1: full generic/direct IPC and hostile-wire role/target/generation/event/port matrix; queued late readiness/replies from real expired documents; save/backup failure and Hot Exit/reopen controls; active terminal/task/debug/Git/background progress; host veto with active work, overlapping failure boundaries, app quit/restoration and `--wait`; full recovery/late-callback/resource leak checks; distinct/shared settings, profiles and trust; all opening entry points and independent remote-authority constraints. The exercised workspace reuse guard does not validate every caller or startup mode.

Stage 2 exact-chat/provider/tool/approval continuity is unperformed, including independently provider-owned work. User chose no sign-in. Stage 3 keyboard/IME/VoiceOver, crash/process allocation and 3–5/10-project capacity/performance is unperformed. Windows/Linux, SSH and Dev Containers remain unvalidated. No accepted architecture changes, production merge, final specification approval or creator experiment verdict is claimed. Continue this ticket; do not transfer the gate or close it on the strength of this checkpoint.
