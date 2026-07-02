# Senior QA Engineer Agent

An autonomous QA agent that runs inside VS Code. Give it a staging URL and your requirements — in any form: plain-text description, a Jira ticket, acceptance criteria, a PRD, or a Figma link — and it writes test cases, executes them in a real browser, finds bugs, files detailed Jira issues, and creates your QA sprint tickets, all without you lifting a finger. Every test case it writes is saved to Qase.

> Built with Claude Code · Playwright MCP · Qase · Jira

---

## Contents

- [What It Does](#what-it-does)
- [Five Modes](#five-modes)
- [Architecture](#architecture)
- [Knowledge Base](#knowledge-base)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup](#setup) ← **start here**
- [Usage](#usage)
- [Example Output](#example-output)
- [Skills](#skills)
- [Roadmap](#roadmap)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## What It Does

```
You: "test it — App: https://staging.myapp.com — <your requirements>"

      where <your requirements> is any of:
        Feature: User Login
        Jira: PROJ-42
        Figma: https://figma.com/file/abc123/Login-Flow

Agent:
  1. Reads your requirements (or fetches them from Jira)
  2. Writes test cases → uploads to Qase
  3. Opens a real browser → executes every test
  4. Finds bugs → captures screenshot + console + network logs
  5. Files detailed bug reports to Jira
  6. Closes the session with a full summary
```

Runs entirely inside VS Code. No extra tools, no dashboards, no context-switching.

---

## Five Modes

| Mode | Trigger | What Happens |
|------|---------|-------------|
| **WAY 1** — Full QA Session | `test it` | Full lifecycle: analyze → write test cases → execute → file bugs → summary |
| **WAY 2** — Quick Bug Report | `report it` | Parse your shorthand input → format → file to Jira instantly |
| **WAY 3** — Write Test Cases | `write it` | Analyze requirements → generate test cases → upload to Qase |
| **WAY 4** — Review Test Cases | `review it` | Audit & improve existing Qase suite → fix fields → fill gaps |
| **WAY 5** — Create QA Jira Tickets | `create it` | Fetch epic → create TC Dev ticket + Retesting parent + sub-tasks → move to backlog |

---

## Architecture

```mermaid
flowchart TD
    User[You\nVS Code sidebar]
    CC[Claude Code\nOrchestrator + LLM Brain]
    PW[Playwright MCP\nBrowser Automation]
    QA[Qase MCP\nTest Management]
    JR[Jira MCP\nBug Tracking]
    APP[Staging App]
    FS[qa-artifacts\nScreenshots and Logs]

    User -->|"test it / report it / write it / review it / create it"| CC
    CC -->|"navigate · click · capture"| PW
    CC -->|"create suites · mark results"| QA
    CC -->|"file issues · attach evidence"| JR
    PW -->|"interacts with"| APP
    PW -->|"saves"| FS
```

---

## Knowledge Base

*The agent's product memory.*

By default an AI test agent starts every session cold — it only knows the requirements and staging URL you give it. The `knowledge-base/` folder fixes that. It's persistent product memory the agent loads automatically before analyzing requirements (WAY 1, 3, 4), keyed by your **Qase project code** (`QASE_PROJECT` in settings).

```
knowledge-base/
├── _TEMPLATE/     ← copy this to start a new product KB
└── <QASE_PROJECT>/
    ├── product-flows.md
    ├── business-rules.md
    ├── feature-map.md
    └── known-defects.md
```

Start a product KB:

```bash
cp -r knowledge-base/_TEMPLATE knowledge-base/MYPROJECT
```

| File | What it changes |
|------|-----------------|
| `product-flows.md` | Grounds happy-path tests in real navigation, not guesses |
| `business-rules.md` | **Bug-vs-intended oracle** — a rule here outranks heuristic guesses |
| `feature-map.md` | Adds regression-risk areas to every test scope |
| `known-defects.md` | Probes weak spots harder; prevents duplicate bug reports |

**It compounds.** At the end of every WAY 1 session the agent proposes KB updates — new confirmed defects, flows, rules learned. You can also just tell it a fact ("the upload limit is now 20 MB") and it files it into the right KB file. See [knowledge-base/GUIDE.md](knowledge-base/GUIDE.md) for the full format.

---

## Tech Stack

| Tool | Role | Cost |
|------|------|------|
| [VS Code](https://code.visualstudio.com) + [Claude Code Extension](https://marketplace.visualstudio.com/items?itemName=Anthropic.claude-code) | IDE + agent orchestrator | Free + $20/mo (Claude Pro) |
| Claude Sonnet (Anthropic) | LLM brain — reasoning, test generation, bug analysis | Included with Claude Pro |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | Browser automation, screenshots, logs | Free |
| [Qase MCP](https://github.com/qase-tms/qase-mcp-server) | Upload test cases, manage runs, mark results | Free tier available |
| [mcp-atlassian](https://github.com/sooperset/mcp-atlassian) | File Jira issues, create tickets | Free |

**Estimated total: ~$20/month** (Claude Pro covers everything)

---

## Project Structure

```
qa-agent/
├── CLAUDE.md                          # Agent brain — full workflow + trigger keywords
├── README.md                          # This file
├── knowledge-base/                    # Persistent product memory
│   ├── GUIDE.md                       # How the knowledge base works
│   └── _TEMPLATE/                     # Copy to start a new product KB
│       ├── product-flows.md
│       ├── business-rules.md
│       ├── feature-map.md
│       └── known-defects.md
├── scripts/                           # Utility scripts (gitignored — contain credentials)
│   ├── create_retest_tickets.py
│   └── link_and_backlog.py
├── .mcp.json                          # MCP server config with API tokens (gitignored)
├── .claude/
│   ├── settings.json                  # Claude Code settings + env tokens (gitignored)
│   └── agents/                        # 10 specialist skills
│       ├── analyze-requirements/
│       ├── parse-criteria/
│       ├── write-test-cases/
│       ├── generate-edge-cases/
│       ├── execute-tests/
│       ├── explore-app/
│       ├── report-bug/
│       ├── classify-severity/
│       ├── review-test-cases/
│       └── report-session/
├── qa-artifacts/                      # Created locally — gitignored
│   ├── screenshots/
│   ├── console-logs/
│   ├── network-logs/
│   └── logs/
└── assets/                            # README images
```

Files excluded from git: `.mcp.json`, `.claude/settings.json`, `scripts/`, `qa-artifacts/`

---

## Setup

### 1. Prerequisites

| Requirement | Version | Install |
|-------------|---------|---------|
| VS Code | Latest | [code.visualstudio.com](https://code.visualstudio.com) |
| Claude Code Extension | Latest | VS Code Extensions → search "Claude Code" |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Claude Pro account | — | Required for Claude Code |

### 2. Clone the repo

```bash
git clone https://github.com/your-username/qa-agent.git
cd qa-agent
```

### 3. Install Playwright browser

```bash
npx playwright install chromium
```

### 4. Get your API tokens

| Service | Where to get it |
|---------|----------------|
| **Jira** | [id.atlassian.com](https://id.atlassian.com) → Security → API Tokens → Create |
| **Qase** | [app.qase.io](https://app.qase.io) → Settings → API Tokens → Generate |

You also need:
- Your **Jira workspace URL** (e.g. `https://yourcompany.atlassian.net`)
- Your **Jira project key** (e.g. `SCRUM`)
- Your **Qase project code** (e.g. `DEMO`)

### 5. Create your config files

**`.mcp.json`** — create this file in the project root:

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "--headless"]
    },
    "qase": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@qase/mcp-server"],
      "env": { "QASE_API_TOKEN": "your_qase_token" }
    },
    "jira": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "mcp-atlassian"],
      "env": {
        "JIRA_URL": "https://yourcompany.atlassian.net",
        "JIRA_USERNAME": "your@email.com",
        "JIRA_API_TOKEN": "your_jira_token"
      }
    }
  }
}
```

**`.claude/settings.json`** — create this file:

```json
{
  "model": "claude-sonnet-4-6",
  "enableAllProjectMcpServers": true,
  "permissions": {
    "defaultMode": "bypassPermissions",
    "allow": ["Bash(*)", "Read(*)", "Write(*)", "Edit(*)", "mcp__playwright__*", "mcp__qase__*", "mcp__jira__*"]
  },
  "env": {
    "JIRA_URL": "https://yourcompany.atlassian.net",
    "JIRA_USERNAME": "your@email.com",
    "JIRA_API_TOKEN": "your_jira_token",
    "JIRA_PROJECT": "SCRUM",
    "QASE_API_TOKEN": "your_qase_token",
    "QASE_PROJECT": "DEMO",
    "SCREENSHOT_DIR": "./qa-artifacts/screenshots",
    "LOG_DIR": "./qa-artifacts/logs"
  }
}
```

> **Why two files?** `.mcp.json` is read by the MCP server processes at startup. `settings.json` passes the same values to Claude Code as environment variables. Both need the same credentials.

### 6. Create artifact directories

```bash
mkdir -p qa-artifacts/screenshots qa-artifacts/console-logs qa-artifacts/network-logs qa-artifacts/logs
```

### 7. Open in VS Code

```bash
code .
```

### 8. Verify MCP servers

Type `/mcp` in the Claude Code panel to confirm all three servers show as connected:
- `playwright` — browser automation
- `qase` — test case management
- `jira` — bug tracking

---

## Usage

### WAY 1 — Full QA Session

```
test it
App: https://staging.myapp.com
Feature: Document Upload
Requirements:
1. Users can upload PDF and DOCX files only
2. Files over 10MB are rejected with a clear error
3. Uploaded files appear in the document list immediately
```

Or from a Jira story:
```
test it
App: https://staging.myapp.com
Jira: PROJ-42
```

**Produces:** Qase test run with pass/fail results · Jira bug reports with screenshots + logs · Session report in `qa-artifacts/`

---

### WAY 2 — Quick Bug Report

```
report it
Admin Portal, Must be logged in, Go to Settings > Click Delete Account > Confirm > Observe: page shows 500 error instead of success message
```

Format: `[Portal], [Precondition], [Step 1 > Step 2 > Observe: what you saw]`

**Produces:** Jira bug filed instantly — summary printed with key, title, priority, and link.

---

### WAY 3 — Write Test Cases Only

```
write it
Jira: PROJ-42
App: https://staging.myapp.com/upload
```

Optional params: `App:` (UI-aware step wording) · `Figma:` (design reference)

**Produces:** Qase test cases organized into suites · Summary in `qa-artifacts/`

---

### WAY 4 — Review Existing Test Cases

```
review it
Suite: https://app.qase.io/project/PROJ/suite/5
Jira: PROJ-42
```

**Fixes per test case:** Title format · Severity & Priority · Type → Regression · Layer → E2E · Behavior · Precondition · Steps · Expected Results · Test Data · Grammar

**Produces:** Updated Qase test cases · New cases for gaps · Review report in `qa-artifacts/`

---

### WAY 5 — Create QA Jira Tickets from Epic

```
create it
Epic: PROJ-100
```

**Creates:** 1 TC Development ticket (aggregated requirements + Figma links) · 1 Retesting parent + 1 sub-task per dev story (all unassigned) · All moved to backlog

Story points calculated automatically from dev SP matrices.

---

## Example Output

### Bug Report Filed to Jira

```
[File Upload] 15MB file accepted despite 10MB limit

Precondition: Must have a property with file upload enabled

Steps To Reproduce:
1. Navigate to https://staging.myapp.com/documents
2. Click "Upload Document"
3. Select a 15MB PDF file
4. Click "Save"
5. Observe the system response.

---

Actual Result: File uploads successfully with no error shown.

---

Expected Result: Upload rejected with error: "File size exceeds the 10MB limit."

---

Test Data: https://staging.myapp.com/documents | File: 15MB PDF
```

---

## Skills

Each skill is a specialist instruction file in `.claude/agents/` that gives the agent expert-level knowledge for one phase of testing.

| Skill | Used In | What It Does |
|-------|---------|-------------|
| `analyze-requirements` | WAY 1, 3, 4 | Breaks specs into happy paths, edge cases, security scenarios |
| `parse-criteria` | WAY 1, 3 | Converts BDD / user-story criteria into pass/fail conditions |
| `write-test-cases` | WAY 1, 3 | Generates Qase test cases with steps, preconditions, expected results |
| `generate-edge-cases` | WAY 1, 3 | Adds boundary values, injection payloads, encoding attacks |
| `execute-tests` | WAY 1, 4 | Executes tests in browser, manages waits, captures failures |
| `explore-app` | WAY 1 | Structured exploratory testing with heuristics and attack patterns |
| `report-bug` | WAY 1, 2 | Files Jira bug reports — WAY 1 with evidence, WAY 2 from shorthand input |
| `classify-severity` | WAY 1 | Severity × priority matrix with auto-escalation for security bugs |
| `review-test-cases` | WAY 4 | Audits Qase suite — fix every field, grammar, gaps; create missing cases |
| `report-session` | WAY 1 | Closes session, updates Qase results, generates stakeholder report |

---

## Roadmap

### Shipped
- ✅ **Persistent, per-product Knowledge Base** — product flows, business rules, feature map, known defects — auto-loaded by `QASE_PROJECT`
- ✅ **Compounding knowledge** — agent proposes KB updates at end of each WAY 1 session and learns facts on demand
- ✅ **Bug confidence tiers** — `Confirmed` (violates a documented business rule) vs `Suspected` (heuristic only)

### Planned
1. **Bug approval gate** — auto-file only `Confirmed` defects; hold `Suspected` ones for sign-off
2. **Expand ingested context** — accept OpenAPI/Swagger spec; actually read Figma frames; pull existing Qase cases to avoid regenerating duplicates
3. **Measurement & metrics** — session metrics block (cases created, pass/fail/blocked, run time); running `qa-artifacts/metrics.csv`
4. **Knowledge-base bulk backfill** — point at a Jira epic or closed bugs to harvest rules and defects into the KB in one pass

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Jira MCP 401 error | Check `JIRA_URL`, `JIRA_USERNAME`, `JIRA_API_TOKEN` in `.mcp.json` and `settings.json` |
| Qase MCP auth fails | Regenerate token in Qase → Settings → API Tokens |
| Agent goes off-task | Ensure `CLAUDE.md` is in the project root; reload VS Code window |
| Screenshots not saved | Check `qa-artifacts/screenshots/` exists and is writable |
| MCP server not connecting | Type `/mcp` in Claude Code panel to verify server status |

---

## License

MIT — use freely, attribution appreciated.
