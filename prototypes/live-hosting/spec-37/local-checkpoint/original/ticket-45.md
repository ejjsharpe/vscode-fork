## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Joined requests share one truthful outcome. Close cancels recovery, survives genuine host-shutdown cancellation, and cannot be undone by stale callbacks or late readiness.

## Acceptance criteria

- [ ] An explicit Close during recovery or host coordination records one pending intent, invalidates recovery immediately, coalesces repeats and disables Retry while pending.
- [ ] Obsolete recovery success/failure/readiness callbacks cannot attach or select a replacement, overwrite newer state or resurrect a closed tab.
- [ ] Defer competing project teardown while host coordination owns it. Successful host shutdown fulfils Close once; genuine host cancellation preserves pending Close for normal project safeguards afterward.
- [ ] A project veto clears its pending Close while leaving recovery cancelled until explicit Retry. Interruption and cleanup failure remain distinct and reconcile actual surviving state.
- [ ] Keep one authoritative result for each Close attempt independently of live-registry membership; joined, direct-disposal and host callers receive the same result only after required cleanup.
- [ ] A Close before replacement safeguard readiness reports interruption promptly; late readiness cannot retry it. A later explicit attempt continues only unfinished work without replaying completed phases/notifications or rewriting the earlier outcome.
- [ ] Cover synchronous reentry, separately scheduled overlaps, partial cleanup errors, already-destroyed resources and registry removal before completion with deterministic deferred operations, plus bounded real dispatch/readiness evidence.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
