# Invitation Link Revisit Handling ✅

## Overview

Users can now revisit invitation links they've already accepted, and they'll see appropriate messages based on their account status.

---

## Scenarios Handled

### Scenario 1: Already Registered (Completed Signup) ✅

**User State:**
- Invitation: `accepted`
- Profile: `active` (exists in database)
- Auth: Completed Google OAuth

**What User Sees:**
```
┌─────────────────────────────────────┐
│          Kanban Board               │
│                                     │
│            ✓ [blue icon]            │
│                                     │
│      Already Registered             │
│                                     │
│  You have already accepted this     │
│  invitation and completed your      │
│  account setup. Please sign in.     │
│                                     │
│       [ Role: User ]                │
│                                     │
│  ✓ Your account is already set      │
│    up and active.                   │
│                                     │
│      [ Sign In → ]                  │
└─────────────────────────────────────┘
```

**Button Text:** "Sign In" (direct to login)

---

### Scenario 2: Accepted But Not Completed OAuth ⚠️

**User State:**
- Invitation: `accepted`
- Profile: `none` or `inactive`
- Auth: Haven't completed Google OAuth yet

**What User Sees:**
```
┌─────────────────────────────────────┐
│          Kanban Board               │
│                                     │
│            ✓ [blue icon]            │
│                                     │
│    Invitation Already Accepted      │
│                                     │
│  You already accepted this          │
│  invitation. Please complete        │
│  sign in with Google.               │
│                                     │
│       [ Role: User ]                │
│                                     │
│  ⚠️ You accepted this invitation    │
│     but haven't completed sign      │
│     in yet.                         │
│                                     │
│    [ Complete Sign In → ]           │
└─────────────────────────────────────┘
```

**Button Text:** "Complete Sign In" (finish OAuth flow)

---

### Scenario 3: Fresh Invitation (First Time) 🎉

**User State:**
- Invitation: `pending`
- Profile: `none`
- Auth: Haven't started

**What User Sees:**
```
┌─────────────────────────────────────┐
│          Kanban Board               │
│                                     │
│            ✓ [green icon]           │
│                                     │
│      Invitation Accepted!           │
│                                     │
│  You've been invited as a User.     │
│  Click below to sign in...          │
│                                     │
│       [ Role: User ]                │
│                                     │
│    [ Continue to Sign In → ]        │
│                                     │
│  You'll be redirected automatically │
└─────────────────────────────────────┘
```

**Button Text:** "Continue to Sign In" (auto-redirects after 3s)

---

## Technical Implementation

### Backend Changes

**File:** `app/api/auth/accept-invite/route.ts`

```typescript
// When invitation status is 'accepted', check profile status
if (invitation.status === 'accepted') {
  const { data: existingProfile } = await adminClient
    .from('profiles')
    .select('id, email, role, status')
    .eq('email', invitation.email)
    .maybeSingle()

  if (existingProfile && existingProfile.status === 'active') {
    // User completed signup - direct them to login
    return {
      error: 'Already registered',
      details: 'You have already accepted this invitation...',
      code: 'ALREADY_REGISTERED',
      email, role
    }
  } else {
    // Invitation accepted but OAuth not completed yet
    return {
      error: 'Invitation already accepted',
      details: 'You already accepted this invitation...',
      code: 'ALREADY_ACCEPTED',
      email, role
    }
  }
}
```

### Frontend Changes

**File:** `app/auth/accept-invite/page.tsx`

**New Status Type:**
```typescript
type Status = 'processing' | 'success' | 'error' | 'already-accepted'
```

**Visual Differentiation:**
- `success`: Green icon (first time acceptance)
- `already-accepted`: Blue icon (revisiting)
- `error`: Red icon (invalid/expired)

**Conditional Rendering:**
```typescript
{status === 'already-accepted' && (
  <>
    <BlueCheckmarkIcon />
    <RoleBadge color="blue" />
    <ContextualInfoBox />
    <ConditionalButton />
  </>
)}
```

---

## User Flows

### Flow 1: Complete Journey (Successful)

```
1. Click invite link (first time)
   → Status: success (green)
   → Button: "Continue to Sign In"
   → Auto-redirect: 3 seconds

2. Sign in with Google
   → OAuth completes
   → Profile created & active
   → Redirected to dashboard

3. Click same invite link again (curiosity/mistake)
   → Status: already-accepted (blue)
   → Message: "Already registered"
   → Button: "Sign In"
   → No auto-redirect (manual action)
```

