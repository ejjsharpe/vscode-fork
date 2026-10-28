# Lifetime revocation experiment: lifecycle reply isolation failed

**Disposable evidence, not production code. Stage 1 incomplete. Creator review pending.**

Decision: [Revalidate live workbench hosting after lifetime revocation refinement](https://github.com/ejjsharpe/escode/issues/26). The full [three-stage contract](https://github.com/ejjsharpe/escode/issues/23) and all refinements remain mandatory.

## Verdict

The old extension-host handle now rejects after a document reload, with successful current-lifetime controls. A separate required boundary failed: a different real project renderer could answer the target project's pending reload lifecycle callback. Stop at this failure; the hosting candidate is not validated or disproved by this incomplete adapter.

The generic IPC transport now binds connections to a main-issued document bootstrap and connection lifetime. However, lifecycle `vscode:okN`, `vscode:cancelN` and `vscode:replyN` callbacks use separate Electron IPC listeners. In `LifecycleMainService.onBeforeUnloadWindowInRenderer`, the cancel listener ignores its event sender. Origin validation alone does not establish which logical workbench/document owns a pending lifecycle request.

The experiment exercised the cancellation path only. It did not bypass a save, discard user data, or demonstrate arbitrary web-content access. The analogous OK/reply handlers lack sender checks in source, but their runtime consequences were not tested.

## Runtime observations

| Check | Result |
| --- | --- |
| Real hosting | Real Agents, single-folder and saved multi-folder workbenches under one native host. Registered logical IDs 100000–100002; WebContents 2–4; native host 1. |
| Document replacement | Multi-folder generation changed from 2 to 4 with WebContents 4 unchanged in the first run. Main pushed a new bootstrap secret on `dom-ready`; navigation revoked prior connections. |
| Old handle after reload | **Passed sampled reproduction:** scratch handle `4` returned `false` while authorized before reload, then explicitly rejected with `Rejected extension-host owner/lifetime`. Fresh handle `6` returned `false` normally. The hosts were unstarted; no inspector was enabled. See `create.json`, `result.json`, `reload-runtime.log`. |
| Caller and target scope | **Passed 24 sampled cases:** 18 rejected impersonation/foreign/unknown targets, six authorized calls. Includes claims of Agents/shared-process roles and nested targets. See `caller-results.json`. |
| Same-document reconnect | **Passed sampled case:** a new connection claiming old document/connection identifiers could not use the prior connection's scratch handle. See `connection-worker-bounded.json`. |
| Utility worker | **Passed bounded sample:** foreign worker disposal rejected; an authorized scratch watcher delivered one MessagePort and returned termination code 0 after disposal. Initial startup logs also identify intended worker/extension-host port destinations. This is not full hostile-port or delayed-delivery validation. |
| Native events | Authorized maximize/unmaximize events carried the correct logical workbench ID. Focus/blur **inconclusive**: no native focus/blur transition was observed even with force-focus, so missing renderer focus events are not classified as a runtime failure. |
| Lifecycle reply scope | **FAILED:** a real reload of a dirty scratch editor in WebContents 4 registered `vscode:cancel0`. WebContents 3 sent that channel. The pending lifecycle listener was consumed (1 before, 0 after), cancelling that reload while the dirty target editor remained. See `reload-prompt.json` and `foreign-veto.json`; the probe records the actual Electron sender. |

The first worker probe waited without a bound and did not yield a complete result. The bounded repeat records each checkpoint and completed successfully. Do not infer cancellation-race correctness from that repeat. A normal renderer reload restored its standard IPC connection before the command-palette lifecycle test; diagnostic clients otherwise replace normal renderer IPC.

## Source, build and setup

Final runtime source: `48fc6487c03784472cdbe513f770f0fd559d40bb`, based on `1565d746d39`. The first stale-handle run used this checkpoint minus the later utility-worker adapter, port-generation check and native reload allowlist entry; `initial-run-source.patch`, applied to the checkpoint, reconstructs that exact source variant. Its patch applicability was checked. The generation and extension-host binding code was unchanged between runs.

Build Node 24.22.1; runtime Electron 43.8.3 / Node 24.22.0 / arm64. Full runtime versions are in `runtime.json`, OS details in `platform.txt`. Client output rebuilt with `npm run build-fast -- --client-only`; client typecheck and layer checks passed, along with shell syntax, diff whitespace and `node prototypes/live-hosting/lifetime-revocation/check-evidence.mjs`. The evidence check asserts the observed failure, not overall acceptance.

Dependencies, Electron and compiled extensions were independent filesystem copies of the preceding probe checkout, not symlinks. Built-in extension freshness was not independently revalidated. Fresh app-owned profile/extensions/shared-data directories were used without profile seeding; normal-profile before/after auditing was not performed. Provider sign-in was not imported. No production checkout changes, PR or merge.

## Reproduce

1. Check out the disposable branch and build the client as above, retaining independently installed dependencies and built extensions. Use the repository launch skill. Run `bash prototypes/live-hosting/run.sh`; retain the launcher parent terminal and its returned JSON. All workspaces are scratch fixtures.
2. Attach a unique `npx @playwright/cli -s=NAME attach --cdp=http://127.0.0.1:PORT` session. Inspect the tab list, select the visible multi-folder workbench, then capture and inspect its screenshot. Hidden-view screenshot capture can time out.
3. Run `create.js` with `run-code --filename=...`, reload the actual renderer, wait for rendering, inspect it, then run `check.js`. The old handle must reject and the fresh control must succeed. For exact first-run reconstruction apply `initial-run-source.patch` before building.
4. On a fresh launch of the final source, run the previous `ipc-refinement/ipc-probe.js`, then `connection-worker.js`. Each diagnostic creates a replacement IPC connection; do not treat the normal workbench as intact afterward.
5. For lifecycle reproduction, set `files.hotExit` to `off` only in the returned scratch profile's `User/settings.json`, reload to restore normal IPC, and inspect the rendered workbench. Run `prepare-veto.js` to create an untitled editor containing only disposable text and observe its lifecycle request. Run `request-reload.js` to invoke Developer: Reload Window. It records the real pending callback channels.
6. Run `node prototypes/live-hosting/lifetime-revocation/inspect.mjs MAIN_PORT prototypes/live-hosting/lifetime-revocation/foreign-veto.js`. Verify the actual target/source WebContents IDs first and adjust the script's captured IDs if they differ. The script requires one pending callback, sends its cancellation from the other renderer, and captures the consumed listener and actual sender. The inspector only orchestrates the probe; the cancelling IPC message originates in the foreign renderer through its ordinary exposed preload API.
7. Stop at the failure. Exit only the disposable instance and close its named automation sessions. Captured cleanup used `app.exit(0)` (forced cleanup, not graceful shutdown acceptance). All dirty text belonged to the disposable fixture.

## Remaining obligations

No full Stage 1 pass. Unperformed: transition-time hostile bootstrap/connection messages; approved/vetoed reload generation sequencing acceptance; crash/disposal and same-document/tab-switch lifetime cases; cancellation/late resource publication/event/reply/port races; complete native/main-channel inventory; auxiliary targets; internal-to-renderer separation; named shell/Agents/project coordinators; complete extension-host lifecycle isolation; provider-owned resource separation.

Remaining Stage 1 profile/trust/storage isolation, background tasks/debug/terminals, menu routing, close/quit safeguards and recovery, restoration and opening/CLI compatibility are unperformed. All Stage 2 exact-chat/provider/tool/approval continuity and Stage 3 accessibility/IME/crash/capacity/performance checks are unperformed. No provider, Windows/Linux, SSH or Dev Container acceptance is claimed.

Native UI inspection timed out; no native-dialog screenshot or composed-window capture is claimed. Initial/settled renderer screenshots were inspected; a premature blank reload capture was replaced after rendering. Focus testing was inconclusive as described above.

The next revision must extend authenticated ownership to lifecycle responses and inventory other direct IPC paths, including current-document/operation binding and listener cleanup. Keep the existing accepted product behavior. Closing this unsuccessful experiment requires the creator's live review and explicit transfer of the entire remaining gate to its follow-up.
