# Ticket #39 — retained project tabs

Named scenario: exact workspace selection and persistent navigation. Branch `implement/spec-37-ticket-39`, worktree `work/ticket-39`, completed commit `e2265e460f7df48a367a07337c794521c1d902e2`. Confirmed updated `integration/spec-37-complete` (`934cea8e878f918fe1e0827f4c7d75417a5d82b2`) was an ancestor before starting; merged existing `implement/39-project-tabs` (tip `8352e41b0c2`) to reuse its implementation and original red/green regression. Latest integration merged again before handoff, with no updates required. No push or issue write.

## Scope

The reused implementation supplies a permanent Agents control outside the scrolling project strip; exact-folder versus saved-workspace-file plus environment matching with most-recently-active exact reuse; path labels and accessible tab states; append/drag ordering; retained views switched by visibility/bounds/focus; shell-only updates without document reload; independent workbench focus timestamps; and a palette command to focus project navigation. All finder callers, native contract/implementation/authorization, workspace-management caller, contribution registration and native test-service fixture are updated. It uses existing workbench interiors, workspace/profile/storage/trust configuration and renderer lifetime controls.

This pass removes the unapproved custom Alt+Shift+Arrow reordering shortcut and its help claim. Drag reorder remains; normal tablist arrow/Home/End controls and the pre-existing shell accessibility-help convention remain. No additional architecture, provider behavior, storage or dependencies were added.

## Design handling

Read Impeccable and repository design-philosophy, ran Impeccable context for the shell target, and read the craft floor. This is an in-world Operate refinement of the accepted project-navigation surface; preserved its incumbent composition using the provided brief (subagent, no separate interview). Mechanical detector ran once after changes and returned `[]`; it does not establish a visual/native usability pass. Root owns rendered verification against the final integration app.

## Checks

Independent APFS copies of node_modules/.build/out came from the preceding ticket-39 worktree. Original red/green logs there show the public exact-workspace lookup regression failing before implementation, then passing. The 16 affected source/test modules were freshly transpiled for this current source; a first transpile accidentally emitted CommonJS and the test loader rejected `exports` before tests ran. Corrected the output to ESM, then reran successfully; no production repair was needed for that fixture error.

- `scripts/test.sh --run src/vs/platform/windows/test/electron-main/windowsFinder.test.ts`: **6 passing**, exit 0. Current log `test-39-current.log`.
- Targeted `npm run eslint --` all 13 changed TypeScript files: **passed**. Log `lint-39-current.log`.
- `git diff --check`: **passed**.
- Impeccable mechanical detector for `prototypeWorkbenchHost.ts`: **no findings**, log `design-39-current.json`.
- Earlier full client typecheck (`typecheck-39-merged.log`) passed. Its only source difference before this small deletion is the independent #38 extension-control repair, which separately passed typecheck. No broad typecheck repeated solely for deleting a shortcut/help sentence.

## Native handoff / limits

Root should rebuild final integration and open real Agents, a scratch single-folder workspace and a saved multi-folder workspace. Repeatedly switch by shell controls, verify each dirty editor/layout/sidebar focus remains, exact requests reuse the right tab, drag reorder works, path labels distinguish duplicate names, horizontal overflow preserves Agents, hidden views stay out of focus/accessibility, and palette Focus Project Tabs/Alt+F1 remain usable. Observe actual workspace/profile/trust separation rather than inferring it from source. Record any failure and repair before claiming those checks pass.

Ordinary opening entry-point/profile/restoration work remains in #46/#48/#49, project Close controls/safeguards in #42, active tools in #40, and the complete native accessibility/capacity gate in #35. Real remotes, Windows/Linux, provider continuity/sign-in/work and authorization probes were not performed here. This source check is not a Stage 1 or runtime acceptance pass.

## Integration merge

Merger confirmed a clean `integration/spec-37-complete` and merged `implement/spec-37-ticket-39` with `--no-ff` at `cf36c4a7d2bcd71d83bd9a19f8d4b5908140fd27` (`Merge #39 independent project tabs`). No source edits, pushes or issue writes in merger role.
