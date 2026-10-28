# Whole-window Close — disposable checkpoint

Continues [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33) from [the startup-configuration and ordinary-UI checkpoint](../bootstrap-config/README.md). Runtime source: **`a330d2a1016`**, on `prototype/whole-window-close`. No production merge or PR. The complete inherited staged gate remains on the ticket; this checkpoint does not establish Stage 1 or feasibility.

## Meaning of Close

The creator clarified live that the command-palette **Close Window** action closes the **whole shared window**, like the native window close button. A project-tab Close is a distinct, project-only action. An initial provisional project-only route was removed before candidate runtime testing and was never committed. This checkpoint does not test a project-tab close button.

## Failures and repairs

The baseline rejected ordinary **Close Window** with `Unclassified/coordinator-only native operation: closeWindow`, before presenting workspace safeguards. `close-ui.js` reproduced that exact failure in a dirty single-folder workbench. The baseline's independently copied outputs initially omitted Copilot `dist`; it proves the routing rejection only, not complete initialization or provider behavior.

Commit `18cea478f7f` classifies the existing `closeWindow` native operation. It preserves the adapter's existing caller/document and target checks and dispatches to the existing native service. That service requests native host Close, whose existing coordinator collects safeguards from every hosted workbench. No new project-close route, retry policy, lifecycle outcome or authorization framework is introduced. Existing Close Window callers were searched before editing; caller interfaces and arguments are unchanged. Broader callers, auxiliaries and authorization matrices remain unvalidated.

The first repaired command reached a genuine Agents terminal confirmation, but the confirmation was in a hidden view while a project remained visible. A physical native-close-button click reproduced this. CUA native accessibility and screenshot inspection showed the project rather than the pending prompt; read-only main inspection confirmed Agents' view was hidden. This is a functional visibility failure, not evidence that terminal safeguards were absent or stuck internally.

Commit `a330d2a1016` focuses each lifecycle-ready workbench before host permission collection. It reuses the existing workbench focus/selection operation. The real terminal and save prompts then appeared in the native window. The coordinator still collects all permission before dispatching cleanup. Selection changes during explicit shutdown; this does not certify broader focus or accessibility behavior.

## Observed controls

| Control | Result and evidence |
| --- | --- |
| Ordinary Close Window routing | Baseline rejected; candidate presents the actual Agents terminal safeguard. `baseline.json`, `command-terminal-prompt.json`. |
| Cancel terminal safeguard | Host and all three views retained; both projects' exact dirty text preserved. `after-terminal-cancel.json`, `dirty-after-terminal-cancel.json`. |
| Actual native close button, then Cancel at single-folder Save prompt | Real terminal permission followed by visible Save / Don't Save / Cancel. Cancel retains host and both dirty editors. `after-file-cancel.json`, `dirty-after-file-cancel.json`, `native-ui.json`. |
| Save first project, Cancel at neighbour | Actual native Save As writes the exact expected scratch file. The multi-folder project's Cancel keeps both workbenches and the host open. `saved-single.json`, `after-save-neighbour-cancel.json`. |
| Later explicit Close Window | Terminal confirmation recurs because no cleanup ran after cancellation. The clean single-folder editor does not prompt again. Saving the remaining dirty editor produces genuine before/will-unload replies from all three workbenches, then native host and all original views are destroyed. Both files match exactly. `later-command-prompt.json`, `lifecycle.txt`, `completed-close.json`, `verified-completion.json`, `after-completed-close.json`. |
| Prompt visibility | Original Agents prompt was hidden; candidate Agents prompt is visible. `hidden-dialog-native.json`, `final-terminal-prompt.json`, native CUA observations. |
| Build and checks | Incremental client build, client typecheck, diff check and saved-evidence assertions passed. `build.txt`, `typecheck.txt`, `check-evidence.mjs`. |

Evidence is under `evidence/`. Main inspection and destruction listeners are read-only observers: no lifecycle replies, service results or IPC handlers were replaced for these controls. Command-palette actions used the named Playwright CLI session; actual native close-button, terminal/save decisions and Save As controls used CUA. `native-ui.json` records the native interaction sequence; raw screenshots/logs remain local. Published lifecycle lines contain fixture identities and outcomes, not document credentials or configuration contents.

