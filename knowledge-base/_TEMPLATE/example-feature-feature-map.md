# Feature Map

What depends on what. The agent uses this to reason about **blast radius** — when you test or change one feature, which other features and services could be affected. This is the agent's lightweight stand-in for cross-service regression awareness.

**Format per feature:**
- `Feature ID` — stable identifier (`FEAT-xx`)
- `Name` — human name
- `Depends on` — upstream features/services it needs to work
- `Used by` — downstream features that break if this one breaks
- `External services` — third-party systems it touches

---

> The entries below are **examples** showing the expected structure. Replace them with your real feature relationships.

| Feature ID | Name | Depends on | Used by | External services |
|------------|------|-----------|---------|-------------------|
| FEAT-AUTH | Authentication & Sessions | — | FEAT-DOCS, FEAT-SETTINGS, FEAT-BILLING | Auth0 / identity provider |
| FEAT-DOCS | Document Management | FEAT-AUTH, FEAT-STORAGE | FEAT-SEARCH, FEAT-SHARING | — |
| FEAT-STORAGE | File Storage | — | FEAT-DOCS | AWS S3 |
| FEAT-SEARCH | Document Search | FEAT-DOCS, FEAT-STORAGE | — | Elasticsearch |
| FEAT-SHARING | Document Sharing | FEAT-DOCS, FEAT-AUTH | — | Email (SendGrid) |
| FEAT-SETTINGS | Account Settings | FEAT-AUTH | — | — |
| FEAT-BILLING | Billing & Plans | FEAT-AUTH | FEAT-DOCS (quota limits) | Stripe |

## How the agent should use this

- When analyzing a feature, list its `Used by` entries as **regression-risk areas** to flag in the testing scope (Section "Integration & Dependency Risks").
- When a feature has an `External services` entry, ensure negative/timeout scenarios cover that dependency being slow or down.
- This map is **directional**: testing FEAT-AUTH implies regression risk for everything in its `Used by` chain.
