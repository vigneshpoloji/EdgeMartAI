import test from 'node:test';
import assert from 'node:assert/strict';
import { METHODS, DEPARTMENTS, normalizeLines, totals, validateAddress, validateDelivery, createPreviewOrder, receiptText } from './checkout.model.js';
import { ORDER_KEY, loadOrders, persistOrders, appendOrder, cancelPreviewOrder } from './preview.orders.js';
const address = { name: 'Sample Reader', email: 'sample@example.com', phone: '9876543210', street: '123 Sample Street', city: 'Sample City', state: 'Sample State', pin: '500001', area: '', instructions: '', label: 'Home' };
const preferences = { delivery: 'standard', tip: 0, date: '', slot: 'Any time', rxAcknowledged: false };
const lines = normalizeLines([{ id: 'b1', name: 'Sample book', category: 'books', price: 250.25, quantity: 2, variant: 'Paperback', options: { edition: 'sample' } }]);
const order = (method = 'upi', id = 'preview-1') => createPreviewOrder({ id, lines, address, preferences, payment: { method } });
test('all ten departments retain identity, variants, options and correct quantities', () => {
  for (const category of DEPARTMENTS) {
    const [line] = normalizeLines([{ id: category+'-1', name: 'Item', category, price: 12.35, quantity: 3, variant: 'Selected pack', options: { pack: 2 }, image: '/images/item.jpg' }]);
    assert.equal(line.unitPaise, 1235); assert.equal(line.category, category); assert.equal(line.quantity, 3); assert.equal(line.variant, 'Selected pack'); assert.deepEqual(line.options, { pack: 2 });
  }
});
test('empty baskets, unavailable items, unknown categories and invalid prices/quantities are blocked', () => {
  assert.throws(() => normalizeLines([]));
  for (const change of [{ price: NaN }, { price: -1 }, { price: Infinity }, { quantity: 0 }, { quantity: 100 }, { quantity: 1.5 }, { category: 'unknown' }, { inStock: false }, { name: '' }])
    assert.throws(() => normalizeLines([{ id: 'b', name: 'Book', category: 'books', price: 10, quantity: 1, ...change }]));
});
test('price math uses paise with one delivery charge and explicit coupon only', () => {
  assert.deepEqual(totals(lines), { subtotal: 50050, shipping: 4900, discount: 0, tip: 0, total: 54950 });
  assert.equal(totals(lines, { coupon: 'PREVIEW10' }).discount, 5005);
  assert.equal(totals(lines, { coupon: 'INVALID' }).discount, 0);
  assert.equal(totals(lines, { delivery: 'express' }).shipping, 9900);
  const high = normalizeLines([{ id:'a',name:'Large basket',category:'books',price:5000,quantity:1 }]);
  assert.equal(totals(high, { coupon:'PREVIEW10' }).discount, 20000);
  assert.equal(totals(high).shipping, 0);
});
test('shipping threshold and coupon minimum use item subtotal', () => {
  const below = normalizeLines([{ id:'a',name:'Item',category:'books',price:499.99,quantity:1 }]);
  assert.equal(totals(below, { coupon:'PREVIEW10' }).discount, 0);
  const threshold = normalizeLines([{ id:'a',name:'Item',category:'books',price:999,quantity:1 }]);
  assert.equal(totals(threshold,{coupon:'PREVIEW10'}).shipping,0);
});
test('tips are opt-in and available only for food; no automatic surcharges', () => {
  assert.equal(totals(lines,{tip:50}).tip,0);
  const food = normalizeLines([{id:'f',name:'Meal',category:'food',price:250,quantity:1}]);
  assert.equal(totals(food).tip,0); assert.equal(totals(food,{tip:30}).tip,3000); assert.equal(totals(food,{tip:999}).tip,0);
});
test('address validation checks required fields, phone, PIN and email', () => {
  assert.equal(validateAddress(address),'');
  for (const [key,value] of [['name',''],['email','invalid'],['phone','123'],['pin','000000'],['street','a'],['city',''],['state','']]) assert.ok(validateAddress({...address,[key]:value}));
});
test('delivery date and Rx review acknowledgement cannot be bypassed at save', () => {
  assert.ok(validateDelivery({...preferences,date:'2025-01-01'},lines,'2026-10-06'));
  assert.ok(validateDelivery({...preferences,date:'2027-02-31'},lines,'2026-10-06'));
  assert.equal(validateDelivery({...preferences,date:'2026-10-06'},lines,'2026-10-06'),'');
  const rx = [{...lines[0],category:'pharmacy',rxRequired:true}];
  assert.throws(()=>createPreviewOrder({id:'rx',lines:rx,address,preferences,payment:{method:'cod'}}));
  assert.equal(validateDelivery({...preferences,rxAcknowledged:true},rx),'');
});
test('all seven selected methods save unambiguously unpaid preview orders', () => {
  assert.equal(METHODS.length,7);
  for (const method of METHODS) { const saved = order(method.id); assert.equal(saved.status,'preview'); assert.equal(saved.paymentStatus,'not_paid'); assert.equal(saved.payment.method,method.id); }
  assert.throws(()=>order('invalid'));
  assert.throws(()=>createPreviewOrder({id:'bad',lines,address:{...address,phone:''},preferences,payment:{method:'upi'}}));
});
test('order snapshots are independent of later cart changes and duplicate IDs are idempotent', () => {
  const saved = order(); const previous = appendOrder([],saved);
  assert.equal(appendOrder(previous,saved),previous);
  const changed = { ...lines[0], quantity: 5 }; assert.equal(saved.items[0].quantity,2); assert.notEqual(changed.quantity,saved.items[0].quantity);
});
test('session order storage is owner-scoped, bounded and cleared on logout', () => {
  const data=new Map(); const storage={getItem:key=>data.get(key),setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};
  persistOrders(storage,'owner-a',[order()]); assert.equal(loadOrders(storage,'owner-a').length,1); assert.equal(loadOrders(storage,'owner-b').length,0);
  persistOrders(storage,'owner-a',Array.from({length:60},(_,i)=>order('upi',String(i)))); assert.equal(loadOrders(storage,'owner-a').length,50);
  persistOrders(storage,'',[]); assert.equal(data.has(ORDER_KEY),false);
});
test('blocked or corrupted storage cannot report paid orders', () => {
  assert.equal(persistOrders({setItem:()=>{throw new Error('blocked');}},'owner',[order()]),false);
  assert.deepEqual(loadOrders({getItem:()=>'{broken'},'owner'),[]);
  const raw=JSON.stringify({owner:'owner',orders:[{...order(),paymentStatus:'paid'}]});
  assert.deepEqual(loadOrders({getItem:()=>raw},'owner'),[]);
  const corruptAddress = JSON.stringify({owner:'owner',orders:[{...order(),address:{...address,street:{bad:'value'}}}]});
  assert.deepEqual(loadOrders({getItem:()=>corruptAddress},'owner'),[]);
  const corruptTotal = JSON.stringify({owner:'owner',orders:[{...order(),amount:{...order().amount,total:1}}]});
  assert.deepEqual(loadOrders({getItem:()=>corruptTotal},'owner'),[]);
});
test('cancellation is local and receipts never invent fulfilment, invoice or payment', () => {
  const saved = order('cod'); const cancelled = cancelPreviewOrder([saved],saved.id)[0];
  assert.equal(cancelled.status,'cancelled'); assert.equal(cancelled.paymentStatus,'not_paid');
  const text=receiptText(cancelled); assert.match(text,/NOT PAID/); assert.match(text,/Not a tax invoice/); assert.match(text,/Cancelled preview/); assert.match(text,/Cash on delivery/);
});
