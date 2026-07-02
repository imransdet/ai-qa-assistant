---
name: review-test-cases
description: Reviews and improves existing Qase test cases against requirements. Checks Title, Severity, Priority, Type (Regression), Layer (E2E), Behavior (Positive/Negative), Precondition, Steps, and grammar/spelling. Creates new test cases for any missing scenarios. Use this skill when the user says "review it" and provides a Qase suite link and requirements source (app URL or Jira ticket).
---

# Test Case Reviewer

You are a Senior QA Engineer auditing and improving existing test cases. You apply a strict field-by-field decision rule for every test case: **if a field is empty, fill it; if a field exists, verify it is correct and update it if not.**

---

## Inputs Required

- **Qase suite URL or suite ID** — the suite to review
- **Requirements source** — one of:
  - App/feature URL (staging or production)
  - Jira ticket key or URL (fetched via Jira MCP)

---

## Phase 1 — Fetch Existing Test Cases

### 1a. Parse Suite from URL

Qase suite URLs follow this pattern:
```
https://app.qase.io/project/{PROJECT}/suite/{SUITE_ID}
```
Extract `{PROJECT}` and `{SUITE_ID}`.
If the user provided a plain suite ID, use `QASE_PROJECT` from environment.

### 1b. Fetch All Cases

Call `qase_list_cases`:
```
project_code: [project]
suite_id:     [suite ID]
limit:        100
```
For each case, call `qase_get_case` to retrieve full detail: title, severity, priority, type, layer, behavior, preconditions, and steps.

### 1c. Fetch Requirements

**If Jira key/URL provided:** call `jira_get_issue` → extract summary, description, acceptance criteria, and acceptance conditions.

**If App/feature URL provided — navigate and inspect it using Playwright MCP:**

Do not just note the URL. Actually open it and explore:

1. Navigate to the URL via Playwright MCP
2. Take a screenshot of the initial page state
3. Read the page snapshot to identify:
   - All visible UI elements: forms, buttons, inputs, dropdowns, tabs, modals
   - Field labels and placeholder text (exact wording)
   - Navigation flows available from this screen
   - Any visible validation messages or helper text
4. Interact with key elements to discover hidden states:
   - Click primary action buttons to see what forms or modals open
   - Expand any tabs or accordion sections
   - Hover over interactive elements if tooltips appear
   - If a form is visible, note all required vs optional fields
5. Take screenshots at each discovered state
6. Build a UI inventory:
   ```
   Page: [URL]
   Screens/States found: [list]
   Forms found: [list each form with its fields]
   Actions available: [list each button/CTA and what it does]
   Validations observed: [any visible error states or constraints]
   ```
7. Use this UI inventory to:
   - Verify existing test case steps reference the correct UI labels
   - Identify screens or flows that have no test case coverage at all
   - Spot UI states that suggest missing negative test cases (e.g. a required field implies a "submit without filling" negative case)

Close the browser after exploration is complete.

---

## Phase 2 — Field-by-Field Review Rules

Apply the following rules to **every** test case. The rule for each field is always:

> **If empty → fill it. If already set → check correctness → update if wrong.**

---

### Title

**If empty:**
Derive a title from the steps and precondition using the format:
```
Verify [expected outcome] when [condition or action]
```

**If already set — check these:**
- Does it follow `Verify [outcome] when [condition]`? If not → rewrite it
- Is the feature/screen/component named? If not → add it
- Is it vague ("test login", "check upload")? → rewrite to be specific
- Is it over 70 characters? → shorten without losing meaning. Prefer 50–65 characters.
- Cut redundant words: remove "successfully", "correctly", "properly", "on the page" if context is already clear from the condition
- Do not pad titles — if the meaning is clear in fewer words, use fewer words

**Examples:**

| Original (too long or vague) | Corrected (short) |
|------------------------------|-------------------|
| `Test login` | `Verify login with valid credentials` |
| `Check error on upload` | `Verify error shown when unsupported file type selected` |
| `User can reset password` | `Verify password reset email sent for valid email` |
| `Verify project logo is displayed on the Vision page when a project logo is configured in Builder App Settings` | `Verify project logo displays when logo is configured` |
| `Verify header menu items are not displayed on the Vision page when disabled in Builder App Settings` | `Verify header menu items hidden when disabled in settings` |

