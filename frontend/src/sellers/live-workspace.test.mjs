import test from 'node:test';
import assert from 'node:assert/strict';
import {loadSellerState} from './live-workspace.js';

test('drivers and signed-out users do not request seller or buyer resources', async () => {
  const client = {api: async () => {throw new Error('Unexpected request');}};
  for (const user of [null, {id: 'driver', role: 'driver'}]) {
    assert.equal((await loadSellerState(client, user)).seller, null);
  }
});

test('buyers without a store load the catalogue without a forbidden workspace request', async () => {
  const calls = [];
  const catalogue = {products: [{id: 'book', sellerId: 'seller-other'}], profiles: [{id: 'seller-other'}]};
  const state = await loadSellerState({api: async path => {calls.push(path); return catalogue;}}, {id: 'buyer', role: 'buyer'});
  assert.deepEqual(calls, ['/api/catalogue']);
  assert.deepEqual(state.products, catalogue.products);
  assert.equal(state.seller, null);
});

test('store owners receive their private listings and orders while other stores remain public', async () => {
  const catalogue = {products: [{id: 'own', sellerId: 'seller-owner'}, {id: 'other', sellerId: 'seller-other'}], profiles: [{id: 'seller-owner'}]};
  const workspace = {seller: {id: 'seller-owner'}, products: [{id: 'own', status: 'paused'}], orders: [{id: 'order'}]};
  const calls = [];
  const state = await loadSellerState({api: async path => {calls.push(path); return path === '/api/catalogue' ? catalogue : workspace;}}, {id: 'owner', role: 'buyer'});
  assert.deepEqual(calls, ['/api/catalogue', '/api/seller/workspace']);
  assert.deepEqual(state.products, [catalogue.products[1], workspace.products[0]]);
  assert.deepEqual(state.orders, workspace.orders);
});
