# Disposable live-workbench hosting probe

**Verdict: incomplete Stage 1; sender-binding acceptance gate failed. Not evidence of full feasibility or of fundamental Electron infeasibility. Creator review pending. Do not merge.**

Question: [Validate the selected hosting architecture with live workbenches](https://github.com/ejjsharpe/escode/issues/23), under [One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/16).

## Build and scope

Run on macOS 26.3.1 (25D2128), Electron 43.8.3 / Chromium 150.0.7871.250 / Electron Node 24.22.0. Source base: `ffd7973948bdb469993485c2662483205d983223`. Build Node: 24.22.1. Client sources were freshly transpiled with `npm run build-fast -- --client-only`. Existing compiled built-in extensions and independent copies of dependencies/runtime were copied from the original checkout; their original build freshness was not independently verified. The original checkout and its uncommitted glossary changes were left alone. No production merge or PR.

The experiment creates one real BrowserWindow shell and three real WebContentsViews with the normal sandbox/preload and workbench entry points. The CodeWindow registry uses distinct logical IDs; native APIs still receive the genuine shared BrowserWindow. Renderer destinations use each workbench's WebContents. The native host and logical workbench identities are not interchangeable. Workspace/configuration/remote-authority bootstrap remains per CodeWindow, but remote runtime behavior is untested.

This is a startup/routing probe, not a lifecycle-complete implementation. Project close is deliberately blocked, and native host close is intercepted, because the existing native-window shutdown coordinator has not been adapted to hosted workbenches. The experiment was cleaned up with `app.exit(0)`; this is forced disposable cleanup, **not** a successful coordinated-quit test.

## Observed evidence

| Surface | Logical workbench | Native host | WebContents | Renderer PID | Initial local extension host PID |
| --- | --- | --- | --- | --- | --- |
| Agents | 100000 | 1 | 2 | 82650 | 82660 |
| Single-folder project | 100001 | 1 | 3 | 83647 | 83673 |
| Saved multi-folder project | 100002 | 1 | 4 | 83661 | 83704 |

`identities.json` records one native window with three attached children and the actual runtime versions. `runtime-evidence.txt` records normal workbench loads and extension-host startup. Agents also restarted its local extension host during this run; the cause was not established and this is not a clean lifecycle pass. These observations support successful initial routing/boot, not complete extension-command or port-security coverage.

`agents.png` and `multi.png` are inspected CDP captures of the actual workbench renderers. `host.png` and `launch.png` capture only the shell surface: Electron's capture did not include child-view composition, so those files must not be represented as full native-window screenshots. `focus-probe.json` samples visibility after selecting the multi-folder view: only that child remained visible over six samples. The app was not foreground, so no keyboard-focus conclusion follows from this probe.

The first launch was blocked by the existing vscode-file resource guard, which enumerates native windows. The revised probe recognizes registered workbench WebContents while retaining sandboxing, the normal preload, and existing frame checks. Electron's [security guidance](https://www.electronjs.org/docs/latest/tutorial/security) was consulted before adjusting this guard. This narrow change is not a full security audit.

## Failed acceptance check

From the real multi-folder renderer (logical ID 100002), a read-only `nativeHost.getProcessId` call supplied each workbench ID in turn. Main returned Agents PID 82650, single-folder PID 83647, and caller PID 83661. An unknown ID returned null. See `sender-probe.js` and `sender-probe.txt`.

The origin-validated IPC connection does not bind the supplied native-host argument to the authenticated workbench sender. The transport scopes messages by WebContents, but the service proxy accepts a caller-supplied window-ID argument. Merely separating IDs and redirecting replies does not fulfill the accepted architecture's sender-binding requirement. This test does not demonstrate an exploit from untrusted web content; it demonstrates that the proposed per-workbench binding is absent in this integration.

The probe creates and disposes a fresh IPC Client, which replaces that renderer's existing main-process connection. It is intentionally the last test in this disposable run. Reload/relaunch before any further scenario; do not infer post-probe usability. The PID lookup is read-only, and no cross-project file/terminal/debug mutation was attempted.

The required next refinement is a concrete sender-bound native-service interface: derive the caller identity from the registered WebContents, distinguish permitted explicit cross-workbench operations, and define stale/disposed-target behavior. Re-test the binding before continuing. Keeping retained views is still a viable candidate; this result does not establish whether the full contract can be achieved.

## Requirements not performed

- Full extension-host port destination assertions, extension commands and hostile/stale-sender matrix.
- Distinct profiles/themes, trust independence, shared-profile propagation, workspace storage assertions. The two fixture projects rendered in Restricted Mode.
- Dirty editors, terminal heartbeat, tasks, debugging, Git/native menu routing and state retention across repeated switches.
- Project close/reload, veto/failed backup, resource teardown, host close, quit, restore and unavailable workspace recovery.
- Stage 2: exact-chat identity, drafts/attachments, streaming, approvals, tool execution after closure. No provider continuity passed. The isolated profile had no GitHub sign-in; Cloud Agent reported sign-in required, and that was not pursued after the Stage 1 failure.
- Stage 3: IME, VoiceOver, keyboard-only switching, crash behavior, capacity, latency or resource measurements. No performance claims.
- Windows/Linux and SSH/Dev Container runtime support. Per-workbench remoteAuthority bootstrap was retained; no remote connections were exercised.

## Reproduce

Use this throwaway branch only. On a fresh clone, install the repository dependencies and build the product using the repository instructions (`npm run install-fast`, then `npm run build-fast`). Do not share/symlink node_modules. The supplied launcher uses isolated user-data, shared-data and extensions directories and scratch workspaces.

Run `bash prototypes/live-hosting/run.sh` from a normal unsandboxed terminal. The launch result is in `prototypes/live-hosting/scratch/launch.json`. For an agent executor that kills background descendants at command completion, keep its launching shell/session alive while inspecting. Use the returned CDP port with a unique Playwright CLI session; select the multi-folder workbench target by its title, not an assumed tab index. Inspect screenshots before interacting.

Run the last, destructive-to-connection probe with `playwright-cli -s=<session> run-code --filename=prototypes/live-hosting/sender-probe.js`. IDs start at 100000 and assume a clean launch with Agents, then the single-folder project, then the saved multi-folder project. Use no real workspaces.

For native diagnostics, `HOSTING_LAUNCH_INFO=prototypes/live-hosting/scratch/launch.json node prototypes/live-hosting/main-eval.mjs '<expression>'` evaluates an explicit trusted diagnostic expression through the launcher's main-process inspector. The captured expression and output shape are described in `identities.json`; normal application use must never expose this debugging facility.

Disconnect the dedicated Playwright session and terminate only the PID/process tree recorded by this launcher. Delete only its returned disposable run directory once its needed evidence is saved. Close buttons are intentionally unavailable in this partial probe.

Run `node prototypes/live-hosting/check-evidence.mjs` to assert the saved evidence's consistency. It asserts the observed **failure**, not acceptance. Validation performed: client transpilation, client TypeScript check, repository layer checks, shell syntax check, diff whitespace check, and evidence self-check. Impeccable's mechanical detector returned no findings on the shell module. No claim of full accessibility or UI validation follows.
