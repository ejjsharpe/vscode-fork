Partial implementation checkpoint — leave this issue open.

Selected logical project routing, native callback/dialog guards, main-owned auxiliary registration and selected-only WebContentsView attachment are integrated (`8f3666d7770`, merge `52f6f8033eeb`). 23 focused tests passed with2 existing platform skips; Electron attachment/retained-background-heartbeat check passed. Earlier actual native File → Save affected only the selected multi-folder project, and inactive dirty editors disappeared from AX at52f6f. These historical samples are not full current-source native acceptance.

Unchecked criteria1–2,4: remaining selected-project command and native-control coverage, explicit-target flows from Agents, real auxiliary/dialog UX, keyboard/IME/assistive technology and current-source direct/native matrix. Keep existing lifecycle safeguards; #42/#43/#45 remain separate.

Open native blockers: #39. Checked criteria describe only established source/service or explicitly recorded runtime behavior; unchecked compound criteria remain incomplete. A merge or unit pass is not full runtime acceptance.

Checkpoint source `403375db5f1794d95849d795ceecbf8553d2dfdb`; integration branch `integration/spec-37-complete`; draft [PR #60](https://github.com/ejjsharpe/escode/pull/60). [Committed handoffs, evidence and review](https://github.com/ejjsharpe/escode/blob/d71ae1f23b018cfc7f99616d24f187dc96375ea6/prototypes/live-hosting/spec-37/checkpoint-2026-10-28/README.md). Orchestration is stopped; no worker remains assigned. Provider work/sign-in stays deferred, authorization probes stay paused, no production merge is authorized, and #35 retains full staged acceptance plus the separate creator verdict.
