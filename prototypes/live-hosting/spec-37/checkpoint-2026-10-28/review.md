# Checkpoint review

Range: `ec9a1750b4d8b1a8a0ff7de7e722f69c6e1c32e3...403375db5f1794d95849d795ceecbf8553d2dfdb`. Read-only; no repair cycle started after the user freeze.

## Standards

# Standards checkpoint

Reviewed source changes in `ec9a1750b4d8b1a8a0ff7de7e722f69c6e1c32e3...403375db5f1794d95849d795ceecbf8553d2dfdb` against repository guidance. Historical prototype evidence is not treated as a new runtime pass.

## Documented-standard violations

- **P2 — Electron IPC server lacks disposal ownership.** `src/vs/base/parts/ipc/electron-main/ipc.electron.ts:19–21` adds `const onConnect = new Emitter<ClientConnectionEvent>();` and an anonymous `validatedIpcMain.on('vscode:hello', ...)`. Neither has teardown when `Server.dispose()` runs; the inherited disposer removes its subscription, not this emitter/native listener or the static client registrations. A disposed server therefore retains a listener that can keep creating connections and displacing another server's clients. This violates `.github/instructions/coding-guidelines.instructions.md:65`, “Register disposables immediately after creation.” Record server-owned teardown and a disposal regression check as further work.

- **P2 — New protocol metadata reader bypasses the required boundary.** `src/vs/platform/workspace/common/chatHomeWorkspace.ts:58–61` adds `readChatHomeWorkspaceFromMeta(...)` reading `meta?.[CHAT_HOME_WORKSPACES_METADATA_KEY]`; Agent Host source imports it directly, including `node/agentService.ts:7`. `.github/instructions/agentHostTesting.instructions.md:29` requires new namespaced protocol `_meta` readers under `common/meta`, accepting the parent protocol object. Keep the reusable workspace value codec shared, but place the new AHP metadata adapter behind `agentHost/common/meta`.

## Baseline smell — judgment

- **P2 — Duplicated Code / Repeated Switches.** `src/vs/platform/agentHost/common/remoteAgentHostIpc.ts:228–234` and `297–303` duplicate the exact relay authorization/release block: `owners.require(...)`, snapshot `owners.resources.get(...)`, `await proxy.call(...)`, conditional identity-checked deletion, then `owners.check(context)`. Tunnel and Dev Container repeat the same lifecycle shape at `367–373` and `433–438`. These are judgment findings, not four independent policy defects: provider-specific dispatch is reasonable, but common lease authorization and replacement-safe release now require coordinated edits in four places. Record consolidation of that shared lifecycle operation in `RemoteAgentHostChannelOwners` while preserving provider-specific behavior.

No repository edits, tests, provider/authentication probes, or repairs were performed. Runtime behavior remains unverified by this read-only review.

## Spec

# Spec checkpoint review

Read-only review of `ec9a1750b4d8b1a8a0ff7de7e722f69c6e1c32e3...403375db5f1794d95849d795ceecbf8553d2dfdb`. Source paths below are relative to `work/integration`; spec references use `work/spec-37.md`.

- **[P2] Integrated #51: dismissed/cancelled Choose Project cannot be requested again for the same chat.** Spec line 121 requires “Ambiguous ownership offers non-blocking Choose Project when opened or navigation is requested.” `src/vs/sessions/services/sessions/browser/sessionsManagementService.ts:770` returns whenever the last target matches, but lines 794–803 never clear that target when the notification closes. Clicking its action closes the notification; cancelling the picker then leaves ownership unresolved. Reopening or requesting project navigation for that same chat silently returns until another chat replaces the target or the service restarts. Reset deduplication when the offer closes; retain deduplication only while the original offer remains usable. This is source inspection, not a new runtime reproduction.

- **Integrated #50/#51 source limitation: extension-backed home persistence/assignment remains missing.** Spec line 101 says “Persist one home per project-associated chat through the provider-neutral contract”; line 121 says “Assignment associates the existing conversation without copying or sending”. `src/vs/workbench/api/browser/mainThreadChatSessions.ts:869` registers only `provideChatSessionContent`, without home hooks; `src/vs/sessions/services/sessions/browser/sessionsManagementService.ts:808` consequently rejects Choose Project for these owners. Agent Host coverage does not complete the extension-backed/Copilot Cloud requirement. Explicit refusal is appropriate, but these slices cannot be reported provider-wide complete.

- **Intentionally unfinished, not newly discovered regressions:** #42–49 and #52–57 still own lifecycle/recovery, ordinary opening/CLI/profile/restoration, Project Chats/exact routing, presentation/execution continuity, links/unavailable homes and attention. For example, spec line 102 requires “Reveal that exact chat through the editor service”, while `src/vs/sessions/electron-browser/actions/vscodeActions.ts:78` still derives folders from effective workspace and line 103 returns session-only identity. This is acknowledged #52 work, not a #51 regression.

- **Evidence remains partial.** Spec line 150: “Historical samples at different commits cannot be combined into a current-source pass.” `work/runtime/native40/combined-progress.json:2` identifies `1ce038`; lines 36–37 leave minimized-state and repaired-browser native coverage unperformed. Latest-source GET/render/AX rerun and full #35/creator verdict remain outstanding.

No additional scope creep found. No source edits, tests, runtime, provider/auth work or repairs performed; unsupported owners and incomplete runtime acceptance remain risks.

Standards: three findings (two documented-standard violations, one judgment); highest operational concern is IPC server teardown. Spec: four findings/categories; concrete integrated defect is same-chat Choose Project retry. The axes are not ranked against one another.
