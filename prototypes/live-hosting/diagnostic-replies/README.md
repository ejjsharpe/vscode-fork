# Diagnostic reply ownership — disposable checkpoint

Continues [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33) from the [direct reload checkpoint](../direct-reload/README.md). The complete inherited gate remains open in that ticket. These sampled controls do not establish a Stage 1 or feasibility pass, and no creator verdict has been obtained. No production merge or PR.

## Findings and candidate

Baseline `4fc68c6c1da` accepted a forged diagnostic result sent by the neighbouring project over actual renderer IPC. A second request timed out but left one reply listener installed. The service used a predictable per-window callback and `once` without reply ownership checks. `baseline.js` reproduces both findings using real hosted workbenches and a synthetic remote authority; this does not demonstrate an actual SSH connection or remote-data compromise.

Runtime candidate **`1e37c84911918322220e2d18945b215e4cc45fd3`** uses a unique callback per operation and the existing main-owned document-generation/reply checks. It checks the sender, main frame and credential before consuming the wait, cancels the wait when that document is revoked, and removes its listener, revocation subscription and timer on settlement. It captures identity before asynchronous workspace-metadata preparation and rechecks it before dispatch. Unready documents return an explicit error. Requests are not queued into replacement documents.

The isolated preload supplies the document credential on diagnostic response channels. Pre-bootstrap responses are sent without authorization and are not queued for later credentialled replay. The real renderer's no-connection path now supplies an explicit `undefined` payload before that credential. All diagnostic callers use the existing service API; inspected callers include process exploration, system/performance information and the other-instance diagnostic path. Those complete user flows were not exercised here.

The first two-file candidate failed its genuine no-connection control: the renderer sent no payload, so the appended credential occupied the data argument and the ownership check rejected the reply. The wire trace recorded one string argument without recording the secret. After fixing the renderer caller, the trace recorded `undefined` followed by a string, and the final service control returned the expected no-connection error. `initial-candidate.patch` reconstructs that first candidate against the baseline for reproduction; the final committed source includes the repair.

## Evidence

The probes instantiate the real `DiagnosticsMainService` with a narrow window proxy that supplies a synthetic remote authority and can hold diagnostic dispatch. They retain real WebContents, preload, document lifetimes and IPC. Controlled result payloads, delayed metadata and explicit main-side event injections are identified below. No remote server, provider sign-in or provider execution was used.

| Evidence under `evidence/` | Observed result |
| --- | --- |
| `baseline.json` | Neighbour's actual IPC reply accepted; timeout left one listener. |
| `ownership-final.json` | Actual foreign and extra-argument replies rejected while the legitimate wait remained usable; own controlled reply accepted. Concurrent operations used different channels and settled independently. Duplicate and late replies had no listener. Actual renderer no-connection response worked. Timeout removed its listener. |
| `ownership-final.json` | Explicit main-side injections of missing/guessed credentials, wrong sender with copied credential, non-main frame and expired credential were rejected. These are not real hostile-frame/queued-old-document wire tests. |
| `ownership-final.json` | Actual document replacement interrupted its pending diagnostic; a new operation accepted a fresh reply, old channel/credential did not settle it, and neighbour generation stayed unchanged. Injected unready state and send exception returned errors without leaked listeners. |
| `transitions-final.json` | Actual replacement during deliberately delayed workspace-metadata preparation produced interruption and zero dispatches. A real isolated window using the auxiliary preload sent a rejected reply; the legitimate own reply still settled. This window was not created or registered through the app's auxiliary-window service. |
| `prebootstrap.json` | A script installed before navigation sent actual IPC at DOMContentLoaded. Main received one reply with an undefined credential; none was automatically replayed after readiness. |
| `destruction-final.json` | Deliberately closing the target view interrupted its pending diagnostic, removed the listener and preserved the neighbour generation/native host. This destructive probe bypassed safeguards on a disposable project with no unsaved edits; it is not a safeguard or graceful-shutdown acceptance test. |
| `reload-final.json`, `close-final.json`, `host-final.json` | Existing direct-reload authorization, replacement-startup shared Close/disposal, host-startup interruption and stale-context controls passed on final source. The copied Close probe waits for a bounded readiness/outcome condition. |
| `empty-reply-before.json`, `empty-reply-after.json` | Argument-type trace before/after the renderer caller repair, collected before the final preload no-queue refinement. Final-source behavior is covered by `ownership-final.json`. |
| `runtime.json`, `build.txt`, `typecheck.txt` | Actual runtime/process identities, incremental client build, final client typecheck exit 0. `git diff --check` passed. |

Every new diagnostic wait in the final probes had zero remaining callback listeners at completion. This is scoped listener evidence, not a heap or whole-process leak audit. `check-evidence.mjs` checks saved-record consistency; it does not rerun the product.

