# EdgeMart Spring Boot + MongoDB backend

The existing product API now shares a real session with buyer accounts, seller workspaces, stock reservations and cash-on-delivery orders. All ten departments use the same API. The frontend preserves each department's existing design.

## Run on this computer

Your previous MongoDB connection was moved into ignored `backend/application-local.yml`; existing products were preserved. The packaged application contains no Atlas password. Run from the backend folder so Spring loads the local file:

1. In PowerShell: `cd C:\Users\DELL\OneDrive\Desktop\EdgeMartAI\backend`
2. Run `.\start-backend.ps1`. If this workspace's backend is already healthy on port 8081, the command reuses it and avoids a duplicate server. To load backend code changes, run `.\start-backend.ps1 -Restart`; this clears sign-in sessions. For a clean build, stop the server using **Ctrl+C** or `.\stop-backend.ps1`, run `.\mvn.ps1 clean test`, then `.\start-backend.ps1`. Maven's Windows profile clears read-only flags on generated `target` files and folders before `clean`, which avoids OneDrive directory deletion errors.
3. In another terminal, run `npm run dev` in `frontend`.
4. Open `http://localhost:5173`. Use **localhost** consistently for frontend and backend cookies.

The frontend uses `VITE_AUTH_API_URL=http://localhost:8081` and `VITE_API_BASE_URL=http://localhost:8081/api`. Restart Vite after changing either.

When launching the backend in the background, put redirected logs in ignored `backend/.logs/`, outside `target`. A launcher keeps its log files open on Windows; putting them in `target` prevents `mvn clean` from deleting the build folder. If port 8081 is already in use, the backend may already be running. Stop it with the command above before starting another instance. A backend restart clears sign-in sessions.

Register a buyer with a name, email and password. Signup creates the account and returns to login. Seller registration saves the account and store together, and delivery registration creates a delivery account; both require a subsequent login. The named Profile menu offers logout with confirmation; Login/Signup buttons return after logout. Existing accounts use their password. Email verification, password recovery, delivery codes and the development code inbox have been removed.

Seller accounts use the same account. Create a seller profile from **Sell with us**, publish an active listing and visit its buyer department. Profiles, images, listings and orders are stored in MongoDB; browser-only seller profiles are not imported or treated as authenticated accounts. Draft and paused products are excluded from buyer reads. Each account can change only its own seller profile and products. For Food/Fruits, set the store's pickup coordinates in Store settings, and choose a buyer delivery location within 5 km.

The four earlier seed products retain their existing IDs and seller IDs. They remain readable. To order an old seed product, its sellerId must belong to a genuine registered seller_profiles record; update that mapping privately in Compass when you know its legitimate owner. The API never assigns someone else's product to the current account automatically. Explicit operator imports use edgemart.import-owner-id (the existing account ID) and edgemart.import-product-ids. The earlier email-based import setting is no longer used.

## Authentication

For local administrator recovery of an existing account, run `./recover-account.ps1 -Email your-email@example.com` to check the record, then add `-Reset` in an interactive terminal. The command uses the private backend MongoDB configuration and prompts for the new password without displaying it. It changes only that account's password hash and session version; existing account identity, seller profile, products and orders are preserved. Passwords use the same strength and BCrypt byte limits as signup. No web password-reset endpoint is added. Users must sign in again after recovery. Treat this tool as database administrator access.

Passwords are BCrypt hashes. Session identity is held in an HttpOnly server cookie, with a CSRF token obtained from GET /auth/session for every mutation. Signup and login endpoints are rate-limited. No passwords, OAuth secrets or database URI are stored in Vite configuration or localStorage.

Server sessions are currently held by the running Spring process: restarting it requires users to sign in again. Run one backend instance; add a shared session/rate-limit store before horizontal scaling.

## Social sign-in setup

Prepared integrations stay unavailable until their server credentials are configured. Register web OAuth apps and use these exact callback URLs locally:

| Provider | Callback | Server environment |
| --- | --- | --- |
| Google | http://localhost:8081/login/oauth2/code/google | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET |
| GitHub | http://localhost:8081/login/oauth2/code/github | GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET |
| Microsoft | http://localhost:8081/login/oauth2/code/microsoft | MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID |

Follow [OAUTH_SETUP.md](OAUTH_SETUP.md) for provider registration and the private `configure-oauth.ps1` setup command. Microsoft supports personal and work/school accounts using `common`, or a specific organization using its tenant UUID. After configuring credentials, restart the backend. GET /auth/config lists enabled providers.

