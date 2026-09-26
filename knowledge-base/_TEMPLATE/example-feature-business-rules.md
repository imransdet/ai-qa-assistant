# Business Rules

The authoritative list of what the product **allows, forbids, or enforces**. This is the agent's primary **bug-vs-intended oracle**: if observed behavior contradicts a rule here, it is a confirmed defect and the agent cites the rule ID. If a behavior is unusual but matches a rule, it is *not* a bug.

**Format per rule:**
- `Rule ID` — stable identifier (`BR-xx`) the agent cites in bug reports
- `Rule` — one atomic, testable statement
- `Applies to` — feature/flow it governs
- `On violation` — the expected user-facing behavior when the rule is enforced

---

> The entries below are **examples** showing the expected structure. Replace them with your real business rules.

| Rule ID | Rule | Applies to | On violation (expected behavior) |
|---------|------|-----------|----------------------------------|
| BR-01 | Only PDF and DOCX file types may be uploaded | FLOW-02 / FEAT-DOCS | Reject with error: "Only PDF and DOCX files are allowed" |
| BR-02 | Uploaded files must be 10 MB or smaller | FLOW-02 / FEAT-DOCS | Reject with error: "File size exceeds the 10 MB limit" |
| BR-03 | A user must be authenticated to access `/documents` | FEAT-DOCS | Redirect unauthenticated users to `/login` |
| BR-04 | Only an account owner with Admin role may delete an account | FLOW-03 | Hide/disable "Delete Account" for non-admins; return 403 if forced |
| BR-05 | Passwords must be at least 8 characters with one number and one symbol | FEAT-AUTH | Block submission with inline validation error |
| BR-06 | A session expires after 30 minutes of inactivity | FEAT-AUTH | Next action redirects to `/login` with "Session expired" notice |
| BR-07 | Email addresses must be unique across all accounts | FEAT-AUTH | Registration fails with "An account with this email already exists" |

## Notes for the agent

- A rule here **outranks** a heuristic guess. If the app does X and a rule says X is expected, do not file a bug — even if X looks unusual.
- If a requirement provided in the session **contradicts** a rule here, flag the contradiction in the analysis output rather than silently picking one.
- If behavior is observed that **no rule covers**, treat it with the heuristic tier (suspected, not confirmed) and note the missing rule.
