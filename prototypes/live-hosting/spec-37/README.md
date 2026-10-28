# Spec #37 integration evidence

Disposable integration of [spec #37](https://github.com/ejjsharpe/escode/issues/37), based on the retained-view baseline `d6f73d25b56` and the feature documentation branch. [PR #60](https://github.com/ejjsharpe/escode/pull/60) remains draft. This record does not certify the separate [runtime acceptance gate #35](https://github.com/ejjsharpe/escode/issues/35) or authorize a production merge.

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

## Outstanding coverage

The remaining ticket graph (#40–57) and the hidden-view repair are in progress. Exact chat routing/persistence, cross-renderer presentation state, independent tools/approval ownership, native service/resource scopes, project lifecycle races, ordinary opening/profiles/restoration, unavailable homes and attention are not established by the startup/tab observations above. Full native usability, actual remotes, Windows/Linux, provider continuity and capacity remain unperformed. Provider work/sign-in remains deferred, authorization probes remain paused, and #35 retains its full staged evidence requirements and separate creator verdict.