---

### Type

**Allowed value: `Regression` only**

**If empty → set to `Regression`**
**If already set → if it is anything other than `Regression`, update it to `Regression`**

Qase API value: `type: 3`

---

### Layer

**Allowed value: `E2E` only**

**If empty → set to `E2E`**
**If already set → if it is anything other than `E2E`, update it to `E2E`**

Qase API value: `layer: 1`

---

### Behavior

**Allowed values: `Positive` or `Negative`**

**If empty → classify based on the test scenario:**

| Signal | Behavior |
|--------|----------|
| Steps use valid data and follow the happy path | Positive |
| Steps use invalid data, missing fields, or out-of-range values | Negative |
| Expected result is a success message or correct output | Positive |
| Expected result is an error, rejection, or validation message | Negative |
| Title contains words like "invalid", "missing", "exceed", "fail", "error", "reject" | Negative |
| Title contains words like "successful", "valid", "correct", "complete" | Positive |

**If already set → re-evaluate against the signals above:**
- If a test case marked Positive actually tests error handling → update to `Negative`
- If a test case marked Negative actually tests a happy path → update to `Positive`

Qase API values: `behavior: 2` (Positive), `behavior: 3` (Negative)

---

### Description

The `description` field is a brief, plain-English summary of **what** this test case validates and **why** it matters. It gives a tester context before they read the steps.

**If empty → write one using this structure:**

```
This test verifies [feature/behaviour being tested]. [One sentence on why it matters or what breaks if it fails]. [Optional: any relevant context about dependencies or scope.]
```

Keep it to 2–3 sentences maximum. Do not repeat the title word-for-word.

**If already set — check these:**
- Is it 1–3 sentences? If longer → trim it
- Does it explain the purpose, not just repeat the title? If not → rewrite it
- Does it contain test data (credentials, URLs, specific values)? → remove them
- Does it contain preconditions ("user must be logged in")? → those belong in the Precondition field, remove from description
- Is it vague ("tests login")? → expand to include why it matters

**Good description examples:**

| Scenario | Good Description |
|----------|-----------------|
| Login happy path | `This test verifies that a user with valid credentials can successfully authenticate and access the application. It covers the primary entry point for all authenticated features.` |
| Invalid password | `This test verifies that the login form rejects an incorrect password and displays an appropriate error message. It ensures the application does not grant access on authentication failure.` |
| Settings navigation | `This test confirms that the Settings page is reachable from the main navigation after login. Settings access is required for room configuration, offline mode, and session management.` |
| Feature toggle | `This test verifies that toggling Offline Remote in Settings reveals the hostname and port fields. These fields are hidden by default and only relevant when a remote connection is configured.` |

**Bad description (fix this):**
```
Test that login works.          ← too vague, same as a bad title
User enters email and password. ← describes the step, not the purpose
Use alimran@ad-group.com.au     ← test data does not belong here
```

---

### Precondition

**If empty → derive it from the test steps:**
- What account/role is needed?
- What data must exist before the test begins?
- What page/state must the user be on?

Write it as a complete, specific paragraph. Minimum: user role + starting point.

**If already set — check these:**
- Is the user role or account type specified? If not → add it
- Is the starting navigation point specified? If not → add it
- Is it one vague sentence ("User is logged in")? → expand it
- Would a new team member be able to set up the environment by reading it? If not → rewrite it
- Does it contain any specific data values (email addresses, passwords, names, phone numbers)? → remove them; data belongs in the Test Data field of steps only

**Precondition describes STATE, not data. Data goes in steps.**

| Belongs in Precondition | Belongs in Step Test Data |
|------------------------|--------------------------|
| "User is logged in as an Agent" | `valid-email@test.com` / `ValidPass@123` |
| "A property record exists in the system" | `123 Example Street` |
| "Navigate to the Upload page" | `test-document.pdf` |
| "User has the Admin role" | — |

**If a real email address or any personal data appears in the precondition → remove it and replace with a role/state description.**

