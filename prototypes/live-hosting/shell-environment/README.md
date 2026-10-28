# Document-owned shell environment — disposable evidence

Continues [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33) from the [native-menu checkpoint](../context-menu/README.md). Runtime source: **`071d2d634ed`**. No production merge or PR. This is a progress checkpoint, not a Stage 1 or feasibility pass; the complete inherited gate and separate live creator verdict remain required.

## Finding and candidate

On baseline `6cba50af70c`, an unregistered auxiliary-preload renderer invoked `vscode:fetchShellEnv` over actual Electron IPC and reached the application's fallback resolver. The probe substituted a resolver returning only a harmless sentinel; the auxiliary received that sentinel. It did not read or publish actual environment values, prove exploitation from an arbitrary external page, or test a registered auxiliary integration.

The candidate requires the existing authenticated current document, main frame and registered workbench before invoking the resolver. It uses that workbench's configuration and environment and rejects unrecognized renderers instead of selecting the application fallback. The same ownership check runs after asynchronous resolution, before returning the result. The isolated preload waits for its main-issued document authorization for its initial environment fetch. Explicit renderer invokes attach the current credential immediately: an early explicit call is rejected and is not replayed. No new retry policy or authorization framework is introduced.

The sole source call to this IPC was in the workbench preload, used by CodeWindow. Auxiliary preload does not initiate environment resolution. SharedProcess is a UtilityProcess, not a BrowserWindow using that preload. Main-owned environment resolution elsewhere is unchanged. The bootstrap configuration channel itself is still outside this checkpoint; this does not certify its ownership boundary or all internal roles.

Scope: the preload's initial fetch and exposed invoke adapter, the CodeApplication handler, and the existing ownership helper's type signature (now also accepting invoke events). No dependency, export, configuration, fixture or caller API was added. The runtime probe uses temporary resolver substitutions and handler interception, restored in `finally`; these are not production paths.

## Evidence

All files below are in `evidence/`. No environment values or document credentials are published.

| File | Coverage |
| --- | --- |
| `baseline.json` | Actual unregistered auxiliary IPC reaches the old fallback and receives a controlled sentinel. |
| `ownership.json` | Actual IPC from Agents and both project workbenches selects each workbench's own configuration/environment. Actual auxiliary and extra-argument rejection. Main-handler injected missing/guessed/foreign credential and non-main-frame rejection; unauthorized requests never invoke the controlled resolver. |
| `transitions.json` | Actual renderer request and replacement with controlled asynchronous resolver delay. The old main handler rejects as interrupted; an injected expired credential is rejected; the new preload and a later explicit request resolve; neighbour generation unchanged. This observes the old handler's result, not delivery into a destroyed JavaScript context. |
| `prebootstrap.json` | Actual DOMContentLoaded explicit request has no credential and rejects. The preload independently issues one authenticated request after authorization; the genuine resolver succeeds. No replay of the early explicit request. No shell values are captured. |
| `destruction.json` | Actual scratch renderer destruction during a controlled pending resolution; old handler rejects as interrupted and Agents' document generation is unchanged. This bypasses logical Close and is not logical-disposal or graceful-shutdown acceptance. |
| `reload.json`, `diagnostic-startup.json`, `menu.json`, `close.json`, `host.json` | Existing sampled reload ownership, first diagnostic reply, native-menu callback ownership, shared startup Close/disposal and host-startup regressions on the candidate. Controlled scheduling, injected events, synthetic remote authority and other limitations remain those documented by their originating reports. |
| `runtime.json`, `build.txt`, `typecheck.txt` | Runtime versions and sampled workbench readiness; successful incremental client build and client typecheck. |
| `failures.json` | Setup/probe failures and repairs, including the asynchronous-destruction assertion. |

Initial candidate ownership/replacement/startup probes passed, but log inspection found missing `extensions/copilot/dist` in the independently copied build. The missing output was copied independently, the app was relaunched with fresh state, and all published candidate results above were rerun on the repaired runtime. No broad extension/provider health claim is made: final logs still contain extension-inspector address collision and provider policy-context-unavailable warnings. No sign-in or provider request was performed, preserving the creator's prior choice.

The first destruction probe called `WebContents.close` and immediately asserted `isDestroyed()`. That assertion failed. The repaired probe waits for actual destruction with a bounded deadline and passed on a remaining scratch project. The first screenshot selector also expected `workbench.html`, while the actual development target is `workbench-dev.html`; correcting the selector allowed visual inspection. These setup/probe errors are not hidden product passes.

## Reproduce

Use an independent checkout, dependencies and outputs; include built-in extension output, especially Copilot's `dist`. Follow `.agents/skills/launch/SKILL.md`. Launch `bash prototypes/live-hosting/replacement-readiness/run.sh` with a retained terminal. It creates fresh app-owned state and trusted single-/multi-folder scratch workspaces without importing a normal profile. Inspect an actual workbench capture after launch. Read the dynamic main inspector port from `replacement-readiness/scratch/launch.json`.

Run `node prototypes/live-hosting/diagnostic-startup/inspect.mjs MAIN_PORT PROBE`, with paths rooted under `prototypes/live-hosting/`: first `lifecycle-replies/observe.js`, then `recovery-shutdown/capture-service.js`. Run `shell-environment/ownership.js`, `transitions.js`, and `prebootstrap.js`. Run the saved regression probes from `direct-reload/authorization.js`, `diagnostic-startup/startup.js`, `context-menu/ownership.js`, `diagnostic-replies/startup-close.js`, and `replacement-readiness/host-startup.js`. Run `shell-environment/destruction.js` last: it destroys the second scratch project renderer. Use a fresh instance for repetition. Run `shell-environment/baseline.js` on the baseline commit to reproduce the original unregistered request.

`node prototypes/live-hosting/shell-environment/check-evidence.mjs` checks saved results; it does not rerun Electron. Runtime: macOS arm64, Electron 43.8.3, Node 24.22.0; build Node 24.22.1. Dependencies and outputs were independent APFS copies, not symlinks. Raw logs and screenshots remain local. Cleanup uses scoped `recovery-ownership/cleanup.js` (`app.exit(0)`), not graceful shutdown.

## Remaining gate

Keep the ticket open, assigned and blocking final specification approval. No decision is resolved and no architectural decision is reopened. The map's Decisions-so-far is unchanged.

Outstanding direct boundaries include shared/PTY/agent-host ports and downstream scopes, restart/policy, registered auxiliary ownership, bootstrap configuration, zoom/devtools, and the complete role/target/service/event/port matrix. This checkpoint also does not establish shell-resolution cancellation, rollback of an already-started shell, crash recovery, hostile configuration channels, terminal/task/debug environment correctness, environment cache isolation, or all shell-error cases. Registered auxiliaries and internal roles need integration coverage, not blanket assumptions from this isolated auxiliary rejection.

The full Stage 1 active-work/save/backup/joiner/opening/recovery/resource/restoration/isolation gate, Stage 2 exact-chat/provider/tool/approval continuity, Stage 3 accessibility/capacity, and Windows/Linux/SSH/Dev Container coverage remain unvalidated. All inherited requirements and the separate live creator verdict remain required. Sampled passes here do not waive those gates.
