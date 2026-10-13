# EdgeMart department seller dashboards

Each department has its own dashboard component and stylesheet in its named folder. `SellerPortal.jsx` loads the matching dashboard from `?seller=dashboard&department=...`.

The ten overview layouts provide department-specific tools: electronics specifications, fruit harvest records, vegetable farm details, jewellery purity and hallmarks, meat packing and use-by checks, pharmacy prescriptions and batches, grocery replenishment, book ISBNs and conditions, food preparation and allergens, and plant care.

`SellerWorkspace.jsx` shares product editing, CSV export, order snapshots, store settings and session controls. `WorkspaceParts.jsx` shares accessible presentation components. The separate department pages choose their own layout, checks and filters.

Active seller listings are adapted by `buyer.catalog.js` and merged directly into the native buyer product arrays. Drafts and paused listings remain hidden. Empty or failed photographs show “Photo not available”. Product images support public HTTPS links or device uploads of JPG, PNG and WebP up to 5 MB, resized to bounded raster data for the current local repository.

The shared offer is `EDGEMART10`: 10% off item subtotals from ₹500, capped at ₹200. Product delivery dates are estimates calculated using the Indian calendar date. The shopping assistant uses catalogue data and shopping guides; it does not claim a live AI service or confirmed fulfilment.

Authentication, listings and unpaid checkout previews currently use the existing frontend repositories. The future AWS services should supply authoritative identity, inventory, offers, delivery dates, payment and order status. Browser profiles and entered product details do not establish seller verification.

Run the build with `npm run build`. Run the added integration coverage with `node --test src/sellers/commerce.integration.test.mjs` alongside the existing authentication, seller, checkout and commerce test suites.
