# Native two-project observations at cf36c4a7d2b

Actual macOS app, isolated state under runtime/tabs; scratch single-folder plus saved multi-folder workspace. No provider sign-in/send or authorization probes.

The native shell shows permanent Agents plus `multi.code-workspace` and `single`, with exact filesystem paths. The real editors open `single/example.txt` and `multi-a/example.txt`. Both accept distinct unsaved edits; switching to another project and Agents retains their editor/dirty state. The active workbench switches without a native window change.

FAILED: native accessibility exclusion. A full CUA AX snapshot after selecting multi contains active `HTML content multi (Workspace)` and inactive `HTML content example.txt — single`, including the inactive file editor. The single editor is still reported as one unsaved file. `setVisible(false)` is insufficient. The #41 implementer is repairing native attachment while keeping renderers live; rerun required.

Automated initial tab harness sampled workbench URLs before load; cleanup was requested before exact-document readiness and did not complete. This harness failure is not a product navigation pass. The scratch app remained available for the native UI observations above. The corrected harness now waits for real workbench DOM before identity assertions. Host startup-Close behavior belongs to #42/#43/#45 and remains unvalidated here.
