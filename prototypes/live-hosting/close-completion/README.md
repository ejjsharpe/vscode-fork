# Close completion: reentry repaired, interruption still reports cancellation

**Disposable experiment. Stage 1 failed/incomplete. Creator verdict pending. No production merge.**

Decision: [Revalidate live workbench hosting after Close completion ownership repair](https://github.com/ejjsharpe/escode/issues/31).

## Verdict for live review

The baseline reproduces the published synchronous logger-error/reentry failure: the original Close rejects and the reentrant caller resolves while disposal remains unfinished. The candidate repairs this sampled case. Both callers share the pending Close and reject; one logical-close notification fires. A later explicit retry completes disposal without replaying unload phases. Independently scheduled Close and direct disposal join a pending real will-unload phase and complete together. An independent injected view-detachment error also rejects Close and direct disposal while logger cleanup proceeds; explicit retry completes without replaying phases or notifications.

The next required check **fails**. With a ready real project, the harness holds delivery of the actual before-unload request, then replaces that document with `WebContents.reload()`. Main correctly retires the wait as `interrupted`. Nevertheless, both coalesced Close callers resolve, Close pending clears, and the shell says **Close cancelled**. No renderer veto or cleanup acknowledgement was sent. The project remains registered, logical disposal is incomplete, and no logical-close notification fires. This repeats on a fresh instance with Agents and both projects intact, without diagnostic IPC replacement.

This demonstrates a misclassified interruption and an ambiguous successful Promise result, not completed teardown or a genuine safeguard cancellation. The controlled document replacement is an injected ordering, not a claim that an ordinary user reload naturally races Close. No data loss, cross-project authority exploit or provider-continuity result is established. Acceptance stopped at this failed invariant. Neither the full security gate nor Stage 1 passed.

## Source and build

Candidate runtime source is `c826c75f705` on `prototype/close-completion`, based on `c416d763b25` (`prototype/logical-disposal`). Later commits add probes, reports and evidence only. `evidence/source.txt`, `compiled-hashes.txt`, `platform.txt`, `startup.json`, build and final typecheck logs identify the source/runtime. macOS 26.3.1 arm64; Electron 43.8.3 / runtime Node 24.22.0, build Node 24.22.1. Client build, final client typecheck and `git diff --check` passed.

An independent APFS copy supplied the existing dependency tree, Electron and built-in extension outputs. No dependency symlinks or dependency changes. The baseline used the copied original client output before rebuilding the candidate. Its window/lifecycle compiled SHA-256 hashes were respectively `772b58bdefa85e65f4068951c9720055a4f67446292f922f1027b58940b9e712` and `24522e1dd2d298de91f0c60db7a1498efb924f6695eaa1019bbf090435e8ce2a`.

Launch used `.agents/skills/launch/SKILL.md`, a nonexistent source profile, fresh isolated app-owned user-data/extensions/shared-data, and scratch single-folder/multi-folder workspaces. No persistent profile import, sign-in, credential bootstrap or provider request. Normal-profile before/after hashing was not performed. The launcher now reserves base debug ports between 20000 and 39999, leaving all ten extension-host probe strides within 65535. Runtime logs show extension hosts starting and no `ERR_SOCKET_BAD_PORT`; this is not full extension-host isolation or reload-health acceptance. The main launch has `--disable-workspace-trust`; the original child-opening commands do not propagate it, and child screenshots show Restricted Mode. Trust acceptance remains unperformed.

## Candidate scope

- Keep pending Close targets independent of live routing entries; consult the pending outcome before disposal.
- Publish a disposal Promise before any destructive callback can reenter. Direct disposal of a live project enters the existing lifecycle Close path; the coordinator invokes disposal only after its unload phase.
- Await per-project cleanup outcomes during host teardown; never infer successful disposal solely from registry absence.
- Keep existing bounded lifecycle/hosting services and interface, with a bounded internal after-unload argument. No retry UI or recovery framework.

The candidate is deliberately left at the failed gate. `doUnload` still converts `interrupted` into the boolean veto path. `finishPrototypeClose` then completes the Promise and clears pending as a cancellation. The repaired cleanup-error path does not fix this separate loss of outcome information. Host successful-shutdown and partial-cleanup interruption behavior are still unvalidated.

## Evidence ledger

| Check | Evidence and result |
| --- | --- |
| Baseline reentry | `baseline-result.json`: original rejects, reentrant resolves, unfinished disposal. Published `disposal-checks.js` assertion fails as expected. |
| Fresh hosting | `startup.json`: one host, three retained real workbenches, distinct document generations preserved through switching. `fresh-state.json` records workspace/profile/runtime identity. |
| Caller/target controls | `caller.txt`: six own-call controls and eighteen caller/explicit/nested-target rejections. Not an exhaustive role or service audit. |
| Connection/worker controls | `connection.txt`: old connection-owned extension handle rejects; foreign worker destination rejects; authorized worker receives one port and terminates. |
| Diagnostic reload | `stale-create.txt`, `stale-check.txt`, `diagnostic-reset.json`, `state*.json`, `diagnostic-run.log`: diagnostic clients replaced normal IPC. Reload waited; raw document reset interrupted waits. Stale handle rejection is not proof of a normal reload. No lifecycle reload pass claimed. Later Close evidence uses separate fresh instances. |
| Original recovery/shutdown race | `fresh-close-race.json`: pending Close retained, delayed recovery cancelled, only target removed. This sampled host-cancellation path is not successful-host-shutdown acceptance. |
| Logger failure/reentry | `fresh-disposal-result.json`: both callers reject, same Close Promise, one notification, logical disposal remains false. `retry.json`: later retry completes with unchanged phase/count observations. |
| Scheduled overlap | `scheduled-close.json`: independently scheduled second Close and direct disposal return the first pending outcome; all remain pending through real will-unload acknowledgement; complete successfully once released. Repeated completed disposal does not change count. |
| Independent cleanup boundary | `detach-error.json`: genuine injected `removeChildView` exception; Close and direct disposal both reject, logger cleanup runs, one notification. Explicit retry completes with zero phase replay. This is not coverage of every disposable/resource boundary. |
| Interruption | **FAILED**: `interruption.json` and independent `repeat-interruption.json`. Ready-project before-unload wait reports `interrupted`; callers resolve and shell reports cancellation without a veto. |
| Visible state | `interrupted-shell.png`, `repeat-visible.json`: shell message only, not a composite native-window screenshot or proof that all neighbouring resources are usable. `fresh-initial.png` is the confirmation instance's real project screenshot. |
| Cleanup | `cleanup.json`: scoped `app.exit(0)` after evidence, not graceful shutdown acceptance. Scratch state retained locally. |

The first diagnostic screenshot attempts targeted a hidden view and timed out; selecting that project made capture succeed. Diagnostic reload attempts and onboarding clicks are preserved as setup observations, not passing product tests. Several historical evidence filenames were overwritten during diagnostic retries; the accepted narrow verdict depends on the fresh-instance JSON and logs named above, not on those diagnostic attempts.

## Reproduce

1. Check out runtime source `c826c75f705` with this branch's probes. Prepare independent dependencies and complete built-in extension outputs per repository instructions. Run `npm run build-fast -- --client-only`.
2. Run `bash prototypes/live-hosting/close-completion/run.sh` in a retained PTY. Keep it alive and record the returned main inspector port. Each launch creates isolated fresh state. Inspect the rendered workbench before testing; `inspect-start.js` captures the selected multi-folder renderer. Run scripts via `node prototypes/live-hosting/lifecycle-replies/inspect.mjs MAIN_PORT FILE`.
3. Install `lifecycle-replies/observe.js`, then `recovery-shutdown/capture-service.js`. Confirm all three workbenches are ready. The capture temporarily replaces the host-close handler solely to obtain the service; it does not exercise host shutdown.
4. For the minimal **failed gate**, run `close-completion/interruption.js`. It selects the multi-folder project on a fresh instance, holds before-unload delivery, requests Close twice, then replaces the document. Expect the product assertion “Interrupted Close must not resolve as successful completion or a genuine safeguard veto” to fail. Run `read-interruption.js` and `capture-failure.js` to retain the result. Do not invert the product assertion.
5. For the earlier repair controls, use separate fresh launches. Install the observers, run `recovery-ownership/observe.js`, `recovery-shutdown/close-race.js`, the unchanged `logical-disposal/disposal-checks.js`, then `close-completion/retry.js`. For scheduled success and independent error use another fresh launch with observers, then `scheduled-close.js` and `detach-error.js`.
6. Stop at the first failed required invariant. Cleanup only this instance with `recovery-ownership/cleanup.js`; it calls `app.exit(0)` and does not test graceful shutdown.
7. `node prototypes/live-hosting/close-completion/check-evidence.mjs` verifies the saved observations, including the failure. It is not a new acceptance run.

## Remaining gate

All inherited requirements remain. Full generic/direct IPC scope, auxiliary/internal/bootstrap authorization, subscriptions, delayed effects/deliveries/ports, named coordinator operations and actual reload/revocation coverage remain incomplete. The prior `lifecycle-replies/DIRECT-IPC.md` inventory was reviewed but its incomplete diagnostic/shared/PTY/agent-host/auxiliary/environment/devtools/raw-reload/context-menu/protocol adapters were not corrected or runtime-tested here. They must be corrected before testing those requirements. An unclassified `clearToasts` error remains in logs. No security-gate pass is claimed.

Interruption semantics must be preserved through the Close coordinator. Genuine safeguard cancellation, real dirty save/backup/joiner controls, successful host shutdown, interruption after partial cleanup, all independent cleanup boundaries, late callbacks, recovery replacement races, restoration/listener/resource retirement and surviving-resource usability remain unperformed beyond the narrow cases above. This run does not demonstrate that a retry avoids replaying every completed lower-level disposable.

All remaining original Stage 1 distinct settings/profiles/themes/trust, terminal/task/debug/Git progress, native command routing, opening/CLI/`--wait`, restoration and unavailable-workspace checks remain unperformed. Stages 2 and 3 were not entered: no real-provider/exact-chat/tool/approval continuity, keyboard/IME/VoiceOver or capacity/performance acceptance. Windows/Linux and SSH/Dev Containers remain unvalidated.

The creator must separately review this scoped failed experiment. Keep the current ticket open, return the architecture for bounded interruption-outcome revision, preserve the complete inherited gate in the follow-up, and keep final specification approval blocked.
