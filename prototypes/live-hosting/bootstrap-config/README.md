# Workbench startup configuration — disposable checkpoint

Continues [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33) from [the bootstrap UI checkpoint](../bootstrap-ui/README.md). Runtime source: **`c4385c17be0`**, on `prototype/bootstrap-config-ownership`. No production merge or PR. The full inherited acceptance gate remains on the ticket; this checkpoint does not establish Stage 1 or feasibility.

## Finding and candidate

The baseline configuration object handler returned a target workbench's startup configuration to a neighbouring project and an unregistered auxiliary renderer over actual Electron IPC. The own-workbench control succeeded. Extra arguments were also accepted. The probe records booleans and ownership comparisons only; no configuration, environment or credential contents were published.

The candidate binds the configuration object to its existing CodeWindow owner and reuses the experiment's exact-document authentication. The preload's own startup fetch awaits its main-owned authorization; explicit early requests reject without replay. There is one caller of `createIPCObjectUrl`, updated together with its interface, implementation and preload. This is a bounded disposable adapter change, with no new dependencies or authorization framework. The original regression command failed at “Neighbour must not retrieve target configuration”; its repaired rerun passed.

## Collected evidence

| Evidence | Result and limits |
| --- | --- |
| `evidence/baseline.json` | Own controls succeed; actual neighbour/auxiliary requests and unexpected arguments are accepted. |
| `evidence/ownership.json` | Agents and both projects retrieve their own configuration; actual neighbour, auxiliary and extra-argument requests reject. The auxiliary is an unregistered test window, not a complete registered-auxiliary integration. |
| `evidence/transitions.json` | Actual document replacement and early DOMContentLoaded explicit request. Early request rejects, normal preload bootstrap succeeds after authorization, no explicit request is replayed, and a later explicit request succeeds. Main-event injections cover missing/guessed/foreign/expired credentials, extra arguments and absent frame; these are distinguished from actual wire tests. Neighbour generation is preserved. |
| `evidence/reload.json`, `environment.json`, `diagnostic.json`, `menu.json`, `close.json`, `host.json` | Previously sampled controls rerun successfully before testing was redirected: reload phases, shell environment, diagnostic startup, menu ownership, shared startup Close/disposal and host-startup interruption. The original reports' injection, timing and synthetic-remote limitations remain. |
| `evidence/runtime.json`, `build.txt`, `typecheck.txt`, `failures.json` | macOS arm64, Electron 43.8.3, runtime Node 24.22.0; build Node 24.22.1. Incremental client build, client typecheck and diff check passed. Setup and automation failures are recorded separately. |

Independent APFS clone copies supplied dependencies, Electron, client and built-in outputs; there are no shared node_modules symlinks. The initial repository state was clean. Profiles, extensions, shared storage and projects are disposable and isolated. No existing user profile was seeded, no sign-in was performed and no provider request was sent. Screenshots and raw logs remain local.

Logs retain an extension inspector address collision, an onWillCreateProfile buffered-event warning, and sign-in/provider warnings. This checkpoint makes no broad extension-process health or provider-survival claim.

## User-directed change of investigation

The creator reported a Codex “This content can't be shown” notice and asked for another way to progress. Authorization probes stopped. The session continued with ordinary product UI work and kept outstanding coverage unvalidated; it did not attempt to override that restriction or reinterpret missing checks as passes. The already collected results above remain evidence of their stated scope only.

The normal UI follow-up uses the same runtime source, a fresh isolated instance, and only supported app UI actions. Its disposable settings use `window.dialogStyle: custom`, `files.hotExit: off`, `files.autoSave: off`, `window.confirmBeforeClose: never`, and terminal exit confirmation. Those settings expose dirty-file decisions in the workbench. The earlier native-confirmation explanation was not established; the later ordinary Close Window command instead showed an unclassified-operation warning. No original profile is modified.

## Reproduce

Prepare independent dependencies and all built-in outputs. Build with `npm run build-fast -- --client-only` and typecheck with `npm run typecheck-client`. Follow `.agents/skills/launch/SKILL.md`; run `bash prototypes/live-hosting/replacement-readiness/run.sh` in a retained terminal and read its new `scratch/launch.json` for the dynamic inspector/CDP ports. Visually inspect the rendered workbench before interaction.

The earlier probes run with `node prototypes/live-hosting/diagnostic-startup/inspect.mjs MAIN_PORT PROBE_PATH`, after the existing `lifecycle-replies/observe.js` and `recovery-shutdown/capture-service.js` setup. Paths live under `prototypes/live-hosting/`. The configuration probes are `bootstrap-config/ownership.js` and `bootstrap-config/transitions.js`. They are retained as already collected evidence; the session's later work does not resume authorization testing. `node prototypes/live-hosting/bootstrap-config/check-evidence.mjs` verifies saved record consistency only.

For ordinary product UI, attach a uniquely named Playwright CLI session to the current CDP port and run `product-ui.js` via `run-code --filename`. Use the shell's displayed project links, use the exact **File: New Untitled Text File** command from the command palette. A generic New shortcut can create a chat when chat is focused. Do not reuse tab indexes across launches.

## Ordinary product UI result

The normal UI run preserved distinct dirty editors in the single-folder and multi-folder projects over three cycles through Agents and both project links. Both dirty title markers remained, and Agents stayed present. The editor-close dialog offered Save, Don't Save and Cancel. Cancel preserved text and dirty state; Save wrote the exact expected text into the single scratch workspace and closed that editor, while the neighbouring dirty editor remained intact. See `evidence/product-ui.json` and `evidence/editor-save-cancel.json`. These are editor safeguards, not project Close acceptance.

The ordinary **Close Window** command failed with **Unclassified/coordinator-only native operation: closeWindow**. That is a functional failure in the disposable adapter, recorded without changing it while authorization work is paused. It blocks the corresponding product gate; the editor-only checks do not repair or waive it.

The UI automation required several harness corrections: prevent waiting for canceled shell-link navigation, account for chat-focused New behavior, match the recently-used command's title rather than an unstable full accessible name, and avoid carrying tab indexes between launches. Playwright reported document focus for every page, so no native keyboard-focus, hidden-view accessibility, or VoiceOver claim follows from these results.

To repeat the editor controls after `product-ui.js`, select the single-folder workbench, use the ordinary Close Editor shortcut, select Cancel and verify the dirty text remains. Close that editor again, select Save, and use the simple Save As picker to write `product-state.txt` inside the single scratch folder. Read the file from disk and compare its exact text; verify the other project still shows its dirty text. Use the real dialog, not injected lifecycle replies.

Disposable app instances were stopped with scoped `app.exit(0)`, the named Playwright session was closed, and only this session's temporary profiles were removed after retaining logs locally. Forced exit is cleanup, not graceful-shutdown acceptance.

## Remaining gate

Keep the ticket open, assigned and blocking final specification approval. No creator experiment verdict or resolved map decision is recorded. Remaining direct boundaries and the complete authorization matrix remain unvalidated. This includes registered auxiliaries, shared/PTY/agent-host ports and downstream scopes, and restart/policy.

The complete Stage 1 active-work/save/backup/joiner/opening/recovery/resource/restoration/isolation gate, Stage 2 exact-chat/provider/tool/approval continuity, Stage 3 accessibility/capacity, and Windows/Linux/SSH/Dev Containers remain pending. Ordinary product checks and sampled regressions do not certify failed or unperformed prerequisites. The separate live creator verdict remains required.
