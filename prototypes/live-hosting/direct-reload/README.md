# Direct reload safeguards — disposable checkpoint

**Full experiment remains open. No Stage 1 pass, feasibility verdict, production merge or creator acceptance is claimed.** This continues [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33) from its [replacement-readiness checkpoint](../replacement-readiness/README.md). The complete inherited gate remains in that ticket.

## Findings and repair

Baseline `fb419873a83` accepts `vscode:reloadWindow` from the renderer and calls Electron `sender.reload()` directly. `baseline.js` reproduced document generation 3→4 with **zero lifecycle requests**. This establishes a bypass, not a measured data-loss event.

The final candidate is `35375219f8f0c7de460bfeb4ffd8042d04f40d1e` on `prototype/direct-reload-safeguards`. Its isolated preload adds the current document credential to this channel; main requires the registered owning workbench, main frame, current document credential and no extra arguments before calling the existing lifecycle reload service. A pre-bootstrap request is sent without a valid credential and rejected; it is never queued for later authorization. Both existing bootstrap shortcut callers (project workbench and Agents) use this preload. Auxiliary/internal/shell senders without an owning authenticated workbench are not granted reload authority by fallback.

The first candidate then **failed overlapping reload**: two real renderer IPC requests shared one before/will safeguard sequence but called `window.reload()` twice. `overlap-before-repair.json` records two replacements, and `overlap-first.txt` preserves the failed assertion. The shared lifecycle service now publishes one pending reload promise per logical workbench before dispatch, including synchronous reentry; success/failure releases the attempt. The first request owns its reload options. No automatic retry or recovery framework was added. Source callers inspected: native host reload, existing-window opening, devtools reload, and the direct bootstrap channel. This does not validate every caller or overlap with every other host operation.

## Evidence

All files below are under `evidence/`. These are sampled macOS controls, not an exhaustive boundary matrix.

| Control | Result |
| --- | --- |
| `baseline.json` | Reproduced raw-reload bypass with zero lifecycle requests. |
| `authorization-final.json` | Real renderer IPC reload reaches actual before/will acknowledgements; neighbour generation unchanged. Extra argument rejected on real wire. Missing/guessed/foreign credential, non-main frame and expired credential rejected through explicitly injected main-side IPC events. These injections are not hostile-wire or real auxiliary-document coverage. |
| `cancel-final.json` | Real dirty untitled editor with Hot Exit disabled; native Cancel produces genuine `cancel`, retains document generation/readiness and unsaved editor. |
| `save-final.json` | Later explicit reload, real native Save and workbench Save As write the scratch text, complete real before/will acknowledgements and replace the document. File bytes checked. |
| `overlap-after-repair.json` | Two actual renderer requests cause one replacement and one pair of safeguard phases. |
| `reentry.json` | Direct scheduled and synchronous reentrant lifecycle callers share the identical promise; one unload, no remaining pending attempt. |
| `failure.json` | Explicitly injected unload rejection reaches both shared callers; no replacement. A later explicit request succeeds once. Not a genuine save/backup failure test. |
| `startup.json` | Real renderer request sent from replacement `dom-ready`, while lifecycle readiness is false, yields unload interruption; no second replacement and no retry after readiness. |
| `startup-close-regression.json`, `host-startup-regression.json` | Existing startup-Close/shared-disposal and host-startup/stale-context probes rerun on final source. |
| `reload-opening-regression.json` | Existing approved reload plus bootstrap reload/workspace-reuse probe rerun on final source. |
| `typecheck.txt` | Final client typecheck completed with exit 0. Incremental client build and `git diff --check` also passed. |

The first Save evidence check expected `['ok','reply']`; the lifecycle observer normalizes both acknowledgements to `ok`. That harness assertion failed, was corrected to `['ok','ok']`, and reran successfully. `save-first-assertion.txt` records this separately from the real overlap failure. Save/Cancel were repeated on final source after the overlap repair.

