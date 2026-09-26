# Known Defects & Weak Spots

The product's historical failure patterns. The agent uses this two ways:
1. **Probe harder** in areas that have broken before — generate extra edge cases there.
2. **Avoid duplicate bug reports** — if it observes a behavior already logged here, it references the existing ticket instead of filing a new one.

**Format per entry:**
- `Ref` — Jira key or internal ID
- `Area` — feature/flow affected (cite FEAT-xx / FLOW-xx)
- `Symptom` — what was observed
- `Status` — Open / Fixed / Intermittent / Won't Fix
- `Note for agent` — what to do when testing near this

---

> The entries below are **examples** showing the expected structure. Replace them with your real defect history.

| Ref | Area | Symptom | Status | Note for agent |
|-----|------|---------|--------|----------------|
| PROJ-321 | FLOW-02 / FEAT-STORAGE | Uploads of files >8 MB intermittently time out before the 10 MB limit | Intermittent | Add boundary cases at 8/9/10 MB; if a timeout recurs, link PROJ-321, don't file new |
| PROJ-288 | FEAT-AUTH | "Session expired" sometimes fires early (~20 min instead of 30) | Open | Flag any early-expiry as confirmed against BR-06; reference PROJ-288 |
| PROJ-256 | FEAT-DOCS | Document list does not refresh after delete until manual reload | Fixed | Verify the fix held — re-test list refresh on delete as regression |
| PROJ-203 | FEAT-SHARING | Sharing email occasionally sent twice | Intermittent | Watch network log for duplicate SendGrid calls; link PROJ-203 if seen |

## How the agent should use this

- Treat `Open` and `Intermittent` entries as **high-priority probe areas** during exploratory and edge-case generation.
- Treat `Fixed` entries as **regression checks** — confirm the fix still holds.
- Before filing a bug, check this list. If the symptom matches an existing `Ref`, reference it in the report instead of creating a duplicate.
