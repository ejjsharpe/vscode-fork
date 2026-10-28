# #40 shared utility and owned profiling implementation

Worktree: `work/ticket-40-shared`, branch `implement/spec-37-ticket-40-shared`. This is the shared/profiling half, **not a whole-ticket #40 completion claim**. No provider work/sign-in, live authorization probes, issue writes, push or production merge.

## Integration/source

- Started at integration `52f6f8033eeb` (#41). Merged utility foundation `4389ce3eb0d6` as `539ebc0ea72`; retained equivalent c041 interfaces already in #41.
- Owned-process self-profiler helper commits `c29422d5c80` and test-overload repair `565e4dad4de` supplied to native worker and included here. Native coherent `cf8487873be` merged as `9cc923a0449`, preserving #41 native auxiliary/dialog/selected-window routing. Worker fixture repair `450dfb0103c` cherry-picked as `cde058bc9fb`.
- Native PTY/native-target followup `25f486841b4` merged as `b1fa67d4e81`. Latest integration `546c7fe98a5` merged directly as `b96ce1e1667`; ancestry check passed. Only conflicts were equivalent import ordering; both required imports preserved.
- Final latest-integration merge: `464e22d3ab1` (native #40 integration) merged as `8ca2feb61386`; no tree changes, ancestry check passed. Final branch tip `8ca2feb61386bb43993249c8d9dc02b5cc534e0c`.
- Implementation commit: `066683cf006` (37 files, focused checks/lint passed). Worktree clean after commit.

## Implemented scope

- Playwright initialization requires the current trusted logical workbench; auxiliaries and private/inherited methods are rejected. Each renderer gets its own group remote service. Delegated group calls append `{nativeConnectionContext:ctx}` and event args `{id,nativeConnectionContext:ctx}` to main; the native worker's adapter independently resolves/validates the original lifetime, not serialized renderer IDs. Replies and group operations recheck liveness; expired groups rely on main-owned cleanup.
- Shared application channels use a small named public-method/event wrapper, live workbench validation before/after calls and delivery filtering after revocation. Existing extension/MCP/profile/sync/telemetry/tunnel permissions and deliberate application scope remain. Raw endpoint profiling is main-only; no renderer host/port authority. GitHub's existing per-physical-connection leases/credential ownership are preserved and wrapped. Reverse sync utility routing chooses a current project/Agents role.
- Manual sync task IDs bind to their creator, foreign task control fails explicitly, connection expiry stops owned tasks, and late creation stops without publishing an ID. Manual event routing filters ownership. Channel disposal also invalidates pending creations.
- Shared tunnel IDs bind to their creator, start is one-use and project remote authority must match trusted scope. Foreign handle control rejects. Expiry destroys pending/current tunnels; the existing service tombstone handles late opening.
- Git cancellation IDs are namespaced to exact connections, reset/cancel kills only owning processes, and a main-only validation callback runs before each spawned command and after async boundaries. Revocation between read/validation and checkout prevents later mutation. Readonly IPC arity excludes renderer injection of the new internal native operation selector.
- Agent Host profiling uses the native worker's diagnostic-only protected port with no provider clientId. The UI uses optional startCpuProfile/stopCpuProfile instead of a renderer-selected inspector endpoint. The diagnostic transport resets on WillRestart, rejects/closes late old ports without replacing a newer one, and diagnostic-only windows receive restart notices without acquiring provider authority.
- Both manual extension profiling and automatic unresponsive-host profiling use an existing local extension host's main-owned starter capability. The responsive event captures the exact originating manager, not the current first host. `startCpuProfile(starterId)`/`stopCpuProfile(starterId,opaqueHandle)` stay behind the native worker's existing exact owner/lifetime authorization.
- Trusted extension-host bootstrap consumes a main-issued nonce before extension execution, opens an ordinary inspector on `127.0.0.1:0` only if no existing inspector exists, and attests its exact spawned PID plus inspector URL once via its real utility parent control port. Main retains the URL; private startup attestation is filtered from renderer dynamic messages. Existing explicit developer inspector flags and getInspectPorts remain. Capture matches the attested opaque inspector path/port and forces WebSocket address from main-held data (including wildcard-host normalization); no renderer endpoint selector. Original process/lifetime are rechecked throughout and on result publication; late sessions stop/close.
- Base inspector profiling now accepts a main-only owner-validation hook at target selection/connect, debugger enable, profiler enable, sampling interval and start boundaries, closes late connections/sessions, and preserves existing paused-debugger behavior. Stop remains allowed cleanup of the same owned session, but stale results are rejected and the client closes in finally.

## TDD and checks

Invoked TDD and root instructions/glossary read; public test seams are preapproved in `work/spec-37.md`. All service fixtures use fake IPC/network/process boundaries; no provider/auth operations. Dependencies/out/.build are independent APFS copies, no node_modules symlink.

Red logs show missing-rejection or missing implementation failures followed by green repairs:

- `test-40-playwright-red.log` / `test-40-playwright-green.log` (4 passing including existing Playwright service regression).
- `test-40-self-profile-red.log` / `test-40-self-profile-green.log` (3 passing including runner registry check); `node --input-type=module` actual local self-capture also passed, `test-40-self-profile-node.log` (9 nodes/30 samples).
- `test-40-extension-profile-red.log` / `test-40-extension-profile-green.log` (2 passing).
- `test-40-shared-channel-red.log` / `test-40-shared-channel-green.log` (3 passing).
- `test-40-sync-red.log` / `test-40-sync-green.log` (3 passing).
- `test-40-tunnel-red.log` / `test-40-tunnel-green.log` (3 passing).
- `test-40-git-red.log` / `test-40-git-green.log` (3 passing); readonly selector regression additionally red then green in `test-40-git-selector-{red,green}.log` (4 passing, including valid readonly success).
- `test-40-owned-extension-red.log` / `test-40-owned-extension-green.log` (3 passing), expanded own/foreign/replacement/expired native starter + original-session tests in `test-40-owned-extension-final.log` (12 passing including new base CDP boundary regressions).
- `test-40-profile-boundary-red.log`: holding Profiler.enable, expiring the owner, then releasing used to start later sampling/profiling. Green repair plus late connection and retained debugger-pause tests in final owned-extension log.
- `test-40-agent-profile-restart-red.log`: 21 passing/1 expected missing-rejection failure; green: 22 passing. Uses the public diagnostic transport connection with fake external ports to observe late close/new acquisition retention.

Exact comprehensive focused command (before the final diagnostic-port and readonly-arity slices; those have separate current-source checks above):

```sh
npm run build-fast -- --client-only
scripts/test.sh --run src/vs/base/test/node/profiling.test.ts --run src/vs/platform/profiling/test/node/selfProfilingService.test.ts --run src/vs/platform/browserView/test/node/playwrightChannel.test.ts --run src/vs/platform/sharedProcess/test/common/sharedProcessChannel.test.ts --run src/vs/platform/tunnel/test/node/sharedProcessTunnelChannel.test.ts --run src/vs/platform/userDataSync/test/common/userDataSyncServiceIpc.test.ts --run src/vs/platform/git/test/node/localGitChannel.test.ts --run src/vs/platform/git/test/node/localGitService.test.ts --run src/vs/workbench/services/extensions/test/electron-browser/extensionHostProfiler.test.ts --run src/vs/platform/extensions/test/node/extensionHostProfiling.test.ts --run src/vs/platform/windows/test/electron-main/prototypeNativeChannel.test.ts --run src/vs/platform/github/test/common/githubChannel.test.ts
```

Result: **193 passing**, `test-40-shared-focused-final.log`. This includes existing real temporary-repository Git and GitHub physical-connection regressions. Native worker's main/PTy tests remain its separately recorded evidence, not silently re-counted here.

Actual hung-process proof:

```sh
node prototypes/live-hosting/check-owned-extension-profile.ts
ESCODE_CHECK_INSPECT_HOST=0.0.0.0 node prototypes/live-hosting/check-owned-extension-profile.ts
```

Both pass: actual child JS executes a synchronous infinite loop and cannot answer a ping, while main captures 494/673 CPU samples, rejects a foreign handle and rejects revoked ownership. Logs `test-40-owned-extension-hung.log` and `test-40-owned-extension-wildcard.log`. Initial fixture required a particular function name; V8 inlined it, so the proof now independently checks blocked ping and real samples instead of relying on optimized stack names. These are actual Node child checks, not full native desktop startup acceptance.

`lint-40-shared-final.log`: 37 files passed; final readonly selector hunk/test separately linted in `lint-40-git-selector.log` (2 files passed). Early inspector/promises layering lint was repaired by existing inspector callback API; duplicate imports and a forbidden new .cjs prototype were repaired (prototype is .ts). `git diff --check` passed. Earlier broad typechecks on changing source were stopped and explicitly marked superseded (including TERM-resistant compiler children subsequently SIGKILLed); no pass is claimed from them. Per root coordination, the final full typecheck is deferred to the complete #40 integration after connector registration is frozen; no new full compiler remains running in this worktree.

## Remaining integration/runtime

- Fresh helper `/root/ticket_40_connectors` owns SSH/WSL/Dev Container/Tunnel Agent Host channel factories/service cancellation. Its mandatory authority argument/imports must be wired in the complete integration after its coherent commit. Factories in `platform/agentHost/common/remoteAgentHostIpc.ts`: `createSSHRemoteAgentHostChannel(service, store, authority)`, `createWSLRemoteAgentHostChannel(...)`, `createTunnelAgentHostChannel(...)`; existing `createDevContainerAgentHostChannel` gains the same third authority argument. Pass `{getScope: ctx => server.getConnectionScope(ctx), onDidRemoveConnection: server.onDidRemoveConnection}`. Raw project provider operations stay fail-closed pending #52's persistent Agents broker; ordinary remote editor services remain. Connector handoff details are in `work/connector-handoff-40.md`.
- Root must verify actual Electron utility early attestation, ordinary extension commands/terminal/task/debug/Git continuing while inactive, native startup plus selected-project menu/AX, and the integrated #40/#52 path through the bounded desktop scenario. No real provider work/sign-in or authorization probes were performed here. #35's full native boundary matrix remains separate.
- **Material tradeoff for #35 measurement:** ordinary local extension-host startup now opens an ephemeral loopback inspector before extension code, enabling later capture of synchronously hung JS. Existing developer arguments are retained. Startup/resource/production cost has not been measured or validated by these focused checks. The inherited behavior for an already paused developer debugger deliberately retains its connection so disconnect cannot resume it; the regression preserves that behavior.
