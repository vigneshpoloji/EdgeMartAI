# EdgeMart public deployment

Public website: **https://edgemartai.onrender.com**

The landing page, `/api/health/live` and `/api/health` returned HTTP 200 during the October 13, 2026 deployment check. Database readiness reported `connected`. This is a point-in-time check, not a guarantee of future uptime.

On October 13, 2026, the owner confirmed both outbound ranges were added and a contact message from the public website arrived in Gmail. Public Google/GitHub callback configuration and social-login verification remain the next steps.

## 1. Authorize the Render outbound ranges

The service owner supplied these ranges from **Render → EdgeMartAI → Connect → Outbound**:

```text
74.220.52.0/24
74.220.60.0/24
```

Add each range to the existing Atlas project under **Security → Network Access → IP Access List → Add IP Address**. Use a comment such as `EdgeMart Render`. Keep the `/24` suffix. Preserve other entries needed for local development. Check that the entries become active.

In Brevo, open **profile menu → Security → Authorized IPs** and add the same ranges. The laptop's IP authorization does not cover Render. Keep the email API key private and retain IP blocking for unknown sources. Save the entries, then test the website contact form once and confirm receipt in Gmail/Brevo delivery logs.

Render shares outbound IP ranges across services in a region. Database/API authentication is still required; the IP list does not replace credentials. Check the current service's Outbound list if Render changes the ranges or you move regions.

Sources: [Render outbound ranges](https://render.com/docs/outbound-ip-addresses), [Atlas IP access list](https://www.mongodb.com/docs/atlas/security/add-ip-address-to-list/), [Brevo authorized IPs](https://developers.brevo.com/docs/ip-security).

## 2. Register the public sign-in URLs

For the Google OAuth client whose credentials you placed in Render, add:

```text
Authorized JavaScript origin:
https://edgemartai.onrender.com

Authorized redirect URI:
https://edgemartai.onrender.com/login/oauth2/code/google
```

For the GitHub OAuth app whose credentials you placed in Render, configure:

```text
Homepage URL:
https://edgemartai.onrender.com

Authorization callback URL:
https://edgemartai.onrender.com/login/oauth2/code/github
```

Use separate provider applications if you want independent development/production credentials. When you create new provider credentials, update the matching `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in **Render → Environment**, then save and deploy. If only the existing provider app's allowed URLs change, no application code rebuild is needed.

For a public launch, configure the Google consent audience for External customers and use its In production publishing status, completing any applicable verification. Google exempts requests limited to basic name/email/profile/OpenID sign-in from its testing-user restriction; broader scopes have different testing and verification rules. EdgeMart uses basic identity scopes. Test provider login in normal Edge or Chrome. [Google audience rules](https://support.google.com/cloud/answer/15549945).

The root Dockerfile serves frontend and backend at this single origin. The application uses Render's `RENDER_EXTERNAL_URL` automatically. No localhost frontend/API URLs should be set on Render.

## 3. Verify the deployed workflows

### Google Branding: approved policy pages

The owner reviewed and approved publication of `frontend/public/privacy.html` and `frontend/public/terms.html` on October 13, 2026. They describe the current implementation, including identity providers, order/location data, Brevo/Gmail contact messages, Gemini processing and cash-on-delivery workflows. Changes pushed to GitHub redeploy Render.

Verify these three public links load without signing in after deployment, then enter them in Google Auth Platform → Branding:

| Branding field | Value |
| --- | --- |
| App name | EdgeMart AI |
| User support email | vigneshpoloji@gmail.com |
| Application home page | https://edgemartai.onrender.com/ |
| Application privacy policy link | https://edgemartai.onrender.com/privacy.html |
| Application Terms of Service link | https://edgemartai.onrender.com/terms.html |
| Authorised domain | edgemartai.onrender.com |
| Developer contact email | vigneshpoloji@gmail.com |

The logo is optional. Save Branding. If shown, use **Verify Branding**, resolve any listed issues, then use **Publish branding** when the status is Ready to publish. Return to Audience to complete app publishing. Branding publishing and Audience publishing are separate controls. If Google asks for domain ownership verification, verify the allocated `edgemartai.onrender.com` site using the Google project owner's Search Console account; the shared `onrender.com` domain is not owned by this project.

Sources: [Google Branding requirements](https://support.google.com/cloud/answer/15549049), [Google Audience rules](https://support.google.com/cloud/answer/15549945).

### Website checks

1. Check `/api/health`: `status: ok`, `database: connected`.
2. Verify signup returns to Login; test password, Google and GitHub login; then profile logout confirmation.
3. Complete one buyer/seller/driver test with separate accounts: publish a product, order it, provide a delivery location, progress seller states, accept driver pickup and complete delivery.
4. Submit one contact message and verify Gmail receipt. Ask EdgeMart a general question and verify an AI reply.

Your laptop and development terminals can be closed after deployment. Render runs the application and Atlas stores the data. Free Render sleeps when idle and may restart; users may need to wait for a cold start and sign in again after a server restart.

The network-list changes and provider callback updates above are owner-controlled setup steps. Preparing this guide does not apply them to your accounts.
