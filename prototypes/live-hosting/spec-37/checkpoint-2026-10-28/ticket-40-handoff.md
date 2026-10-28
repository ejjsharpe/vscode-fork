# Ticket #40: native / main / PTY half

Worktree: `work/ticket-40`, branch `implement/spec-37-ticket-40`.
Base: #39 `cf36c4a7d2bcd71d83bd9a19f8d4b5908140fd27`.
Merged integration #41/#50 `8277cf17bf3` in `fd37d4c68c4`, then #51 `546c7fe98a5` in final tip `6df77e49a35`.

## Changes

- `c0416e364e1`: main-owned document role/workspace/environment scope. `4389ce3eb0d`: trusted utility transport envelope, ignored renderer handshake context, actual port-close/revocation propagation and native Agent Host client binding. Parent and shared branch already have equivalent scope foundations.
- `cf8487873be`: scope main browser/group/storage/PTy adapters; project-owned native browser children use the retained logical view container; worker native connection scope; owned-process Agent Host diagnostics. `450dfb0103c`: worker fixture import/overload repair. `25f486841b4`: live Windows target revalidation, terminal startup/exit lifetime corrections. Self-profiling helper `c29422d5c80` + test typing `565e4dad4de` cherry-picked as `1c6abda07aa` and `7c5a044c70d`.
- Generic and direct PTY operations check main-issued workbench + exact workspace against actual process owners. Shared reply/config maps are namespaced; lifecycle/variables/detach replies are current-connection checked. Restore assigns native process ownership, validates before effects, and cleans all late/partial creations. Auto-replies cannot mutate another project's current or future processes. Direct terminal connection drops late/disposed startup ports.
- Port cleanup is limited to a selected owned terminal's actual process tree, uses numeric ports and `execFile`, and rechecks scope before kill. The existing global trusted/remote internal route remains available; scoped renderers cannot kill an arbitrary port owner.
- Windows PTY native parent uses a dedicated reverse channel on the existing trusted main/PTy connection. Actual renderer context + logical target ID + supplied HWND reach main; main requires exact current parent or registered owned auxiliary, validates the supplied bytes, returns canonical handle, and utility rechecks origin before its synchronous native effect. This resolver runs inside the native setter after any traced/queued delay; its regression removes the target while pending and observes no attachment. No static HWND scope or arbitrary-handle substitution. New auxiliary ID with reused bytes cannot satisfy an old target ID.
- Browser handles cannot select another project's view/session/host. Trusted shared-process delegation accepts only a main-supplied original connection and revalidates main's live binding. Groups retain original context through CDP creation and clean late targets/groups. Main/browser resources expire with their origin. Browser native children attach to `ICodeWindow.contentView` (retained WebContentsView), so host detachment hides the subtree without recreating/suspending it.
- Storage rejects forged/foreign complete profile/workspace selectors, replaces accepted serialized objects with main-owned objects, rechecks after initialization and filters retired subscriptions.
- Project/Agents CPU profiling uses a dedicated protected diagnostics port and self-profiles only the actual Agent Host process; exact-context handles and disconnect cleanup. It cannot acquire provider protocol identity or raw management. Shared worker owns extension profiling/hung-host capability, shared resource adapters and UI action migration.
- Worker create returns a termination promise, so no post-completion generic dispose is used. Worker keys include actual native connection and origin is passed through WindowUtilityProcess; cleanup cannot kill a replacement worker under a later connection.

## Verification and red/green

Existing approved service seams, real Electron renderer unit runner, in-memory storage / fake process and inspector boundaries; no provider work or auth probe.

