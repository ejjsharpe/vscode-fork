# Document-owned native menus — disposable evidence

Continues the [startup diagnostic repair](../diagnostic-startup/README.md) within [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33). Combined runtime source: **`62efec8257c`**. No production merge or PR. This checkpoint does not resolve the ticket, waive any gate, or establish Stage 1 or feasibility. No creator verdict has been obtained.

## Finding and candidate

On baseline `43d4a0646b7`, an actual renderer menu request created a native menu. The probe deliberately held its popup callback, replaced that renderer's document, installed listeners in the new document, and invoked the old dismissal callback. The new document received `-1` click cleanup and a menu-close notification. This is an actual cross-document delivery under controlled scheduling, not an observed natural user interaction. The baseline did not demonstrate an old menu action executing in the new document.

The candidate uses the existing document credential in the isolated preload, without queuing pre-bootstrap menu requests. Main validates the current sender/frame/document and the callback channel corresponding to the menu ID before opening a menu. Each click/submenu/dismissal callback checks the captured document authority again; revocation retires the callback and closes that menu. Dismissal and popup exceptions dispose the revocation subscription. No new authorization framework or retry policy was introduced.

The renderer adapter and its NativeContextMenuService caller were inspected. Auxiliary UI uses the owning workbench's imported popup adapter; actual registered auxiliary integration remains untested. Other internal or native-window roles were not certified by these probes. Item/option schema hardening beyond existing menu handling is not a completed audit.

## Evidence

| File under `evidence/` | What ran |
| --- | --- |
| `baseline.json` | Real renderer request and real replacement; deliberately held native dismissal delivered into the replacement. |
| `ownership.json` | Real current-document menu request; injected native click and dismissal delivered; post-dismissal callbacks inert. Real-wire arbitrary callback/extra-argument rejection. Injected missing-credential/non-main-frame rejection. Real replacement closed the old menu; old callbacks and injected expired request inert; fresh authorized request succeeded; neighbour generation unchanged. Native popup scheduling and close calls were intercepted for deterministic control. |
| `native.json` | Actual renderer `popup` module opened an actual native menu; `Menu.closePopup()` dismissed it and renderer `onHide` ran exactly once. Programmatic dismissal, not keyboard or mouse accessibility testing. |
| `prebootstrap.json` | Actual DOMContentLoaded menu send had no credential, opened no menu and was not replayed after bootstrap readiness. |
| `diagnostic-startup.json`, `diagnostic-ownership.json`, `reload.json`, `close.json`, `host.json` | Existing diagnostic startup/ownership, direct reload authorization, shared startup Close/disposal and host-startup regressions on the combined candidate. Their controlled/injected and remote limits remain in the originating reports. |
| `runtime.json`, `build.txt`, `typecheck.txt` | Actual process/runtime snapshot, successful client build and typecheck. |

The first menu baseline harness ended its renderer script with an IPC listener object, causing “An object could not be cloned.” Returning a serializable boolean fixed the harness; the reproduction rerun then recorded the stale delivery. No candidate menu failure was observed in the listed controls. Whole-process memory or subscription-leak coverage was not performed.

## Reproduce and environment

Launch as in the startup diagnostic report, then capture the existing lifecycle service with its two setup probes. Run `context-menu/ownership.js`, `native.js`, and `prebootstrap.js` through `diagnostic-startup/inspect.mjs MAIN_PORT PROBE`. Run `context-menu/baseline.js` on `43d4a0646b7` to observe stale dismissal delivery. All paths are under `prototypes/live-hosting/`. Run `node prototypes/live-hosting/diagnostic-startup/check-evidence.mjs` to check the saved evidence.

macOS arm64 only; Electron/runtime versions and sampled host/workbench identities are recorded in `runtime.json`. Build Node was 24.22.1. Independent APFS copies of dependencies and outputs, fresh app-owned user-data/extensions/shared-data, trusted scratch single-/multi-folder workspaces, no imported normal profile, no sign-in or provider request. No dependencies were added. Workbench captures were inspected locally; raw logs, screenshots, launch details and credentials are not published. The first shell-only capture was replaced with a WebContents capture of the actual workbench. Local logs included hidden-page font-query warnings, provider-unavailable messages and the prior buffered-event warning; these were not diagnosed as part of this checkpoint. Cleanup uses the scoped `recovery-ownership/cleanup.js` (`app.exit(0)`), not graceful-shutdown acceptance.

## Remaining gate

Keep the ticket open, assigned and blocking final specification approval. Its complete inherited gate is unchanged. Do not append a resolved decision to the map for this progress checkpoint.

Remaining direct boundaries include shared/PTY/agent-host ports and downstream service scope, restart/policy, actual auxiliary ownership, bootstrap configuration/environment, zoom/devtools, and the complete real-wire role/target/service/event/port matrix. Menus still need actual auxiliary, submenu/keyboard, navigation/crash/destruction and broader adversarial/schema coverage. Diagnostics still need real remote success/error behavior and complete user workflows.

Also outstanding: the full Stage 1 active-work/save/backup/joiner/opening/recovery/resource/restoration and isolation gate, Stage 2 exact-chat/provider/tool/approval continuity under the creator's no-sign-in choice, Stage 3 accessibility/IME/VoiceOver and capacity/performance, and explicit Windows/Linux/SSH/Dev Container coverage limitations. Sampled regression passes do not certify these unperformed requirements or the transient readiness deadline. The separate live creator experiment verdict remains required.
