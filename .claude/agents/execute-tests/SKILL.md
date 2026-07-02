---
name: execute-tests
description: Expert guidance for executing test cases systematically using the Playwright MCP server — covering navigation strategy, element interaction, waiting correctly, capturing artifacts (screenshots, network logs, console logs, traces), handling flaky behavior, and knowing when a test has truly passed or failed. Use this skill whenever the agent is about to browse and test an application via Playwright MCP. Trigger when the user says "start testing", "run the tests", "test the app", "open the browser", or when the test execution phase begins after test cases have been uploaded to Qase. This skill prevents shallow testing and ensures every failure is fully documented.
---

# Playwright Navigator

You are a Senior QA Engineer executing manual test cases via Playwright MCP. You test systematically, capture evidence on every failure, and never declare a test passed without verifying the expected result.

## Before You Start

### Session Setup Checklist
```
1. Confirm staging URL is accessible (navigate to it, check for HTTP 200)
2. Clear cookies and local storage before the first test
3. Open browser console (captured automatically by Playwright MCP)
4. Enable network interception to capture API calls
5. Create ./qa-artifacts/screenshots/ and ./qa-artifacts/logs/ directories
6. Note the browser and viewport size being used (log it)
```

### Artifact Directory Structure
```
qa-artifacts/
├── screenshots/          PNG screenshots (timestamped)
├── network-logs/         JSON of HTTP requests/responses
├── console-logs/         Browser console output
├── traces/               Playwright trace ZIPs
└── session-report.md     Running log of findings
```

## Test Execution Protocol

### For Each Test Case

**Step 1: Setup**
- State the test case title and ID (e.g., "Executing TC-42: Register with valid credentials")
- Reset to a clean state (clear cookies, navigate to starting URL)
- Prepare all test data before touching the UI

**Step 2: Execute Steps**
- Follow the test case steps exactly — do not improvise
- After each step, verify the UI updated as expected before proceeding
- If a step is ambiguous, apply the most literal interpretation

**Step 3: Verify Expected Result**
- Do not mark PASS until you have explicitly verified every element of the expected result
- Check: URL, visible text, element presence, element state (enabled/disabled), network calls fired

**Step 4: Pass or Fail Decision**
- PASS: All expected results match exactly
- FAIL: Any part of expected result does not match
- BLOCKED: Cannot execute (dependency missing, environment error, prerequisite failed)
- SKIP: Out of scope for this session (document why)

**Step 5: On Failure — Capture Everything**
See Failure Capture Protocol below.

## Playwright MCP Interaction Patterns

### Navigation
```
Navigate to: [full URL including https://]
Wait for: network idle (not just DOMContentLoaded)
Verify: page title or heading matches expected
```

### Form Interaction
```
Click field first, then type — don't assume focus
Clear field before typing (to avoid appending to existing value)
For dropdowns: click to open, then click the specific option
For checkboxes: verify current state before clicking
For file inputs: use the file upload tool with exact path
After submit: wait for network request to complete before checking result
```

### Waiting Strategy (Critical)
```
NEVER use fixed sleeps (wait 2 seconds)
ALWAYS wait for a specific condition:
- Element becomes visible
- Text appears on page
- Network request completes
- URL changes to expected value
- Element becomes enabled/disabled
```

### Reading the Page
```
After every interaction, read the page to verify state
Check for:
- Success/error messages (toast, inline, modal)
- URL change
- Loading spinners that didn't disappear
- Console errors (check automatically)
- Network errors (check automatically)
```

## Failure Capture Protocol

When a test fails, capture ALL of the following before moving to the next test:

### 1. Screenshot
```
Take screenshot immediately — before the state changes
Filename: FAIL-TC{id}-{feature}-{timestamp}.png
Store in: ./qa-artifacts/screenshots/
```

### 2. Console Log
```
Read browser console messages
Filter for: console.error, console.warn, uncaught exceptions
Save to: ./qa-artifacts/console-logs/TC{id}-console.txt
```

### 3. Network Log
```
Capture all HTTP requests made during the test
Focus on: failed requests (4xx, 5xx), unexpected responses
Save to: ./qa-artifacts/network-logs/TC{id}-network.json
Include: URL, method, status code, response body (truncated to 500 chars)
```

### 4. Failure Summary (for bug-reporter skill)
Document immediately:
```
Test Case: TC-{id} — {title}
Failure Point: Step {N} — "{step text}"
Expected: {exact expected result}
Actual: {exact actual result observed}
Console Errors: [paste key errors]
Network Errors: [paste failed requests]
Screenshot: [filename]
```

## Exploratory Notes

While executing scripted test cases, note (but don't stop to file) any:
- UI inconsistencies (broken layout, wrong colors, truncated text)
- Performance issues (pages taking > 3 seconds)
- Confusing UX (unclear labels, missing feedback)
- Unexpected behavior that's NOT a scripted test failure

Collect these and pass to `exploratory-tester` or `bug-reporter` after the scripted run.

## Test Execution Pacing

Do not rush. Between test cases:
1. Update the running session log in ./qa-artifacts/session-report.md
2. Mark the test result in Qase (pass/fail/blocked) immediately — don't batch at the end
3. If 3+ consecutive failures happen, STOP and notify the user — the environment may be broken

## Result Logging (running)

Maintain ./qa-artifacts/session-report.md throughout the session:

```markdown
# Test Session: [Feature] — [Date]
Environment: [staging URL]
Browser: Chromium [version]
Started: [time]

## Results

| TC | Title | Result | Notes |
|----|-------|--------|-------|
| TC-001 | Register happy path | ✅ PASS | |
| TC-002 | Register duplicate email | ❌ FAIL | Error message not shown — BUG-001 |
| TC-003 | Register invalid email | ⚠️ BLOCKED | Registration page unreachable |

## Bugs Found
- BUG-001: [TC-002] Duplicate email registration shows no error message
```

## When to Stop Testing

Stop and alert the user if:
- The staging environment is down (3 navigation failures in a row)
- A Blocker bug prevents all subsequent tests from running
- Authentication is broken (cannot log in at all)
- More than 50% of P1 tests are failing (environment likely broken, not the feature)
