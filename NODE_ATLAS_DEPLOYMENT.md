# EdgeMart: Node.js, Postman and MongoDB Atlas procedure

This is an implementation and deployment guide, not a completed Node.js backend or a deployed website. The existing application uses React/Vite in `frontend/` and Java/Spring Boot in `backend/`. It already has session authentication, seller profiles, products, orders and delivery APIs. Choosing Node.js requires porting that behavior and checking compatibility before switching traffic.

The first milestone is one complete flow: customer registration -> seller profile -> published product -> customer purchase using cash on delivery -> seller order management.

## 1. Target architecture

During development:

```text
Browser: React/Vite at http://localhost:5173
    -> Node.js/Express at http://localhost:8081
        -> MongoDB Atlas
Postman -> the same Node.js API
```

For the first deployment, serve the built frontend and API from one Express web service at one HTTPS origin. This simplifies cookies and avoids cross-site authentication problems. Postman tests the API; it does not host any part of the website.

Keep the Java backend as a reference during migration. Do not run Java and Node on port 8081 simultaneously. Develop Node on another port, such as 8082, until it is ready to replace Java locally.

## 2. Install and verify tools

Use a supported Node.js LTS release. Node.js 24 is an LTS release at the time this guide was prepared. Install Postman Desktop and use MongoDB Atlas in the browser. MongoDB Compass is optional for inspecting records.

```powershell
node --version
npm --version
```