## Failures, repairs and limits

`failures-and-reruns.json` preserves the observed candidate defect and harness/setup failures. The first detached launch became unavailable before inspection; the baseline was repeated in a retained terminal. The first candidate probe ran before window readiness and tried to send to an undefined channel; it now waits for observed readiness. The inherited Close probe's fixed six-second wait expired before readiness, while its interruption assertions passed; later inspection confirmed readiness and the bounded-wait rerun passed. The first destruction probe passed its interruption/listener/neighbour assertions, then failed while formatting its report because disposal had cleared `w.win`; capturing the host before destruction fixed the report, and the final control passed.

A standalone diagnostic trace sent immediately after replacement received no response within five seconds. A later explicit trace succeeded. The receiver is registered at `LifecyclePhase.Eventually` in source, but its actual installation order was not traced here. Prompt diagnostic availability during startup remains unvalidated; this checkpoint does not claim that every ready document already has that receiver. Product timeout stays bounded and does not automatically retry.

Environment: macOS 26.3.1 arm64, build Node 24.22.1, Electron 43.8.3/runtime Node 24.22.0. Final snapshot had one native host and three workbenches with separate sampled renderer PIDs; this is not universal process-isolation evidence. Independent APFS copies of dependencies/output were used, with no shared dependency symlinks or added packages. Launches followed `.agents/skills/launch/SKILL.md` with a nonexistent source profile, separate user-data/extensions/shared-data and trusted scratch single-/multi-folder workspaces. Scratch workspace files were reused; profiles were fresh. No normal profile was intentionally opened or imported; normal-profile before/after hashing was not performed.

The baseline workbench capture was visually inspected. Following the creator's display-error report, this session switched to terminal-driven tests and text evidence, with no further embedded previews. Raw launch inventories/logs remain local; published evidence contains no credential values. The final instance was stopped using scoped `app.exit(0)` cleanup, not graceful-shutdown acceptance. No Playwright daemon was started.

## Reproduce

1. Prepare this disposable branch with independent dependencies and built-in outputs. Build the client with `npm run build-fast -- --client-only`. For baseline reproduction, save `baseline.js` separately, check out `4fc68c6c1da`, rebuild and use that saved probe. `git apply --unidiff-zero prototypes/live-hosting/diagnostic-replies/initial-candidate.patch` applies to that baseline and reproduces the first candidate's empty-response defect.
2. Launch `bash prototypes/live-hosting/replacement-readiness/run.sh` in a retained terminal. Read fresh `mainPort` from its `scratch/launch.json`; recorded ports are not reusable.
3. Use `node prototypes/live-hosting/replacement-readiness/inspect.mjs MAIN_PORT PROBE_PATH` for the following probes. First run `prototypes/live-hosting/lifecycle-replies/observe.js`, then `prototypes/live-hosting/recovery-shutdown/capture-service.js` to capture the existing service without running shutdown.
4. Run `diagnostic-replies/ownership.js`, `prebootstrap.js` and `transitions.js` (all paths under `prototypes/live-hosting/`). For the standalone empty-reply trace, wait for the renderer diagnostic contribution to be installed; an immediate post-replacement trace may time out as recorded above.
5. Run `direct-reload/authorization.js`, `diagnostic-replies/startup-close.js`, `replacement-readiness/host-startup.js`, then `diagnostic-replies/runtime.js`. Each is under `prototypes/live-hosting/`. Run `diagnostic-replies/destruction.js` last because it intentionally destroys its project view.
6. Stop only this instance with `prototypes/live-hosting/recovery-ownership/cleanup.js`, close its retained terminal, and retain/redact the evidence for review. No sign-in is needed for these controls.

## Remaining gate

Keep the ticket open, assigned and blocking final specification approval. No accepted architecture was changed and no resolved-decision entry belongs on the map for this checkpoint. The full inherited gate is neither replaced nor weakened.

Other incomplete direct adapters remain: shared/PTY/agent-host ports and downstream scopes, restart/policy, actual auxiliary ownership, bootstrap configuration/environment, devtools/zoom and delayed context-menu callbacks. Full real-wire role/target/service/event/port matrices, diagnostic remote success/error payloads against a real server, actual app-registered auxiliaries and early receiver ordering remain outstanding.

Also unvalidated: the complete Stage 1 active-work/backup/save/opening/recovery/resource/host-restoration gate; Stage 2 exact-chat/provider/tool/approval continuity under the prior no-sign-in choice; Stage 3 accessibility/IME/VoiceOver and capacity/performance; Windows/Linux, SSH and Dev Containers. The separate live creator verdict remains required for experiment acceptance. These sampled results do not certify failed or unperformed prerequisites.
