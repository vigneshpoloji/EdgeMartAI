# Live buyer products

All ten buyer dashboards call the existing shared catalogue hook with the exact API category: Books, Electronics, Groceries, Fruits, Vegetables, Pharmacy, Plants, Meat, Jewellery and Food. Existing JSX, styles and fallback arrays are unchanged. Connected commerce mode uses the refreshed server catalogue and excludes mock products from real checkout.

Set `VITE_API_BASE_URL=http://localhost:8081/api` in frontend/.env.local and restart Vite. This product API setting is separate from VITE_AUTH_API_URL; no change to authentication configuration is needed. The default product API is the same URL. The existing Spring controller returns an array from GET /api/products?category=Books.

On mount, the shared hook fetches and normalizes the category. Non-empty valid results replace the mock category; empty, failed, timed-out or malformed responses retain it. Local seller listings continue to merge normally without duplicate IDs. Data is shared for 30 seconds with nested plant/food configurators. Unmounted consumers ignore completion callbacks.

Spring/Mongo fields id (or _id), name, price in rupees, stock, description and imageUrl are mapped to the existing UI models. Original API categories remain in sourceCategory; UI category uses the existing lowercase department IDs for cart/checkout compatibility. Missing images fall back to /images/hero-DEPARTMENT.jpg. Missing/invalid stock is treated as unavailable. Minimal products receive the arrays and metadata containers needed by existing cards and configurators; no mock prices, ratings or certification details are copied into live products.

Product reads do not implement authentication, real payment, order creation or fulfilment. Your manual backend remains responsible for those features.
