Partial implementation checkpoint — leave this issue open.

Agent Host exact per-chat durable homes and deliberate reassignment are integrated (`80315b75855`, `8c87c898a59`, merge `8277cf17bf3`). Existing catalog ownership is reused; null/unresolved/exact home and environment remain distinct. Service/provider/catalog/persistence suites, client build/typecheck/lint/layer checks passed; exact groups and sources are in the handoff. This is deterministic service evidence, not real-provider runtime.

Unchecked criteria1,3–4 remain partial: extension-backed owners (including Copilot Cloud) have no durable home creation/assignment hooks and must fail explicitly; no app-local fallback was added. Project-side chat presentation still needs #52 persistent Agents broker. Review recorded a protocol metadata reader in the wrong prescribed boundary (P2). Real desktop/remote/provider validation and #35 are unperformed.

Open native blockers: #39. Checked criteria describe only established source/service or explicitly recorded runtime behavior; unchecked compound criteria remain incomplete. A merge or unit pass is not full runtime acceptance.

Checkpoint source `403375db5f1794d95849d795ceecbf8553d2dfdb`; integration branch `integration/spec-37-complete`; draft [PR #60](https://github.com/ejjsharpe/escode/pull/60). [Committed handoffs, evidence and review](https://github.com/ejjsharpe/escode/blob/d71ae1f23b018cfc7f99616d24f187dc96375ea6/prototypes/live-hosting/spec-37/checkpoint-2026-10-28/README.md). Orchestration is stopped; no worker remains assigned. Provider work/sign-in stays deferred, authorization probes stay paused, no production merge is authorized, and #35 retains full staged acceptance plus the separate creator verdict.
