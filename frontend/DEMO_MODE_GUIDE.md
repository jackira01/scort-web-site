# Demo Mode Implementation Guide

This document explains how the Demo Mode functionality works and how to verify it.

## Overview

The Demo Mode is designed to allow users to interact with the application (create, edit, delete) without permanently modifying the database. Write operations are intercepted in the frontend and simulated.

## Enabling Demo Mode

To enable Demo Mode, set the following environment variable in your frontend deployment (e.g., Vercel, .env.local):

```bash
NEXT_PUBLIC_IS_DEMO_MODE=true
```

## How it Works

1.  **Frontend Interception**: A special Axios adapter (`frontend/src/lib/demo-adapter.ts`) is injected into the HTTP client.
2.  **Read Operations (GET)**: These pass through to the real backend, so users see real data (e.g., existing profiles).
3.  **Write Operations (POST, PUT, DELETE)**: These are **intercepted** and do NOT reach the backend.
    *   The adapter returns a simulated `200 OK` success response.
    *   The operation is logged to `sessionStorage` (viewable in browser console).
    *   The UI will show success messages (toasts), but data will reset on page reload (unless persistent client-side state is added).
4.  **Authentication**: Login and Register endpoints are whitelisted so users can log in to the "Demo Account".

## Safety Recommendations (Critical)

While the frontend interception prevents accidental writes from the *interface*, it is **highly recommended** to add a backend guard if your Demo App connects to a Production Database.

### Recommended Backend Guard
If you have a specific "Demo User" (e.g., `demo@scort.com`), add a middleware in your backend to block writes from this user:

```typescript
// backend/src/middlewares/demo-guard.ts
export const demoGuard = (req, res, next) => {
  const user = req.user; // Assuming user is attached
  if (user?.email === 'demo@scort.com' && req.method !== 'GET') {
     return res.status(200).json({ success: true, message: 'Demo Mode: Operation simulated' });
  }
  next();
};
```

## Deployment for "Demo App"

1.  Create a new branch `production-demo` (optional) or just use a separate deployment pipeline.
2.  In the Demo Deployment settings, set `NEXT_PUBLIC_IS_DEMO_MODE=true`.
3.  (Optional) Create a specific "Demo User" in your DB with `admin` role so users can see the Admin Board.

## Verification

1.  Set `NEXT_PUBLIC_IS_DEMO_MODE=true` in `.env.local`.
2.  Run the app.
3.  Open Browser Console. You should see: `🚧 Application running in DEMO MODE`.
4.  Try to edit a profile. You should see a log: `🔒 DEMO MODE: Intercepted PUT ...` and a success toast in the UI.
5.  Check the Network tab: The request should NOT be sent (or show as handled locally).
