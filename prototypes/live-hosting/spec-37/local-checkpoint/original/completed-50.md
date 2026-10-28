# Ticket 50 — exact per-chat home

Worktree: `work/ticket-50`, branch `implement/spec-37-ticket-50`. Initial integration dependency: `cf36c4a7d2bcd71d83bd9a19f8d4b5908140fd27` (#39). Implementation commits: `80315b75855`, `8c87c898a59`. Merged integration tip `8be621657c1` without conflicts at `cdcbbcbb9338b4372f884c4998a082f4266a8caf`, preserving the equivalent #40 interfaces carried by #41. This is source and deterministic service evidence, not a #35 desktop or provider verdict.

Per parent authorization, confirmed `work/integration` clean and on `integration/spec-37-complete` at `8be621657c1`, then merged `--no-ff implement/spec-37-ticket-50` with message `Merge #50 durable exact chat homes`. Integration result: **`8277cf17bf30de5772063350f70336e80531b7de`**. Both worktrees are clean. The integration merge has the same source tree as the validated ticket head. No push or issue write.

## Result

- Added lower `platform/workspace/common/chatHomeWorkspace.ts`: exact folder or saved workspace-file URI plus optional environment; `undefined` remains unresolved and `null` is intentional No Workspace. Identity never grants access.
- Workbench `IChatSessionsService` / content providers and Sessions `IChat` / management expose the home through existing owner adapters. No second transcript, execution owner or app-local home authority was introduced.
- Agent Host stores the value in existing `chats_v2.metadata.homeWorkspace`; list projection, legacy metadata migration, live session metadata, cached discovery, peer moves and promotion preserve it. Reads and assignments resolve the actual registered chat owner rather than parse a session from its URI.
- Editor creation captures the exact saved workspace or folder and current workbench environment, including `file:` workspace configuration under SSH/Dev Container authority. Explicit creation provenance and intentional null win. Agents folder creation supplies the selected folder; quick chat supplies null. Deliberate workspace changes update only the addressed chat. Provider-resolved worktree creation records its resulting folder while retaining the selected environment.
- Explicit home creation reaches the provider instead of reusing an unrelated draft. Unsupported assignment or explicit home creation fails; it never stores a fallback record. The existing Agent Host initialize capability advertises durable support; older hosts reject explicit-home creation before a create request is sent, while their history remains readable.

## Exact provider coverage and limits

| Existing owner/adaptor | Source support in this change |
| --- | --- |
| Native `AgentService` / local Agent Host and its Copilot, Claude, Codex harness chats | Host-owned durable catalog field and mutation, independent of SDK transcript/provider data. Tested using the existing deterministic fake provider and in-memory databases; no real harness was invoked. |
| `LocalAgentHostSessionsProvider`, `AgentHostSessionHandler`, `LocalAgentHostService` | Creation, observables, discovery/cache and read/assignment forwarding implemented and exercised through existing fixtures. |
| `RemoteAgentHostSessionsProvider`, Dev Container subclasses, editor remote Agent Host protocol client | Same base contract and protocol forwarding. Requires the connected host to advertise `vscode.chatHomeWorkspacePersistence`. Actual SSH/Dev Container/tunnel/remote runtime remains unperformed. Agents remote folder URIs retain the connection identity in their URI; explicit project creation carries its native exact target and environment. |
| `CloudSandboxSessionsProvider` and `CloudSandboxSessionHandler` | Existing Agent Host base path; the Workbench wrapper forwards only to its available live provider. No offline/cloud service home store was added. Availability and a capable live host are required; actual sandbox runtime is unperformed. |
| Extension-backed `CopilotChatSessionsProvider`, `MainThreadChatSessions` providers (including Copilot Cloud), read-only cloud history, policy-unavailable providers | **No durable home implementation** in these owners. Their history continues normal Agents discovery with unresolved home. Shared interfaces do not establish support. Explicit assignment/project-home creation must fail or remain unavailable; consumers must not imply success, infer another chat's home, or write an app-local/transcript fallback. Extension API/backend capability work remains a source limitation. |

## Red → green and repairs

- `test-50-red.log`: existing catalog metadata round trip dropped recorded home/null; fixed the existing validator/catalog/list persistence path. Initial harness missing-decode/import mistakes were repaired before the substantive failing assertion.
- `test-50-red-service.log`: public home service operation was absent; added persistence using the existing peer metadata owner and catalog projection. A stale-output import failure was repaired with independent dependencies and build before recording the missing-operation failure.
- `test-50-red-invalid.log`: invalid explicit creation metadata did not throw; creation now validates before effects.
- `test-50-red-worktree.log`: created home stayed at the source repository; creation now follows the provider-resolved worktree.
- `test-50-red-worktree-environment.log`: a remote URI was collapsed to `file:` during resolved worktree creation; retaining its original URI environment fixes that. Explicit saved workspace-file home remains the saved file.
- `test-50-red-reuse.log`: explicit project creation reused an unrelated untitled draft; explicit-home requests now reach creation.
- `test-50-red-capability.log`: older host accepted explicit creation without durable support; capability negotiation now refuses it before creating a conversation.
- `test-50-red-peer-precedence.log`: an explicit saved workspace-file peer home became a folder when a creation workspace supplied the tools' cwd. Explicit creation home now wins over workspace/working-directory inputs. The scratch fixture independently proves intentional null survives an allocated, existing scratch cwd. `setChatWorkspace` remains a deliberate reassignment operation.
- `test-50-red-pending-home.log`: the provider's pending-session path ignored an explicit home and returned its existing main draft. It now refuses a different home; callers must select it through session creation rather than report a false creation success.

## Validation

Named bounded scenario: **ticket-50 exact-home catalog and presentation**, isolated worktree outputs/dependencies, in-memory database and existing service fixtures. No desktop launch, sign-in, real provider send, tool run, approval response or authorization probe.

- `npm run build-fast -- --client-only`: pass (`build-50.log`).
- Local provider, AgentHost chat contribution and Sessions management suites: 1778 passing, 13 pre-existing pending (`test-50-presentations.log`). After the final draft-reuse guard, full management suite separately passes 346, 2 pending (`test-50-management.log`).
- Existing AgentService workspace/scratch/worktree group plus new home creation, peer, restart and move/promotion regressions: 64 passing (`test-50-workspaces.log`).
- Catalog/database/projection/source/migration focused groups: 147 passing (`test-50-catalog.log`); metadata round trip also separately passed (`test-50-green-metadata.log`).
- Home protocol client and existing workspace capability cases: 4 passing (`test-50-protocol.log`); ordinary moved-chat owner request case: 1 passing (`test-50-server.log`). These are deterministic protocol service fixtures, not an authorization probe.
- Full client typecheck passed (`typecheck-50.log`) after repairing the new fixture's required `override` annotation. Changed/new TypeScript ESLint passed (`lint-50.log`, `lint-50-additional.log`, `lint-50-final.log`); layer checks passed (`layers-50.log`).
- Merged-tip client build, 64-test service group and full typecheck passed (`build-50-merged.log`, `test-50-workspaces-merged.log`, `typecheck-50-merged.log`). After the pending-draft refusal, final provider suite passes **571**, 11 pre-existing pending (`test-50-provider-final.log`); changed-file ESLint and full typecheck pass (`lint-50-pending.log`, `typecheck-50-final.log`). Final source build passes (`build-50-pending.log`).

Unperformed: real desktop Project Chats/Choose Project interaction, cross-renderer owner continuity, provider-owned external history mutation, real remote/platform execution, #35 staged acceptance and creator verdict. Later #51–57 consumers still need to use this contract; an API implementation alone is not the full combined-window feature.
