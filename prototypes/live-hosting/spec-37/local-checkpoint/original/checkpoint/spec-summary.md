<!-- spec-37-checkpoint-2026-10-28 -->
## Partial checkpoint — orchestration stopped on 28 October 2026

Integration branch: `integration/spec-37-complete`, checkpoint commit `d71ae1f23b018cfc7f99616d24f187dc96375ea6`; final implementation source `403375db5f1794d95849d795ceecbf8553d2dfdb`. [PR #60](https://github.com/ejjsharpe/escode/pull/60) remains draft and will not be merged. [Committed handoffs, exact-source evidence and separate standards/spec review](https://github.com/ejjsharpe/escode/blob/d71ae1f23b018cfc7f99616d24f187dc96375ea6/prototypes/live-hosting/spec-37/checkpoint-2026-10-28/README.md).

- **Completed/closed:** [#38 — Launch the standalone shared shell](https://github.com/ejjsharpe/escode/issues/38), including first/repeat startup at403375. This is the bounded ticket scope, not full #35 acceptance.
- **Partial source integrated; open:** [#39](https://github.com/ejjsharpe/escode/issues/39), [#40](https://github.com/ejjsharpe/escode/issues/40), [#41](https://github.com/ejjsharpe/escode/issues/41), [#50](https://github.com/ejjsharpe/escode/issues/50), [#51](https://github.com/ejjsharpe/escode/issues/51). Their checkboxes/comments identify passing evidence and unmet criteria. #40 browser repair needs actual GET/render/native AX rerun; #50/#51 extension-backed home support is missing; #51 chooser dismissal/cancellation retry and #40/#50 standards findings are recorded without another repair cycle.
- **Read-only plan only:** [#42](https://github.com/ejjsharpe/escode/issues/42). No implementation began.
- **Remaining, not started:** [#43](https://github.com/ejjsharpe/escode/issues/43), [#44](https://github.com/ejjsharpe/escode/issues/44), [#45](https://github.com/ejjsharpe/escode/issues/45), [#46](https://github.com/ejjsharpe/escode/issues/46), [#47](https://github.com/ejjsharpe/escode/issues/47), [#48](https://github.com/ejjsharpe/escode/issues/48), [#49](https://github.com/ejjsharpe/escode/issues/49), [#52](https://github.com/ejjsharpe/escode/issues/52), [#53](https://github.com/ejjsharpe/escode/issues/53), [#54](https://github.com/ejjsharpe/escode/issues/54), [#55](https://github.com/ejjsharpe/escode/issues/55), [#56](https://github.com/ejjsharpe/escode/issues/56), [#57](https://github.com/ejjsharpe/escode/issues/57).

All native dependency edges remain intact. With #38 closed, the next unblocked ticket is [#39 — Open and switch independent project tabs](https://github.com/ejjsharpe/escode/issues/39). Finish its unmet criteria before starting downstream work; source merges do not remove blockers.

Current-source full client typecheck, client build and bounded first/repeat startup pass. Inactive extension/terminal/task/debug progress and earlier native Save/AX checks remain explicitly tied to their own earlier commits; historical samples are not a combined current-source pass. Minimized state and repaired-browser native rerun remain unestablished. Full #35 staged runtime acceptance and creator verdict are incomplete.

All work is committed/preserved. No unfinished source changes were found in own worktrees; clean child checkouts can be removed with branches and commits retained. Local raw evidence remains in the documented work directory. `explore_native` handed off at clean tip466489, ended its turn, and will not be resumed. Every worker has stopped; no automatic continuation is scheduled.

Provider work/sign-in stays deferred; authorization probes stay paused; no production merge is authorized. This spec remains open while required implementation/validation remains.
<!-- /spec-37-checkpoint-2026-10-28 -->
