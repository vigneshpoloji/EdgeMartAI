# Authentication

Buyer and seller accounts use the Spring Boot backend at http://localhost:8081. Signup creates an account and returns to Login. Existing accounts sign in with their original email/password, Google or GitHub method. Passwords are checked by the server and sessions use HttpOnly cookies with CSRF protection. The production root Dockerfile serves the frontend and backend on one HTTPS origin.

Production builds use `VITE_AUTH_API_URL=/`. Preserve this value when passing it to the shared authentication client; converting it to an empty string disables buyer/seller authentication. The regression test in `src/integrations/api.test.mjs` loads the actual Vite modules with this production setting and checks shopping and driver login routes, cookies and CSRF headers.

If a server restart or expired session invalidates the CSRF token, the shared client refreshes the session and retries the rejected mutation once. Credential failures and server errors are not retried. To check this against a running local backend without creating an account, run `node frontend/scripts/verify-signin-recovery.mjs` from the project root.

Google and GitHub use registered backend OAuth apps. Configure provider credentials privately before those providers become available. Password reset, email codes, email verification and the local code inbox have been removed.

See [backend setup](../../../backend/README.md) for registration and provider callbacks. Live mode is enabled in frontend/.env.local; browser preview identities are not accepted by the backend.
