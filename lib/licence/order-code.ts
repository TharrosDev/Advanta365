// This module imports nothing, so lib/licence/token.ts can import it under Node's type stripping and
// the checkout can import it in the browser without pulling node:crypto in with it.

/** An order's own code, as `orderCode` (lib/checkout/order.ts) writes it: `A365-261012-K7QX2M`. */
export const ORDER_CODE = /^A365-\d{6}-[2-9A-HJ-NP-Z]{6}$/;
