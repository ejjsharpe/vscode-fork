# Spec #37 integration evidence

Disposable integration of [spec #37](https://github.com/ejjsharpe/escode/issues/37), based on the retained-view baseline `d6f73d25b56` and the feature documentation branch. [PR #60](https://github.com/ejjsharpe/escode/pull/60) remains draft. This record does not certify the separate [runtime acceptance gate #35](https://github.com/ejjsharpe/escode/issues/35) or authorize a production merge.

Orchestration stopped on 28 October 2026. The [partial checkpoint and continuation handoffs](checkpoint-2026-10-28/README.md) supersede the progress wording below; the historical observations retain their original source boundaries.

## Standalone startup and retained project tabs

Named batch: standalone first/repeat startup and single-folder/saved-multi-folder navigation. Source `cf36c4a7d2bcd71d83bd9a19f8d4b5908140fd27`; macOS arm64, Node `24.22.1`, Electron `43.8.3`. Independently copied dependencies/outputs were refreshed with `npm run install-fast`, then rebuilt using `npm run build-fast`. No dependency directory is shared or symlinked between worktrees.

The app was launched with explicit isolated user-data, shared-data and extensions directories, in-memory secret storage and scratch workspaces. No other editor profile was imported. The observed existence/mtime metadata of the Code, Code - OSS and Code OSS development profile directories was unchanged; this limited observation is not a full filesystem audit. No provider sign-in/send or authorization probe was performed.

| Check | Result |
| --- | --- |
| App-owned user-data/environment and native extension-control regressions | 46 tests passed; targeted lint and syntax checks passed. |
| Exact folder/workspace-file/environment and MRU window lookup | Six tests passed; changed-file lint passed. |
| Full integration client and bundled extension build | Passed. |
| Fresh first and repeat launch | Real Agents workbench and permanent selected Agents control, zero project tabs, one native BrowserWindow on both launches. |
| Single-folder plus saved multi-folder workspace | Both real workbenches opened beside Agents with distinct exact path labels. |
| Dirty editor preservation | Distinct unsaved edits remained in both scratch projects through project/Agents switching. Native whole-window Close presented save safeguards; choosing Save wrote both expected file contents, followed by authenticated before-/will-unload acknowledgements and destruction of all three workbench WebContents. |
| Hidden-view accessibility exclusion | **Failed.** Full native AX snapshots exposed the inactive project editor after switching and both inactive projects while Agents was selected. `setVisible(false)` alone did not exclude these views. Repair and native rerun are required. |
| Internal Agent Host client channels | Startup reproduced unknown `agentHostClientProxy` / `agentHostClientByokLm` channel errors. The native ownership slice tracks this missing role adapter. |

The first startup harness used the editor renderer URL for Agents; its assertion failed and was corrected to the actual Sessions renderer. A second harness assertion counted screen-reader-only navigation help as visible tab text; it was corrected to assert the Agents control state and project-tab count. Both corrected startup runs passed against the source above. The initial tab harness sampled workbench URLs before load; its startup Close did not complete while lifecycle safeguards were unready. Native observations were then performed on the still-live scratch app. After the user-facing save/Close sequence released all workbench views, its remaining headless test main was explicitly terminated. This is not a graceful app-quit pass.

## Native selected-project routing and hidden-view repair

Named batch: native accessibility exclusion and selected-project File → Save. Source `52f6f8033eeba687db890be54e1b39289292d105`, rebuilt with `npm run build-fast -- --client-only`; macOS arm64 and Electron `43.8.3`. Fresh app state was placed under a short `/tmp/escode-spec37-41-*` path after the first fixture exceeded macOS's Unix socket path limit and failed before app startup. The failed-launch log is retained; no product fix was needed for that fixture failure.

The native CUA check opened the real single-folder and saved multi-folder workbenches, typed distinct unsaved markers into their file editors, and switched by the shell controls. Full native AX snapshots now contain only the shell plus the selected workbench: the inactive single editor disappears when multi is selected, and both project editors disappear when Agents is selected. Returning to single restores its dirty editor and cursor position. This repairs the earlier observed accessibility failure without destroying the inactive renderer.

With multi selected, native File → Save wrote only `multi-a/example.txt`; a filesystem assertion confirmed `single/example.txt` still held its original on-disk text while its editor remained unsaved. The remaining scratch edit was then saved explicitly, and native window Close released all hosted views. The remaining headless macOS test main was terminated by its recorded PID; no graceful app-quit claim follows.

Supporting source checks for this slice passed: 23 focused dialog/native/finder/profiler tests (two existing platform skips), targeted lint, client typecheck and build. The committed `check-host-routing.cjs` Electron check first failed with all views attached, then passed with selected-only attachment, a progressing detached-renderer heartbeat, inactive replacement/disposal, and final-project return to Agents. Full VoiceOver, IME, auxiliary UX and the native authority matrix remain unperformed.

## Outstanding coverage

The remaining ticket graph is stopped at the linked checkpoint. Later source integration and bounded checks are recorded there; exact chat routing, cross-renderer presentation state, independent tools/approval ownership, complete native service/resource validation, project lifecycle races, ordinary opening/profiles/restoration, unavailable homes and attention remain incomplete. Full native usability, actual remotes, Windows/Linux, provider continuity and capacity remain unperformed. Provider work/sign-in remains deferred, authorization probes remain paused, and #35 retains its full staged evidence requirements and separate creator verdict.
