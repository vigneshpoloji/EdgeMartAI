import test from 'node:test';
import assert from 'node:assert/strict';
import { addLine, hydrateCart, totals, validateAddress, normalizeState } from './commerce.js';
const product = { id: 'keyboard', price: 1000, originalPrice: 1500, inStock: true, variants: { switches: [{ type: 'Red', priceDelta: 0 }, { type: 'Brown', priceDelta: 200 }] } };
test('variant prices and separate lines survive quantity changes', () => {
  let cart = addLine([], product, 'Red', 2);
  cart = addLine(cart, product, 'Brown', 1);
  cart = addLine(cart, product, 'Red', 20);
  const lines = hydrateCart(cart, [product]);
  assert.equal(lines.length, 2); assert.equal(lines[0].quantity, 10); assert.equal(lines[1].unitPrice, 1200);
  assert.equal(totals(lines).subtotal, 11200);
});
test('unknown products and variants cannot enter checkout', () => {
  assert.deepEqual(hydrateCart([{ id: 'missing', variant: 'Red' }, { id: 'keyboard', variant: 'invalid' }], [product]), []);
  assert.deepEqual(addLine([], { ...product, inStock: false }, 'Red'), []);
});
test('coupon cap and shipping are applied exactly once', () => {
  const lines = hydrateCart([{ id: product.id, variant: 'Brown', quantity: 5 }], [product]);
  assert.deepEqual(totals(lines, 'WELCOME10', 'express'), { subtotal: 6000, mrp: 7500, discount: 500, shipping: 99, total: 5599, savings: 2000 });
  assert.equal(totals([], 'WELCOME10', 'express').total, 0);
});
test('address validation rejects whitespace and invalid contact fields', () => {
  const address = { name: 'Test', street: 'Test street', city: 'Hyderabad', state: 'Telangana', phone: '9876543210', pin: '500049' };
  assert.equal(validateAddress(address), ''); assert.ok(validateAddress({ ...address, name: ' ' })); assert.ok(validateAddress({ ...address, pin: '000000' }));
});
test('malformed stored state does not break cart and account', () => {
  const state = normalizeState({ cart: [null, 2, { id: 'keyboard', variant: 'Red' }], profile: { name: 12 }, orders: [null, {}] });
  assert.equal(state.cart.length, 1); assert.equal(state.profile.name, ''); assert.equal(state.orders.length, 0);
});
