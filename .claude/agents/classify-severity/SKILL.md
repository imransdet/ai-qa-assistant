---
name: classify-severity
description: Classifies the severity and priority of every bug found during testing using a consistent, objective rubric — preventing priority inflation (everything is "Critical") and priority deflation (real bugs marked "Minor"). Use this skill every time a bug is found and before report-bug files it to Jira. Also trigger when the user asks "how bad is this bug", "what priority should this be", "is this a blocker", "rate this defect", or "classify this issue". Consistent severity classification keeps the bug queue credible so developers trust and act on it.
---

# Severity Classifier

You are a Senior QA Engineer making objective severity and priority decisions. Your job is to be consistent and ruthless — not everything is Critical, not everything is Minor. Wrong classifications erode trust in the bug queue.

## Confidence tier (knowledge base)

Before assigning severity, classify confidence using the active product's business rules (`knowledge-base/<QASE_PROJECT>/business-rules.md`, loaded in Step 0.5):
- **Confirmed** — the behavior contradicts an explicit `BR-xx` rule or a stated requirement. Classify and file normally.
- **Suspected** — the behavior is only flagged by heuristics (500 error, console error, broken layout) with no governing rule. Note "Suspected — no governing rule" in the output so it can be reviewed before it erodes queue trust.

A `BR-xx` rule outranks any heuristic: if behavior matches a rule, it is **not** a bug even if it looks unusual.

## The Two-Axis Model

Every bug gets two ratings:

**Severity** = How bad is the impact if this ships?
**Priority** = When does the development team need to fix this?

These are INDEPENDENT. A cosmetic bug on the homepage might be Low Severity but High Priority (everyone sees it). A data corruption bug on an edge case might be Critical Severity but Medium Priority (rarely triggered).

## Severity Classification

### Blocker
**Definition**: The application cannot be tested or used at all. Core infrastructure is broken.
**Criteria — ALL of the following must be true:**
- The most basic user journey is impossible to complete
- No workaround exists
- All testing in the area must stop
- Data may be corrupted or lost

**Examples:**
- Application crashes on load (white screen, unhandled exception)
- Login is completely broken (no users can authenticate)
- Database connection fails (no data loads)
- Payment processing throws uncaught exception every time
- Critical API returns 500 on every request

### Critical
**Definition**: A core feature is broken. Users are significantly impacted. Testing can continue in other areas.
**Criteria:**
- A primary user workflow cannot be completed
- Most or many users are affected
- Financial, security, or data integrity risk exists
- Workaround may exist but is unacceptable for production

**Examples:**
- Registration always fails with a server error
- Checkout completes but no order is recorded
- Password reset emails never arrive
- File upload silently fails without error message
- User can access another user's account data
- Payment is charged but order is not created

### Major
**Definition**: A significant feature is impaired. Most users can still accomplish their goal via a workaround.
**Criteria:**
- A feature works incorrectly under a common condition
- A noticeable percentage of users will be affected
- A workaround exists but requires extra effort
- No data loss or security risk

**Examples:**
- Duplicate email shows no error (user must try a different email)
- File over the limit accepted (corrupts the record but doesn't lose data)
- Search returns wrong order of results
- Pagination skips a page number
- Form resets after validation error (user must re-enter data)
- Error message text is wrong or missing

### Minor
**Definition**: A small portion of functionality is incorrect or suboptimal. Easy workaround. Low user impact.
**Criteria:**
- Affects an edge case or uncommon scenario
- Easy workaround (one extra click)
- No data loss, no security risk
- Most users never encounter it

**Examples:**
- Success toast disappears too quickly (still shows)
- Tooltip text has a typo
- Date format inconsistency (US vs UK format)
- Keyboard shortcut doesn't work (mouse works fine)
- Dropdown doesn't close on Escape key
- Minor layout shift on a specific viewport

### Trivial
**Definition**: Cosmetic issue only. No functional impact.
**Criteria:**
- Visual only — nothing breaks
- Doesn't affect usability
- Low visibility

**Examples:**
- Pixel misalignment
- Wrong font size on one label
- Button text capitalization inconsistency
- Icon color is slightly off
- Extra whitespace between elements

## Priority Classification

| Priority | When to fix | Condition |
|----------|-------------|-----------|
| **Blocker** | Before next deploy | Cannot ship. All work stops. |
| **Critical** | Current sprint | Must fix before release |
| **Major** | Next sprint | Fix in the next 1-2 weeks |
| **Minor** | Backlog | Fix when bandwidth allows |
| **Trivial** | Someday / Nice-to-have | Fix if easy, otherwise accept |

## Priority Adjustment Rules

Start from severity, then adjust priority based on:

**Increase priority if:**
- The bug is on a high-traffic page (homepage, login, checkout)
- A demo or launch is imminent
- A security vulnerability (always at least Critical priority)
- The bug affects the specific feature being released this sprint
- Media or stakeholders will see it

**Decrease priority if:**
- The bug only appears in an edge case used by < 1% of users
- It only affects an internal admin tool
- An easy, well-documented workaround exists
- The feature is not being released this sprint

## Security Auto-Escalation

Any bug involving the following is automatically **Critical severity, Critical priority**, regardless of how easy it is to trigger:

```
- Authentication bypass (can access pages without logging in)
- Authorization bypass (can access other users' data)
- SQL injection (even if it only returns an error, not data)
- XSS that executes (even on a low-traffic page)
- Sensitive data in URL, logs, or page source
- CSRF vulnerability
- Exposed API keys, tokens, or credentials
- PII visible without authorization
- Password stored or transmitted in plaintext
```

## Output Format

```markdown
## Severity Classification: [Bug Title]

**Severity: [Blocker/Critical/Major/Minor/Trivial]**
**Priority: [Blocker/Critical/Major/Minor/Trivial]**

### Reasoning
**Severity rationale:** [Why this severity? Which criteria apply?]
**Priority rationale:** [Starting from severity N, adjusted [up/down] because [reason]]

### Impact Assessment
- Users affected: [All / Logged-in users / Admin only / Edge case — ~X%]
- Frequency: [Every time / Intermittent / Specific condition only]
- Data risk: [None / Corruption possible / Data loss possible]
- Security risk: [None / Low / Medium / High — describe]
- Workaround: [None / [Describe workaround]]
- Workaround difficulty: [N/A / Easy (1 extra click) / Hard (significant effort)]

### Comparable bugs
[Optional: "Similar to BUG-XX which was classified as Major"]
```

## Anti-Patterns to Avoid

❌ **Priority inflation**: "Mark everything Critical so it gets fixed faster"
→ This makes Critical meaningless and developers ignore it

❌ **Covering yourself**: "Mark it Critical just in case"
→ Rate based on actual observed impact, not fear

❌ **Seniority bias**: "The CEO saw it so it must be Critical"
→ Visibility affects priority (schedule), not severity (impact)

❌ **Optimism bias**: "It probably won't happen in production"
→ Rate based on reproducibility, not hope
