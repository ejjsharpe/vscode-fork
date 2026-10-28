# Standards checkpoint

Reviewed source changes in `ec9a1750b4d8b1a8a0ff7de7e722f69c6e1c32e3...403375db5f1794d95849d795ceecbf8553d2dfdb` against repository guidance. Historical prototype evidence is not treated as a new runtime pass.

## Documented-standard violations

- **P2 — Electron IPC server lacks disposal ownership.** `src/vs/base/parts/ipc/electron-main/ipc.electron.ts:19–21` adds `const onConnect = new Emitter<ClientConnectionEvent>();` and an anonymous `validatedIpcMain.on('vscode:hello', ...)`. Neither has teardown when `Server.dispose()` runs; the inherited disposer removes its subscription, not this emitter/native listener or the static client registrations. A disposed server therefore retains a listener that can keep creating connections and displacing another server's clients. This violates `.github/instructions/coding-guidelines.instructions.md:65`, “Register disposables immediately after creation.” Record server-owned teardown and a disposal regression check as further work.

- **P2 — New protocol metadata reader bypasses the required boundary.** `src/vs/platform/workspace/common/chatHomeWorkspace.ts:58–61` adds `readChatHomeWorkspaceFromMeta(...)` reading `meta?.[CHAT_HOME_WORKSPACES_METADATA_KEY]`; Agent Host source imports it directly, including `node/agentService.ts:7`. `.github/instructions/agentHostTesting.instructions.md:29` requires new namespaced protocol `_meta` readers under `common/meta`, accepting the parent protocol object. Keep the reusable workspace value codec shared, but place the new AHP metadata adapter behind `agentHost/common/meta`.

## Baseline smell — judgment

- **P2 — Duplicated Code / Repeated Switches.** `src/vs/platform/agentHost/common/remoteAgentHostIpc.ts:228–234` and `297–303` duplicate the exact relay authorization/release block: `owners.require(...)`, snapshot `owners.resources.get(...)`, `await proxy.call(...)`, conditional identity-checked deletion, then `owners.check(context)`. Tunnel and Dev Container repeat the same lifecycle shape at `367–373` and `433–438`. These are judgment findings, not four independent policy defects: provider-specific dispatch is reasonable, but common lease authorization and replacement-safe release now require coordinated edits in four places. Record consolidation of that shared lifecycle operation in `RemoteAgentHostChannelOwners` while preserving provider-specific behavior.

No repository edits, tests, provider/authentication probes, or repairs were performed. Runtime behavior remains unverified by this read-only review.