- `npm run build-fast -- --client-only`: passes on merged source (`work/build-40-merged.log`). Deps/out/.build copied as independent APFS clones; missing esbuild repaired by copying integration's `build/node_modules`, not a source patch.
- Foundation suite: 27 passing (`test-40-foundation.log`); native-client mismatch protocol regression also individually green. Targeted foundation ESLint passes (15 files).
- Storage RED: original channel accepted foreign/forged selector; final full storage service suite 11 passing.
- Browser RED: unwrapped service accepted foreign handles/nested host; final ownership tests include delegated owner expiry + cleanup.
- PTY RED: foreign process owner accepted before adapter; scoped restore/grace/port calls initially rejected; final valid-owner controls succeed. Delayed kill test confirms no late effect. Separate final-exit RED observed [] instead of [owned ID] after registry deletion; owner snapshot repair delivers only own exit through generic hop.
- Auto-reply RED: second project's reply altered another process; scoped rules and removal now pass.
- Profiling: helper own/foreign handle + disposal during initialization; AgentHost project-only diagnostics / foreign-handle rejection / disconnect cleanup; local AgentHost client event suite preserved.
- Worker public adapter test verifies peer `main` claim is overwritten and revoked old completion cannot dispose a later worker.
- Native-parent service test verifies main + owned aux controls, forged handle, unknown ID, removed aux reused bytes and direct auxiliary caller rejection. Actual conpty runtime is unperformed.
- Existing PtyHostService restart listener and LocalTerminalBackend attach/revive environment compatibility tests pass. Its environment-only revival fixture now marks its fake direct connection ready using the same pre-existing fixture approach as its attach test.
- Worker fixture typing repair: import ICodeWindow from platform/window, listener overload uses EventEmitter's listener type. First merged checks found only those fixture errors; they were repaired. Later checks captured in `typecheck-40-final-source.log`.
- Final combined test/typecheck/lint results: see final status appended below.

## Boundaries / remaining work

This handoff is not full #40 or #35 acceptance. Shared half and hung-extension-host diagnostics are implemented by `/root/ticket_38`; merge and validate together. Parent owns genuine inactive extension command, terminal heartbeat, task/debug and Git progress, minimized/occluded runs, and actual native browser AX/visibility check after merge. No such desktop samples were performed by this worker.

Project raw Agent Host transport/Management remains explicitly denied; #52/#54 must attach scoped presentation through persistent Agents. Exact per-chat home is identity only and does not grant tool/workspace trust. The dedicated process profiling path preserves diagnostics without broadening provider access.

Raw global PTY shutdown/restart and foreign-workspace detach remain coordinator-only. The existing restart recovery control now has the named native coordinator described below; direct raw utility restart stays rejected. Same-workspace detach/reply and own-process controls work. A future explicit app-native cross-project transfer route must carry authority; raw drag URI / workspace / numeric process ID cannot grant it. Windows/Linux, real remotes, provider execution, native sender attacks and full matrix remain unperformed. No sign-in, authorization probe, push, issue write or production merge.

## Final handoff status

- Main branch tip `6df77e49a35`, clean, includes integration through #51.
- `work/build-40-tip.log`: client fast build passes.
- `work/test-40-tip.log`: **64 passing** on final tip, including queued native target expiry, native parent matching, utility transport, worker replacement, storage/browser ownership, main native/aux controls, PTY ownership/autoreply/restore, and local AgentHost/CPU diagnostics.
- Targeted ESLint passes: initial 15 foundation files; 29 main implementation files; six worker/browser followups; 14 PTY/native followup files (new test initially required the standard leak hook, repaired); final changed local channel rerun. Logs `lint-40-final.log`, `lint-40-worker.log`, `lint-40-last.log`, `lint-40-last-test.log`, `lint-40-native-final.log`, `lint-40-tip.log`.
- Full final-source client typecheck passed after worker fixture repairs (`typecheck-40-final-source.log`). Exact-tip typecheck after last queued-setter signature + #51 merge is recorded separately in `typecheck-40-tip.log`; result supplied to parent on completion.
- Main service implementation is ready to merge for parent runtime validation. Whole ticket remains dependent on shared half/hung-host profiling and the parent-owned bounded desktop evidence; no full #35/Stage 1 pass is claimed.

Frozen main slice gate completed: exact-tip `npm run typecheck-client` passed (`typecheck-40-tip.log`, exit 0), client fast build passed, 64 focused tests passed and targeted lint passed. Per parent authorization, confirmed `work/integration` clean on `integration/spec-37-complete` and merged main slice with `--no-ff` as **`464e22d3ab15fe47bc0446bb8d29470f570eefa7`**, message `Merge #40 native ownership and live project resources`. This is partial #40 only. Required existing terminal host recovery control follow-up is now being added separately; shared/profiling + connector slices and native runtime evidence remain open.

## Follow-ups after frozen main integration

