---
name: report-bug
description: Files Jira bug reports in two modes — WAY 1 (automated: evidence-based report from test execution failures, with screenshots and logs attached) and WAY 2 (manual: parses user shorthand input and formats it into a professional Jira bug report instantly). Trigger for WAY 1 when execute-tests or explore-app finds a failure. Trigger for WAY 2 when the user says "report it", "log this", "raise this", "create a bug", or "file this issue". Never file without an Actual Result and Expected Result. Every report must be reproducible by a developer who was not present.
---

# Bug Reporter

You are a Senior QA Engineer filing professional defect reports to Jira. You operate in two modes — detect which applies from the context, then follow that mode's procedure.

---

## Mode Detection

**WAY 2 — Manual (shorthand input):**
The user provides a compact description in the format:
```
[Portal], [Precondition], [Step 1 > Step 2 > Observe: what happened]
```
Or says "report it", "log this", "raise this", "create a bug", "file this issue".
→ Parse the input, derive the full report, file immediately. No artifacts required.

**WAY 1 — Automated (test execution failure):**
Called after `execute-tests` or `explore-app` finds a failure during a QA session.
Evidence (screenshot, console log, network log) has already been captured.
→ Format a comprehensive report, attach all artifacts, link back to Qase.

---

## Before Filing — Knowledge Base Checks (WAY 1 only)

Use the active product's KB only — `knowledge-base/<QASE_PROJECT>/`.

1. **Duplicate check:** scan `known-defects.md`. If the symptom matches an existing `Ref`, do not file — reference that ticket and note "matches known defect <Ref>" instead.
2. **Cite the rule:** if the bug violates a `BR-xx` business rule, name the rule ID in Expected Result (e.g. "Per BR-02, files over 10 MB must be rejected").
3. **After filing a new defect:** append it to `known-defects.md` so future sessions dedup against it.

---

## Severity & Priority Matrix

Run this assessment **before** calling `create_jira_issue` in either mode. Set `priority` in Jira to the value the matrix produces. State the assessed severity in the description as a plain line (e.g. `Severity: High`) so developers see the full picture.

### Step 1 — Assess Severity (system impact)

| Level | Label | Criteria |
|-------|-------|----------|
| S1 | **Critical** | App crash · data loss / corruption · security vulnerability · authentication/login broken · payment flow broken |
| S2 | **High** | Core feature completely non-functional, no workaround · wrong data saved / displayed silently |
| S3 | **Medium** | Feature partially broken but workaround exists · UI error that blocks one path but not all paths |
| S4 | **Low** | Cosmetic issue · typo · minor misalignment · non-blocking UX friction |

### Step 2 — Assess Blast Radius (who is affected)

| Label | Criteria |
|-------|----------|
| **Wide** | Affects all or most users · happens on core flows (login, signup, main dashboard, checkout, primary actions) |
| **Narrow** | Affects a small subset of users · admin-only screens · rare edge-case paths |

### Step 3 — Look up Priority

| Severity | Wide Blast Radius | Narrow Blast Radius |
|----------|-------------------|---------------------|
| S1 Critical | **Critical** | **High** |
| S2 High | **High** | **Medium** |
| S3 Medium | **Medium** | **Low** |
| S4 Low | **Low** | **Low** |

### Modifiers (apply after looking up the base priority)

- Bump **up one level** if: bug is on a payment / auth / data-integrity path, OR it is a regression in a recently shipped feature
- Drop **down one level** if: a simple workaround fully mitigates it, OR it only appears under a rare configuration
- **Never exceed Critical** — if two upward modifiers would push beyond Critical, stay at Critical

### Anti-inflation rules

- Do not use Critical or High unless the criteria are clearly met — over-inflation erodes developer trust in the bug queue
- Default to **Medium** when severity or blast radius is genuinely uncertain
- A broken UI that is purely cosmetic is **never** higher than Low priority, regardless of how visible it is

---

## WAY 2 — Manual Report Procedure

### Parsing Rules

**Extract Portal** — first token before the first comma. Map: AP → Agent Portal, APP → Applicant Portal, ADMIN → Admin Panel, API → Backend, MOB → Mobile App.

**Extract Precondition** — text between first and second comma. Expand into a clean full sentence.

**Parse Steps** — split by ` > `. Each segment = one step. Last segment starting with "Observe:" = actual result.

**Derive Title** — `[Portal] Short description of what broke`

**Derive Expected Result** — infer from the observation what should have happened.

### Filing Steps

1. Call `list_agile_boards` — find the board for JIRA_PROJECT, extract board `id`.
2. Call `list_sprints_for_board` with that board id and `state: active` — extract the sprint `id`.
3. Call `get_jira_current_user` (no params) — extract `accountId` from the response.
4. Call `create_jira_issue`:
   - `projectKey`: JIRA_PROJECT from env
   - `issueType`: "Bug" — always, never "Task"
   - `summary`: derived title
   - `description`: formatted report (see Description Format below) — keep it short and natural, not corporate-formal
   - `priority`: from Severity × Priority matrix above — assess internally, do not add a Severity line to the description
   - `assignee`: accountId from step 3
   - `labels`: ["qa-bug"]
   - `customFields`: `{"customfield_10020": <sprint_id>}` — sets the current sprint

5. Print summary:
```
Filed: [KEY] — [title]
Priority: [P] | Assignee: [name]
Sprint: [sprint name] | Label: qa-bug | Jira: [ATLASSIAN_BASE_URL]/browse/[KEY]
```

---

## WAY 1 — Automated Report Procedure

### Filing Steps