Spring Security handles the authorization-code flow and state; Google also uses OIDC nonce and ID-token verification. Immutable provider subjects identify users. Accounts are not automatically linked by matching email. Sign in with your password and choose Connect in Profile to attach a provider securely. Social signup returns to login without starting a dashboard session.

Provider documentation: [Google](https://developers.google.com/identity/openid-connect/openid-connect), [GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [Microsoft](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow).

## Ordering and delivery

The backend calculates totals from stored prices and checks each quantity, listing status, ownership, prescription flags and nearby radius. One order contains one department and one store. Stock and the order commit in an Atlas transaction; insufficient stock rolls back the entire order. Idempotency keys prevent duplicate reservations on retries. Cancellation restores stock once, while the order is still confirmed. Sellers advance confirmed → preparing → ready.

Only cash on delivery is active. UPI, cards and other online payments require a merchant provider and verified backend webhooks; no paid status is fabricated. Prescription orders cannot advance to fulfilment until a pharmacist approval workflow is connected.

The separate delivery portal is `/delivery`, with login at `/delivery/login` and signup at `/delivery/signup`; `/?driver=1` remains compatible. Drivers register directly with name, email, password, mobile number, city and vehicle. New delivery accounts can pick up ready orders from the EdgeMart delivery network. Signup ignores caller-supplied roles and store assignments, and always creates a separate driver account. Existing email addresses must sign in with their existing account instead of being converted to drivers. Seller Studio's **Delivery partners** lists drivers who have accepted that store's orders, together with existing store-assigned drivers.

Delivery login uses `/auth/driver/session`, `/auth/driver/login`, `/auth/driver/signup` and `/auth/driver/logout`. Buyer and driver identities occupy separate validated session slots, so they can work in the same browser. Signing out of one portal preserves the other portal's session. Passwords remain hashed, signup is rate limited, and CSRF protection applies to all mutations. Customer contact information remains restricted to the driver who accepts the order.

The pickup queue refreshes every five seconds. Drivers can edit their profile and switch online/offline; offline blocks new pickup claims and retains their active deliveries. The dashboard includes search, status filters, pickup and destination maps, actual device GPS sharing, customer address and contact details after assignment, preferred delivery date, delivery history and explicit cash confirmation. Sellers advance orders using **Orders → Start preparation → Ready for pickup**. The driver chooses **Accept pickup → Share live location**. Buyers select the order under **My orders** to view tracking. Location sharing stops after completion. GPS requires device permission, localhost/HTTPS and an open page; background mobile tracking and automated dispatch are separate services.

Save the seller pickup location in **Store settings** so the driver can open the pickup map. For ready/active orders created before that location was saved, the driver queue fills only the missing pickup map location from the current seller profile. Orders that already have a pickup location retain it. This does not change the buyer delivery location or stored order records.

Every new order requires numeric `location.lat` and `location.lng` for the delivery address, including Books. The frontend offers device location and manual coordinates; blank fields are rejected. For an older order missing coordinates, its buyer can open **My orders**, select the order, and save its delivery location before pickup. The authenticated, CSRF-protected `POST /api/orders/{id}/delivery-location` accepts `{"location":{"lat":13.0827,"lng":80.2707}}`. It only fills a missing location while the order is confirmed, preparing, or ready; it cannot replace existing coordinates or change a picked-up/closed order. Food/Fruits still enforce the store delivery radius. Driver queue entries include `deliveryLocationRequired`; pickup is disabled until the buyer saves the location. Driver accounts do not poll the seller workspace.

## Postman

Import `postman/EdgeMart.postman_collection.json`. Set baseUrl, buyer/seller email and password variables privately in Postman. First call Session to set the CSRF variable; Postman's cookie jar stores the session automatically. Call Session again after Login. Product and order requests capture productId and orderId variables for subsequent operations. No credentials are included in the collection.

## Verification and deployment

`.\mvn.ps1 test` runs validation tests. The full HTTP integration test runs only if EDGEMART_TEST_MONGODB_URI names a dedicated `edgemart_test_*` database on a replica set; it removes only the records in that isolated database afterward. Never point this test variable at the real catalogue database.

For Render or another server, build with `mvn package` and run the jar (or use Dockerfile). Set MONGODB_URI, FRONTEND_URL, BACKEND_URL, ALLOWED_ORIGINS and OAuth environment variables in the server dashboard. Enable SESSION_COOKIE_SECURE, and register HTTPS OAuth callbacks. Use a same-site frontend/API setup; unrelated sites need SameSite=None and can face browser third-party-cookie restrictions. The MongoDB URI remains on the backend. Add the server's outbound network access to Atlas and use a restricted database user. No cloud deployment was performed by this integration.
