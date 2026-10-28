# Document-owned zoom and developer tools — disposable evidence

Continues [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33) from the [shell-environment checkpoint](../shell-environment/README.md). Runtime source and probes: **`6503bba1470`**, on `prototype/bootstrap-ui-ownership`. No production merge or PR. This checkpoint does not resolve the ticket, establish Stage 1 or overall feasibility, or replace the complete inherited gate and separate live creator verdict.

## Finding and candidate

Baseline `0249258d00d` accepted an actual `vscode:openDevTools` message from an unregistered auxiliary-preload renderer and opened its DevTools. Its zoom handler also accepted an injected invalid document credential, and an actual renderer invoke stored a string as the custom zoom level. This does not prove exploitation from arbitrary external content or a registered auxiliary integration.

The candidate extends the existing preload credential adapters to the two direct developer-tools channels and the zoom invoke. Main requires the registered owning workbench, main frame, exact current document credential and correct argument count before acting. Zoom accepts finite numbers or explicit `undefined` (reset to configured zoom). The existing workbench zoom caller logs rejected invokes rather than leaving an unhandled rejection. Early requests are rejected immediately and never replayed after authorization. No new authorization framework, dependency, configuration or public API was added.

Source scope: `preload.ts`, `CodeApplication` bootstrap handlers and `NativeWindow.handleOnDidChangeZoomLevel`. Both project and Agents bootstrap keyboard/error handlers use the changed preload. The sole zoom caller only notifies for its main workbench window. Separate native-host/browser-view developer-tools APIs and main-owned calls are unchanged and are not certified by this experiment. No layer or accepted architecture contract changes.

## Evidence

All structured results below are in `evidence/`; credentials and environment values are not captured.

| File | Check and result |
| --- | --- |
| `baseline.json` | Real unregistered auxiliary opens DevTools; injected invalid credential changes zoom; real string zoom is stored. |
| `ownership.json` | Agents and both projects use actual IPC to open and toggle genuine DevTools and send numeric/reset zoom values. Actual invalid values (string, NaN, infinity, null, object), extra arguments and unregistered auxiliary requests reject. Injected missing/guessed/foreign credentials and missing frame reject. Negative DevTools effects are counted using temporary method substitutions, restored afterward. |
| `transitions.json` | Actual document replacement and DOMContentLoaded requests before authorization. Early requests reject without replay; injected expired credentials reject after replacement; fresh explicit calls succeed and neighbour generation stays unchanged. Uses controlled DevTools effect counters, not real windows for this scheduling test. |
| `zoom-ui.json` | Real workbench command-palette Zoom In and Reset Zoom trigger authenticated notifications with `1` and `undefined`; custom zoom returns to configured state. No direct invoke substitutes for these UI commands. |
| `destruction.json` | Actual scratch WebContents destruction followed by injected late zoom and DevTools requests; rejection/no thrown DevTools operation, Agents generation unchanged. This bypasses logical Close and does not certify disposal or recovery. |
| `reload.json`, `environment.json`, `diagnostic.json`, `menu.json`, `close.json`, `host.json` | Existing sampled controls rerun on this source: authorized reload and lifecycle acknowledgements, shell-environment ownership, first diagnostic reply, native-menu ownership, shared startup Close/disposal interruption and host-startup interruption. Their original limitations remain: controlled scheduling/injections, synthetic remote authority, and no full provider or remote-runtime validation. |
| `runtime.json`, `build.txt`, `typecheck.txt`, `failures.json` | Runtime identity, successful incremental client build and client typecheck, setup/edit-script failures and their repairs. |

Runtime: macOS arm64, Electron 43.8.3, runtime Node 24.22.0; build Node 24.22.1. Dependencies, Electron, client and built-in extension outputs (including Copilot `dist`) were independently copied using APFS clone copies, not symlinks. The repository had no initial tracked changes. Fresh isolated profiles/extensions/shared storage and trusted scratch workspaces were used. No sign-in or provider request; the creator's prior no-sign-in preference is preserved. Workbench captures were visually inspected; screenshots and raw logs remain local.

