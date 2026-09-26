# Product Flows

Step-by-step descriptions of how users move through the product. The agent uses these to ground end-to-end and happy-path test cases in *real* navigation, instead of guessing the UI.

**Format per flow:**
- `Flow ID` — short stable identifier the agent can cite
- `Actor` — which persona/role performs it
- `Entry point` — where the flow begins (URL, screen, trigger)
- `Steps` — numbered, in order
- `Exit / success state` — how you know it completed
- `Related` — feature-map IDs or other flows it connects to

---

> The entries below are **examples** showing the expected structure. Replace them with your real product flows.

## FLOW-01 — User Login
- **Actor:** Any registered user
- **Entry point:** `/login`
- **Steps:**
  1. User enters email and password
  2. User clicks "Sign In"
  3. System validates credentials
  4. System redirects to dashboard
- **Exit / success state:** User lands on `/dashboard` with their name shown in the header
- **Related:** FEAT-AUTH, FLOW-02

## FLOW-02 — Document Upload
- **Actor:** Authenticated user with Editor role
- **Entry point:** `/documents` → "Upload Document" button
- **Steps:**
  1. User clicks "Upload Document"
  2. User selects a file from the file picker
  3. User clicks "Save"
  4. System validates file type and size (see BR-01, BR-02)
  5. System uploads and stores the file
  6. File appears at the top of the document list
- **Exit / success state:** Uploaded file is visible in the list with a "Processing complete" badge
- **Related:** FEAT-DOCS, FEAT-STORAGE, BR-01, BR-02

## FLOW-03 — Delete Account
- **Actor:** Account owner (Admin role)
- **Entry point:** `/settings` → "Delete Account"
- **Steps:**
  1. User navigates to Settings
  2. User clicks "Delete Account"
  3. System shows a confirmation modal
  4. User confirms
  5. System soft-deletes the account and signs the user out
- **Exit / success state:** User is redirected to `/login` with a "Your account has been deleted" message
- **Related:** FEAT-AUTH, BR-04