The final observed run contains three genuine cancellations and three will-unload acknowledgements, all `ok`, only in the completing attempt. Native host/view destruction is observed; this is not an exhaustive logical-registry, listener, extension-host or provider resource audit.

## Reproduce

1. Prepare independent dependencies, Electron, client and all built-in outputs, including extension `dist` artifacts. Never share or symlink `node_modules`. Build with `npm run build-fast -- --client-only`; use `npm run typecheck-client` for the recorded source validation.
2. Follow `.agents/skills/launch/SKILL.md`. Run `bash prototypes/live-hosting/product-close/run.sh` in a retained terminal, keeping the terminal alive afterwards. Its fresh isolated profile uses the checked-in `settings.json`, custom dialogs, Hot Exit off, autosave off and terminal exit confirmation. Only scratch workspaces and fresh app-owned state are used.
3. Read the dynamic CDP/main ports from `scratch/launch.json`. Attach a uniquely named Playwright CLI session, inspect the rendered screenshot, and identify targets from current titles. Indexes change between launches. Complete onboarding without signing in. Run `prepare-selected.js` on each project to create distinct dirty editors using ordinary UI.
4. Run `close-ui.js` on a project. It invokes visible Quick Access and Close Window and asserts a genuine terminal/save safeguard rather than the known rejection. Use the actual native window close button separately. Inspect the native window to ensure the owning prompt is visible; a DOM snapshot of a hidden workbench alone is insufficient.
5. Repeat the cancellation/save sequence in `evidence/native-ui.json`. Save into `scratch/single/whole-window-state.txt` and `scratch/multi-a/whole-window-state.txt`. Compare exact content on disk. Confirm cancellation retains the same host and three views with `read-state.js`, run via `node prototypes/live-hosting/diagnostic-startup/inspect.mjs MAIN_PORT PROBE_PATH`.
6. Before the final attempt, install the non-mutating destruction observer `observe-close.js` through that inspector runner. Perform a later explicit Close Window, allow terminal shutdown and save the remaining editor. Confirm the native window disappears and inspect `completed-close.json` and native state. The saved-evidence checker is `node prototypes/live-hosting/product-close/check-evidence.mjs`; it does not rerun the UI.

`evidence/failures.json` records setup/harness failures and repairs. These include detached launch lifetime, missing extension outputs, canceled shell-navigation waits, command-palette automation, a Save-only probe missing the earlier real terminal prompt, and native keyboard/AX text entry that did not select the requested command. The final explicit command was selected through the named Playwright session. This checkpoint makes no keyboard-focus/shortcut/IME/VoiceOver or hidden-view accessibility claim.

## Runtime, cleanup and remaining gate

macOS arm64; Electron 43.8.3; runtime Node 24.22.0; build Node 24.22.1. Fresh isolated profiles, shared storage, extensions and scratch projects; independent APFS copies of dependencies/outputs. No sign-in or agent request. Runtime logs retain an extension-inspector address collision and provider policy/sign-in warnings. No broad process-health, active-command or independent-agent continuity claim follows from terminal sessions being present.

The final native host closes naturally after real safeguards and cleanup acknowledgements. Afterwards, scoped `app.exit(0)` stops the remaining macOS application process; earlier failed instances also used scoped forced cleanup. Forced cleanup is not a graceful app-quit/restoration test. The named Playwright session and retained launch terminals are closed; only this session's temporary profiles are removed after retaining raw logs locally.

Keep the ticket open, assigned and blocking final specification approval. Authorization probes remain paused following the creator's earlier direction. No separate creator experiment verdict is obtained. Project-tab Close, the remaining direct adapters and full role/target/service/event/port matrix, registered auxiliaries, full save/backup/failure/joiner/active-work/opening/recovery/restoration/resource coverage, provider/exact-chat/tool/approval continuity, accessibility/capacity, Windows/Linux, SSH and Dev Containers remain outstanding. Replacement/startup/race and earlier authorization controls were not rerun in this ordinary-UI checkpoint. The complete inherited gate is unchanged; no follow-up replaces or weakens it.
