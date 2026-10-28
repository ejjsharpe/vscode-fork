# IPC refinement: failed renderer-lifetime gate

**Stage 1 incomplete; renderer-lifetime authorization failed. Creator review pending. Do not merge.**

Decision: [Revalidate live workbench hosting after IPC refinement](https://github.com/ejjsharpe/escode/issues/25). This is a second disposable experiment starting from `48a388f6849`. It does not supersede the complete [three-stage acceptance contract](https://github.com/ejjsharpe/escode/issues/23).

## Changes under test

- The Electron transport obtains `window:<logical ID>` from the main-owned retained-view registry. The client handshake is consumed but cannot replace that identity. Unregistered WebContents get an unregistered identity, not a claimed internal role. This resolver is used by this disposable app, not every generic IPC transport.
- A nativeHost channel adapter explicitly lists own-workbench methods/events and application-wide methods/events. It rejects mismatched caller IDs, foreign/unknown nested target selectors, and unclassified methods. Scoped native events filter by logical workbench. Application-wide service exposure is explicitly preserved in the allowlist. This is not a complete classification of every main-process channel.
- An extension-host adapter records the logical workbench and Electron main frame when it creates an extension-host handle. Calls and subscriptions check that owner. Start validates the destination before port transfer. **The frame-based lifetime check proved insufficient.**
- IPC transport disconnects on main-frame navigation, crash or destruction; replies check the connection and captured frame. These changes are implemented, but delayed reply/subscription race acceptance was not performed.
- Utility-process lifecycle matching now compares the logical workbench ID instead of the shared native BrowserWindow, and observes renderer crash/destruction. Port destinations are logged. The prior comparison could terminate Agents' extension host when another project loaded. This is a source-supported explanation, not a definitive reconstruction of the previous run. The fresh runs show one initial extension-host startup per workbench; the reload run then shows only the tested project's host exiting/restarting in the captured interval.

## Results

| Check | Result and evidence |
| --- | --- |
| Real boot | One native host, real Agents, single-folder and saved multi-folder project views. See `runtime.json` and the two filtered runtime logs. Screenshots were inspected. They capture individual renderer surfaces, not the composed native window. |
| Caller argument and handshake spoofing | Passed the 24-case read-only sample in `caller-results.json`: 18 unauthorized calls rejected; six own-workbench calls succeeded. Handshake claims included Agents, shared-process and the actual project. This does not validate all internal/shared-process paths. |
| Explicit/nested target selectors | Foreign/unknown targets rejected in the sampled PID, native-handle and maximized-state calls. Auxiliary-window ownership was not exercised. |
| Initial port routing | Logs identify extension-host/utility-worker ports sent to WebContents 2/3/4 for logical workbenches 100000/100001/100002, respectively. This is destination evidence, not a complete hostile-port/lifetime pass. |
| Reload revokes extension-host authority | **FAILED.** Multi-folder renderer 100002 created extension-host handle `5`. After a real document reload, its new connection called `extensionHostStarter.enableInspectPort('5')`. The adapter authorized the old handle and the service returned `false`, rather than rejecting at the boundary. `false` means the unstarted scratch host had no inspector to enable; it is not an authorization rejection. See `lifetime-created.json` and `lifetime-result.json`. |

The stale-handle check uses an unstarted scratch extension host to avoid manipulating a real project's running extension host. The failure is authority surviving document replacement within the same logical workbench. It does not demonstrate access from arbitrary web content, cross-project code execution, or a fundamental Electron limitation. Electron's main-frame object identity is insufficient as a document-generation token in this observed reload. The next revision needs explicit main-owned generation/connection identity and revocation of handle ownership, not just a WebContents or frame reference.

Stopped at the failed required invariant. The earlier accepted product behavior and hosting primitive are not disproven; this adapter is incomplete and the architecture's implementation boundary needs revision.

## Unperformed requirements and limits

- The complete first gate: event visibility and legitimate event delivery, auxiliary ownership, utility-worker authorization, all native/main service channels, internal-to-renderer authority separation, delayed deliveries, crash/disposal races, and legitimate named coordinator operations. The current utility-worker channel remains unwrapped; named navigation/close/reload coordination is not implemented. These omissions are not passes or evidence that the architecture cannot work.
- Remaining Stage 1: profile/storage/trust independence and propagation, dirty editors and background task/debug/terminal progress, native-menu routing, lifecycle vetoes and backups, coordinated close/quit, restore/unavailable workspace behavior, and opening/CLI compatibility. The raw diagnostic reload does not test approved project reload or lifecycle vetoes. The launcher requested fresh empty app-owned storage; no independent before/after audit of the normal user profile was performed.
- All of Stage 2: exact chat/provider identity, drafts/attachments/approvals/streaming, executor ownership after project closure, and Copilot Cloud continuity. No provider passed. The fresh profile displayed the standard sign-in onboarding; authentication was not needed for these IPC probes and was not imported or bootstrapped.
- All of Stage 3: accessibility, keyboard/IME, crash isolation, performance/capacity and resource measurements.
- macOS/local only. Windows/Linux and SSH/Dev Container runtime support remain unvalidated. Independent per-workbench remote bootstrap is inherited; no new remote acceptance result is claimed.

## Reproduce

Use the disposable `prototype/live-workbench-ipc-refinement` branch, not production. Runtime versions are captured in `runtime.json`; macOS build is recorded in `platform.txt`. Build Node 24.22.1; client source was rebuilt with `npm run build-fast -- --client-only` and checked with `npm run typecheck-client`. Dependencies, Electron and compiled built-in extensions are the independent copies inherited from the first probe; extension build freshness was not independently revalidated.

1. Run `bash prototypes/live-hosting/run.sh` with the repository launch skill. It supplies an explicitly missing source profile and fresh user-data/extensions/shared-data directories, plus scratch workspaces. Keep its parent terminal alive under an executor that cleans up descendants. Never seed a real user profile for this test.
2. Attach a unique Playwright CLI session to the returned CDP endpoint. Identify the single-folder target from `tab-list`, capture and inspect its screenshot, then run `ipc-probe.js` with `run-code --filename=...`. These diagnostic clients replace the renderer's normal IPC connection. Exit this disposable run and launch afresh before another scenario.
3. For the lifetime test, select the multi-folder target and inspect its screenshot. Run `lifetime-create.js`; record the returned ID. Use Playwright `reload`, wait for the workbench to render, then capture and inspect a fresh screenshot. Set the old-host literal in `lifetime-check.js` to the ID actually returned (the captured run used `5`), then run it. The required result is an authorization rejection; the captured run returned normally.
4. Stop on this failure. Use the launch-info main inspector to exit only this scratch instance, and close only its Playwright session. The captured cleanup used `app.exit(0)`; this is forced disposable cleanup, not a graceful-quit acceptance result.
5. `node prototypes/live-hosting/ipc-refinement/check-evidence.mjs` checks the saved observations, including the **failure**. It is not a test asserting acceptance.

No PR or production merge. The ticket stays open for the creator's live review; final specification approval remains blocked.
