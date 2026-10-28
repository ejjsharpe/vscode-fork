# Ticket 51 — discover provider history without guessing ownership

Worktree: `work/ticket-51`; branch: `implement/spec-37-ticket-51`. Confirmed starting integration ancestor and HEAD `8277cf17bf30de5772063350f70336e80531b7de` before edits. Implementation commit: `96d580b780c52e1aa0a913b5b10ee1f3c0acc075`. Merged the current integration tip into the ticket branch before completion (`Already up to date`). Per parent authorization, confirmed `work/integration` clean on `integration/spec-37-complete`, then merged `--no-ff implement/spec-37-ticket-51` with message `Merge #51 exact home discovery and assignment`. Integration merge: **`546c7fe98a5f5047aa084599687d044336507356`**. Verified the merged tree exactly matches the validated ticket source, then fast-forwarded the ticket branch to the merged integration tip. Both worktrees are clean. No push or GitHub issue write.

## Result and scope

- Existing connected-provider history remains on the normal provider catalog path with fresh app-owned state. No transcript import, second history/home store, provider send, tool execution or execution-ownership claim was added.
- The Agent Host Sessions adapter now consumes validated exact `chats[].homeWorkspace` values rather than requiring a duplicate session metadata map. One exact value resolves that addressed chat; conflicting exact candidates leave it unresolved. Effective folders, containment, repository identity and neighbouring/session-member chats never supply a home.
- Recorded map values and intentional null remain strongest. The legacy provider's explicit workspaceless main-chat marker is preserved as No Workspace, including across a later metadata refresh without that marker; peer chats do not inherit it or the physical scratch cwd.
- Existing durable assignment now updates the provider's presentation and existing discovery cache after successful provider acknowledgement. It keeps the existing chat identity. Failed or unsupported assignment does not record success. Current per-chat home values are included when serializing discovery, so a chosen home survives weaker discovery and a cached restart.
- Added localized, non-modal Choose Project through the existing Sessions management/presentation boundary. Explicit session/chat/show/split/grid opening and unresolved project navigation offer it only after required metadata loading settles; startup/automatic/history restoration does not trigger a bulk wizard. Repeated requests for the same current unresolved chat keep the original prompt, without duplicate notifications.
- The standard quick picker supports intentional No Workspace, exact app-owned recent folder/saved-workspace targets including their recorded remote authority, and local folder/workspace browsing through the existing file dialog. It calls only durable home assignment. Unsupported extension-backed/Copilot Cloud history stays readable and reports assignment failure.
- Both native and web project-navigation entry points refuse inference when the home is unresolved/loading and offer Choose Project. Known-home routing remains the separate #52 implementation; the old routing after these guards is not claimed to satisfy #52.
- Reused built-in notification, picker and file-dialog interiors/accessibility. No CSS, alternate design system, startup wizard, broad recovery framework or additional dependency.

## Named bounded scenario and checks

Scenario: **ticket-51 exact-home discovery and explicit choice**, isolated worktree dependencies/output, in-memory storage and existing deterministic provider/service/mocked-presentation fixtures. Dependencies and `.build`/`out` were copied with APFS clone copies from ticket-50; no shared node_modules symlink and no install.

Red → green evidence is outside the repo in the current chat's `work/`:

- `test-51-red-discovery.log`: exact home supplied only in chat catalog was lost. `test-51-green-discovery.log` passes after consuming it.
- `test-51-red-choice.log`: public home-choice operation was absent. `test-51-green-choice.log` passes the metadata-loading/intentional-null behavior.
- `test-51-red-open.log`: explicit history open never offered Choose Project (also corrected a test URI serialization literal). `test-51-green-open.log` passes.
- `test-51-red-ambiguity.log`: conflicting exact home candidates selected the first. `test-51-green-ambiguity.log` passes with conservative conflict handling.
- `test-51-red-assignment.log`: successful durable assignment did not update presentation or cached restart. `test-51-green-assignment.log` passes; final test uses a real public catalog refresh carrying a weaker null candidate.
- `test-51-red-no-workspace.log`: legacy intentional workspaceless main chat looked unresolved. `test-51-red-legacy-retain.log`: later empty metadata erased that intentional null. Both are green in `test-51-final-retained.log`.
- `test-51-red-navigation.log`: unresolved project navigation opened inferred effective folders. `test-51-green-navigation.log` passes native/web action suites.
- `test-51-red-dedup.log`: repeated opening closed the original prompt. `test-51-green-dedup.log` passes while keeping the current prompt.
- `test-51-red-presentations.log`: direct foreground show omitted the choice. Final presentation suites pass after reaching explicit foreground opening callers.
- `test-51-all.log` exposed six older restart fixtures lacking a notification service after this newly reached UI path. Added the existing TestNotificationService to those fixtures; `test-51-all-repaired.log` passes. This was a fixture repair, not a suppressed production error.
- `typecheck-51.log` caught two new test-shape errors (generic protocol summary versus provider metadata, and an inferred partial chat type); repaired the fixtures without casts. `lint-51.log` caught an untracked observable `.get()` and unlocalized test-string spelling; repaired both.

Final client build: pass (`build-51-final.log`). Final focused full suites: **974 passing, 13 pre-existing pending** (`test-51-final-retained.log`) across LocalAgentHostSessionsProvider, SessionsManagementService, session navigation and native/web Open in Editor actions. Final changed-file ESLint: pass (`lint-51-final.log`). `git diff --check`: pass. Impeccable detector: no findings (`design-51.json`). Full client typecheck: pass, exit 0 (`typecheck-51-final.log`). The integrated merge has the identical validated source tree, so these source/build/service results apply without repeating unchanged checks. Actual desktop rendering/interaction remains unperformed.

## Limits

No real provider sign-in/history mutation/send/tool/approval or authorization probe was performed. Actual remote runtimes, native Choose Project rendering, keyboard/VoiceOver and the full #35 runtime acceptance/creator verdict remain unperformed. The deterministic fixtures establish source/service behavior, not provider-wide runtime support. Extension-backed owners without durable home hooks remain explicitly unsupported for assignment; there is no fallback authority. Home assignment grants no tool or trust permissions.
