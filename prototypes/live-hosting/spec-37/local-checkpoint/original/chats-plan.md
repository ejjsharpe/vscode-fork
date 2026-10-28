# Minimum chat integration path (#50–57)

Read-only source inspection at `67319907a061b59d905c79cd83a6c40a62e7c32a` on `integration/spec-37-complete`. This updates the prior `notes-chats.md`; no provider activity, sign-in, auth probe, runtime experiment or source edits.

## Start with #50: one lower contract, one provider adapter

Put the serialized exact conversation/home reference in a platform-level common file if native main must consume it; main cannot import Workbench. Reuse existing folder/workspace-file identifiers and URI comparison helpers. Carry provider ID, opaque session URI, optional opaque exact-chat URI, and `undefined` unresolved / `null` intentional No Workspace / exact folder-or-workspace-file plus remote authority. Do not use Sessions `environment` labels or `IChat.workspace` accessible folders as routing identity.

The narrow Agent Host persistence route is a validated extension request alongside `SetChatWorkspaceExtensionMethod` in `platform/agentHost/common/agentHostExtensionProtocol.ts`, `AgentHostProtocolClient`, and `ProtocolServerHandler`. Add a home-specific mutation rather than overloading `setChatWorkspace`: `AgentService._requireChatWorkspaceTarget` intentionally refuses default chats and any chat with a turn, while deliberate reassignment must preserve existing conversations. Validate ownership via the host chat registry; persist through the existing session/chat metadata database and sequencer before publishing.

`common/meta/vscode/agentHostChatInputState.ts` is an existing pattern for a validated per-chat map keyed by opaque exact chat URI inside session `_meta`, merged without replacing unrelated metadata. Reuse the pattern for home publication, but persist it: that particular input-state map is transient. `AgentService._creationMetadataOverrides`, the session state mirror, `AgentHostPeerChatStore` local metadata and move/catalog restoration are the necessary durability callers. A helper alone does not complete #50. Chat moves must preserve the home with the chat; session metadata maps alone cannot do that without move integration. The generated protocol's `ChatState._meta` is present, but `ChatSummary` has no `_meta`, and there is no general client-dispatchable chat-meta action; do not edit generated protocol files casually or silently expect root discovery to expose chat metadata.

Expose home as an observable on the Sessions `IChat` facade and via lower Workbench `IChatSessionsService`/provider presentation contracts. Creation supplies a home explicitly: project creation captures current exact workspace+authority, Agents creation uses the picker or deliberate null. Worktree preparation must update to the resulting exact worktree home, rather than record its repository root. Keep provider data as authority and existing normal history discovery.

## #51/#52: catalog, assignment and navigation

`BaseAgentHostSessionsProvider` has separate hydrated state, discovery metadata and a cached discovery serializer (`serialize/deserialize` near 330–470); all must carry the recorded map without a weak refresh clearing it. Use required-metadata loading to keep undefined unresolved. Offer Choose Project at open/navigation; assigning calls the home mutation and never a create/send method.

Replace `vscodeActions.getChatSessionToOpenInEditor`'s URI-only result and `platform/window/common/window.ts` option with the shared exact reference. Update `nativeHostMainService` delivery and the Workbench receiving contribution. Resolve provider redirects through registry callbacks; reveal the exact URI using `IEditorService.openEditor` and existing `ChatEditorInput`. `openSessionInVSCode` currently returns an unrelated local empty window when a remote folder cannot resolve; replace this with an explicit unavailable-home outcome.

Project Chats should consume the lower provider catalog filtered by exact recorded home. Existing `AgentHostSessionListStore` folder-containment filtering is legacy behavior, not a safe home-membership implementation. Register the view using existing Workbench view/container contributions beside Files and Source Control; retain existing chat editor interior. Show in Agents routes the same provider/session/chat to existing Sessions navigation service, without claiming execution.

## #53: there is already a confirmed dispatch seam

`IAgentHostConnection.dispatchConfirmed` exists (`common/agentService.ts` around 1403, `AgentHostProtocolClient` around 1832). It waits for the exact client sequence acknowledgement, rejects lost connection/cancelled subscriptions, and returns the authoritative action envelope. Reuse it for a handoff draft flush; do not invent another ack protocol.

`AgentHostSessionHandler._installDraftSync` already converts attachments/model/input to `ChatDraftChanged`, handles remote versus local state, and flushes on disposal. Retained hidden workbenches are not disposed, so switching before its debounce still loses the immediate handoff. Expose one explicit async flush on the handler/provider presentation boundary, cancel pending delay, dispatch the current input using confirmed dispatch, then navigate/attach the target. Handle rejection and newer user edits without overwriting them. Reading position is separate: `SessionsChatViewStateService` is renderer-local and requires a bounded ephemeral cross-renderer handoff through the main-owned named route, keyed by exact reference; it is not a transcript store. Existing handoff safeguards must still preserve an occupied target draft.

## #54: real execution gap, not solved by keeping a subscription

`AgentHostSessionHandler` lives in each renderer and owns client-tool invocation and approval observation. `ProtocolServerHandler._releaseActiveClientForSession` fails the departing client's pending tools. A second renderer attaching a model cannot take over the already-issued invocation: `_isOwnedClientToolRequest` checks initiating client ID. Never spoof/reuse the departing connection ID or retain the closed workbench.

The smallest architectural path is to keep the persistent Agents environment as the execution client from run start and route the project's provider operations to that existing owner, with an explicit lower provider-neutral bridge. The project still owns its presentation and normal editor services; mutation/tool/approval work must reach the persistent client with the recorded home's existing trust/tool scope. This requires an actual owner adapter for send/cancel/approve and client tools, not a boolean continuity flag or lifecycle-only workaround. Existing Agent Host client proxy and protocol client/service boundaries are candidates; extension-backed providers need their own adapter and remain separate unperformed proof. An alternative transfer API must account for in-flight tools and approvals and is larger. Close must not destroy the project until the required persistent ownership is genuinely ready; if unavailable, return a truthful failure/veto.

## #55–57 follow the same exact reference

Reuse current `AgentsWindowWorkspaceHandoff` occupied-draft protection and `openSessionLink` parsing/redirect ownership. Omitted workspace remains intentional null. Link application should use the #53 flush path before target restoration and must never send.

Unavailable homes keep the recorded target and conversation; #56 composes #44 recovery/Close ownership and exact opening with Locate/Restore/reconnect choices. Replacement target requires the explicit home mutation, with no main-checkout fallback.

For #57 derive distinct approval/failure/completion attention from existing `SessionStatus` and per-chat read state. Publish snapshots over a named authenticated Agents-to-main native operation and aggregate by exact home in the shell, including homes with no open tab. Background publication only updates indicators; explicit activation uses #52 navigation. Use existing read-state setters for acknowledgement. No popup or focus-selection side effect on publication.

## Existing tests to extend

Use the seams already confirmed in #37: local provider creation/discovery tests; existing native handoff (`sessions/test/electron-browser/vscodeActions.test.ts`); draft handoff tests; ChatEditorInput; provider/session navigation; AgentHost draft/client-tool state; protocol/server ownership tests. Assert exact identities and observed state through those public boundaries. Real provider sends/tools/approvals, desktop Close continuity and actual remote behavior remain #35 evidence and are unperformed here.