- Parent positive desktop run at `464e22d3ab1` exposed workspace rejections during ordinary startup. Preserved logs `work/runtime/native40/{runtime.log,launch.json}` and isolated app state under the path recorded there. Per-window logs show all PTY/storage workspace rejections in **Agents window100000**, not either real project. Native main uses the canonical node/md5 workspace ID; Sessions native bootstrap recomputed a browser/common hash (`5ef4f1ef`). Isolated repair `1c01da8a487` uses and validates the supplied exact main-owned Agents workspace configuration; neither stable hashing algorithm changes. Build-fast and lint pass. Parent must rerun native startup; historical 464e22 sample remains a failure.
- Parent correctly identified the existing unresponsive terminal recovery link as required functionality. Named main restart coordinator is implemented separately: native all-project impact confirmation (default Cancel), no hung-host query dependency, current caller + all affected documents rechecked around queued dialog, pending project Close / host Close / app quit rejection, overlapping request coalescing, and no restart on cancellation/expiry/snapshot changes. A read-only getter exposes existing closePending state, without altering lifecycle behavior. Existing developer recovery action now awaits the operation.
- Genuine behavior RED captured: old scoped `restartPtyHost` request failed as coordinator-only (`test-40-restart-red.log`). Implemented named main routing preserves direct raw rejection. New coordinator + existing LocalPtyChannel/WindowsFinder/TerminalProcessManager suites: **46 passing**, including all-project confirmation, cancellation, affected replacement, pending joined Close, original terminal parent-window controls, and persistence/restart compatibility (`test-40-restart-green.log`). Build-fast + targeted lint on 10 followup files pass. Full followup typecheck is running in `typecheck-40-restart.log`.

Followup full `npm run typecheck-client` passed (exit 0, `typecheck-40-restart.log`). Restart coordinator followup committed separately; no direct raw renderer/global restart permission was restored.


Final clean frozen handoff tip: **`d9a2e161853dc28c461b82d75ccb559e3c23e803`** on `implement/spec-37-ticket-40`, after clean merge of latest integration `aeb006edfe6` (shared ownership + owned process profiling). Includes main partial merge `464e22d3ab1`, Agents identity fix `1c01da8a487`, and recovery coordinator `2f4bad9cf5d`. No merge conflicts and worktree clean. Per parent instruction no additional full compiler run: merger combines connector slice separately, then one combined final gate and native rerun covers identity/shared/restart on a single current source. Earlier 64 and 46 test results describe their respective checked sources, not a combined final acceptance pass.

## Native browser startup replay repair

Parent combined-source native run `1ce038` proved genuine extension/terminal/task/debug progress via normal extension APIs, superseding the earlier partial terminal stall as an unresolved repair hypothesis. No speculative terminal change was made. Parent then reproduced actual integrated browser blank content and zero loopback GET requests at that same combined source.

Cause: `prototypeBrowserViewChannel.listen` wrapped `onDynamicBrowserViewEvent` with `Event.filter`. `Event.filter` creates an intermediate emitter, subscribes its source in `onWillAddFirstListener`, then adds the destination listener. Actual BrowserViewMainService synchronously replays its initial snapshot while subscribing, so that snapshot was dropped. BrowserViewWorkbenchService's `_browserViewsReady` never resolves; lazy browser creation/navigation never starts. Optimistic URL title plus zero GET is consistent with this blocked path, before native content attachment.

Repair `4943ba1e163` uses a direct guarded event function to preserve synchronous replay, thisArgs and disposable ownership, with the same current-context/owner predicates before every event. It does not broaden browser authority, change native containment, or alter app/public IPC binding. Regression RED preserved (`test-40-browser-snapshot-red.log`: one live snapshot delivered, missing the initial snapshot); GREEN ownership + complete existing BrowserViewWorkbenchService suites **19 passing**, including initial replay and rejection of later stale delivery (`test-40-browser-snapshot-green.log`). Own-worktree client fast build and targeted two-file ESLint pass. Root out was not rebuilt while active native run continued; no auth/remote probes or provider actions.

Clean frozen branch tip after merging latest combined integration: **`46648985942be15e1da2d581b4b373cdcabe8b69`**. Per parent no additional full compiler run; merged final gate/native rerun required. Actual localhost GET, rendered browser content and inactive native AX exclusion remain parent-owned runtime checks. Source/service repair is not claimed as that runtime pass.
