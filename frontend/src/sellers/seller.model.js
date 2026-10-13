import { SELLER_DEPARTMENTS } from './departments.js';
import { validPhotoData, MAX_STORED_PHOTO } from './product-photo.js';
import { DEPARTMENT_FIELDS, PRODUCT_CATEGORIES } from './department-fields.js';
export const SELLER_DATA_KEY = 'edgemart-seller-workspaces-v1';
export const SELLER_SESSION_KEY = 'edgemart-seller-session-v1';
export function sellerPreviewAvailable(authUrl = '', sellerUrl = '', flag = '') {
  return !authUrl.trim() && !sellerUrl.trim() && flag !== 'false';
}
const LIFETIME = 8 * 60 * 60 * 1000;
const departments = SELLER_DEPARTMENTS.map(d => d.id);
const clean = (value, max = 160) => typeof value === 'string' ? value.trim().slice(0, max) : '';
const emailValid = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
export function validImage(value) {
  if (!value) return '';
  if (typeof value !== 'string' || value.length > MAX_STORED_PHOTO || (!value.startsWith('data:') && value.length > 2000)) throw new Error('This image is too large. Upload a smaller photo or a shorter image link.');
  if (validPhotoData(value)) return value;
  if (/^\/images\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes('..')) return value;
  try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch { /* Invalid image. */ }
  throw new Error('Upload a JPG, PNG or WebP photo, or use an HTTPS image link.');
}
export function validateProduct(values, department) {
  if (!departments.includes(department)) throw new Error('Choose a valid department.');
  if (typeof values.image === 'string' && values.image.length > MAX_STORED_PHOTO) throw new Error('This photo is too large to save.');
  const name = clean(values.name, 120), description = clean(values.description, 1000), sku = clean(values.sku, 60), variant = clean(values.variant, 120);
  const price = String(values.price ?? '').trim(), stock = String(values.stock ?? '').trim();
  if (name.length < 3) throw new Error('Product name must have at least 3 characters.');
  if (description.length < 10) throw new Error('Add a description of at least 10 characters.');
  if (!variant) throw new Error('Enter the pack, portion, size or selling unit.');
  if (!/^\d{1,8}(\.\d{1,2})?$/.test(price) || Number(price) <= 0 || Number(price) > 10000000) throw new Error('Enter a price above zero with up to two decimal places.');
  if (!/^\d{1,6}$/.test(stock) || Number(stock) > 999999) throw new Error('Stock must be a whole number between 0 and 999999.');
  if (!['draft', 'active', 'paused'].includes(values.status)) throw new Error('Choose a listing status.');
  return { department, name, description, sku, variant, unitPaise: Math.round(Number(price) * 100), stock: Number(stock), status: values.status,
    image: validImage(clean(values.image, MAX_STORED_PHOTO)), attribute: clean(values.attribute, 300), rxRequired: department === 'pharmacy' && Boolean(values.rxRequired),
    subCategory: [...PRODUCT_CATEGORIES[department].map(c => c[0]),'other'].includes(values.subCategory) ? values.subCategory : 'other',
    details: Object.fromEntries(DEPARTMENT_FIELDS[department].map(([key]) => [key,clean(values.details?.[key],300)])) };
}
const emptyData = () => ({ version: 1, profiles: [], products: [], orders: [] });
function validProfile(p) {
  return p && typeof p.id === 'string' && /^seller-[\w-]+$/.test(p.id) && emailValid(p.email || '') && typeof p.name === 'string' && p.name.length >= 2 && p.name.length <= 100 &&
    typeof p.store === 'string' && p.store.length >= 2 && p.store.length <= 100 && typeof p.city === 'string' && p.city.length <= 100 &&
    typeof p.phone === 'string' && (!p.phone || /^[6-9]\d{9}$/.test(p.phone)) && departments.includes(p.defaultDepartment) && typeof p.description === 'string' && p.description.length <= 500;
}
function validProduct(p, profiles) {
  if (!p || !profiles.some(s => s.id === p.sellerId) || typeof p.id !== 'string' || !/^seller-product-[\w-]+$/.test(p.id) || !Number.isSafeInteger(p.unitPaise) || p.unitPaise <= 0 || p.unitPaise > 1000000000 || !Number.isInteger(p.stock) || typeof p.createdAt !== 'string' || typeof p.updatedAt !== 'string') return false;
  try { const normalized = validateProduct({ ...p, price: (p.unitPaise / 100).toFixed(2) }, p.department); return normalized.name === p.name && normalized.description === p.description && normalized.variant === p.variant; } catch { return false; }
}
export function parseSellerData(raw) {
  try {
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.profiles) || !Array.isArray(data.products) || !Array.isArray(data.orders)) return emptyData();
    const profiles = data.profiles.filter(validProfile).slice(0, 50).map(p => ({ id: p.id, email: p.email, name: p.name, store: p.store, city: p.city, phone: p.phone, defaultDepartment: p.defaultDepartment, description: p.description }));
    const ids = new Set();
    const products = data.products.filter(p => validProduct(p, profiles) && !ids.has(p.id) && ids.add(p.id)).slice(0, 1000).map(p => ({ ...validateProduct({ ...p, price: (p.unitPaise / 100).toFixed(2) }, p.department), id: p.id, sellerId: p.sellerId, createdAt: p.createdAt, updatedAt: p.updatedAt }));
    const orders = data.orders.filter(o => o && typeof o.id === 'string' && o.id.length <= 100 && profiles.some(p => p.id === o.sellerId) && departments.includes(o.department) && ['preview', 'cancelled'].includes(o.status) && o.paymentStatus === 'not_paid' && Number.isSafeInteger(o.subtotal) && o.subtotal > 0 && typeof o.date === 'string' && !Number.isNaN(Date.parse(o.date)) && Array.isArray(o.items) && o.items.length && o.items.length <= 200 && o.items.every(validOrderLine) && o.subtotal === o.items.reduce((sum, i) => sum + i.quantity * i.unitPaise, 0)).slice(-200).map(o => ({ id:o.id, sellerId:o.sellerId, department:o.department, status:o.status, paymentStatus:'not_paid', date:o.date, subtotal:o.subtotal, items:o.items.map(i => ({ id:i.id, name:i.name, variant:i.variant, quantity:i.quantity, unitPaise:i.unitPaise })) }));
    return { version: 1, profiles, products, orders };
  } catch { return emptyData(); }
}
function validOrderLine(i) {
  return i && typeof i.name === 'string' && i.name.length <= 500 && typeof i.variant === 'string' && i.variant.length <= 500 && typeof i.id === 'string' && i.id.length <= 160 && Number.isInteger(i.quantity) && i.quantity > 0 && i.quantity <= 99 && Number.isSafeInteger(i.unitPaise) && i.unitPaise > 0 && i.unitPaise <= 1000000000;
}
// Frontend preview repository; these records and this session are never proof of identity.
export function createSellerRepository({ storage, sessionStorage, now = () => Date.now(), uuid = () => crypto.randomUUID() } = {}) {
  let data = emptyData(), session = null, persistent = Boolean(storage), initialized = false, sessionPersistent = Boolean(sessionStorage);
  const listeners = new Set();
  const snapshot = () => ({ ...data, persistent });
  const emit = () => listeners.forEach(fn => fn(snapshot()));
  const reload = () => {
    if (initialized && !persistent) return snapshot();
    try { const raw = storage?.getItem(SELLER_DATA_KEY); if (raw) data = parseSellerData(raw); else if (initialized && persistent) data = emptyData(); } catch { persistent = false; }
    initialized = true;
    return snapshot();
  };
  const commit = next => {
    data = next;
    try { if (!storage) throw new Error('No storage'); storage.setItem(SELLER_DATA_KEY, JSON.stringify(data)); persistent = true; } catch { persistent = false; }
    emit();
  };
  const signout = () => { session = null; try { sessionStorage?.removeItem(SELLER_SESSION_KEY); } catch { /* Memory fallback. */ } emit(); };
  const current = () => {
    if (sessionPersistent) try { const raw = sessionStorage?.getItem(SELLER_SESSION_KEY); session = raw ? JSON.parse(raw) : null; } catch { sessionPersistent = false; }
    if (!session || !Number.isFinite(session.expiresAt) || session.expiresAt <= now() || session.expiresAt > now() + LIFETIME) { if (session) signout(); return null; }
    return data.profiles.find(p => p.id === session.id) || null;
  };
  const signin = email => {
    reload();
    const profile = data.profiles.find(p => p.email === clean(email, 254).toLowerCase());
    if (!profile) throw new Error('No seller profile with this email in this browser. Create one first.');
    session = { id: profile.id, expiresAt: now() + LIFETIME };
    try { if (!sessionStorage) throw new Error('No session storage'); sessionStorage.setItem(SELLER_SESSION_KEY, JSON.stringify(session)); sessionPersistent = true; } catch { sessionPersistent = false; }
    emit(); return profile;
  };
  const signup = values => {
    reload();
    const profile = { id: `seller-${uuid()}`, name: clean(values.name, 100), store: clean(values.store, 100), email: clean(values.email, 254).toLowerCase(), city: clean(values.city, 100), phone: clean(values.phone, 10), defaultDepartment: values.department, description: '' };
    if (!validProfile(profile)) throw new Error('Check your name, store, email, city and department.');
    if (data.profiles.some(p => p.email === profile.email)) throw new Error('This browser already has a seller profile with that email. Sign in instead.');
    if (data.profiles.length >= 50) throw new Error('This browser has reached its preview seller limit.');
    commit({ ...data, profiles: [...data.profiles, profile] }); return signin(profile.email);
  };
  const requireSeller = () => { const seller = current(); if (!seller) throw new Error('Sign in to your seller workspace first.'); return seller; };
  const saveProduct = (values, department, id) => {
    reload(); const seller = requireSeller(), product = validateProduct(values, department);
    const existing = id ? data.products.find(p => p.id === id && p.sellerId === seller.id) : null;
    if (id && !existing) throw new Error('You can only edit your own products.');
    if (!id && data.products.length >= 1000) throw new Error('This browser has reached its preview listing limit.');
    if (product.sku && data.products.some(p => p.sellerId === seller.id && p.department === department && p.id !== id && p.sku.toLowerCase() === product.sku.toLowerCase())) throw new Error('This SKU is already used in this department.');
    const date = new Date(now()).toISOString();
    const saved = { ...product, id: existing?.id || `seller-product-${uuid()}`, sellerId: seller.id, createdAt: existing?.createdAt || date, updatedAt: date };
    commit({ ...data, products: existing ? data.products.map(p => p.id === id ? saved : p) : [...data.products, saved] }); return saved;
  };
  const deleteProduct = id => { reload(); const seller = requireSeller(); if (!data.products.some(p => p.id === id && p.sellerId === seller.id)) throw new Error('You can only delete your own products.'); commit({ ...data, products: data.products.filter(p => p.id !== id) }); };
  const settings = values => {
    reload(); const seller = requireSeller(); const profile = { ...seller, name: clean(values.name, 100), store: clean(values.store, 100), city: clean(values.city, 100), phone: clean(values.phone, 10), description: clean(values.description, 500) };
    if (!validProfile(profile)) throw new Error('Check the store details and optional 10-digit mobile number.');
    commit({ ...data, profiles: data.profiles.map(p => p.id === seller.id ? profile : p) });
  };
  const recordOrder = order => {
    reload();
    if (!order || typeof order.id !== 'string' || !order.id || order.id.length > 100 || typeof order.date !== 'string' || Number.isNaN(Date.parse(order.date)) || order.paymentStatus !== 'not_paid' || !['preview', 'cancelled'].includes(order.status) || !Array.isArray(order.items) || !order.items.length || order.items.length > 200 || !order.items.every(validOrderLine)) return;
    const groups = new Map();
    for (const line of order.items) {
      const product = data.products.find(p => p.id === line.id);
      if (!product) continue;
      const key = `${product.sellerId}:${product.department}`;
      if (!groups.has(key)) groups.set(key, { sellerId: product.sellerId, department: product.department, items: [] });
      groups.get(key).items.push({ id: line.id, name: line.name, variant: line.variant || '', unitPaise: line.unitPaise, quantity: line.quantity });
    }
    let orders = data.orders;
    for (const group of groups.values()) {
      const saved = { ...group, id: order.id, date: order.date, status: order.status, paymentStatus: 'not_paid', subtotal: group.items.reduce((sum, i) => sum + i.unitPaise * i.quantity, 0) };
      orders = [...orders.filter(o => !(o.id === saved.id && o.sellerId === saved.sellerId && o.department === saved.department)), saved];
    }
    // A cancellation also reaches snapshots whose listings were subsequently deleted.
    if (order.status === 'cancelled') orders = orders.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o);
    if (groups.size || order.status === 'cancelled') commit({ ...data, orders: orders.slice(-200) });
  };
  reload();
  return { snapshot, reload, current, signin, signup, signout, saveProduct, deleteProduct, settings, recordOrder, subscribe: fn => { listeners.add(fn); return () => listeners.delete(fn); } };
}
