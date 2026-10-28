# Ticket #38 — standalone shell source integration

Named scenario: first-launch app identity and app-owned development extension controls. Worktree `/Users/elliotsharpe/Documents/Codex/2026-10-28/new-chat-10/work/ticket-38`; branch `implement/spec-37-ticket-38`; completed commit `1366f326830b008450485b89c91b42195dce7ac0`.

Confirmed `integration/spec-37-complete` (`67319907a061b59d905c79cd83a6c40a62e7c32a`) is an ancestor before starting. Read root AGENTS, Copilot instructions, GLOSSARY and TDD skill. Test boundaries are already confirmed in spec #37. Existing standalone runtime/data identity implementation `519a6ea4382` was present in integration; merged the existing reviewed repair branch `implement/38-standalone-shell`, including `03611141fd3`, rather than rewriting it. Merged the latest integration tip again before handoff; no updates were required.

## Surfaces reached

The remaining repair changes native/server extension scanners, build synchronizer and builtin-controls UI to derive this app's development control location from product identity. It updates the existing scanner fixture to exercise the actual native scanner boundary, supplies its product data-folder identity and verifies a foreign Code OSS control cannot override the app-owned choice. No new transcript store, provider owner, native authority rules or imports were introduced.

The preceding TDD cycle is preserved in the previous run's `notes-38-fix.md` and `test-38-fix-red.log`: the regression first selected foreign extension version 1.0.2 instead of expected app-owned 1.0.0, then passed after the four consumer repairs. Current source and dependency inputs were compared against that validated source (`git diff --quiet a037cd2eb5b HEAD -- src build package.json package-lock.json product.json .npmrc .nvmrc`): identical. No new implementation was required here.

## Current checks

Dependencies, `.build` and compiled outputs were independently APFS-copied from the previous ticket-38 checkout; no shared or symlinked node_modules. Compiled inputs match the preserved tested source.

- `scripts/test.sh --run src/vs/platform/environment/test/node/userDataPath.test.ts --run src/vs/platform/environment/test/node/environmentService.test.ts --run src/vs/platform/extensionManagement/test/node/extensionsScannerService.test.ts`: **46 passing**, exit 0. Log `test-38-current.log` beside this note.
- `npm run eslint -- src/vs/platform/extensionManagement/common/extensionsScannerService.ts src/vs/platform/extensionManagement/test/node/extensionsScannerService.test.ts src/vs/server/node/extensionsScannerService.ts build/lib/builtInExtensions.ts build/builtin/browser-main.js`: **passed**, five files. Log `lint-38-current.log`.
- `node --check build/lib/builtInExtensions.ts`, `node --check build/builtin/browser-main.js`, `bash -n scripts/code.sh` and `git diff --check`: **passed**.
- Source search of the affected production extension-control consumers found no remaining hardcoded `.vscode-oss-dev`; the one remaining match is the deliberate negative regression fixture.
- Prior full client typecheck passed with identical relevant source/dependency inputs; it was not repeated solely for this merge.

## Handoff and limits

Source integration is ready for the merger. Root retains real native first/repeat launch and other-installation untouched-state observations against the final integration build. Prior runtime samples remain historical, not a current-source native acceptance pass. Provider history/sign-in/work, authorization probes, actual server/remote runtime and Windows/Linux were not run. #35 keeps staged acceptance and the separate creator verdict. No production merge, push or issue write was performed.

## Integration merge

As merger subagent, confirmed `integration/spec-37-complete` clean and merged the implementation with `--no-ff` at `934cea8e878f918fe1e0827f4c7d75417a5d82b2` (`Merge #38 standalone state isolation repair`). Created `work/ticket-39` on `implement/spec-37-ticket-39` from that exact integration tip. No other source changes, pushes or issue writes.
