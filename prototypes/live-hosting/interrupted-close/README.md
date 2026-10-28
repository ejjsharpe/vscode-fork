# Interrupted Close: truthful outcome, replacement-readiness failure

**Disposable experiment. Stage 1 failed/incomplete. Creator verdict pending. No production merge.**

Decision: [Revalidate live workbench hosting after interrupted Close outcome repair](https://github.com/ejjsharpe/escode/issues/32).

## Verdict for live review

The candidate repairs the sampled published before-unload interruption: two joined Close callers reject with `Close interrupted`; the shell displays that outcome, with no fabricated veto, logical-close notification or completed disposal. The real lifecycle wait reports interruption. This passed on the final candidate and also during a preliminary development run.

The next attempted check exposed a failed explicit retry. The initial document replacement leaves `isReady` true. A later Close can consequently dispatch before-unload into a replacement document during bootstrap, before the renderer has installed its lifecycle receiver. It stays pending after the replacement finishes loading. The shell displays `Close pending`; another Close joins the same pending operation. A fresh independent instance reproduces the failure by requesting Close at `dom-ready`, after the main-owned generation changes. The replacement reports ready and finishes loading, but the Close still has no result more than a minute later. Completing optional onboarding does not release it. No save/cancel safeguard dialog was present.

The dispatch timing, inherited ready flag, pending operation and lack of reply are observed. Loss before receiver installation is the source-supported explanation, not a traced renderer receipt. This is an injected scheduling test, not a claim of a naturally observed user race. No data loss, hostile authority acquisition or provider continuity is established. Stop at this failed invariant; neither Stage 1 nor overall feasibility passes.

## Candidate and scope

Runtime source: `0e469ae5b78` on `prototype/interrupted-close`, based on `795fa1211b7`. Subsequent commits contain probes and evidence only. The three source changes preserve an explicit `interrupted` unload result, reject the shared Close attempt with a distinct internal error, and display **Close interrupted**. Host coordination rejects pending Close requests after interruption rather than automatically continuing them; completed host-cleanup entries are skipped on another host attempt. Those host changes remain unvalidated. Existing reload and workspace-opening callers use `!outcome` and therefore refuse replacement for interruption; this is source inspection only.

No new recovery framework, permanent retry UI, provider change or production specification change. The prototype deliberately remains at the failure. Main-owned document authorization and lifecycle-ready state still have different lifetimes. The next design decision must define how explicit Close during replacement is settled or safely held until the exact replacement is lifecycle-ready, while preserving safeguards, completed phases and shared outcomes. Merely setting ready false is insufficient if the existing not-ready unload path then authorizes disposal without safeguards.

## Build and setup

macOS 26.3.1 arm64; exact Electron/Node versions are in `evidence/runtime.json`. Build Node 24.22.1. `npm run build-fast -- --client-only`, final `npm run typecheck-client` and `git diff --check` passed. An early typecheck found an insufficient TypeScript narrowing for the optional host generation; that was corrected before the committed final candidate. The first preliminary launch terminated when its PTY ended; all acceptance observations use retained launch terminals.

An independent APFS copy supplied the dependency tree, Electron and compiled built-in extensions. No shared dependency symlinks or dependency changes. The launch skill used a nonexistent source profile and fresh isolated app-owned user-data, extensions and shared-data, plus scratch single-folder and saved multi-folder workspaces. `--disable-workspace-trust` is now propagated to both child-opening commands. Distinct trust/profile validation is not claimed. No sign-in, persistent authentication bootstrap or provider request was performed. Normal-profile before/after hashing was not performed.

## Evidence ledger

| Check | Result / evidence |
| --- | --- |
| Fresh real hosting | `startup.json`, `repeat-startup.json`, `ready.json`, `repeat-ready.json`: one native host, three real retained workbenches and main-owned generations. Screenshots were visually inspected. First-selection and full opening acceptance remain unperformed. |
| Published before-unload interruption | `before-interruption.json`: two coalesced callers reject, shell reports interruption, project retained, zero close notifications, no logical disposal. |
| Attempted will-unload check | The script started another Close during replacement; it never reached will-unload. Inspector timed out. This is **not** a will-unload result. `early-retry-state.json` and `late-retry-state.json` show the pending before-unload operation and loaded renderer. |
| Independent reproduction | `repeat-bootstrap-retry.json`: next-generation bootstrap has inherited `ready: true`; before-unload dispatched while loading; pending after load. `repeat-late.json` and `final-repeat-state.json` retain later state. |
| Product assertion | `retry-assertion.txt`: the requirement that the later Close not remain orphaned fails. The assertion has not been inverted to call the product correct. |
| Onboarding control | `onboarding-control.json` and `onboarding-finished-control.json`: Continue without Signing In and Get Started complete; Close remains pending, without a save/veto dialog. |
| Visual state | `pending-shell.png` is shell-only, not a composite native screenshot. `repeat-project.png` shows the loaded replacement after onboarding. Neither proves all neighbouring resources usable. |
| Runtime cleanup | Both instances stopped using scoped `app.exit(0)`. `first-cleanup.json` and `repeat-cleanup.json`; not graceful-shutdown acceptance. Scratch state is retained locally. |

`first-runtime.log` and `repeat-runtime.log` are captured logs, not assertions. Startup includes ordinary no-auth/provider warnings. No claim is made that all warnings were classified. The full IPC/direct-boundary adapters listed in the prior `lifecycle-replies/DIRECT-IPC.md` remain incomplete and were not tested or treated as passing here. This run revisited fresh hosting and interruption/retry checks within Stage 1, not every preceding Stage 1 security requirement.

## Reproduce

1. Check out `prototype/interrupted-close`; prepare independent dependencies and complete built-in extension outputs per repository instructions. Build with `npm run build-fast -- --client-only`.
2. Run `bash prototypes/live-hosting/interrupted-close/run.sh` in a terminal that remains alive. Each launch creates fresh state. Read the dynamic main inspector port from `scratch/launch.json`. The launcher does not remain foreground after opening workbenches; retain its terminal session.
3. Use `node prototypes/live-hosting/lifecycle-replies/inspect.mjs MAIN_PORT FILE` for each probe. Run `interrupted-close/inspect-start.js` and visually inspect its PNG; run `lifecycle-replies/observe.js`, then `recovery-shutdown/capture-service.js`. The latter obtains the service without actually performing host shutdown. Confirm all workbenches are ready.
4. For the repaired original check, run `interrupted-close/before-interruption.js`. It holds a genuine before-unload delivery, requests Close twice, then calls raw `WebContents.reload()` to inject unexpected document replacement. No approval, veto or acknowledgement is fabricated.
5. On a separate fresh launch, run `interrupted-close/retry-during-bootstrap.js` instead. It repeats interruption and explicitly requests another Close when the new document reaches `dom-ready`. Wait for loading to finish, then run `inspect-failure.js` and `assert-retry.js`; the latter fails while the Close remains pending. The optional `dismiss-onboarding.js` and `finish-onboarding.js` remove onboarding as an explanation, not as a product acceptance check.
6. Stop at failure. Use `recovery-ownership/cleanup.js` only for this instance. Do not enter later stages. `node prototypes/live-hosting/interrupted-close/check-evidence.mjs` checks saved observations, not a new runtime acceptance run.

## Remaining gate

All inherited requirements remain. Will-unload interruption, joined direct-disposal outcomes, host interruption and partial cleanup, real safeguard veto/save/backup/joiner controls, late replies, explicit retries without replay and cleanup-error controls are unperformed in this candidate beyond the narrow observations above. Host-related edits and source-inspected reload/workspace-open guards are not runtime-validated.

Full generic/direct IPC, current/stale/foreign/auxiliary/internal roles, subscriptions, delayed effects/deliveries/ports, extension-host isolation, native routing, settings/profile/trust, background terminal/task/debug/Git progress, CLI/opening/`--wait`, restoration/recovery/resource retirement and neighbour usability remain incomplete. Provider/exact-chat/tool/approval continuity, accessibility, capacity/performance, Windows/Linux, SSH and Dev Containers were not entered. No production merge or feasibility approval.

The creator must separately review this scoped failed experiment. Keep the ticket open pending that verdict, return architecture for the bounded replacement-readiness decision, transfer the complete inherited gate to its follow-up, and keep final specification approval blocked.
