# Ticket #41 — native routing and hidden-view isolation

Named bounded scenarios: (1) selected logical workbench routing and stale native callbacks; (2) actual native selected-only view attachment with retained background progress. Completed source `8f3666d77701acd32db220b8aba463219f1f06a0`, branch `implement/spec-37-ticket-41`, worktree `work/ticket-41`. Confirmed `cf36c4a7d2bcd71d83bd9a19f8d4b5908140fd27` integration ancestry before starting; merged latest integration before final commit (only the spec-37 evidence README was added). No issue write or push.

## Changes and reach

- Main windows service now resolves a native BrowserWindow through the host's selected logical workbench, including shell focus. Focused auxiliaries resolve their main-owned parent explicitly. Native focus/blur and project selection events use logical IDs, and native host reactivation restores selected workbench focus. Native menus use this lookup rather than comparing native IDs to logical IDs.
- Only the selected WebContentsView is attached to the host. Switching detaches inactive views while retaining their objects, WebContents and background activity. Inactive replacements stay detached; existing recovery/removal paths tolerate nonchild removal. This repairs the macOS AX failure observed by root on `cf36c4a7d2b`, where setVisible(false) still exposed the previously focused dirty editor.
- Native menubar updates accept the selected workbench's current document. Delayed menu installation rechecks the original contents/generation, and menu-item closures reject foreign/replacement owners instead of reusing new selection. Queued `sendWhenReady` commands capture original contents/generation; native commands do not wait for a different bootstrap document.
- Existing native dialog queues now accept a main-only lifetime guard and check it before display and before publishing results. The native RPC wrapper supplies the authenticated originating connection guard, rejects extra dialog arguments, and the native service also preserves exact contents/generation. Save/open queue locks still release after errors. Fullscreen-to-position callbacks receive the same connection check before applying delayed bounds.
- Native profiling now targets the exact workbench WebContents rather than the shared shell's BrowserWindow. It validates its original owner before later protocol effects/publication and releases the inspector on failure. The native wrapper validates profile arguments and injects its connection guard.
- Auxiliary ownership is captured in main from actual opener WebContents and the main-resolved parent ID, pending options are keyed per opener, and registration requires the actual main-frame opener/current parent generation. Parent identity is readonly on the auxiliary. Child documents receive main-owned auxiliary-role bootstrap; protected preload credentials authenticate direct registration. Parent expiry closes its children. Parent-renderer native calls may target only their currently registered auxiliaries for classified native controls; nested foreign targets and direct auxiliary-parent impersonation reject before effects.
- Existing direct bootstrap configuration/environment, diagnostic, zoom, DevTools and raw-reload handlers retain their exact sender/main-frame/document guards and lifecycle route. Their full native matrix is unperformed; no authorization probe was run.

Relevant interfaces/callers, native/app registrations, auxiliary preload/constructor, windows/menubar/native service consumers and test fixtures are updated. Dialog native APIs are injected as an external system boundary for public queue tests, with the app construction caller updated. No second lifecycle manager, provider owner, permission broadening or new dependency was added.

## Shared #40 foundation

Native worker supplied `c0416e364e1240ef4a615027eb2e5607ac554da0`, cherry-picked here as `fbe798319702a261f2c4bc97070dadf710128bee`: main-owned document scope/bootstrap helper and trusted port-context types. Preserve these equivalent changes when merging #40's full branch. #41 leaves utility transport and extension/worker wrapper implementation to #40; it only changes the shared caller identity check and native wrapper section.

The existing lifecycle service's `node:crypto` import was changed to equivalent `crypto`, matching the existing Electron renderer import map. This one-line loader repair makes existing main-window service tests executable. It changes no lifecycle behavior or outcomes; #42/#43/#45 retain those tasks.

## Checks and failure accounting

- Original public dialog regression: **RED** because expired owners still received the native result; **GREEN** after queue guards. File save/open variants also prove late-result rejection and reusable locks. Logs `test-41-dialog-{red,green}.log`.
- Exact-workbench profiler regression: **RED** because the BrowserWindow-based profiler tried `contents.webContents.debugger`; **GREEN** after exact-WebContents routing. Owner-loss case verifies no late result and released inspector. Logs `test-41-profile-{red,green}.log`.
- Native service scopes: the baseline rejects a legitimate owned auxiliary target and accepts auxiliary-parent impersonation; current source permits the former and rejects the latter, nested foreign targets and expired connections. Tests use main-issued in-memory document connections at the public wrapper boundary, not source authorization probes. Existing lifetime diagnostic logging is captured at its logging boundary during these tests.
- Final `scripts/test.sh` batch of dialogMainService, dialogMainUtils, windowImpl, windowsFinder, prototypeNativeChannel and windowProfiling suites: **23 passing, 2 platform-specific pending**, exit 0. Log `test-41-current.log`.
- `npm run typecheck-client`: **passed** on final cross-client types; log `typecheck-41-final.log`. Initial test-fixture implicit types/overload inference were corrected before the passing run.
- `npm run build-fast -- --client-only`: **passed**, log `build-41.log`. Initial copied fixture lacked build-scoped esbuild; independently APFS-copying refreshed integration/build/node_modules repaired that fixture. No symlinked/shared dependencies were introduced.
- Targeted ESLint of 19 changed TypeScript targets: **passed**, `lint-41-final.log`. `node --check prototypes/live-hosting/check-host-routing.cjs` and `git diff --check`: **passed**.
- Existing windowImpl/native tests initially failed module loading because the renderer import map lacks `node:crypto`. The #40 lifetime import repair plus the one-line lifecycle import repair resolved this; the final existing windowImpl suite passes. No loader failure was counted as a product pass.

## Real Electron check

Committed `prototypes/live-hosting/check-host-routing.cjs` extends the existing disposable-native check area. Run from repository root with an explicit fresh `ESCODE_CHECK_PROFILE` and the source Electron executable. Current command used `.build/electron/escode.app/Contents/MacOS/escode prototypes/live-hosting/check-host-routing.cjs`, with profile under this chat's `work/native-host-41/final-profile`.

The original **RED** run saw all three views attached instead of one. Final **PASS** asserts selected-only actual Electron attachment, native-host-to-selected-logical identity, retained inactive WebContents, a detached renderer's advancing JavaScript heartbeat, inactive replacement staying detached, inactive disposal preserving selection and final-project disposal revealing Agents. Logs `test-41-host-{red,green,current,final}.log`. This checks public hosting boundaries and ordinary native objects; it does not replace real editor/terminal/provider or AX evidence.

## Root handoff and limits

Root should rebuild the final integration source, rerun the previously failing native AX sample with a dirty single-folder editor and active saved multi-folder project, and verify actual native Save/menu actions affect the selected project, shell/Agents focus and dialog context. Keyboard-only, IME, VoiceOver, real auxiliary editor windows and the full direct/native matrix remain unperformed here. Two platform-specific unit cases remain skipped by their existing macOS conditions. Windows/Linux, actual remotes, provider work/sign-in and authorization probes were not executed. No Stage 1, full #35 acceptance or creator runtime verdict is claimed.

#40 remains necessary integration. #42 handles Close/reload outcomes; #43 handles quit; #46 ordinary opening; #48/#49 profile/restoration semantics. These are not marked complete by this native-routing slice.

## Integration merge

Merger confirmed clean `integration/spec-37-complete` and merged the ticket branch with `--no-ff` at `52f6f8033eeba687db890be54e1b39289292d105` (`Merge #41 native project routing and hidden-view isolation`). The #40 foundation equivalence is retained. No other source edits, pushes or issue writes in merger role.