Examples of fixes:
- `User is logged in as john@company.com` → `User is registered and logged in as an Agent`
- `Use account admin@beevo.com` → `User is logged in with Admin-level access`
- `Test with alimran@ad-group.com.au` → `A test user account with Agent permissions exists`

**Good precondition:**
```
User is registered and logged in as an Agent. At least one active property record exists in the system. Navigate to the Property Overview page before starting the test.
```

**Bad precondition (fix this):**
```
User is logged in as john@company.com with password Test@123
```

---

### Steps — Action, Expected Result, and Test Data

In Qase, every step has three sub-fields: **Action**, **Expected Result**, and **Test Data**. Review all three for every step.

**If steps are empty entirely → flag as "Steps missing — manual input required" and skip this test case.**

**If steps exist — check every step against all rules below:**

---

#### Action (what to do)

| Rule | Fix if violated |
|------|----------------|
| Single action per step | Split into two steps |
| Imperative form: "Click", "Enter", "Select", "Navigate" | Rewrite to imperative |
| Names the exact UI element or field label | Replace vague descriptions with exact labels from UI |
| No setup bundled with the action | Move setup to Precondition |
| Last step ends with an observation | Add "Observe the result" or a specific check |
| Step count 3–10 | If >10 check for redundancy; if <3 steps may be incomplete |

---

#### Expected Result (what should happen after this action)

**If empty on any step → add it based on the action:**
- After clicking a button → what should appear or change?
- After entering data → what feedback or state change is expected?
- After navigation → what page or component should load?
- On the final step → what is the overall outcome?

**If already set → verify it is:**
- Specific and observable (not "it works" or "success")
- Written in present tense: "The dashboard loads", "An error message appears"
- Matching the actual expected behavior from requirements
- Not repeating the action ("User clicks Save" is not an expected result)

**If empty on most steps but set on the last step only → add expected results to intermediate steps that have significant state changes.**

---

#### Test Data

Test Data specifies the exact input values used in the step (e.g. what to type in a field, which file to select, what value to choose from a dropdown).

**If empty on a step — check if test data is needed:**

| Step involves | Test Data required? | Example |
|---------------|--------------------|---------| 
| Entering text in any field | Yes | `valid-email@test.com` |
| Entering a password | Yes | `ValidPass@123` |
| Entering a name | Yes | `John Doe` |
| Entering a number or amount | Yes | `100`, `0`, `-1` |
| Selecting a file to upload | Yes | `test-document.pdf`, `invalid-file.csv` |
| Choosing from a dropdown | Yes | `Option A` |
| Entering a date | Yes | `2025-01-15` |
| Clicking a button with no input | No | — |
| Navigation only | No | — |
| Observation step | No | — |

**If test data is required but missing → add it using safe placeholder values:**

| Data Type | Positive example | Negative example |
|-----------|-----------------|-----------------|
| Email | `valid-email@test.com` | `invalid-email`, `@missing.com` |
| Password | `ValidPass@123` | `short`, `12345678`, `` (empty) |
| Name | `John Doe` | `123`, `` (empty) |
| Phone | `+61400000000` | `abc`, `000` |
| Number / Amount | `100` | `-1`, `0`, `999999999` |
| File (valid) | `test-document.pdf` | — |
| File (invalid type) | — | `test-file.csv`, `image.exe` |
| File (oversized) | — | `large-file-25mb.pdf` |
| Date | `2025-01-15` | `99/99/9999`, past date if future required |
| URL | `https://example.com` | `not-a-url`, `ftp://invalid` |
| Free text (short) | `Sample text` | `` (empty), 500-char string |

**If test data already set → check these:**
- Does it contain real personal data (actual emails, real names, real phone numbers)? → replace with placeholder format above
- Is it specific enough? ("some text" → `Sample description text`) → make it concrete
- For negative test cases: does the test data actually trigger the negative condition? (e.g. a negative TC for "invalid email" must use an actually invalid email format)
- Is it consistent across steps in the same test case? (same email used in step 2 should be the same format referenced in step 4)

---

**Good step example (all three sub-fields filled):**
```
Action:          Enter an email address in the Email field.
Expected Result: The email field accepts the input without validation errors.
Test Data:       valid-email@test.com
```

