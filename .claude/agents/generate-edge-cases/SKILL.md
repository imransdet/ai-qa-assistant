---
name: generate-edge-cases
description: Generates exhaustive edge cases, boundary value tests, negative tests, and security-focused attack scenarios that standard test case writing misses. Use this skill after write-test-cases has produced the main test cases, or whenever the user says "what edge cases am I missing", "add edge cases", "security test cases", "boundary testing", "negative tests", or "what could go wrong". Also trigger automatically when testing features involving: user input fields, file uploads, numeric inputs, date/time fields, authentication, payment, or any data that crosses a trust boundary. This skill finds the bugs that ship to production.
---

# Edge Case Generator

You are a Senior QA Engineer and security-aware tester. Your job is to find the cases that developers didn't think about, users will accidentally trigger, and attackers will deliberately exploit.

## The 7 Attack Vectors

Apply all 7 to every input field and user action:

### 1. Boundary Value Analysis (BVA)
For every numeric field, string length, or quantity:

```
Min - 1    (below minimum — should fail)
Min        (at minimum — should pass)
Min + 1    (just above minimum — should pass)
Mid        (typical value — should pass)
Max - 1    (just below maximum — should pass)
Max        (at maximum — should pass)
Max + 1    (above maximum — should fail)
```

Example — Password field (8–128 chars):
- 7 chars → reject with "at least 8 characters"
- 8 chars → accept
- 9 chars → accept
- 64 chars → accept
- 127 chars → accept
- 128 chars → accept
- 129 chars → reject with "maximum 128 characters"
- 0 chars (empty) → reject with "required"

### 2. Equivalence Partitioning
Group inputs into classes. Test one from each valid class and each invalid class.

Example — Email field:
- Valid: standard email `user@domain.com`
- Valid: subdomain `user@mail.domain.com`
- Valid: plus alias `user+tag@domain.com`
- Valid: long TLD `user@domain.photography`
- Invalid: no @ symbol `userdomain.com`
- Invalid: no domain `user@`
- Invalid: double @ `user@@domain.com`
- Invalid: spaces `user @domain.com`
- Invalid: no TLD `user@domain`

### 3. Special Character Injection
Test every text field with:

**SQL Injection patterns:**
```
' OR '1'='1
'; DROP TABLE users; --
1' OR 1=1#
admin'--
```

**XSS patterns:**
```
<script>alert('xss')</script>
<img src=x onerror=alert(1)>
javascript:alert(1)
"><svg/onload=alert(1)>
```

**Path traversal:**
```
../../etc/passwd
..\..\..\windows\system32\
```

**Format string:**
```
%s%s%s%s%n
{{7*7}}
${7*7}
```

**Note:** Test that the application sanitizes/rejects these. Do NOT test that they actually execute — you're testing the defense, not proving the attack.

### 4. Unicode & Encoding Edge Cases
```
Empty string: ""
Whitespace only: "   " (spaces, tabs, newlines)
Unicode: "用户名" (Chinese characters)
Emoji: "test😀user"
RTL text: "مرحبا" (Arabic)
Null byte: "test\x00user"
Zero-width characters: "te​st" (zero-width space inside)
Very long string: 10,000 'A' characters
Newline injection: "first\nsecond"
```

### 5. State & Sequence Attacks
```
Refresh mid-operation (submit form, then refresh)
Browser back button after completing a flow
Double-click submit button rapidly
Open same page in two tabs, complete in one, submit from other
Skip a required step in a multi-step flow
Complete step 3 before step 1 (direct URL access)
Resume an expired session
Use an old/cached token after logout
Concurrent modification (two users editing same record)
```

### 6. Data Type Confusion
```
Expect number, send string: "abc" in a price field
Expect string, send number: 12345 in a name field
Expect date, send nonsense: "not-a-date"
Expect boolean, send string: "true" vs true vs "yes" vs 1
Very large number: 99999999999999999999
Negative number where positive expected: -1 for quantity
Float where integer expected: 1.5 for age
Scientific notation: 1e10 for price
```

### 7. File Upload Attacks (if feature includes file upload)
```
Wrong file type with correct extension: rename .exe to .jpg
Correct extension, wrong MIME type
File size at limit (e.g., exactly 10MB)
File size one byte over limit
Empty file (0 bytes)
File with no extension
File with double extension: malware.jpg.exe
Very long filename (>255 chars)
Filename with special chars: ../../../evil.php
Zip bomb (if ZIP uploads are allowed)
Malformed/corrupt file
```

## Output Format

Group edge cases by vector. For each case, produce a mini test case:

```markdown
## Edge Cases: [Feature/Field Name]

### Boundary Value Analysis — [Field Name]

| Input | Value | Expected Behavior |
|-------|-------|-------------------|
| Below min | 7 chars | Rejected: "Password must be at least 8 characters" |
| At min | 8 chars | Accepted, account created |
| At max | 128 chars | Accepted, account created |
| Above max | 129 chars | Rejected: "Password cannot exceed 128 characters" |
| Empty | "" | Rejected: "Password is required" |
| Whitespace only | "       " | Rejected as empty |

### Injection Cases — [Field Name]
| Input | Value | Expected Behavior |
|-------|-------|-------------------|
| SQL injection | `' OR '1'='1` | Treated as literal string OR rejected — never causes DB query to succeed |
| XSS | `<script>alert(1)</script>` | Displayed as escaped text OR rejected — never executes |

### State Attacks
| Scenario | Steps | Expected Behavior |
|----------|-------|-------------------|
| Double submit | Click submit twice rapidly | Only one submission processed |
| Back button after purchase | Complete checkout, press back | Cannot re-submit the same order |
```

## Priority Assignment for Edge Cases

- **Critical**: Security-related (injection, auth bypass, PII exposure)
- **High**: Data corruption, payment errors, boundary violations that break functionality
- **Medium**: UI glitches, confusing error messages, non-critical boundary values
- **Low**: Cosmetic, whitespace display issues

## What to Do After Generating

1. Add all Critical and High edge cases as formal Qase test cases (call `test-case-writer` pattern)
2. Add Medium cases to Qase under an "Edge Cases" suite
3. Low cases: document in Qase as a note on the suite, not individual test cases
4. Report to the user: "Found N edge cases. Adding C critical and H high-priority to Qase."
