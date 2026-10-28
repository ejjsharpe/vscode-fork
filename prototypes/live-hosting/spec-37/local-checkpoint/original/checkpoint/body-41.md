## Parent

[#37 — Spec: One-window IDE with project tabs and shared Agents](https://github.com/ejjsharpe/escode/issues/37)

## What to build

Commands and focus reach the selected project; Agents requires explicit project targets. Auxiliary ownership and delayed native callbacks cannot target a foreign or replacement workbench.

## Acceptance criteria

- [ ] Save, Git, terminal, debug, workspace-setting and native-menu commands affect the selected project; project-specific actions invoked from Agents require an explicit project target.
- [ ] Restore focus to the selected workbench and present native menus/dialogs in the correct visible context, preserving keyboard use, IME and assistive-technology behaviour.
- [x] Register auxiliary ownership in main and scope auxiliary, nested and explicit targets to the authenticated originating workbench; auxiliary renderers cannot impersonate their parent or another role.
- [ ] Complete relevant diagnostics, bootstrap configuration/environment, zoom, DevTools and native-control adapters without exposing another project's resources or bypassing required lifecycle safeguards.
- [x] Capture and revalidate the originating lifetime for delayed native-menu/dialog callbacks; a selection change or replacement cannot redirect old authority.
- [x] Cover legitimate selected-project and explicit-target flows plus stale/foreign rejection through existing test boundaries, retaining the pause on authorization probes and recording unperformed native UX coverage.

## Execution boundary

This is an approved implementation slice within [#34](https://github.com/ejjsharpe/escode/issues/34). Inspect and reuse its published disposable baseline; implement only missing behaviour using existing services and test infrastructure. Preserve the full accepted contract in #37 and its authoritative linked resolutions, including requirements not repeated here.

Use a named bounded scenario, isolated app-owned state and scratch workspaces. Record exact source/build, focused checks, failures/repairs and unperformed coverage. [#35](https://github.com/ejjsharpe/escode/issues/35) retains the full staged runtime acceptance gate and separate creator verdict. Provider work/sign-in remains deferred and authorization probes remain paused. Publication does not start execution, lift those limits, establish feasibility or authorize a production merge.
