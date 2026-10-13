import { METHODS, DEPARTMENTS, totals } from './checkout.model.js';
export const ORDER_KEY = 'edgemart-preview-orders-v1';
function validOrder(order) {
  if (!order || order.version !== 1 || typeof order.id !== 'string' || order.id.length > 100 || typeof order.date !== 'string' || Number.isNaN(Date.parse(order.date)) ||
    !['preview', 'cancelled'].includes(order.status) || order.paymentStatus !== 'not_paid' || !Array.isArray(order.items) || !order.items.length || order.items.length > 200 ||
    !order.items.every(line => typeof line.id === 'string' && typeof line.key === 'string' && typeof line.name === 'string' && line.name.length <= 500 &&
      DEPARTMENTS.includes(line.category) && typeof line.variant === 'string' && typeof line.image === 'string' && (!line.image || /^\/(?!\/)/.test(line.image)) &&
      Number.isSafeInteger(line.unitPaise) && line.unitPaise >= 0 && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 99) ||
    !order.address || !['name','email','phone','street','area','city','state','pin','instructions','label'].every(key => typeof order.address[key] === 'string' && order.address[key].length <= 500) ||
    !order.preferences || !['standard','express'].includes(order.preferences.delivery) || typeof order.preferences.slot !== 'string' || typeof order.preferences.date !== 'string' ||
    !order.payment || !METHODS.some(method => method.id === order.payment.method) || (order.payment.preference !== undefined && typeof order.payment.preference !== 'string') || typeof order.coupon !== 'string') return false;
  const expected = totals(order.items, { ...order.preferences, coupon: order.coupon });
  return ['subtotal','shipping','discount','tip','total'].every(key => Number.isSafeInteger(order.amount?.[key]) && order.amount[key] >= 0 && order.amount[key] === expected[key]);
}
export function loadOrders(storage, owner) {
  if (!owner) return [];
  try {
    const saved = JSON.parse(storage?.getItem(ORDER_KEY) || 'null');
    if (saved?.owner !== owner || !Array.isArray(saved.orders)) return [];
    return saved.orders.filter(validOrder).slice(0, 50);
  } catch { return []; }
}
export function persistOrders(storage, owner, orders) {
  try {
    if (!owner) storage?.removeItem(ORDER_KEY);
    else storage?.setItem(ORDER_KEY, JSON.stringify({ owner, orders: orders.slice(0, 50) }));
    return Boolean(storage);
  } catch { return false; }
}
export function appendOrder(orders, order) {
  return orders.some(saved => saved.id === order.id) ? orders : [order, ...orders].slice(0, 50);
}
export function cancelPreviewOrder(orders, id) {
  return orders.map(order => order.id === id && order.status === 'preview' ? { ...order, status: 'cancelled' } : order);
}
