# #40 remote connector helper scope

Fresh implementer should own **only** remote Agent Host connector channel/resource files and relevant service cancellation/revocation code/tests. Parent's native foundation commit: `cf8487873be` (contains 4389 foundation and SelfProfilingService helper equivalents). Current shared branch `implement/spec-37-ticket-40-shared` merged this as `9cc923a0449`. Shared implementation remains uncommitted; do not read dirty files as an integration base. Start from latest integration + native coherent commit as parent directs.

Do not edit `code/electron-utility/sharedProcess/sharedProcessMain.ts`, Playwright/group remote files, shared tunnel, sync, Git, profiling, or extension-host files. Shared implementer owns registration and will invoke exported adapters.

## Trusted input/API

Utility `Server.getConnectionScope(ctx)` gives main-attested `{role:'project'|'agents'|'auxiliary',workbench,generation,workspaceId?,remoteAuthority?,clientId?}`; undefined means actual trusted internal main, unknown/revoked throws. Context is a unique lifetime binding. `server.onDidRemoveConnection(({ctx})=>...)` cleans owned resources. An optional constructor parameter `{getScope:(ctx:string)=>IMessagePortConnectionScope|undefined,onDidRemoveConnection:Event<{ctx:string}>}` or explicit equivalent is sufficient; no framework. Keep existing IServerChannel interface and custom Dev Container cancellation transport behavior. Export named adapter constructors/factories and send exact integration signatures to `/root/ticket_38`.

**Raw project provider connect/relay/management is fail-closed pending #52's persistent Agents broker.** Valid Agents/native coordinator operations work and bind resources to their originating context. Keep ordinary remote editor services intact; those use existing remote services, not raw shared provider authority. Do not make provider client/correlation IDs authority, no sign-in/provider work/live auth probes. Unit/service fake-authority tests authorized.

## Channels/files to inspect

- `platform/agentHost/common/sshRemoteAgentHost.ts`, `node/sshRemoteAgentHostService.ts` (`SSHRemoteAgentHostMainService`), existing tests in node/electron-browser.
- `common/wslRemoteAgentHost.ts`, `node/wslRemoteAgentHostService.ts` (`WSLRemoteAgentHostMainService`).
- `common/devContainerAgentHost{,Ipc}.ts`, `node/devContainerAgentHostService.ts`; preserve `createDevContainerAgentHostChannel`: listDevContainers(token) gets CancellationToken out-of-band, `onDidChangeSandboxSupport` deliberately unbuffered to deliver facts before connect rejection.
- `common/tunnelAgentHost.ts`, `node/tunnelAgentHostService.ts` (verify file). Lists/discovery/auth explicitly classified as app capabilities if retained, private/prototype methods refused.

## Observable ownership behavior

- SSH connect's optional expectedConnectionId arg1 and reconnect's arg6 must already belong to caller. `computeSSHConnectionKey(config)` common export; alias key `ssh:${alias}`. WSL reconnect optional expectedConnectionId arg4; progress key `wsl:${distro}`. Returned connectionId is relay lease; bind and validate every relay/release/event. Underlying SSH/WSL sessions can coalesce across callers; release only owning leases, never destroy another caller's global host/distro session. `disconnect(host/distro)` must not become unrestricted cross-owner global kill.
- SSH prompt events `onDidRequestKeyboardInteractive`, `onDidRequestEndpointSelection`, `onDidRequestHostKeyVerification` contain requestId+connectionKey. Bind once when source event fires to the live originating pending connect, independent of subscriber order. Filter prompt/cancel/announcement/progress/relay/close subscriptions; reject foreign/duplicate reply before backend. Replies `respondKeyboardInteractive(id,answers|undefined)`, `respondEndpointSelection(id,selection|undefined)`, `respondHostKeyVerification(id,bool)`. Revoke outstanding prompts safely. Main-owned subscriptions establish ownership; do not let an event subscriber adopt a guessed request ID.
- Dev Container config.connectionId is caller supplied: reject ownership collision/preclaim before connect so progress/output/sandbox events filter correctly. Scope disconnect, stop/remove source operations explicitly (caller-owned source/known inventory or named coordinator capability). Late connect/config side effects need cancellation/owner rechecks, not just result filtering. Existing service has CancellationTokenSource per connect and disconnect cancels it.
- Tunnel prepareSelection returns selectionId, completeSelection consumes it to yield connectionId, cancelSelection own-only; relaySend/disconnect own-only. Late selection or connection cleanup on expiry; list/delete classification preserves tokens/permissions but avoids foreign live resources.
- Recheck before later effects/publication after awaits; close late renderer-owned leases. Node SSH/WSL connect has many awaited phases before remote spawn/install; inspect whether cancellation or main-only validate callback is needed rather than assuming late-result cleanup cancels prior work.

## Validation

Read root AGENTS/copilot/glossary + invoked TDD skill; seams preapproved work/spec-37.md. Public service/channel tests: valid owner, foreign selectors/replies, unknown commands, revoked event/result, late allocation cleanup and async later-effect prevention. Use existing fake network/process boundaries; no live remote/provider/auth operations. Own independent copied deps/out. Save completed-40-connectors.md with exact source, commands/results and limits. No issue writes/push. Latest integration merge before final report/commit; root handles merger.
