# Live workbenches in one Electron window

Research for [Assess Electron support for live workbenches in one window](https://github.com/ejjsharpe/escode/issues/19), part of [One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/16).

Date: 2026-10-27. This is documentary evidence, not an architecture approval or a runtime feasibility result.

## Finding

Electron supplies the native composition primitives needed for this experience. A shell with several retained `WebContentsView` instances is a credible candidate to test. The harder problem in this fork is separating a workbench's identity and lifetime from the single native `BrowserWindow` identity currently used for configuration, IPC, focus, and shutdown. This is an inference from the API and repository evidence below, not proof that an unchanged workbench can be embedded.

## Version and evidence boundary

- Checkout examined: [`9f6477db551549b9d8b225cbc639cf5213922321`][R0].
- [`.npmrc`][R1] requests Electron **43.8.3**, with `ms_build_id=15784459`. Locally, `.build/electron/version` says `43.8.3`, and `.build/typings/electron.d.ts` identifies the same version and declares `BaseWindow`, `WebContentsView`, visibility, focus, and throttling APIs.
- The upstream `v43.8.3` tag resolves to [Electron commit `1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7`][E0]. Electron links below are pinned to that commit, not latest documentation.
- [The downloader][R2] supports either an artifact feed or upstream releases; this checkout's [product configuration][R3] has an empty `electronArtifactFeed`. Cached metadata and typings were inspected; the binary was not executed or compared byte-for-byte with upstream, and downstream patches were not audited.

## Options and disposition

These are research assessments for the human architecture decision.

| Approach | Evidence | Assessment |
|---|---|---|
| A `BrowserWindow` shell with retained child `WebContentsView` workbenches | `BrowserWindow` extends `BaseWindow`; view composition is supported. This fork already attaches child views to a BrowserWindow. [E1], [E2], [R4] | First candidate to investigate: retains a familiar native window owner, but its primary web contents must no longer stand for every project. |
| `BaseWindow` containing shell, Agents, and project views | Electron explicitly documents multiple web views in one native window. [E2], [E3] | Also credible. Makes composition explicit, but removes the implicit primary web contents assumed by existing window code. |
| Several workbenches in one renderer/document | The current entry point creates one Workbench on the document body, with one service collection and workspace/storage pair; `mainWindow` is a module-level reference. [R5], [R6] | Not a drop-in reuse path. Keeping independent service ownership, globals, DOM, commands, and disposal would require a substantial refactor. No claim of impossibility. |
| One workbench that replaces its workspace on tab selection | Current workspace/configuration/storage/trust and remote authority are constructed for one workspace context. [R5] | Insufficient by itself for the agreed independently running projects. Saved visual state is not equivalent to live workspace services. |
| Iframes | Electron documents ordinary iframe embedding and its browser/CSP constraints. [E4] | Possible web-content composition, but no evidence that the desktop preload, IPC and native-service bootstrap works unchanged inside frames. Not a shortcut established by this research. |
| `BrowserView` or `<webview>` | The former is deprecated in favor of WebContentsView; Electron discourages the latter for stability reasons. [E5], [E4] | No reason found to introduce either for new workbench hosting when the supported view primitive already exists. |
| Native macOS window tabs | Electron's tab grouping APIs are macOS-only; this fork already opts in conditionally. [E2], [R7] | Does not satisfy the agreed cross-platform shared shell by itself. |

## Electron facts that constrain the candidate

### Composition and lifetime

A WebContentsView exposes its web contents and can adopt an existing instance, but one web contents cannot be presented by multiple WebContentsViews simultaneously. The View API supplies bounds, visibility, child ordering, attachment and removal. These APIs allow retained views; they do not define the IDE's tab lifecycle. [E3], [E6]

BaseWindow does not automatically destroy attached WebContentsView web contents when the native window closes. The host must manage their lifetime. [E2]

Inference: switching project tabs can change visibility/focus while retaining each workbench, whereas closing a tab needs an explicit workbench shutdown protocol. Do not use view removal as an implicit save, shutdown, or cancellation operation.

### Focus, menus, and shutdown

`webContents.focus()`, focus/blur events, and `getFocusedWebContents()` distinguish web contents. macOS first-responder focus is distinct from native-window activation. `before-input-event` can intercept keyboard input and menu shortcuts. `close({ waitForBeforeUnload: true })` permits a page to veto unloading; the default does not wait. [E7]

Inference: shared shortcuts, project shortcuts, menu dispatch, editor focus restoration, and dirty-file vetoes need explicit routing to the active workbench. A browser-view disposal helper is not an adequate project shutdown policy.

### Background activity and resource use

`backgroundThrottling` defaults to true and affects timers, animation and page visibility. Disabling it for one web contents displayed in a BrowserWindow affects frame drawing/swapping for the whole window and its other web contents. [E8]

The Agents BrowserWindow already disables throttling in this fork. [R8] Inference: a shared host could keep more rendering active than expected. A hidden view's retention is not a guarantee about task throughput, renderer timers, power use, or terminal/agent process survival; measure these independently.

### Security and storage boundaries

WebContentsView accepts per-view web preferences. Electron has separate controls for sandboxing, preload, context isolation, and session/partition selection; the same partition shares an Electron session. [E3], [E8] Electron recommends preserving isolation and validating privileged IPC senders. [E9]

Inference: retain the existing sandbox and narrow preload bridge while adding host/workbench routing. An Electron cookie/session partition is not a replacement for VS Code workspace storage, trust, profile, or remote authority. Giving each view a new partition also needs analysis of authentication and custom protocols; it is not a free isolation switch.

### Crash behavior and accessibility

Electron exposes `render-process-gone`, but explicitly warns that multiple web contents can share a renderer process. Separate web contents therefore do not prove one-project crash isolation. [E7]

Electron supports HTML accessibility and activation when assistive technology is present. [E10] Its documentation does not prove the proposed shell-to-workbench focus order or hidden-view accessibility behavior. Those require keyboard and screen-reader checks with actual views.

### Platform differences

The composition APIs are not limited to macOS. Native tabs are. BrowserWindow documentation also distinguishes macOS occlusion/page-visibility behavior and Linux Wayland restrictions on programmatic native-window manipulation. [E2], [E1]

Inference: Mac-first testing can establish a candidate, but it cannot certify Windows menu/close behavior or Linux/Wayland focus and window decoration behavior. View switching inside one native window should not be confused with APIs that focus or move whole native windows.

## Existing integration seams

| Local evidence | Consequence to investigate |
|---|---|
| `CodeWindow` constructs a BrowserWindow, takes its id, and loads either Sessions HTML or Workbench HTML. [R8] | Introduce an explicit distinction between host-window identity and hosted-workbench identity; decide which existing callers really target each. |
| Desktop startup passes `configuration.windowId` to main/shared-process clients and creates one workspace/configuration/storage/trust context with its remote authority. [R5] | Do not give different projects one indistinguishable IPC identity or accidentally share their workspace-scoped services. |
| `getWindowByWebContents` resolves through `BrowserWindow.fromWebContents`; native host methods select windows by id. [R9], [R12] | Multiple project views need routing beyond the native host lookup. A BaseWindow replacement also affects callers expecting BrowserWindow. |
| `doFocusWindow` explicitly focuses the BrowserWindow's primary web contents after native focus. [R8] | A project view could lose focus to the shell unless this policy follows the selected workbench. |
| Main lifecycle tracks unload work by window id and negotiates renderer vetoes. [R10] | Closing one tab, reloading one workbench, and closing the host need distinct coordination; preserve dirty-file protection. |
| Agents receives its own profile and has different workbench layout/ownership contracts. [R9], [R11] | Preserve those boundaries while making Agents another hosted surface; do not assume its services can simply share a project's container. |
| Integrated browser code already creates sandboxed WebContentsViews, sets bounds/visibility, reparents views, and explicitly disposes web contents. [R4] | Reuse applicable patterns. Its hidden-view focus fallback, workspace-switch disposal, and `waitForBeforeUnload: false` cleanup are browser-specific policies, not safe defaults for project workbenches. |
| Agents may import Workbench, not the reverse. [R11] | Locate shared hosting below or outside the two concrete workbenches, or explicitly justify a layer change; do not introduce a reverse import casually. |

Remote SSH/Dev Container support is a required design constraint, not validated here. The current per-workbench remote environment is promising for retained independent workbenches, but mixed authorities, extension hosts, forwarded ports, and reconnect behavior need their own evidence. [R5]

## Bounded next experiment

After the ownership and lifecycle decisions, test one hosting candidate with the actual cached runtime and this fork. These are proposed probes, not test results.

1. Boot a shared shell, Agents, and two real project workbenches in one native window. Keep separate workspace identities, one sandboxed preload/configuration channel per workbench, and instrument message destinations.
2. In each project, maintain an unsaved file, a terminal heartbeat, an extension command, and an active task; switch repeatedly through Agents. Verify retained state and that commands never reach the wrong project.
3. Navigate between an exact chat in Agents and its central project chat editor. Verify one conversation identity and no duplicate sends, competing mutations, or lost stream updates.
4. Exercise project close, host close, reload, and veto cancellation with dirty editors and live work. Confirm intentional teardown and absence of orphan views/processes.
5. Test keyboard-only switching, menus, IME/composition, focus after dialogs, and VoiceOver traversal. Check that inactive project content is absent from interactive navigation.
6. Measure switch latency, startup, memory and idle CPU at the agreed normal/upper tab counts, including hidden, minimized and occluded states. Compare throttling policies without making background work depend on rendering.
7. Crash a project renderer in the disposable environment and inspect other projects and the shell. Record actual process allocation instead of assuming WebContents equals process isolation.
8. Record Windows/Linux and remote coverage as pending until exercised. For remote feasibility, mix local and SSH/container projects, disconnect/reconnect one, and check isolation of terminals, extensions, credentials and routing.

The research supports proceeding to a hosting decision and a runtime probe. It does not select BrowserWindow versus BaseWindow, establish a resource budget, validate remote compatibility, or approve implementation.

## Sources

[R0]: https://github.com/ejjsharpe/escode/tree/9f6477db551549b9d8b225cbc639cf5213922321
[R1]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/.npmrc
[R2]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/build/lib/electron.ts#L106-L116
[R3]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/product.json#L36
[R4]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/platform/browserView/electron-main/browserView.ts
[R5]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/workbench/electron-browser/desktop.main.ts#L133-L345
[R6]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/base/browser/window.ts#L7-L23
[R7]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/platform/windows/electron-main/windows.ts#L204-L207
[R8]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/platform/windows/electron-main/windowImpl.ts
[R9]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/platform/windows/electron-main/windowsMainService.ts#L1726-L1844
[R10]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/platform/lifecycle/electron-main/lifecycleMainService.ts#L435-L625
[R11]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/sessions/README.md
[R12]: https://github.com/ejjsharpe/escode/blob/9f6477db551549b9d8b225cbc639cf5213922321/src/vs/platform/native/electron-main/nativeHostMainService.ts#L395-L465
[E0]: https://github.com/electron/electron/commit/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7
[E1]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/api/browser-window.md
[E2]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/api/base-window.md
[E3]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/api/web-contents-view.md
[E4]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/tutorial/web-embeds.md
[E5]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/api/browser-view.md
[E6]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/api/view.md
[E7]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/api/web-contents.md
[E8]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/api/structures/web-preferences.md
[E9]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/tutorial/security.md
[E10]: https://github.com/electron/electron/blob/1c0ee213f150fc4a0d06304dcedabd9b2e8ce0f7/docs/tutorial/accessibility.md
