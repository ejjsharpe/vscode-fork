# Logical disposal: original race repaired, reentrant Close reports false success

**Disposable experiment. Stage 1 failed/incomplete. Creator verdict pending. No production merge.**

Decision: [Revalidate live workbench hosting after logical disposal refinement](https://github.com/ejjsharpe/escode/issues/30).

## Verdict for live review

The baseline reproduces the destroyed-view exception, stale logical registration and shell identity fallback. The candidate passes the original race's narrow removal assertion: accepted Close cancels delayed recovery, removes only its project and leaves two registered workbenches/two child views. Stale `webContents` access explicitly rejects and repeated disposal of that completed project does not change counts.

The next required check **fails**. During the final project's logger cleanup, the harness injects a genuine cleanup exception and reenters Close while the original operation remains pending. Independent view removal, logical registration/count cleanup and one logical-close notification occur. The original Close rejects and the shell says “Project 100001: Close failed”. But the reentrant Close resolves successfully while `logicalDisposed` is false. Two callers receive contradictory outcomes for the same unfinished teardown. Stop acceptance here; do not treat earlier sampled checks as a Stage 1 pass.

The native host and Agents view remain. Native inspection shows the failure message above Agents, with a workspace-trust prompt still present. This establishes visible failure and surviving renderer presence, not full resource usability, restored state or provider continuity. No closed-tab resurrection, shell-authority exploit or user-data loss is demonstrated.

## Source, build and setup

Runtime source: `09c4d1d3cd5` on `prototype/logical-disposal`; baseline `97ebd37ee5c`. `evidence/source.txt` records the full runtime SHA. Later commits add only probes/evidence/documentation.

An independent APFS copy of the previous disposable checkout provided dependencies, Electron and built extensions; no dependency symlinks or dependency changes. Changed client output was rebuilt with `npm run build-fast -- --client-only`. Client typecheck and `git diff --check` passed. `evidence/compiled-hashes.json`, `platform.txt`, `startup.json`, build/typecheck logs and runtime logs record provenance. macOS 26.3.1 arm64, Electron 43.8.3, runtime Node 24.22.0, build/inspector Node 24.22.1.

Launch skill: `.agents/skills/launch/SKILL.md`. Each baseline/candidate launch used a nonexistent source profile and fresh isolated app-owned user-data/extensions/shared-data; single-folder and saved multi-folder workspaces were scratch data. Initial baseline launch exited when its PTY ended, before probes; relaunch with a retained PTY supplied the evidence. A too-long Playwright session socket name failed to attach; short session `d30` succeeded. These setup failures are not product acceptance results. No sign-in, provider prompt, credential bootstrap or old-profile import was deliberately performed. A full before/after normal-profile hash audit was not performed.

The test logs also contain `ERR_SOCKET_BAD_PORT` for 67392 during reload and an unclassified `clearToasts` call, plus signed-out provider/policy errors. Do not infer extension-host health or real reload completion from a successful UI automation command. A UI reload attempt initially timed out; later commands returned, but their complete lifecycle/extension-host consequences are not established. The stale-handle result is a current connection/lifetime rejection control; it is not independently sufficient proof of a successful normal reload. Harness-driven actual document replacement changed generations and interrupted pending lifecycle waits.

## Candidate changes

- Cache cleanup WebContents identity before destruction; expired hosted access throws instead of falling back to the shell. The hosting entry retains its own WebContents identity across view expiry/replacement.
- Retain unfinished view-removal bookkeeping separately from the live routing map, attempt independent cleanup steps, and aggregate real errors.
- Deliver logical-close notification once, attempt disposal despite a view-removal error, and make project Close await physical destruction and logical cleanup. Report failure at the shell and reject the original pending Close on errors.
- Update the existing window interface and its test fixture. No general framework, provider changes or production PR.

These changes are an unsuccessful candidate, not an accepted implementation. The source preserves a crucial defect: `LifecycleMainService.close` checks absence from the live registry before consulting `pendingProjectCloses`. Once the logical-close listener removes that registry entry, a reentrant Close goes directly to `disposePrototypeWorkbench`. Its `finishLogicalClose` sees `logicalDisposing` and returns; the new Promise resolves without joining the original completion/error. The test invokes that exact route from a synchronous logger-cleanup callback, then throws. This deterministic injection demonstrates a reachable reentry ordering, not evidence of a naturally occurring logger failure or a second UI click interleaving in one synchronous stack.

## Evidence ledger

| Check | Result and scope |
| --- | --- |
| Baseline original race | `baseline-state.json`, `baseline-race-output.txt`, `baseline.log`: reproduced physical removal with stale three-workbench registry and shell fallback. |
| Fresh candidate hosting | `startup.json`: one host, three real workbenches; distinct identities and generations survive tab switching. No full startup/restoration pass. |
| Generic caller/target controls | `caller.txt`: 18 rejections and six authorized own-native calls. No exhaustive service/event/internal-role audit. |
| Connection/worker controls | `connection.txt`: stale connection-owned extension handle rejects; foreign worker target rejects; authorized worker delivers one port and terminates after disposal. No provider or delayed-transfer proof. |
| Stale handle | `stale-create.txt`, `stale-check.txt`: old handle rejects, fresh scratch-handle control succeeds. Normal reload interpretation is limited by runtime errors described above. |
| Lifecycle transport | `phases.json`, `replacement.json`: foreign/wrong-ID replies do not consume legitimate waits; authorized replies settle; old completion cannot settle a fresh wait; document replacement interrupts and retires listeners. These are transport controls, not real dirty-save/backup/joiner acceptance. |
| Original disposal race on candidate | `close-race.json`: retained/coalesced Close cancels one delayed retry and removes only its project, leaving two views/two registered workbenches. |
| Completed disposal / expired identity | `disposal-result.json`: explicit stale getter rejection; repeated Close on the completed target preserves counts; remaining renderer DOM can be read. |
| Injected genuine cleanup error | `disposal-result.json`: Close remains pending during injection; original operation rejects, one notification, registry/count and view cleanup continue, host and Agents survive. `failed-shell.png` records shell text, not the composed native window. |
| Reentrant Close outcome | **FAILED**, `disposal-error.txt`: reentrant operation is not the pending Promise and resolves successfully despite unfinished disposal and original rejection. |
| Cleanup | `cleanup.json`: scoped `app.exit(0)` after evidence, not graceful-shutdown acceptance. Scratch state retained for review. |

## Reproduce

1. Check out runtime source `09c4d1d3cd5` with the probes from this branch. Prepare independent dependencies and full built-in extension output per repository instructions, then `npm run build-fast -- --client-only`.
2. Run `bash prototypes/live-hosting/recovery-shutdown/run.sh` in a retained PTY (keep its shell open). Record the returned main/CDP ports. Use a short unique Playwright CLI session name. This uses the existing launch skill and fresh scratch app state; the session title still reads “Recovery shutdown arbitration”.
3. Inspect a screenshot of the rendered workbench. For the full recorded prefix, run `recovery-shutdown/startup.js` and `lifecycle-replies/observe.js` through `lifecycle-replies/inspect.mjs MAIN_PORT FILE`. Attach Playwright and run the caller, connection-worker, create, reload, check and reload probes from the evidence ledger in order. Inspect errors; successful CLI exit alone is not acceptance. Run `capture-service.js`, `recovery-ownership/observe.js`, `lifecycle-replies/phases.js`, wait for readiness, then `replacement.js`; wait for readiness again.
4. For a minimal independent disposal reproduction, install `lifecycle-replies/observe.js`, run `recovery-shutdown/capture-service.js`, confirm all three windows are ready, then run `recovery-ownership/observe.js`. Capturing the service temporarily replaces the host-close handler without performing shutdown; it is setup, not a passing shutdown test.
5. Run `recovery-shutdown/close-race.js` through the main inspector. The original required removal assertion now passes.
6. Run `logical-disposal/disposal-checks.js`. It first verifies expired identity and repeated completed disposal, then injects the logger error/reentry on the remaining project. Expected **current failure**: “Reentrant Close must not report success while the same disposal fails”. Do not invert this product assertion. Read `logical-disposal/read-result.js` to capture `globalThis.disposalResult` after the failure.
7. Inspect the shell's “Close failed” state and the surviving Agents view. Stop acceptance; do not advance to later stages. Exit only this instance through `recovery-ownership/cleanup.js`, then close its named Playwright session.
8. `node prototypes/live-hosting/logical-disposal/check-evidence.mjs` checks the saved observations, including the failure; it is not a new runtime acceptance run.

## Remaining gates

No Stage 1 pass. The original first security gate is incomplete: full hostile bootstrap/auxiliary/internal-role/named-coordinator scope, service/event subscriptions, delayed effects/deliveries/ports and resource-publication cleanup remain unperformed. The direct IPC inventory at `../lifecycle-replies/DIRECT-IPC.md` was reviewed; diagnostics, shared/PTY/agent-host ports and downstream authority, restart/policy, auxiliary-parent ownership, bootstrap config/environment, zoom/devtools/raw reload and delayed context-menu adapters remain uncorrected and untested in this run. Correct these before testing their requirements. No comprehensive security audit is claimed.

Disposal still needs truthful shared completion through reentry/errors, safe explicit retry of unfinished work, injected failures at every independently required cleanup boundary, restoration state/listener/resource retirement, and late callbacks. Visible/native/service Close paths, successful host shutdown, before-unload versus cleanup overlap, veto/save/backup failures, replacement-created recovery races, interruption after partial cleanup and actual surviving-resource usability remain unperformed beyond the sampled preparation race. Final-project view/count removal occurred under injected failure, not as a successful final-project acceptance case.

All other original Stage 1 distinct profiles/themes/trust/storage/shared settings, terminal/task/debug/Git progress, command routing, startup/opening/CLI/`--wait`, restoration/order/selection, unavailable workspaces and real crash → native Reopen safeguards remain unperformed. No earlier experiment's passes are inherited.

All Stage 2 real-provider/exact-chat/draft/attachment/streaming/client-tool/approval continuity and Stage 3 keyboard/IME/VoiceOver/focus/capacity/performance gates remain unperformed. No Windows/Linux or SSH/Dev Containers runtime claim. Retaining configuration fields is not remote feasibility evidence.

The complete inherited ticket body is preserved in the follow-up before closure. Return the candidate for bounded completion-ownership revision; no new product feature is needed. The creator must give a separate live verdict on this scoped failed experiment. Keep this ticket open and final specification approval blocked until that review and the subsequent full gate.