### Flow 2: Incomplete Journey (Abandoned OAuth)

```
1. Click invite link (first time)
   → Status: success (green)
   → Button: "Continue to Sign In"

2. User closes browser (doesn't complete OAuth)
   → Invitation marked 'accepted'
   → No profile created yet

3. Click invite link again (returning)
   → Status: already-accepted (blue)
   → Message: "Invitation already accepted"
   → Note: "You haven't completed sign in yet"
   → Button: "Complete Sign In"

4. Complete Google OAuth this time
   → Profile created & active
   → Success! ✅
```

---

## Error Codes

| Code | Meaning | Profile Status | Action |
|------|---------|----------------|--------|
| `ALREADY_REGISTERED` | Full signup complete | `active` | Direct to login |
| `ALREADY_ACCEPTED` | Accepted but OAuth incomplete | `none/inactive` | Complete OAuth |
| `INVALID_TOKEN` | Token doesn't exist | N/A | Error page |
| `EXPIRED` | Past expiration date | N/A | Error page |
| `REVOKED` | Admin revoked | N/A | Error page |

---

## Visual States

### Icons:

| Status | Icon Color | Background | Border | Meaning |
|--------|-----------|-----------|--------|---------|
| `success` | Green | green-100 | green-200 | Fresh acceptance ✅ |
| `already-accepted` | Blue | blue-100 | blue-200 | Revisiting link 🔵 |
| `error` | Red | red-100 | red-200 | Problem ❌ |
| `processing` | Indigo | none | none | Loading ⏳ |

### Info Boxes:

**Already Registered (Blue):**
```
┌─────────────────────────────────────┐
│  ✓ Your account is already set      │
│    up and active.                   │
└─────────────────────────────────────┘
```

**Already Accepted (Yellow):**
```
┌─────────────────────────────────────┐
│  ⚠️ You accepted this invitation    │
│     but haven't completed sign      │
│     in yet.                         │
└─────────────────────────────────────┘
```

---

## Testing Scenarios

### Test 1: Complete Flow Then Revisit

```bash
# 1. Generate invitation (as admin)
# 2. Accept invitation (incognito)
# 3. Complete Google OAuth
# 4. Go back to same invite link

Expected:
- Blue checkmark icon ✓
- Message: "Already registered"
- Button: "Sign In"
- No auto-redirect
```

### Test 2: Accept But Don't Complete OAuth

```bash
# 1. Generate invitation (as admin)
# 2. Accept invitation (incognito)
# 3. DON'T complete OAuth (close browser)
# 4. Open same invite link again

Expected:
- Blue checkmark icon ✓
- Message: "Invitation already accepted"
- Warning: "You haven't completed sign in yet"
- Button: "Complete Sign In"
- Clicking button → login page → complete OAuth
```

### Test 3: Multiple Revisits

```bash
# User keeps clicking the same invite link

Scenario A: After OAuth complete
- Always shows: "Already registered"
- Always directs to: Login page

Scenario B: Before OAuth complete
- Always shows: "Already accepted"
- Always prompts: "Complete Sign In"
```

---

## Benefits

✅ **User-Friendly:**
- Clear messaging about what happened
- Appropriate next steps
- No confusing errors

✅ **Context-Aware:**
- Different messages based on signup state
- Helpful hints for incomplete flows

✅ **Prevents Confusion:**
- Users know if they need to complete signup
- Or if they can just login

✅ **Graceful Handling:**
- No broken pages
- No generic errors
- Consistent UI/UX

---

## Edge Cases Handled

### Edge Case 1: User Deletes Browser Data
- Invitation: `accepted`
- User's cookies: Cleared
- Revisit link: Shows "Complete Sign In" ✅

### Edge Case 2: Shared Invitation Link
- Person A: Accepts and completes
- Person B: Clicks same link
- Shows: "Already registered" (for Person A's email) ✅

### Edge Case 3: Admin Re-invites Same Email
- Old invitation: `accepted`
- New invitation: `pending`
- New link: Works normally (different token) ✅

---

## Summary

**What Changed:**
- Added `already-accepted` status type
- Added profile status check on revisit
- Two distinct messages: "Already registered" vs "Already accepted"
- Blue theme for revisit state (vs green for fresh acceptance)
- Context-aware button text
- No auto-redirect on revisit (manual action required)

**Result:**
Users can safely revisit invitation links and get helpful, contextual guidance based on their account state. No more confusion! 🎉

