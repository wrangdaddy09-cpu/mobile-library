# Password Reset Flow

## Summary

Add a "forgot password" flow so users can reset their password via email without admin intervention. Uses Supabase Auth's built-in `resetPasswordForEmail` and `updateUser` methods. All UI stays on-site with the existing dark theme.

## Components

### 1. Login Page Modification (`src/app/login/page.tsx`)

- Add a "Forgot password?" link below the password field, visible only in sign-in mode
- Clicking it reveals an email-only form that calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: '<site>/auth/callback?next=/reset-password' })`
- On success, show a confirmation message: "Check your email for a reset link"
- On error, show the error message in the existing error banner

### 2. Auth Callback Route (`src/app/auth/callback/route.ts`)

- Server-side GET route handler
- Extracts the `code` query parameter from Supabase's email link
- Exchanges the code for a session via `supabase.auth.exchangeCodeForSession(code)`
- Reads the `next` query parameter (defaults to `/dashboard`) and redirects there
- This route is reusable for any future Supabase email-based auth flows

### 3. Reset Password Page (`src/app/reset-password/page.tsx`)

- Client component with "New password" and "Confirm password" fields
- Validates: passwords match, minimum 6 characters (matching signup validation)
- Calls `supabase.auth.updateUser({ password })` to set the new password
- On success, redirects to `/dashboard`
- Same dark-themed styling as the login page

### 4. Middleware Update (`src/middleware.ts`)

- Allow unauthenticated access to `/reset-password` and `/auth/callback` paths
- Update the redirect condition to check for these paths in addition to `/login`

## Data Flow

```
User clicks "Forgot password?" on login page
  -> Enters email, submits
  -> supabase.auth.resetPasswordForEmail(email, { redirectTo })
  -> Supabase sends email with magic link
  -> User clicks link in email
  -> GET /auth/callback?code=xxx&next=/reset-password
  -> Server exchanges code for session
  -> Redirect to /reset-password
  -> User enters new password, submits
  -> supabase.auth.updateUser({ password })
  -> Redirect to /dashboard
```

## No Database Changes

Password reset is fully handled by Supabase Auth. No new tables or columns needed.
