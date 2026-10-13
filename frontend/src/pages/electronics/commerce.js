import { isOfferCode } from '../../components/shopping-benefits.js';
export const STORAGE_KEY = 'edgemart.commerce.v2';
export const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export const uid = () => crypto.randomUUID();
export const emptyAddress = { name: '', phone: '', street: '', city: '', state: '', pin: '', label: 'Home' };
export const initialState = { cart: [], later: [], wishlist: [], orders: [], addresses: [], defaultAddress: '', profile: { name: '', email: '', phone: '', orderUpdates: true }, reviews: [], questions: [], tickets: [], returns: [], recent: [], notifications: [] };
export function variants(product) {
  return product.variants?.colors?.map(c => ({ name: c.name, hex: c.hex, delta: 0 })) || product.variants?.switches?.map(s => ({ name: s.type, delta: s.priceDelta || 0 })) || [{ name: 'Standard', delta: 0 }];
}
export function cartKey(line) { return `${line.id}:${line.variant}`; }
export function hydrateCart(cart, products) {
  return (Array.isArray(cart) ? cart : []).flatMap(line => {
    const product = products.find(p => p.id === line?.id);
    const variant = product && variants(product).find(v => v.name === line.variant);
    if (!product || !variant) return [];
    const quantity = Math.min(10, product.sellerProduct && product.stock > 0 ? product.stock : 10, Math.max(1, Math.floor(Number(line.quantity) || 1)));
    return [{ ...product, variant: variant.name, quantity, unitPrice: product.price + variant.delta, key: cartKey(line) }];
  });
}
export function addLine(cart, product, variant, quantity = 1) {
  if (!product.inStock || !variants(product).some(v => v.name === variant)) return cart;
  const key = cartKey({ id: product.id, variant });
  const old = cart.find(line => cartKey(line) === key);
  const amount = Math.max(1, Math.floor(Number(quantity) || 1));
  const limit = product.sellerProduct ? Math.min(10,product.stock) : 10;
  return old ? cart.map(line => cartKey(line) === key ? { ...line, quantity: Math.min(limit, (Number(line.quantity) || 1) + amount) } : line) : [...cart, { id: product.id, variant, quantity: Math.min(limit, amount) }];
}
export function totals(lines, code = '', delivery = 'standard') {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
  const mrp = lines.reduce((sum, line) => sum + Math.max(line.originalPrice || line.unitPrice, line.unitPrice) * line.quantity, 0);
  const discount = isOfferCode(code) && subtotal >= 500 ? Math.min(200,Math.round(subtotal*.1)) : code === 'WELCOME10' && subtotal >= 1000 ? Math.min(500, Math.round(subtotal * .1)) : 0;
  const shipping = subtotal === 0 ? 0 : delivery === 'express' ? 99 : subtotal >= 999 ? 0 : 49;
  return { subtotal, mrp, discount, shipping, total: subtotal - discount + shipping, savings: mrp - subtotal + discount };
}
export function validateAddress(address) {
  if (!address.name.trim() || !address.street.trim() || !address.city.trim() || !address.state.trim()) return 'Complete your name, street, city and state.';
  if (!/^[6-9]\d{9}$/.test(address.phone)) return 'Enter a valid 10-digit Indian mobile number.';
  if (!/^[1-9]\d{5}$/.test(address.pin)) return 'Enter a valid six-digit pincode.';
  return '';
}
export function normalizeState(raw) {
  const state = { ...initialState };
  if (!raw || typeof raw !== 'object') return state;
  for (const key of Object.keys(initialState)) if (Array.isArray(initialState[key])) state[key] = Array.isArray(raw[key]) ? raw[key].filter(item => item != null) : [];
  state.cart = state.cart.filter(line => typeof line?.id === 'string' && typeof line?.variant === 'string');
  state.later = state.later.filter(line => typeof line?.id === 'string' && typeof line?.variant === 'string');
  state.orders = state.orders.filter(o => typeof o?.id === 'string' && Array.isArray(o.items) && o.address && typeof o.date === 'string');
  state.addresses = state.addresses.filter(a => typeof a?.id === 'string' && ['name', 'phone', 'street', 'city', 'state', 'pin'].every(k => typeof a[k] === 'string'));
  state.profile = { ...initialState.profile, ...Object.fromEntries(Object.entries(raw.profile || {}).filter(([key, value]) => key in initialState.profile && typeof value === 'string')) };
  state.profile.orderUpdates = raw.profile?.orderUpdates !== false;
  state.profile.previewSession = raw.profile?.previewSession === true;
  state.notifications = state.notifications.filter(n => typeof n.id === 'string' && typeof n.text === 'string' && typeof n.date === 'string');
  state.defaultAddress = typeof raw.defaultAddress === 'string' ? raw.defaultAddress : '';
  return state;
}