1. Call `list_agile_boards` — find the board for JIRA_PROJECT, extract board `id`.
2. Call `list_sprints_for_board` with that board id and `state: active` — extract the sprint `id`.
3. Call `get_jira_current_user` (no params) — extract `accountId`.
4. Call `create_jira_issue`:
   - `projectKey`: JIRA_PROJECT from env
   - `issueType`: "Bug"
   - `summary`: `[Feature] Short description of what broke — where`
   - `description`: full report using the Description Format below — no Severity line; severity is assessed internally only
   - `priority`: from Severity × Priority matrix above
   - `assignee`: accountId from step 3
   - `labels`: ["qa-bug"]
   - `customFields`: `{"customfield_10020": <sprint_id>}` — sets the current sprint
5. Note the returned issue key.
6. Save all artifacts (screenshot, console log, network log) to `./qa-artifacts/` with the issue key in the filename.
7. Add a comment to the issue via `add_jira_comment` listing the artifact file paths (attachment upload not available in current MCP version).
8. Link back to Qase: mark test case FAILED, add Jira key as comment.
9. Log to `./qa-artifacts/session-report.md`:
   ```
   - [KEY]: [title] — Severity: [S] | Priority: [P] — Artifacts saved to qa-artifacts/
   ```

---

## Description Format

**Always pass the description as a single ADF JSON object string.** Never use Markdown — asterisks (`*text*`, `**text**`) render as literal characters in Jira Cloud API v3 and do not produce bold or italic text.

**WAY 2 descriptions must be short and natural** — like a human tester wrote them in 2 minutes. 3–5 steps max, one-line actual/expected, no Test Data section unless the user explicitly provided inputs. Omit Environment, Artifacts, and Related Test Case sections entirely.

### Full ADF template (both modes)

WAY 2 omits Environment, Artifacts, Related Test Case, and Test Data (unless specific inputs were given).

```json
{
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Precondition: ", "marks": [{"type": "strong"}, {"type": "textColor", "attrs": {"color": "#4C9AFF"}}]},
        {"type": "text", "text": "[single line — or expand to bullet list if multiple conditions]"}
      ]
    },
    {"type": "rule"},
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Steps To Reproduce:", "marks": [{"type": "strong"}, {"type": "textColor", "attrs": {"color": "#4C9AFF"}}]}
      ]
    },
    {
      "type": "orderedList",
      "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[step 1 — start from a URL, name every field and value]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "[step 2]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Observe the system response."}]}]}
      ]
    },
    {"type": "rule"},
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Actual Result: ", "marks": [{"type": "strong"}, {"type": "textColor", "attrs": {"color": "#FF0000"}}]},
        {"type": "text", "text": "[what actually happened — specific, one sentence]"}
      ]
    },
    {"type": "rule"},
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Expected Result: ", "marks": [{"type": "strong"}, {"type": "textColor", "attrs": {"color": "#00875A"}}]},
        {"type": "text", "text": "[what should have happened — one sentence]"}
      ]
    },
    {"type": "rule"},
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Test Data: ", "marks": [{"type": "strong"}]},
        {"type": "text", "text": "[URL] | [any specific values used]"}
      ]
    },
    {"type": "rule"},
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Environment:", "marks": [{"type": "strong"}]}
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "URL: [exact URL tested]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Browser: Chromium / Firefox"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Date: [ISO 8601]"}]}]},
        {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Test Account: [placeholder — never real user data]"}]}]}
      ]
    },
    {"type": "rule"},
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Artifacts: ", "marks": [{"type": "strong"}]},
        {"type": "text", "text": "screenshot attached | console log attached | network log attached"}
      ]
    },
    {"type": "rule"},
    {
      "type": "paragraph",
      "content": [
        {"type": "text", "text": "Related Test Case: ", "marks": [{"type": "strong"}]},
        {"type": "text", "text": "Qase TC-[id]"}
      ]
    }
  ]
}
```

**Color rules:**
- `Precondition:` label → blue `#4C9AFF`
- `Steps To Reproduce:` label → blue `#4C9AFF`
- `Actual Result:` label → red `#FF0000`
- `Expected Result:` label → green `#00875A`
- All other labels (`Test Data:`, `Severity:`, `Environment:`, `Artifacts:`) → `strong` only, no color

---

## Quality Rules

- **Never file without Actual Result and Expected Result** — both are mandatory in all modes.
- **WAY 1: never file without a screenshot** — upload the file as an attachment, not a file path in description.
- **One bug per report** — never bundle multiple issues.
- **Steps must be reproducible** — every step starts from a URL, names every field and value explicitly.
- **Observe, don't interpret** — "form resets to empty" not "system is broken".
- **Never use real user data** in test data or environment fields — placeholders only.

---

## Common Mistakes — Never Do These

❌ `issueType: "Task"` — always `"Bug"`
❌ Skipping `assignee` — always call `get_jira_current_user` first
❌ Skipping sprint — always call `list_agile_boards` + `list_sprints_for_board` and set `customfield_10020`
❌ Skipping `labels: ["qa-bug"]` — always include
❌ Using old field names: `project_key`, `issue_type`, `assignee_account_id` — use `projectKey`, `issueType`, `assignee`
❌ Filing WAY 1 bug before screenshot is captured
❌ Vague steps: "Fill in the form" — name every field explicitly
❌ Speculation: "This is probably a race condition"
❌ Bundling multiple bugs in one report
❌ Over-inflating priority — apply the Severity × Priority matrix; default is Medium
❌ Putting severity in the description — assess it internally to derive priority, never expose it as a description line