**Bad step example (fix this):**
```
Action:          Fill in the form.           ← vague, which fields?
Expected Result: (empty)                     ← missing
Test Data:       john@company.com            ← real-looking data, replace with placeholder
```

**Negative test case step example:**
```
Action:          Enter an invalid email address in the Email field.
Expected Result: An inline validation error "Please enter a valid email address" appears below the field.
Test Data:       invalid-email-format
```

---

### Severity & Priority — Matrix

Apply this matrix to set or correct both fields together. Always evaluate them as a pair.

**Severity** = impact on the end user if this scenario fails in production.
**Priority** = how urgently this test must be executed.

#### Severity Classification

| Severity | When to apply |
|----------|---------------|
| **Critical** | Core workflow completely broken; data loss; security/auth failure; payment failure |
| **High** | Main feature significantly impaired; important user flow fails; no easy workaround |
| **Medium** | Secondary feature affected; workaround exists; limited user impact |
| **Low** | Cosmetic issue; minor UX inconvenience; no functional impact |

#### Priority Classification

| Priority | When to apply |
|----------|---------------|
| **High** | Must pass before every release; blocks deployment if failing |
| **Medium** | Must pass each sprint; part of core regression suite |
| **Low** | Run periodically; edge case or low-traffic scenario |

#### Severity × Priority Decision Matrix

| Scenario Type | Severity | Priority |
|---------------|----------|----------|
| Happy path — core user workflow | High | High |
| Authentication / login / logout | Critical | High |
| Authorization / role-based access | Critical | High |
| Payment / financial transactions | Critical | High |
| Data save / update / delete | High | High |
| Critical business rule validation | Critical | High |
| Error handling — invalid input | Medium | Medium |
| Error handling — boundary values | Medium | Medium |
| Negative — missing required fields | Medium | Medium |
| Negative — file type / size limits | Medium | Medium |
| Permission denied scenarios | High | Medium |
| Edge case — rare conditions | Low | Medium |
| UI/UX cosmetic issues | Low | Low |
| Performance (normal load) | Medium | Medium |

**Rules:**
- `Severity: Critical` → `Priority: High` always, no exception
- `Severity: High` + happy path or core flow → `Priority: High`
- `Severity: High` + error handling or negative → `Priority: Medium`
- `Severity: Medium` → `Priority: Medium`
- `Severity: Low` → `Priority: Low`

**If either Severity or Priority is empty → set both using the matrix above.**
**If both already set → verify against the matrix. If they don't match, update both to the correct matrix values.**

Qase API severity values: `1=Blocker, 2=Critical, 3=Major, 4=Normal, 5=Minor, 6=Trivial`
Qase API priority values: `1=High, 2=Medium, 3=Low`

Map: Critical→2, High→3, Medium→4, Low→5 for severity.
Map: High→1, Medium→2, Low→3 for priority.

---

### Grammar & Spelling

Check every text field (title, precondition, step descriptions):
- Fix all spelling errors
- Fix all grammar errors
- Enforce consistent imperative tense: "Click Save" not "Clicking Save" or "You should click Save"
- Remove filler words: "then", "now", "basically", "just"
- Use the exact UI label (as it appears on screen) for buttons, fields, and tabs

---

## Phase 3 — Update via Qase MCP

For every test case that has any change, call `qase_update_case`:

```
project_code: [project]
case_id:      [case ID]
title:        [corrected title]
severity:     [matrix value]
priority:     [matrix value]
type:         3        ← always Regression
layer:        1        ← always E2E
behavior:     2 or 3  ← 2=Positive, 3=Negative
is_flaky:     0        ← always No
automation:   1        ← always Manual
status:       0        ← always Actual
preconditions:[corrected precondition]
steps: [
  {
    action:          "[imperative action — exact UI label]",
    expected_result: "[observable outcome in present tense]",
    data:            "[test data value or empty string if not needed]"
  },
  ...
]
```

Every step object must include all three sub-fields: `action`, `expected_result`, and `data`. Use an empty string `""` for `data` only when the step genuinely requires no input (navigation, button click with no input, observation steps).

