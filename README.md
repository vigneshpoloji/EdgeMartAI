# EdgeMart AI

React/Vite frontend, Spring Boot backend and MongoDB Atlas. Node.js runs the frontend tools; the current backend is Java.

## Run locally

From the project folder:

```powershell
npm run dev
```

In another PowerShell terminal:

```powershell
cd backend
.\start-backend.ps1
```

Use `http://localhost:5173/landing.html` for shopping and `http://localhost:5173/delivery` for delivery partners. Signup creates the account and returns to login. New Google/GitHub sellers then sign in with the same provider and finish their store details to open Seller Studio. Store setup keeps their existing session. After login, the named profile menu contains Logout with a confirmation prompt.

## Configure integrations

- [Google and GitHub: local and production setup](backend/OAUTH_SETUP.md)
- [Gemini: connect Ask EdgeMart locally and in production](backend/GEMINI_SETUP.md)
- [Contact form: receive questions and feedback in Gmail](backend/CONTACT_EMAIL_SETUP.md)
- [Publish the whole website with a free public URL](DEPLOYMENT.md)

Create the provider registrations in your own accounts and enter secrets through the backend setup scripts. For deployment, use the production environment values and exact HTTPS callbacks in the guides. Frontend environment changes require a new build. Social login and live Gemini responses need valid credentials before they can be verified.

## Verification

```powershell
npm test
npm run build
cd backend
.\mvn.ps1 test
```

Database integration tests run only when explicitly supplied an isolated `edgemart_test_` MongoDB URI. Never point them at the application's live database.

## Project cleanup

Retired one-time diagnostic/ownership-transfer scripts, old server logs, temporary UI previews and generated dashboard render cache have been removed. Source files, Postman workspaces, dependencies, current build output, private configuration and the seller-ownership recovery backup are preserved. The older Node/Atlas migration guide is retained as a reference; it does not describe the current Java backend.