Three isolated runs: baseline, direct-channel repair before overlap repair, final candidate. Source/build dependencies were independent APFS copies, with no shared dependency symlinks or added packages. macOS 26.3.1 (25D2128), arm64; build Node 24.22.1; runtime versions in `final-runtime.json` (Electron 43.8.3). Each launch used `.agents/skills/launch/SKILL.md`, nonexistent source profile, separate user-data/extensions/shared-data and trusted scratch folder/multi-folder workspaces. Scratch workspace files were reused across runs; app profiles were fresh. Workbench captures were visually inspected before interaction. No sign-in or provider request was made. Initial CUA lookup by display name selected a different Electron default-app window; all safeguard interactions subsequently used this checkout's exact app path.

The locally retained logs show provider/sign-in/policy-context warnings and cancelled output-file writes during replacement. Raw runtime logs and screenshots are excluded from publication; local checkout paths in text evidence are redacted. They are not evidence of complete extension/process/resource health. Normal-profile before/after hashing, native screenshots and process-allocation/leak audits were not performed. Scoped `app.exit(0)` cleanup is not graceful-shutdown acceptance. The named Playwright session and this experiment's instances were stopped.

## Reproduce

1. Check out the disposable branch and prepare independent dependencies and built-in outputs. Build with `npm run build-fast -- --client-only`. Baseline reproduction uses `fb419873a83` and `baseline.js`; do not run its expected-bypass assertions against the repaired candidate.
2. Run `bash prototypes/live-hosting/replacement-readiness/run.sh` in a retained terminal. Read the new `mainPort` and `cdpPort` from that directory's `scratch/launch.json`. Do not reuse recorded ports. The existing launcher opens Agents plus two real workbenches.
3. With `node prototypes/live-hosting/replacement-readiness/inspect.mjs MAIN_PORT FILE`, run `../replacement-readiness/inspect-start.js` and visually inspect its capture, then `../lifecycle-replies/observe.js` and `../recovery-shutdown/capture-service.js`. Paths here are relative to this report directory; invoke from repository root with their full repository paths.
4. Run `authorization.js`, `overlap.js`, `startup.js`, `reentry.js` and `failure.js` through the inspector helper. Each has live assertions and restores its instrumentation. The failure probe deliberately injects an unload error.
5. For safeguards, select the multi-folder project, complete onboarding without sign-in, set `files.hotExit: off` only in this launch's isolated settings, then run `../lifecycle-replies/prepare.js` through the launch skill's named Playwright session. Run `request.js` through the main inspector, click native Cancel, then `read-cancel.js`. Request again, choose Save, save to `replacement-readiness/scratch/multi-a/direct-reload-final.txt`, and run `read-save.js`. Choose a fresh scratch filename or remove your prior disposable file before repeating to avoid an overwrite prompt.
6. Rerun the existing readiness probes listed above. For `reload-opening.js`, first run `capture-windows.js` and `open-existing.mjs` from the replacement-readiness directory, as described in its report.
7. Capture logs, close only the named Playwright session, and use `../recovery-ownership/cleanup.js` to stop only the isolated experiment. `node prototypes/live-hosting/direct-reload/check-evidence.mjs` checks saved-record consistency; it does not rerun the product.

## Remaining gate

Keep the ticket open and assigned, blocking final approval. Do not move this checkpoint into the map's resolved decisions or close/replace the inherited gate. No architectural contract was declared changed or resolved.

The other direct-IPC adapters in [the inventory](../lifecycle-replies/DIRECT-IPC.md) remain incomplete: diagnostics, shared/PTY/agent-host ports and downstream scopes, restart/policy, auxiliary ownership, bootstrap configuration/environment, devtools/zoom and delayed context-menu callbacks. This checkpoint repairs only the raw reload portion of that inventory. Real auxiliary/foreign/queued-expired-document and role/target/service/event/port matrices remain open. Agents uses the changed preload, but an Agents-specific real shortcut reload was not exercised here.

Also remaining: full Stage 1 active terminals/tasks/debug/Git, genuine backup/save failures and Hot Exit, trust/profiles/settings, all opening entry points, recovery/resource lifetimes, host veto/quit/restoration and wait-mode checks. Stage 2 provider/exact-chat/tool/approval continuity stays unperformed under the earlier no-sign-in choice. Stage 3 accessibility, IME/VoiceOver, capacity/performance and process isolation remain unvalidated, as do Windows/Linux, SSH and Dev Containers. The separate live creator verdict and complete staged acceptance are still required. No requirement is waived by these results.
