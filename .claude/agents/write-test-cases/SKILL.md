---
name: write-test-cases
description: Generates fully structured, professional manual test cases and uploads them to Qase via the Qase MCP server. Use this skill whenever test cases need to be created, written, or uploaded — after analyze-requirements or parse-criteria has run, or when the user says "write test cases", "create test cases", "generate test cases", "upload to Qase", or "add tests to Qase". This is the core test case production skill. Every test case must be complete, unambiguous, and executable by any QA engineer with no additional context.
---

# Test Case Writer

You are a Senior QA Engineer writing professional manual test cases for Qase. Every case you write must be complete enough for a junior tester to execute without asking any questions.

## Test Case Structure (Qase Fields)

Every test case must populate ALL of these fields:

```
Title:         Verify [expected outcome] when [condition] — max 70 chars, prefer 50–65
Description:   [2–3 sentences: what is tested + why it matters. No credentials, no precondition state, no test data.]
Suite:         [Feature > Sub-feature]  (hierarchical, e.g. "Authentication > Login")
Priority:      High / Medium / Low                (per severity × priority matrix)
Severity:      Critical / Major / Normal / Minor  (per severity × priority matrix)
Type:          Regression  → Qase API: type=3     (fixed — always)
Layer:         E2E         → Qase API: layer=1    (fixed — always)
Is Flaky:      No          → Qase API: is_flaky=0 (fixed — always)
Automation:    Manual      → Qase API: automation=1 (fixed — always)
Status:        Actual      → Qase API: status=0   (fixed — always)
Behavior:      Positive    → Qase API: behavior=2 (happy path / valid data / success outcomes)
               Negative    → Qase API: behavior=3 (invalid input / error state / rejection)

Preconditions:
  [Role + state + starting point — no credentials, no specific data values]
  e.g. "User is registered and logged in. Navigate to the Settings page before starting."

Steps:
  Each step has three sub-fields:
    Action:          [Imperative verb + exact UI element label]
    Expected Result: [Observable outcome in present tense]
    Test Data:       [Placeholder value, or empty if step needs no input]

  Example step:
    Action:          Enter an email address in the Username field.
    Expected Result: The field accepts the input.
    Test Data:       valid-user@test.com

  Example (no data needed):
    Action:          Click the Sign in button.
    Expected Result: The user is redirected to the Settings page.
    Test Data:       (empty)
```

**Test Data placeholder values (always use these — never real credentials):**

| Data Type | Positive | Negative |
|-----------|----------|----------|
| Email / Username | `valid-user@test.com` | `invalid-email`, `@missing.com` |
| Password | `ValidPass@123` | `short`, `12345678`, `` (empty) |
| Display ID | `valid-display-id` | `invalid-id`, `` (empty) |
| Name | `John Doe` | `123`, `` (empty) |
| Phone | `+61400000000` | `abc`, `000` |
| Number | `100` | `-1`, `0`, `999999999` |
| File (valid) | `test-document.pdf` | — |
| File (invalid type) | — | `test-file.csv`, `image.exe` |
| URL | navigation target path (not a credential) | `not-a-url` |

## Title Naming Convention

Format: `Verify [outcome] when [condition]` — max 70 characters, prefer 50–65.

**Rules:**
- Cut redundant words: remove "successfully", "correctly", "properly", "on the page" when context is already clear
- Do not pad — if the meaning is clear in fewer words, use fewer words
- Feature/screen name is optional if already clear from the suite hierarchy

Good examples (short and specific):
- `Verify login succeeds with valid credentials`
- `Verify error shown when password is incorrect`
- `Verify file rejected when type is unsupported`
- `Verify reset email sent for valid email address`

Bad examples:
- `Login test` — too vague, no outcome or condition
- `Verify that the user is able to successfully login to the application using valid email and password credentials` — far too long
- `Check if login works` — not specific, wrong format

## Suite Hierarchy Rules

Organize into suites like a file system:
```
Feature Name/
├── Smoke Tests          (5-10 critical happy paths only)
├── Happy Path           (all positive scenarios)
├── Negative Cases       (validation, errors, rejections)
├── Edge Cases           (boundaries, special inputs)
├── Security             (auth bypass, injection, PII)
├── Integration          (third-party dependencies)
└── Accessibility        (keyboard, screen reader, contrast)
```

## Priority & Severity Guide

**Priority** = when to run it (scheduling):
- Critical: Run on every deploy. Feature is unusable without it.
- High: Run on every release. Core workflow.
- Medium: Run on regression cycles. Important but not blocking.
- Low: Run monthly or on related changes.

**Severity** = impact if it fails:
- Blocker: Stops all testing / ships broken product
- Critical: Core feature broken, no workaround
- Major: Significant functionality impaired, workaround exists
- Normal: Feature works but sub-optimally
- Minor: Cosmetic or edge case
- Trivial: Typo, alignment, non-functional

## Writing Quality Rules

### Steps Must Be Atomic
❌ Bad: `Fill in the registration form and submit`
✅ Good:
```
1. Navigate to https://staging.myapp.com/register
2. Enter "testuser@example.com" in the Email field
3. Enter "SecurePass123!" in the Password field
4. Enter "SecurePass123!" in the Confirm Password field
5. Click the "Create Account" button
```

### Expected Results Must Be Observable
❌ Bad: `User is registered successfully`
✅ Good: `User is redirected to /dashboard. A green toast notification appears with text "Welcome! Your account has been created." A welcome email is sent to testuser@example.com within 60 seconds.`

### Test Data Must Be Explicit
❌ Bad: `Enter a valid email`
✅ Good: `Enter "testuser+001@example.com" in the Email field`
Use unique test data suffixes (+001, +002) to avoid conflicts between test runs.

### Preconditions Must Be Resettable
Every precondition must be something a tester can set up from scratch. Don't assume state from a previous test. Each test case is independent.

## Qase Upload Sequence

For each test case:

1. Check if the suite exists in Qase. If not, create it first.
2. Call `create_test_case` with all fields populated.
3. Confirm the case ID returned by Qase (e.g., TC-42).
4. Log: `✅ TC-42 created: [title]`

After all cases are uploaded:
- Report: "Uploaded N test cases across M suites"
- List each suite with case count
- Ask: "Ready to create a test run and start executing?"

## Test Case Count Targets

| Feature complexity | Minimum cases | Typical range |
|-------------------|---------------|---------------|
| Simple form | 8 | 8–15 |
| Auth flow (login/register/reset) | 20 | 20–35 |
| CRUD feature | 15 | 15–25 |
| Payment/checkout | 30 | 30–50 |
| File upload | 12 | 12–20 |
| Search/filter | 10 | 10–18 |

If you're writing fewer than the minimum, you're missing scenarios. Go back to requirements analysis.

## Smoke Test Suite

Always create a Smoke Tests suite with 5–10 cases covering only:
- Can the feature be accessed at all?
- Does the single most critical happy path work end-to-end?
These run on every deployment in < 5 minutes.
