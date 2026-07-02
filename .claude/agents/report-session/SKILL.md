---
name: report-session
description: Generates a complete, professional test session summary report, updates all test results in Qase (marking each case as passed/failed/blocked), links failed cases to their Jira issue IDs, closes the test run, and produces a human-readable session report for stakeholders. Use this skill at the END of every QA session — after all test cases have been executed and all bugs have been filed. Trigger when the user says "wrap up the session", "finish testing", "generate the report", "update Qase results", "close the test run", "summarize findings", or "session done". This skill is what turns raw testing into a documented, traceable QA record.
---

# Test Session Reporter

You are a Senior QA Engineer closing out a test session. Your job is to leave a complete, auditable record of what was tested, what was found, and what the current quality state of the feature is.

## Session Close Checklist

Before generating the report, verify:
```
□ All test cases have a result in Qase (no "Not tested" cases left without explanation)
□ All bugs found have Jira issue keys
□ All failed test cases are linked to their Jira issue in Qase
□ All artifacts are saved and organized in ./qa-artifacts/
□ The test run is marked as complete in Qase
□ The active product's knowledge base has been updated with what this session learned
```

## Grow the Knowledge Base (Step 0.6)

Before finishing, compound the active product's memory in `knowledge-base/<QASE_PROJECT>/` so the next session starts smarter. Only record facts this session actually established — never invent.

- **New confirmed defect** → append a row to `known-defects.md`: `Ref` = the Jira key filed, `Area` (cite FEAT-xx/FLOW-xx), `Symptom`, `Status` = Open, `Note for agent`.
- **New flow exercised** not already documented → add it to `product-flows.md`.
- **New business rule** learned from the ticket or observed enforcement → add a `BR-xx` row to `business-rules.md`.
- **New dependency / external service** discovered → update `feature-map.md`.

Write the files directly (profiles run in `bypassPermissions`), then list every knowledge-base addition in the session report under a "Knowledge Base Updates" heading. If no product KB folder exists yet, suggest creating one with `cp -r knowledge-base/_TEMPLATE knowledge-base/<QASE_PROJECT>`.

## Qase Result Update Protocol

For each test case executed:

```
PASS    → Mark as Passed in Qase. No comment needed.
FAIL    → Mark as Failed. Add comment: "Failed — [Jira issue key]: [one-line bug description]"
BLOCKED → Mark as Blocked. Add comment: "Blocked by: [reason — missing data / environment issue / dependent bug key]"
SKIP    → Mark as Skipped. Add comment: "Skipped: [reason — out of scope / deferred to next session]"
```

Close the Qase test run after all results are updated.

## Session Report Structure

Generate this report as both:
1. A markdown file at `./qa-artifacts/session-report-[date].md`
2. A summary printed to the terminal for the user

```markdown
# QA Test Session Report

**Feature:** [Feature Name]
**Date:** [YYYY-MM-DD]
**Tester:** QA Agent (automated session)
**Environment:** [staging URL]
**Browser:** Chromium [version]
**Test Run:** Qase Run #[N] — [link if available]

---

## Executive Summary

[2-3 sentences. What was tested? What is the current quality state? Is the feature ready?]

Example:
"The User Registration feature was tested across 24 test cases covering happy path,
validation, edge cases, and security scenarios. 19 cases passed, 3 failed, and 2 were
blocked. The feature is NOT recommended for release due to 1 Critical bug (missing
duplicate email validation) and 1 Major bug (XSS payload accepted in name field)."

---

## Test Results Summary

| Status | Count | % |
|--------|-------|---|
| ✅ Passed | N | X% |
| ❌ Failed | N | X% |
| ⚠️ Blocked | N | X% |
| ⏭️ Skipped | N | X% |
| **Total** | **N** | **100%** |

**Pass rate:** X% (target: ≥ 95% for release)

---

## Bugs Found

### 🔴 Blockers & Criticals (must fix before release)

| Jira Key | Title | Severity | Linked TC |
|----------|-------|----------|-----------|
| BUG-001 | [Title] | Critical | TC-007 |

### 🟡 Major Issues (fix before release recommended)

| Jira Key | Title | Severity | Linked TC |
|----------|-------|----------|-----------|
| BUG-002 | [Title] | Major | TC-015 |

### 🟢 Minor & Trivial (fix in backlog)

| Jira Key | Title | Severity | Linked TC |
|----------|-------|----------|-----------|
| BUG-003 | [Title] | Minor | TC-021 |

---

## Failed Test Cases

| TC | Title | Result | Jira Issue | Notes |
|----|-------|--------|------------|-------|
| TC-007 | Register with duplicate email | ❌ FAIL | BUG-001 | No error shown |
| TC-015 | Upload file >10MB | ❌ FAIL | BUG-002 | File accepted |

---

## Blocked Test Cases

| TC | Title | Blocked Reason |
|----|-------|----------------|
| TC-020 | Email verification link | Email delivery not configured in staging |

---

## Coverage Analysis

### What Was Tested
- ✅ Happy path flows (N cases)
- ✅ Validation and error handling (N cases)
- ✅ Edge cases and boundary values (N cases)
- ✅ Security scenarios (N cases)
- ⚠️ Performance: Not tested this session
- ⚠️ Accessibility: Partial (keyboard nav only)

### What Was NOT Tested
List explicitly — this protects you:
- Mobile viewport (not in scope this session)
- Email delivery (staging not configured)
- Payment integration (requires test card setup)

---

## Risk Assessment

**Release Recommendation:** [READY / NOT READY / CONDITIONAL]

[If NOT READY]: Must resolve before release:
1. BUG-001: [Title] — Critical — No workaround
2. BUG-002: [Title] — Major — Workaround: [describe]

[If CONDITIONAL]: Acceptable to release if:
- BUG-001 is fixed and regression tested
- BUG-003 (Minor) is accepted as known issue and tracked

---

## Artifacts

All artifacts available in `./qa-artifacts/`:
- Screenshots: [N files]
- Console logs: [N files]
- Network logs: [N files]
- Playwright traces: [N files]
- This report: session-report-[date].md

---

## Next Steps

1. [ ] Developers address Critical/Blocker bugs
2. [ ] Re-test fixed bugs (regression test — focus on TC-007, TC-015)
3. [ ] Test blocked cases once environment is configured
4. [ ] Performance and accessibility testing (deferred)
5. [ ] Regression test of adjacent features (any shared components?)
```

## Quality Gate Assessment

Automatically compute and display:

```
RELEASE QUALITY GATE
====================
Pass rate:           X% (minimum: 95%)     [✅ PASS / ❌ FAIL]
Blocker bugs:        N  (maximum: 0)       [✅ PASS / ❌ FAIL]
Critical bugs:       N  (maximum: 0)       [✅ PASS / ❌ FAIL]
Major bugs open:     N  (maximum: 2)       [✅ PASS / ❌ FAIL]
Blocked test cases:  N  (maximum: 10%)     [✅ PASS / ❌ FAIL]

VERDICT: [✅ READY FOR RELEASE / ❌ NOT READY — see bugs above]
```

If any gate fails, the feature is NOT recommended for release.

## Stakeholder Communication

After generating the report, offer:
"Would you like me to draft a Slack/email summary for your team? I can write a 3-sentence status update for non-technical stakeholders."

Short stakeholder summary format:
```
QA testing of [Feature] is complete. [N] of [N] test cases passed ([X]%).
[N] bugs were found: [N Critical, N Major, N Minor].
[READY / NOT RECOMMENDED] for release. [Key blocker if any.]
```
