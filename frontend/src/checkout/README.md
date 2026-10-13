# Shared checkout

All departments share authenticated cash-on-delivery checkout. The backend checks stored product prices and stock, calculates totals and offers, and commits the order with its stock reservations in one MongoDB Atlas transaction. Requests are idempotent. Buyer cancellation restores stock once before preparation begins.

Sellers prepare orders; assigned driver accounts can claim pickup, send actual device locations and complete delivery after confirming cash collection. Online payment methods and pharmacist approval need their respective provider configuration or implementation.

See [backend setup](../../../backend/README.md) and its Postman collection for the complete API flow.
