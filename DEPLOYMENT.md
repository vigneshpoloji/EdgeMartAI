# Publish EdgeMart with a free public URL

The root Dockerfile builds React and Spring Boot together. One Render web service serves the landing page, buyer and seller dashboards, `/delivery`, authentication and APIs from the same HTTPS origin. MongoDB Atlas retains products, accounts and orders. Separate frontend hosting is unnecessary.

Free Render is suitable for a public demo/pilot: it sleeps after 15 minutes without requests, takes about a minute to wake, may restart, and has usage limits. Render explicitly advises against free instances for production applications. Use this to launch and test; reliable marketplace operations require an appropriate paid plan as usage grows. [Current free limits](https://render.com/docs/free).

## Step 1 — Confirm email locally

Complete [contact email setup](backend/CONTACT_EMAIL_SETUP.md) and confirm a message arrives in Gmail. Verify buyer purchase, seller preparation and driver pickup/delivery locally as well. Payments currently use cash on delivery.

## Step 2 — Upload source to a private GitHub repository

1. Install/sign in to GitHub Desktop with your GitHub account.
2. Choose **File → Add local repository**, select the EdgeMartAI project folder. If it is not a repository yet, choose **Create a repository here**.
3. Review changed files before committing. `.gitignore` excludes `.env` files, backend local credentials, generated files and diagnostic/recovery backups. Do not add private files manually or override ignore rules. Do not upload terminal logs containing connection strings.
4. Commit source changes and click **Publish repository** with **Keep this code private** checked. Publish the whole project root, including `frontend`, `backend`, root `Dockerfile`, `.dockerignore` and `render.yaml`.

## Step 3 — Create the Render service

1. Sign up at [Render](https://dashboard.render.com/) using your own account.
2. Select **New → Web Service**, connect GitHub and choose the EdgeMart repository.
3. Select **Docker** runtime and **Free** instance. Leave **Root Directory** empty. Set **Dockerfile Path** to `./Dockerfile` and Docker build context to the repository root `.`. Choose the closest available region.
4. Name the service **edgemart** (Render may assign a different unique URL). Leave Docker command empty: the Dockerfile starts Java.
5. Set **Health Check Path** to `/api/health/live`. This checks Java without causing restarts during a temporary Atlas outage. `/api/health` separately checks MongoDB readiness.
6. Add the environment variables below. You can also use **New → Blueprint** with `render.yaml`; enter its private values in Render.

| Variable | Value |
| --- | --- |
| `PORT` | `10000` |
| `MONGODB_URI` | Your Atlas connection string including the existing `edgemart` database and `retryWrites=true&w=majority` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Production Google OAuth application credentials |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Production GitHub OAuth application credentials |
| `GEMINI_API_KEY` | Your private Gemini API key |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` |
| `BREVO_API_KEY` | Your private Brevo API key |
| `CONTACT_SENDER_EMAIL` | `vigneshpoloji@gmail.com` |
| `SESSION_COOKIE_SECURE` | `true` |
| `SESSION_COOKIE_SAME_SITE` | `lax` |

Render supplies `RENDER_EXTERNAL_URL`; the application automatically uses it for backend URL, frontend URL and allowed origin. If you later attach a custom domain, explicitly set `FRONTEND_URL`, `BACKEND_URL` and `ALLOWED_ORIGINS` to that exact HTTPS origin, with no trailing slash. Keep secrets out of `render.yaml` and GitHub source. Neither a `.env` file nor local properties files are deployed.

## Step 4 — Permit Render to reach Atlas

1. In Render service **Connect → Outbound**, copy the service's outbound IP ranges.
2. In Atlas **Security → Network Access**, add those ranges to the project IP access list. Keep your own development IP if you still run locally. [Render outbound IPs](https://render.com/docs/outbound-ip-addresses).
   In Brevo **profile menu → Security → Authorized IPs**, authorize those hosting outbound ranges for email API access too. An authorized laptop IP does not authorize the hosting service. [Brevo IP security](https://developers.brevo.com/docs/ip-security).
3. Keep TLS enabled. Use an Atlas database user restricted to the application's database. Retain the real database name so the website finds your existing data.
4. Click **Create Web Service** / **Deploy latest commit**. Wait until the service is live. Copy the actual `https://…onrender.com` URL; do not assume the example name is available.

## Step 5 — Configure public Google/GitHub callbacks

Replace `YOUR-SERVICE` below with the actual host copied from Render.

1. In Google Cloud → Credentials → OAuth client, add authorized JavaScript origin `https://YOUR-SERVICE.onrender.com` and authorized redirect URI `https://YOUR-SERVICE.onrender.com/login/oauth2/code/google`.
2. Configure the Google consent screen for external users and publish it for general access; while in Testing, access is restricted to your configured test users. Complete any review Google requires for your app/scopes.
3. In GitHub → Developer settings → OAuth Apps, set Homepage URL `https://YOUR-SERVICE.onrender.com` and callback URL `https://YOUR-SERVICE.onrender.com/login/oauth2/code/github`. Prefer a separate app for deployment so local callbacks keep working.
4. Store the matching app credentials in Render Environment, then redeploy. Follow [OAuth guide](backend/OAUTH_SETUP.md) for account linking and provider-specific details.

## Step 6 — Test the public website

1. Open `/api/health/live`: expect `status: ok`. Open `/api/health`: expect `database: connected`.
2. Visit the root URL: landing page. Verify anonymous department browsing and `/delivery`.
3. Sign up with a separate test account: it should return to Login. Test email/password, Google and GitHub login and logout confirmation.
4. Publish a product from Seller Studio, buy it, add a delivery address/location, progress seller states in sequence, then claim and complete it with a driver account. Check ownership restrictions with separate accounts.
5. Submit a contact message and confirm Gmail receipt. Ask EdgeMart a general question and verify a Gemini reply.
6. Test another device/browser. Allow browser location permissions; HTTPS enables device location sharing.

The website is publicly hosted only after these dashboard steps are completed. No deployment has been created by preparing these files. If logs show out-of-memory on the free instance, select a larger instance; database outages must be fixed through Atlas/network access, not by disabling TLS. Sessions currently live in server memory, so a server restart requires signing in again.

## Local backend: prevent duplicate runs

Use one terminal and `backend\start-backend.ps1`. Keep it open. Do not run `mvn clean` while the application is running: it deletes classes the running development server uses. Use `start-backend.ps1 -Restart` once after changing backend code/configuration. A previous Maven process can print exit code `-1` when it is stopped during a restart; that is distinct from a compile failure.

An earlier October 13 log showed Atlas `Connection reset` errors after startup; a later log showed a startup timeout while all nodes were still connecting. The previous eight-second selection wait was too short and has been restored to MongoDB's standard 30 seconds. Idle pooled connections are recycled after 60 seconds and the pool is capped at 20. These settings cannot eliminate Wi-Fi, firewall, Atlas access-list or provider outages. Once started, database errors return a retryable 503 without terminating the request-serving application. Database access and index creation must succeed for startup to complete. [MongoDB connection pool guidance](https://www.mongodb.com/docs/drivers/java/sync/current/connection/specify-connection-options/connection-pools/).

After deployment, Render runs the website and backend on its servers. Your laptop, frontend development terminal and backend terminal can all be closed; visitors use the public URL and Atlas stores the data online. The free hosting sleep/restart limitations above still apply.
