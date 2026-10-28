# Preserved integration experiments

Question: can the one-window shared shell retain independent live project workbenches, bind native resources to the correct document, and route the same chat to its durable exact home?

Bounded verdict: initial hosting, startup, selected navigation, sampled inactive work and deterministic ownership/home regressions have evidence. The integration is partial. The repaired browser still needs native GET/render/AX verification; provider-neutral homes, Choose Project retry, lifecycle/opening/continuity and full staged acceptance remain incomplete. #35 retains its staged runtime contract and separate creator verdict. Provider work/sign-in is deferred; authorization probes are paused. Preservation does not authorize another implementation or experiment cycle.

Branch `prototype/spec-37-integration-checkpoint` preserves the complete integration ancestry, including checkpoint `d71ae1f23b018cfc7f99616d24f187dc96375ea6`. Never merge this branch into implementation or main. The [checkpoint report](../checkpoint-2026-10-28/README.md) and its handoffs retain exact source references: startup at `403375db5f1794d95849d795ceecbf8553d2dfdb`, inactive progress and failed browser at `1ce038f7de9edbee2133ac100f032034e0c463cc`, earlier Save/AX checks at `52f6f8033eeb`. They cannot be combined into a current-source acceptance claim.

`original/` is an unchanged copy of meaningful sibling-work files: runners, scratch source fixtures, draft patches, notes, ticket snapshots, raw logs and measurements. [manifest.json](manifest.json) records original paths, hashes and sizes. User/shared data, browser profiles, dependencies, generated build directories and fixture Git databases are excluded. Every original remains in the sibling work directory; no unique local work was deleted. Historical launch paths and PIDs are provenance, never instructions to reuse state or kill a process today. The `wire-*.py` files are historical source-edit scripts, not required run steps.

## Reproduce a bounded scenario

Use a separate checkout of this published prototype branch. Install/build there with Node from `.nvmrc`: `npm run install-fast`, `npm run build-fast`, and the repository Electron setup (`npm run electron` if the runtime is missing). Never share or symlink `node_modules` between checkouts. The helper references this same checkout and creates fresh disposable state and fixture workspaces in `/tmp`; it does not copy historical user data.

From the repository root:

```sh
# Check fixture preparation without launching anything:
python3 prototypes/live-hosting/spec-37/local-checkpoint/rerun.py tabs --prepare-only
# First/repeat real Agents startup:
python3 prototypes/live-hosting/spec-37/local-checkpoint/rerun.py startup
# Two retained projects and Agents, repeated selection (dispatch-based controls):
python3 prototypes/live-hosting/spec-37/local-checkpoint/rerun.py tabs
# Real Electron selected-only view attachment/replacement/disposal assertions:
python3 prototypes/live-hosting/spec-37/local-checkpoint/rerun.py attachment
```

These are bounded smoke checks, not keyboard/drag/AX/provider acceptance. Startup/tab runners assert their observations and save new logs/screenshots/results under the printed run directory. The tab runner may require forced fixture cleanup and explicitly does not claim coordinated shutdown. The attachment runner exits its own Electron process.

`python3 prototypes/live-hosting/spec-37/local-checkpoint/rerun.py native40` launches the preserved scratch extension, configured terminal/task/debug heartbeat and local browser fixture. It only launches: follow [the original native handoff](../checkpoint-2026-10-28/ticket-40-handoff.md) for the manual commands, loopback browser setup, progress readings and native AX observations. Its source/launch metadata is recorded in the new run directory. Keep the launching terminal alive, stop only the newly recorded scratch process tree, and preserve failures separately. No automatic authorization probes or provider sign-in are included. Original hard-coded `checkpoint-startup.mjs` is retained for provenance; the portable helper uses `startup-smoke.mjs` with fresh paths.

Each rerun must record its own source, build/runtime, setup and passed/failed/unperformed outcomes. This preservation task checks manifest integrity, fixture preparation and script syntax only; it does not rerun historical desktop experiments.
