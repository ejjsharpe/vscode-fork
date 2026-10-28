# One-window implementation status

[Spec #37](https://github.com/ejjsharpe/escode/issues/37) and [draft PR #60](https://github.com/ejjsharpe/escode/pull/60) contain partial implementation. Repository housekeeping does not resume implementation, schedule tickets or authorize a production merge.

The implementation starts at the verified PR base `ec9a1750b4d8b1a8a0ff7de7e722f69c6e1c32e3`. Reviewed source/build changes and maintained regression tests were ported as a patch from checkpoint `d71ae1f23b018cfc7f99616d24f187dc96375ea6`, without its prototype ancestry. Probe logging and an unused experimental context helper were omitted; error handling and runtime ownership checks were retained.

## Preserved primary source

The complete former integration history and sibling experiment fixtures are published on [`prototype/spec-37-integration-checkpoint`](https://github.com/ejjsharpe/escode/tree/prototype/spec-37-integration-checkpoint), pinned at [`e403648fdfa94c3471023a5ec6fd8aabb9db01db`](https://github.com/ejjsharpe/escode/tree/e403648fdfa94c3471023a5ec6fd8aabb9db01db). [Run instructions and fixture manifest](https://github.com/ejjsharpe/escode/tree/e403648fdfa94c3471023a5ec6fd8aabb9db01db/prototypes/live-hosting/spec-37/local-checkpoint) and [historical question, bounded verdict, handoffs and reviews](https://github.com/ejjsharpe/escode/blob/e403648fdfa94c3471023a5ec6fd8aabb9db01db/prototypes/live-hosting/spec-37/checkpoint-2026-10-28/README.md) live there. Never merge a prototype branch into implementation or main. Historical samples remain attributed to their individual sources; they are not a current-source acceptance pass.

## Retained responsibilities

- App identity, storage isolation, startup and development launch/build support implement the bounded #38 scope.
- Retained workbench hosting, exact project matching and selection implement partial #39/#41 behavior. `prototypeWorkbenchHost.ts` is active runtime code called by `CodeWindow`, not a throwaway runner.
- Document/connection lifetimes and scoped native/browser/utility/shared/PTY/Agent Host services implement partial #40 behavior. Files named `prototypeLifetime.ts`, `prototypeNativeChannel.ts` and `prototypeBrowserChannel.ts`, their callers and maintained test suites remain because they enforce runtime behavior. Their historical names do not establish acceptance.
- Durable Agent Host exact-chat home metadata, discovery and assignment implement partial #50/#51 behavior. Extension-backed owners remain unsupported.
- Throwaway runners, source-edit scripts, raw logs, screenshots and historical evidence stay exclusively on the prototype branch. Unit regressions remain in the ordinary source test suites.

## Remaining work

#38 retains its existing bounded completion. #39, #40, #41, #50 and #51 remain partial and open. Known gaps include native tab reuse/drag/overflow and command/UX coverage, repaired-browser GET/render/AX verification, minimized/occluded background work, extension-backed durable homes, and reoffering Choose Project after dismissal/picker cancellation. Existing review findings include IPC server teardown ownership, protocol metadata reader placement and duplicated connector lease handling. The separation checks also reproduce a #50 race: normalized workspace finalization can persist a home after concurrent chat disposal has removed its metadata, followed by a cleanup/disposed-map warning. Its source and test are byte-identical to the preserved checkpoint. These findings are recorded on the issues; this separation does not repair them.

#42 has a read-only plan only. #43–#49 and #52–#57 have no new ticket implementation. Baseline lifecycle/recovery code remains in the retained source; that does not complete those tickets. GitHub dependencies and acceptance checkboxes govern remaining work. [#35](https://github.com/ejjsharpe/escode/issues/35) retains staged runtime acceptance and the separate creator verdict. Provider work/sign-in stays deferred; authorization probes stay paused; `explore_native` remains stopped.

## Separation verification

Full client typecheck and client build pass. The 33 focused changed test modules pass 289 tests; eight larger provider/session modules filtered for home/workspace/navigation/handoff pass 300 tests with two pending and two failures from the metadata-disposal race and subsequent console-error check. A targeted rerun reproduces the race. All 41 changed regression-test files are retained unchanged. Script syntax, implementation whitespace and archive checksum/fixture-preparation checks pass. Historical logs remain unmodified, including their whitespace. These checks establish repository separation, not desktop acceptance; no new provider, authorization-probe or full staged runtime run was performed.