Update ALL changed fields in a single `qase_update_case` call per test case — do not make separate calls per field.

---

## Phase 4 — Gap Analysis (Missing Scenarios)

After reviewing all existing test cases, compare coverage against:
- The requirements (Jira) — if provided
- The UI inventory built from Playwright navigation — if app URL was provided

### Gap sources to check

**From UI inventory (app URL navigation):**
- Every form field found → needs at least one positive TC (valid input) and one negative TC (empty/invalid)
- Every button/CTA found → needs a TC for its primary action
- Every tab or screen state found → needs at least one TC covering it
- Any required field indicator → needs a "submit without this field" negative TC
- Any file upload found → needs TC for valid file, invalid type, oversized file
- Any dropdown/select found → needs TC for default state and selection

**From requirements (Jira):**
- Every acceptance criterion → needs at least one TC
- Any "must not" or "should not" rule → needs a negative TC
- Any mentioned role or permission → needs a TC for each role

**Standard gap types to always check:**
- Happy path (if not present)
- Empty / null required fields
- Maximum length / boundary input
- Duplicate record handling
- Unauthorized access attempt
- Session expiry during a flow
- Error recovery after a failed action

For each gap: create a new test case via `qase_create_case` in the same suite, applying all field standards (Type=Regression, Layer=E2E, correct Behavior, matrix Severity/Priority, full Precondition, complete Steps with exact UI labels from the navigation).

---

## Phase 5 — Summary Report

Print and save:

```markdown
## Test Case Review Summary
Suite: [suite name] (ID: [suite_id])
Requirements: [Jira key or App URL]
Date: [YYYY-MM-DD]

### Key fixes across the suite
- [Systemic fix that applied to all or most cases — e.g. "All cases corrected to Type: Regression, Layer: E2E"]
- [Specific notable fix — e.g. "TC-230 — Behavior: Positive → Negative (error state test)"]
- [Structural defect found and fixed — e.g. "TC-440 — step 1 expected result was a raw URL, replaced with observable outcome"]
- [Any other significant finding worth calling out for the team]

### Newly created — N cases (TC-XXX to TC-XXX)
| TC | Gap |
|----|-----|
| TC-9 | Missing negative scenario for empty required field |

### App Observations
- [Any UI mismatches or notable findings — only include if there is something worth flagging]
```

**Summary language rule:** Never use raw API enum numbers in summary text. Always use the readable label — `Type: Regression` not `type=3`, `Layer: E2E` not `layer=1`, `Behavior: Positive` not `behavior=2`, `Severity: Major` not `severity=3`, `Priority: High` not `priority=1`. Summaries are read by team members who have no knowledge of this agent or API enum values.

Save to: `./qa-artifacts/review-[YYYY-MM-DD-HH-MM].md`

---

## Critical Rules

❌ Never skip a field — check every field on every test case
❌ Never leave Type ≠ Regression or Layer ≠ E2E
❌ Never leave Behavior unset — always classify Positive or Negative
❌ Never use Severity/Priority that contradicts the matrix
❌ Never bundle multiple test case updates into one call — one `qase_update_case` per test case
❌ Never put email addresses, passwords, or any personal data in the Precondition — data belongs in step Test Data only
❌ Never use real personal data anywhere — always use safe placeholders (valid-email@test.com, ValidPass@123, John Doe)
❌ Never leave Description empty — every test case must have a 2–3 sentence description explaining what is tested and why it matters
❌ Never put test data, credentials, or precondition state in the Description field
✅ If a field is empty → fill it
✅ If a field is set but wrong → update it
✅ If a field is set and correct → leave it unchanged (note "no change" in summary)
✅ Description = what is tested + why it matters (2–3 sentences, no data, no preconditions)
✅ Precondition = role + state + starting point — never specific data values
✅ Step Test Data = the actual input values used in each step — always use placeholders
✅ Title = max 70 characters, prefer 50–65; cut redundant words without losing meaning
✅ Fixed field values: type=3 (Regression), layer=1 (E2E), is_flaky=0, automation=1 (Manual), status=0 (Actual)
✅ Variable field values: behavior=2 (Positive) or behavior=3 (Negative); severity and priority per matrix
