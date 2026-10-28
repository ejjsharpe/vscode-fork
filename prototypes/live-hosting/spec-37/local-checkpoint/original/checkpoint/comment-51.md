Partial implementation checkpoint — leave this issue open.

Conservative exact-home discovery, loading-aware non-blocking Choose Project and durable assignment/cache preservation are integrated (`96d580b780c`, merge `546c7fe98a5`). 974 focused tests passed with13 existing pending; build/typecheck/lint passed. These are provider-neutral service/presentation checks, not actual native/provider runtime.

Unchecked criteria1,4–5: extension-backed durable assignment remains unsupported, real connected-provider history/native Choose Project validation unperformed, and a P2 source defect prevents reoffering Choose Project for the same chat after notification dismissal or picker cancellation. Deduplicate only while a usable offer is pending; no repair was started. Known-home routing remains #52.

Open native blockers: #50. Checked criteria describe only established source/service or explicitly recorded runtime behavior; unchecked compound criteria remain incomplete. A merge or unit pass is not full runtime acceptance.

Checkpoint source `403375db5f1794d95849d795ceecbf8553d2dfdb`; integration branch `integration/spec-37-complete`; draft [PR #60](https://github.com/ejjsharpe/escode/pull/60). [Committed handoffs, evidence and review](https://github.com/ejjsharpe/escode/blob/d71ae1f23b018cfc7f99616d24f187dc96375ea6/prototypes/live-hosting/spec-37/checkpoint-2026-10-28/README.md). Orchestration is stopped; no worker remains assigned. Provider work/sign-in stays deferred, authorization probes stay paused, no production merge is authorized, and #35 retains full staged acceptance plus the separate creator verdict.
