## Summary

Implement the one-window IDE spec on a disposable integration branch based on `feature/unified-project-window`, reusing the published retained-view baseline.

```text
Shared shell
├── Permanent Agents entry
└── Independent project workbenches
    └── Exact per-chat home identity
```

Source slices merged: standalone app/storage identity (#38), retained exact-workspace tabs (#39), native routing and hidden-view attachment (#41), durable Agent Host chat homes (#50), and exact discovery/Choose Project (#51). Native resource ownership (#40) and the remaining ticket graph are in progress. This PR stays draft until implementation and review finish. No production merge is authorized.

## Evidence

- **Before:** app-owned extension controls could read Code OSS state; exact routing ignored environment; hidden projects remained in native accessibility; native menus looked up logical projects using the shared host ID; chats lacked a durable exact home.
- **After:** environment/scanner, exact-identity, native routing/profiling, provider/catalog/home persistence suites pass, with targeted lint, build, typecheck and layer checks where applicable. New regressions cover mixed-home peers, workspace-file versus working-directory precedence, intentional No Workspace, remote environment identity and restart durability.
- Bounded native checks at `52f6f8033eeb` passed selected-only accessibility, retained dirty editors and native File → Save targeting only the selected project. First/repeat Agents startup passed at the recorded earlier source. These samples are scoped evidence, not a current-source full acceptance pass. Detailed failures/repairs and source boundaries are recorded in `prototypes/live-hosting/spec-37/README.md`.
- Durable homes are implemented for Agent Host adapters with negotiated support. Extension-backed providers without the capability stay accessible in Agents and reject explicit assignment; actual provider/remote runtime is unperformed. Provider work/sign-in remains deferred and authorization probes remain paused.

## Merge Danger

**Door:** two-way

Disposable source integration with no profile import or migration.

**Blast Radius:** desktop

Native hosting, lifecycle, opening and conversation ownership require the separate staged runtime acceptance and creator verdict in #35.

Closes #37.
Closes #38.
Closes #39.
Closes #40.
Closes #41.
Closes #42.
Closes #43.
Closes #44.
Closes #45.
Closes #46.
Closes #47.
Closes #48.
Closes #49.
Closes #50.
Closes #51.
Closes #52.
Closes #53.
Closes #54.
Closes #55.
Closes #56.
Closes #57.