The sampled candidate probes all passed. Failures remain explicit: the initial detached launch's main inspector became unavailable after its command exited; launching with a retained terminal corrected this. An inherited capture helper ran before the multi-folder target existed on two launches; the new capture probe waits for the observed target and lifecycle readiness with a deadline. An edit script incorrectly assumed an existing error-handler import and stopped before writing the zoom caller; the caller now uses its existing log service and the final build/typecheck passed. These are setup/harness failures, not evidence that the product contract passed. Baseline product failures are preserved separately.

Logs still contain extension-inspector address collision, provider policy-context-unavailable/sign-in warnings, and an `onWillCreateProfile` buffered-event warning. Expected invalid-request errors also appear during the negative tests. No broad extension/process/resource-health claim follows from these passes. The collision was not repaired in this checkpoint and must be addressed before extension-debug/runtime-health acceptance.

## Reproduce

Prepare the independent dependencies and all built-in outputs, then `npm run build-fast -- --client-only`; use `npm run typecheck-client` for these cross-process TypeScript changes. Follow `.agents/skills/launch/SKILL.md` and launch `bash prototypes/live-hosting/replacement-readiness/run.sh` in a retained terminal. The existing launcher provides fresh app-owned state and two scratch projects. Use the new dynamic inspector and CDP ports from its `scratch/launch.json`, not the values in old records.

Run `node prototypes/live-hosting/diagnostic-startup/inspect.mjs MAIN_PORT PROBE` with these repository-relative probe paths:

1. `prototypes/live-hosting/bootstrap-ui/capture.js`; visually inspect `../bootstrap-ui-candidate.png`.
2. `prototypes/live-hosting/lifecycle-replies/observe.js` and `prototypes/live-hosting/recovery-shutdown/capture-service.js` to capture the existing services without beginning shutdown.
3. `prototypes/live-hosting/bootstrap-ui/ownership.js`, then `transitions.js` from that directory.
4. For UI zoom, attach a uniquely named `@playwright/cli` session to the current CDP port and select the multi-folder workbench. Dismiss its onboarding without sign-in. Run `observe-zoom-ui.js` through the inspector, use the actual command palette to execute **View: Zoom In** followed by **View: Reset Zoom**, then run `read-zoom-ui.js`. Use the snapshot's current command labels; do not reuse element references from an old run.
5. Existing regressions: `direct-reload/authorization.js`, `shell-environment/ownership.js`, `diagnostic-startup/startup.js`, `context-menu/ownership.js`, `diagnostic-replies/startup-close.js`, `replacement-readiness/host-startup.js`, all beneath `prototypes/live-hosting/`.
6. Run `bootstrap-ui/destruction.js` last; it destroys the second scratch project renderer. Relaunch fresh state for repetition.

To reproduce the original failure, run `bootstrap-ui/baseline.js` against baseline `0249258d00d`, after the capture/setup steps. It expects the old failures and must not be interpreted as a candidate test. `node prototypes/live-hosting/bootstrap-ui/check-evidence.mjs` checks saved evidence consistency only; it does not rerun Electron.

Cleanup uses the existing scoped `recovery-ownership/cleanup.js` (`app.exit(0)`), closes only the named Playwright session, and releases retained launch terminals. Forced exit is not graceful-shutdown evidence.

## Remaining gate

Keep the ticket open, assigned and blocking final specification approval. No creator verdict was requested or obtained for this incomplete experiment, and no map decision is resolved or reopened.

Remaining direct boundaries include bootstrap configuration, registered auxiliary ownership, shared/PTY/agent-host ports and downstream scopes, restart/policy, plus the complete role/target/service/event/port matrix. This checkpoint does not cover all keyboard/error bootstrap paths, zoom persistence/restoration, registered auxiliaries, subframe real-wire attacks, crash recovery, or every malformed payload. Native-host and browser-view developer tools remain distinct paths requiring their own coverage.

The complete Stage 1 active-work/save/backup/joiner/opening/recovery/resource/restoration/isolation gate, Stage 2 exact-chat/provider/tool/approval continuity, Stage 3 accessibility/capacity, and Windows/Linux/SSH/Dev Containers remain unvalidated. Existing sampled evidence and this checkpoint waive none of those requirements. The separate live creator verdict remains required for acceptance.
