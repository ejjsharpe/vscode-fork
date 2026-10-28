Partial implementation checkpoint — leave this issue open.

Exact folder/workspace-file plus environment matching, most-recent exact reuse, retained tabs, paths and ordering are integrated (`e2265e460f7`, merge `cf36c4a7d2b`). #41 adds selected-only attachment (`52f6f8033eeb`). Six finder tests and targeted lint passed. Earlier native dirty-editor retention and AX exclusion passed at52f6f; these are historical bounded checks, not a current-source full ticket pass.

Unchecked criteria5–6: perform current-source native drag reordering, independent strip overflow/path disambiguation and exact-target reuse/switching checks. Retain the native keyboard/AX requirement. Remote identity service tests are not real remote validation.

No open native blockers. This is the next unblocked ticket. Checked criteria describe only established source/service or explicitly recorded runtime behavior; unchecked compound criteria remain incomplete. A merge or unit pass is not full runtime acceptance.

Checkpoint source `403375db5f1794d95849d795ceecbf8553d2dfdb`; integration branch `integration/spec-37-complete`; draft [PR #60](https://github.com/ejjsharpe/escode/pull/60). [Committed handoffs, evidence and review](https://github.com/ejjsharpe/escode/blob/d71ae1f23b018cfc7f99616d24f187dc96375ea6/prototypes/live-hosting/spec-37/checkpoint-2026-10-28/README.md). Orchestration is stopped; no worker remains assigned. Provider work/sign-in stays deferred, authorization probes stay paused, no production merge is authorized, and #35 retains full staged acceptance plus the separate creator verdict.
