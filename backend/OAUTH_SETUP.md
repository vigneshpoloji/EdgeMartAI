# Google and GitHub sign-in

The provider registrations must be created in your own accounts. Enter secrets only into the local setup command, never in chat or frontend files. Configured providers appear at `/auth/config`.

Use these exact local callback URLs:

| Provider | Callback URL |
| --- | --- |
| Google | `http://localhost:8081/login/oauth2/code/google` |
| GitHub | `http://localhost:8081/login/oauth2/code/github` |

## 1. Google

1. Open [Google Cloud Console](https://console.cloud.google.com/), select or create the EdgeMart project.
2. Open **Google Auth Platform**. Configure Branding (app name, support email, contact email) and Audience. Use External for public customers; while the app is in Testing, add your Google account as a test user.
3. Under **Clients**, create an OAuth client with application type **Web application**.
4. Add `http://localhost:5173` as an authorized JavaScript origin and the Google callback from the table as an authorized redirect URI.
5. Copy the client ID and client secret. In your backend PowerShell terminal run `./configure-oauth.ps1 -Provider google`; enter the values when prompted. The secret entry is hidden.

The authorization redirect must match the registered URI exactly. [Google web-server OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server).

## 2. GitHub

1. Open **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Name: EdgeMart. Homepage URL: `http://localhost:5173`. Authorization callback URL: the GitHub callback from the table.
3. Register the application and generate a client secret.
4. Run `./configure-oauth.ps1 -Provider github`; enter the client ID and secret privately.
5. Use a GitHub account with a verified primary email. EdgeMart requests `read:user` and `user:email` to identify the account and obtain that verified email.

[GitHub OAuth application registration](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

## 3. Restart and verify

1. Run `./start-backend.ps1 -Restart` in the backend folder and keep the terminal open.
2. Open `http://localhost:8081/auth/config`. Its `providers` array should contain each configured provider's name. This endpoint does not expose credentials.
3. Open the website in a normal Edge or Chrome browser, refresh the login page, and select the provider. Google can reject sign-in from embedded browser views; use your regular browser for provider testing. [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies).
4. Email signup creates an account and returns to login. Social signup returns to login too; select the same provider there to sign in.
5. If an account already uses this email, sign in using its original method (Google, GitHub or email/password). Open the named **Profile** button and choose **Connect Google** or **Connect GitHub**. Choose the provider account with that same email. After connecting it, that provider can sign you in on future visits. Accounts are never merged solely because their email matches.
6. New seller accounts created through Google/GitHub return to login after signup. Select the same provider to sign in again. Seller Studio then shows **Finish your store setup** with the signed-in email fixed. Add the store name, city and department, and choose **Save store and open dashboard**. This store-creation step preserves the signed-in session; it does not create a second account or require a password. Existing stores open their workspace directly. Delivery signup/login retains its own separate session.
7. Google and GitHub display an account chooser. When testing a different person, log out of EdgeMart first and select that person's provider account. GitHub uses its verified primary email. Google/GitHub accounts created without a password must use their original provider for login.

If another Gmail signs in but your existing email/password account fails, connect Google to the existing account first. Open the email login page in regular Chrome/Edge, sign in with that account's password, then choose **Profile → Connect Google** and select the same email on Google's page. Log out and test **Continue with Google** afterwards. The `account_link_required` message means this connection has not been completed; `account_link_mismatch` means the provider account's email differs. This preserves the existing seller profile and orders.

## 4. Configure the deployed website

Choose the real frontend and backend HTTPS origins before registering production callbacks. The names below are examples, not an existing deployment. Replace them with your domain names.

| Provider | Production redirect URI |
| --- | --- |
| Google | `https://api.your-domain.example/login/oauth2/code/google` |
| GitHub | `https://api.your-domain.example/login/oauth2/code/github` |

1. Create production provider registrations with the corresponding redirect URI. Keeping development and production registrations separate avoids changing a working local app. Google requires exact redirect URI matching and HTTPS for non-localhost redirects. Add your public frontend origin to its allowed origins and complete the consent audience/publication setup for your intended customers. [Google OAuth documentation](https://developers.google.com/identity/protocols/oauth2/web-server).
2. For GitHub, create a production OAuth App with the website's homepage and production callback. Use its production client ID/secret on the host. [GitHub OAuth app setup](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).
3. Set these **backend host** environment variables, using production credentials:

```text
FRONTEND_URL=https://www.your-domain.example
BACKEND_URL=https://api.your-domain.example
ALLOWED_ORIGINS=https://www.your-domain.example
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=lax
GOOGLE_CLIENT_ID=<production Google client ID>
GOOGLE_CLIENT_SECRET=<production Google secret>
GITHUB_CLIENT_ID=<production GitHub client ID>
GITHUB_CLIENT_SECRET=<production GitHub secret>
```

4. Set these **frontend build** variables and rebuild/redeploy:

```text
VITE_AUTH_API_URL=https://api.your-domain.example
VITE_API_BASE_URL=https://api.your-domain.example/api
VITE_AUTH_PREVIEW_ENABLED=false
```

5. Serve frontend routes `/delivery`, `/delivery/login` and `/delivery/signup` with the application's `index.html` fallback; serve `/landing.html` as its built page. Use the same site for frontend and API, such as the `www` and `api` subdomains above. Unrelated hosting domains can encounter browser third-party-cookie restrictions; route the API through the site's origin or use custom domains before testing sign-in.
6. Restart the backend, open its `/auth/config` endpoint and confirm the provider names appear. Test each provider in a regular browser on the public website. Signup must return to login; login must open the intended dashboard; Profile → Logout → Proceed must restore login/signup controls.
7. For an existing password account, sign in first and use **Profile → Connect provider** with a provider account having the same email. Keep local and production credentials out of chat, version control and frontend assets. Update callback registrations and environment values together whenever a domain changes.

Provider credentials and a live domain are required to finish external sign-in testing. The application is prepared for deployment; these steps do not publish a site or create provider registrations.
