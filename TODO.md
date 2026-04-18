# Guest Feedback Form for Public Users
Status: Planning → Implementation

## Current: Company login + role dashboards
## Goal: Add public 'Report Bug' form (no login, normal website visitors)

**Features:**
- Simple form: Name, Email, Bug title, Description, Screenshot
- Guest reports → 'guest' role bugs visible to company dashboards  
- No registration, direct submit
- Thank you page after submission

**Files to Edit:**
1. frontend/index.html - Add guest feedback form beside login-card
2. frontend/script.js - guestSubmitFeedback() function
3. backend/server.js - POST /api/feedback endpoint
4. frontend/style.css - .guest-feedback styles

**Step 1:** Create TODO.md ✅
**Step 2:** Edit frontend/index.html + form
**Step 3:** Backend /api/feedback  
**Step 4:** Frontend JS handler
**Step 5:** Test + deploy PR #1
**Step 6:** Complete