Reference: [Node.js releases](https://nodejs.org/en/about/previous-releases).

## 3. Set up Atlas

1. Inspect the existing Atlas deployment privately before creating another cluster: the Java backend already has an ignored local database configuration.
2. Create a separate development database, such as `edgemart_dev`, for the migration.
3. Create a database user restricted to the required database.
4. Add your development computer's public IP to the Atlas IP access list.
5. Select the cluster's Connect option, choose the application/driver connection method, and copy the connection string.
6. Insert the database name and encode reserved characters in the database password when constructing the URI.
7. Store the URI only in backend configuration. Do not paste credentials into chat or a frontend environment file.

Example with placeholders:

```dotenv
MONGODB_URI=mongodb+srv://DB_USER:ENCODED_PASSWORD@CLUSTER_HOST/edgemart_dev?retryWrites=true&w=majority
```

During deployment, add the application's hosting outbound IP addresses or ranges to the Atlas access list as well. Choose a hosting/network setup that lets you restrict database access to those sources.

References: [Atlas connections](https://www.mongodb.com/docs/atlas/connect-to-database-deployment/), [connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).

## 4. Create a separate Node backend

Run from the project root:

```powershell
New-Item -ItemType Directory -Path backend-node
Set-Location backend-node
npm init -y
npm install express mongoose cors dotenv helmet express-session connect-mongo bcrypt express-rate-limit zod
npm pkg set type=module 'scripts.dev=node --watch src/server.js' 'scripts.start=node src/server.js'
New-Item -ItemType Directory -Path src
```

Suggested structure as the backend grows:

```text
backend-node/
  src/
    server.js
    models/
    routes/
    middleware/
    services/
  tests/
  .env.example
  .env
  package.json
  package-lock.json
```

In `backend-node/.env`, use real values privately:

```dotenv
PORT=8082
NODE_ENV=development
MONGODB_URI=mongodb+srv://DB_USER:ENCODED_PASSWORD@CLUSTER_HOST/edgemart_dev?retryWrites=true&w=majority
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=REPLACE_WITH_A_LONG_RANDOM_VALUE
```

Generate a session secret locally with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. The secret is for backend session configuration, not browser storage. The project's existing `.gitignore` excludes `.env` files; verify exclusions before committing.

## 5. First runnable milestone: database connection and health endpoint

Create `backend-node/src/server.js` with this starting example. It implements database connectivity and health only; sign-in, sellers and orders still need the next steps.

```js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (req, res) => {
  try {
    await mongoose.connection.db.admin().command({ ping: 1 });
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

if (!process.env.MONGODB_URI || !process.env.FRONTEND_URL) {
  throw new Error('Set MONGODB_URI and FRONTEND_URL in backend configuration.');
}
await mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 10000
});
app.listen(Number(process.env.PORT || 8082), '0.0.0.0', () => {
  console.log('EdgeMart API started.');
});
```

Run `npm run dev` from `backend-node/`. In Postman send `GET http://localhost:8082/api/health`. Continue when it returns HTTP 200 and `database: connected`.

Reference: [Mongoose connections](https://mongoosejs.com/docs/connections.html).

## 6. Port authentication without changing the frontend contract

The current frontend expects:

| Method | Route | Response/behavior |
| --- | --- | --- |
| GET | `/auth/config` | `{ "providers": [], "payments": ["cod"] }` initially |
| GET | `/auth/session` | `{ "user": null or public account, "csrfToken": "..." }` |
| POST | `/auth/signup` | `{ "user": public account }`, signed-in cookie |
| POST | `/auth/login` | `{ "user": public account }`, signed-in cookie |
| POST | `/auth/logout` | `{ "ok": true }`, invalidate session and clear cookie |

A public account must contain string `id`, string `email`, `name` and `role`. Password hashes and OAuth identifiers must never be returned. Normalize email, validate inputs, hash passwords, enforce a unique email index, and rate-limit authentication.

Use `express-session` with a persistent MongoDB session store through `connect-mongo`. Keep session IDs in HttpOnly cookies, not localStorage. Rotate the session ID after login. Persist the new session before responding. Save the session's CSRF token, return it from `/auth/session`, and validate `X-CSRF-Token` before every state-changing request. Reject stale/missing tokens with HTTP 403 and `code: CSRF_EXPIRED`, so the current frontend can recover once.

For same-origin HTTPS deployment, use secure cookies and SameSite=Lax. Configure Express proxy trust to match the hosting platform so secure cookies work behind its HTTPS proxy. Express's default MemoryStore is unsuitable for production.

The same account can shop and have a seller profile; do not introduce a separate seller password database or rely only on frontend route guards. Public signup must not grant driver/admin privileges.

Existing Java accounts use BCrypt and existing records can have string IDs. Explicitly map existing MongoDB collection names and `_id` types in Mongoose. Do not silently convert all IDs to ObjectId, rename collections, rewrite hashes or delete records. Check migration against a development copy, including an existing-account login and reference integrity. Java sessions themselves will not transfer; users must sign in after cutover.

Reference: [Express session middleware](https://expressjs.com/en/resources/middleware/session/).

## 7. Port seller, catalogue and ordering APIs

Start with the existing MongoDB collections: `accounts`, `seller_profiles`, `products`, `orders`. Add sessions separately.

| Method | Route | Required result |
| --- | --- | --- |
| GET | `/api/products` | Public active catalogue, supporting current category filters |
| GET | `/api/products/:id` | Public product details |
| GET | `/api/catalogue` | Preserve the current catalogue payload, including products, profiles and radius |
| POST | `/api/seller/profile` | `{ "seller": ... }`, owned by signed-in account |
| GET | `/api/seller/workspace` | `{ "seller": ..., "products": [...], "orders": [...] }` |
| POST | `/api/seller/products` | `{ "product": ... }`; request uses `{ "values": {...}, "department": "books", "id": "optional-existing-id" }` |
| DELETE | `/api/seller/products/:id` | Owner-only deletion, `{ "ok": true }` |
| GET | `/api/orders` | `{ "orders": [...] }`, current buyer's orders |
| POST | `/api/orders` | `{ "order": ... }`, server-calculated order |
| POST | `/api/orders/:id/cancel` | `{ "order": ... }`, authorized cancellation |
| POST | `/api/seller/orders/:id/status` | Authorized seller progress update |

Use the Java controllers/services and existing Postman requests as the detailed specification. Preserve price units, product variants and the ten department names. Enforce ownership in the API, active/draft/paused visibility, stock limits and order state transitions.

The checkout sends items, address, preferences, payment, coupon, location and idempotencyKey. Recalculate prices and discounts from database records. Use a transaction for order creation plus stock changes and a unique idempotency constraint for retries. Cancellation must restore stock at most once. Keep cash on delivery as the initial supported payment.

For the existing delivery features, also port order tracking and the driver list/claim/location/complete routes from `OrderController.java`, with account and order authorization. Keep the existing Food/Fruits distance checks. Register social providers only after their server-side flows and callbacks have been implemented.

## 8. Connect the frontend locally

Once the required APIs work, set `frontend/.env.local` to the Node development port:

```dotenv
VITE_AUTH_API_URL=http://localhost:8082
VITE_API_BASE_URL=http://localhost:8082/api
VITE_AUTH_PREVIEW_ENABLED=false
```

Restart Vite with `npm run dev` from the project root. Open `http://localhost:5173/landing.html`. Use localhost consistently. The shared auth client already sends credentials and CSRF headers; reuse it. Configure Node CORS for the exact frontend origin with credentials enabled.

Do not put MONGODB_URI, SESSION_SECRET or payment secrets in VITE variables. Vite exposes VITE variables in browser bundles and replaces their values at build time.

Reference: [Vite environment variables](https://vite.dev/guide/env-and-mode).

## 9. Test the whole flow in Postman

Import `backend/postman/EdgeMart.postman_collection.json`. It can be reused if Node preserves the API contract. Set its baseUrl to `http://localhost:8082`. Configure test credentials privately; avoid exporting populated passwords or syncing secrets unintentionally.

The existing Session request saves csrfToken into collection variables. Mutations already include `X-CSRF-Token: {{csrfToken}}`, and Postman's cookie jar maintains the session.

Run in this order against the development database:

1. Health; Session.
2. Register a test seller account; Session again.
3. Create a seller profile; open seller workspace.
4. Publish one in-stock active product in Books or Electronics, avoiding delivery-location prerequisites for the first test.
5. Check the public catalogue.
6. Logout; Session; register or login as a different buyer; Session again.
7. Create a COD order; fetch buyer orders.
8. Login as the seller and verify only that seller's order lines are visible.
9. Update an allowed order status and check the buyer's response.
10. On a separate still-cancellable test order, cancel and confirm stock is restored once.

Also test incorrect credentials, expired sessions, missing CSRF tokens, duplicate accounts, another seller's product edits, unavailable stock, double submissions and database outages. Test in a real browser as well: Postman success alone does not prove browser CORS and cookies work.

Reference: [Postman variables](https://learning.postman.com/docs/use/send-requests/variables/variables).

## 10. Prepare a public release

Complete the vertical flow before adding more features. For a commercial release, finish password recovery/email delivery, seller/admin management, product image storage, customer support and real order operations. Keep online payment choices unavailable until a payment provider and verified webhooks actually record payments. Implement any required approval workflow before fulfilling prescription items.

Add API integration tests against a dedicated test database, error logging without secrets, monitoring, database backup/restore procedures and pagination/indexes for larger catalogues. Use object storage for product images when moving beyond the current upload approach. Configure backups appropriate to the chosen Atlas tier and test restoration.

Use a staging deployment and database before production. Verify two accounts in separate browser sessions: seller publishes a product, buyer purchases it, seller manages the order, buyer sees the update. Verify restart survival and expired-session recovery.

## 11. Deploy the frontend and Node API together

Prepare the Express service to serve `frontend/dist` after the API routes. Preserve the frontend's multipage behavior: `/landing.html` serves the landing page, `/?auth=login` and `/?department=books` serve the React entry page. Unknown API routes must return JSON errors, not index.html. Verify the static assets against Helmet's content policy rather than broadly disabling protections.

Put the source and package lockfiles in a Git repository, excluding credentials. On Render create a Node Web Service connected to that repository. For this proposed monorepo layout:

```text
Root directory: repository root
Build command: npm ci --prefix frontend && npm ci --prefix backend-node && npm run build
Start command: npm --prefix backend-node start
Health check path: /api/health
```

These commands require that backend-node has been implemented and has its package-lock.json. The starter alone cannot serve the complete website.

Set private backend environment variables on the host:

```dotenv
NODE_ENV=production
MONGODB_URI=YOUR_PRIVATE_PRODUCTION_ATLAS_URI
SESSION_SECRET=YOUR_PRIVATE_PRODUCTION_SESSION_SECRET
FRONTEND_URL=https://YOUR_SERVICE_HOST
```

Use the hosting platform's PORT value and bind to `0.0.0.0`. Add the host's outbound IP addresses/ranges to Atlas.

Set the public frontend values in the build environment:

```dotenv
VITE_AUTH_API_URL=https://YOUR_SERVICE_HOST
VITE_API_BASE_URL=https://YOUR_SERVICE_HOST/api
VITE_AUTH_PREVIEW_ENABLED=false
```

Use the actual full HTTPS origin with the current frontend configuration, not `/`: the integration currently strips a trailing slash and would treat `/` as an empty backend URL. Rebuild after changing these variables. Add your custom domain, configure DNS/HTTPS, update frontend/backend origin configuration and rebuild when changing to that domain.

References: [Render Node deployment](https://render.com/docs/deploy-node-express-app), [Render port binding](https://render.com/docs/web-services).

## 12. Release and verify

Run the Postman sequence against staging and then appropriate production smoke checks. Check signup, returning login, both dashboards, publishing, stock changes, COD orders and logout in the deployed browser. Confirm the served bundle contains no localhost backend URLs or private secrets.

The release is complete when real users can access the HTTPS site, accounts and sessions work, seller products persist and appear to buyers, orders behave correctly, and monitoring plus recovery procedures are in place. Creating a cluster or uploading frontend files is an intermediate milestone.
