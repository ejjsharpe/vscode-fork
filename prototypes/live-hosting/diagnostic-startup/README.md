# Startup diagnostic receiver — disposable evidence

Continues [Revalidate live workbench hosting after replacement readiness refinement](https://github.com/ejjsharpe/escode/issues/33) from the [diagnostic reply checkpoint](../diagnostic-replies/README.md). This is a progress checkpoint, not a Stage 1 or feasibility pass. The complete inherited gate and separate creator verdict remain required. No production merge or PR.

## Finding and repair

Baseline `0300452aba4` registered `RemoteAgentDiagnosticListener` at Eventually. A real replacement document reported exact-document lifecycle readiness and received a diagnostic dispatch **2,594 ms before installing its diagnostic receiver**. No request-received trace appeared for that dispatch. The request timed out after five seconds; a later explicit request produced the genuine no-connection reply. This traces the ordering left uncertain by the previous checkpoint.

Candidate `43d4a0646b7` registers the existing contribution through `registerWorkbenchContribution2` at `WorkbenchPhase.BlockStartup`, before the native ready notification. In the traced candidate, installation preceded readiness by 148 ms; the first response arrived 122 ms after dispatch. No retry or queue was added. Temporary timing logs were removed from the committed source. The clean-source startup probe also passed, as did its rerun on the combined native-menu candidate `62efec8257c`.

The diagnostic service is real; its window proxy supplies a synthetic remote authority so a local workbench takes the diagnostic dispatch path. The renderer's reply is its real no-connection outcome. This establishes receiver availability, not successful remote diagnostics or SSH behavior. Inspected callers remain the process/system/performance and other-instance diagnostic paths; their complete user workflows were not tested.

## Evidence and failures

- `evidence/baseline.json` and `candidate-trace.json`: ordered main/renderer timestamps; baseline failure and repaired timing. `trace.patch` adds the two temporary console markers to the baseline using `git apply --unidiff-zero`. For the candidate, add those same markers before the receiver registration and inside its callback; the added class ID shifts the source lines. `trace-startup.js` records their ordering.
- `startup.js` asserts that the first request after actual replacement readiness receives the genuine no-connection response; both reply listeners are removed and the neighbour generation is unchanged. `evidence/startup-final.json` records the uninstrumented candidate.
- `ownership-final.json`, `transitions-rerun.json`, `prebootstrap-final.json`: existing diagnostic ownership, delayed metadata, unregistered auxiliary-preload, pre-bootstrap and listener-cleanup controls. Their injection and remote limitations are those in the preceding report.
- `reload-final.json`, `close-final.json`, `host-final.json`: existing direct-reload, startup shared-Close/disposal and host-startup controls. These do not constitute full lifecycle or active-work acceptance.
- `build-final.txt` and `typecheck.txt`: incremental client build and successful client typecheck.

The first detached launch became unavailable when its launching terminal ended (`ECONNREFUSED`); a retained terminal fixed the setup. The first trace harness used the wrong console-event argument shape and a 30-second total timeout; it timed out without producing evidence. The corrected harness accepts Electron's console event shape and has a 60-second overall limit.

The first candidate changed the legacy contribution API's phase to Starting. That API only supports Restored/Eventually: the receiver was never installed and the trace probe failed its bounded installation assertion. `invalid-legacy-phase.patch` preserves that incorrect candidate for reproduction against the baseline with `git apply --unidiff-zero`. The supported registration API repaired it; the final typecheck passed.

The first final-source transition run exceeded its 20-second lifecycle-readiness deadline after the delayed-metadata interruption assertions. A later state inspection showed the window ready, and the unchanged transition probe passed on rerun. The cause of that transient deadline overrun was not established; do not represent it as a proven harness-only defect or a universal timing guarantee. `evidence/failures.json` records all failures.

## Reproduce

Use an independently prepared checkout, dependencies and built-in outputs. Follow `.agents/skills/launch/SKILL.md`; `bash prototypes/live-hosting/replacement-readiness/run.sh` launches fresh isolated state from a nonexistent source profile and trusted scratch workspaces. Keep its terminal alive and obtain the fresh `mainPort` from `replacement-readiness/scratch/launch.json`.

Run `node prototypes/live-hosting/diagnostic-startup/inspect.mjs MAIN_PORT PROBE` with `lifecycle-replies/observe.js`, then `recovery-shutdown/capture-service.js` under `prototypes/live-hosting/`. Run `diagnostic-startup/startup.js`. To reproduce timing, instrument as described above, build the client, reload/launch and use `trace-startup.js`; baseline `0300452aba4` returns `startupPassed: false`, while the candidate returns true. Do not leave trace instrumentation in final source. Existing probes named above live under `diagnostic-replies/`, `direct-reload/` and `replacement-readiness/`.

See [native-menu evidence](../context-menu/README.md) for the combined source, environment, cleanup and remaining gate. The saved-evidence checker validates recorded assertions; it does not rerun the product.
