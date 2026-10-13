import { createLiveProduct } from '../api/productService';

export const sellerPreviewEnabled = true;

const STORAGE_KEY_PRODUCTS = 'edgemart_seller_products';
const STORAGE_KEY_ORDERS = 'edgemart_seller_orders';
const STORAGE_KEY_PROFILES = 'edgemart_seller_profiles';
const STORAGE_KEY_CURRENT = 'edgemart_seller_current';

function safeParse(key, fallback = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[sellerRepository] Failed to write to localStorage for key: ${key}`, err);
  }
}

let listeners = new Set();

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error(e);
    }
  });
}

export const sellerRepository = {
  snapshot() {
    return {
      products: safeParse(STORAGE_KEY_PRODUCTS, []),
      profiles: safeParse(STORAGE_KEY_PROFILES, []),
      orders: safeParse(STORAGE_KEY_ORDERS, []),
      persistent: true
    };
  },

  current() {
    return safeParse(STORAGE_KEY_CURRENT, null);
  },

  reload() {
    notifyListeners();
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  recordOrder(order) {
    const existing = safeParse(STORAGE_KEY_ORDERS, []);
    const updated = [order, ...existing.filter(o => o.id !== order.id)];
    safeSet(STORAGE_KEY_ORDERS, updated);
    notifyListeners();
    return order;
  },

  signin(email) {
    const profiles = safeParse(STORAGE_KEY_PROFILES, []);
    const found = profiles.find(p => p.email?.toLowerCase() === email?.toLowerCase());
    const seller = found || {
      id: 'seller_local',
      email,
      name: email.split('@')[0],
      department: 'groceries'
    };
    safeSet(STORAGE_KEY_CURRENT, seller);
    notifyListeners();
    return seller;
  },

  signup(values) {
    const profiles = safeParse(STORAGE_KEY_PROFILES, []);
    const newProfile = {
      id: `seller_${Date.now()}`,
      ...values
    };
    safeSet(STORAGE_KEY_PROFILES, [...profiles.filter(p => p.email !== values.email), newProfile]);
    safeSet(STORAGE_KEY_CURRENT, newProfile);
    notifyListeners();
    return newProfile;
  },

  signout() {
    safeSet(STORAGE_KEY_CURRENT, null);
    notifyListeners();
  },

  settings(values) {
    const cur = this.current() || {};
    const updated = { ...cur, ...values };
    safeSet(STORAGE_KEY_CURRENT, updated);

    const profiles = safeParse(STORAGE_KEY_PROFILES, []);
    safeSet(
      STORAGE_KEY_PROFILES,
      profiles.map(p => (p.id === updated.id ? updated : p))
    );
    notifyListeners();
    return updated;
  },

  async saveProduct(values, department, id) {
    const currentSeller = this.current();
    const payload = {
      id: id || `prod_${Date.now()}`,
      name: values.name || values.title || '',
      department: department || values.department || 'groceries',
      category: values.category || department || 'General',
      description: values.description || '',
      price: Number(values.price || 0),
      stock: Number(values.stock ?? 10),
      imageUrl: values.imageUrl || values.image || '',
      sellerId: currentSeller?.id || 'seller_default',
      status: 'active'
    };

    const existing = safeParse(STORAGE_KEY_PRODUCTS, []);
    const updated = id
      ? existing.map(p => (p.id === id ? { ...p, ...payload } : p))
      : [payload, ...existing];

    safeSet(STORAGE_KEY_PRODUCTS, updated);
    notifyListeners();
    return payload;
  },

  deleteProduct(id) {
    const existing = safeParse(STORAGE_KEY_PRODUCTS, []);
    const updated = existing.filter(p => p.id !== id);
    safeSet(STORAGE_KEY_PRODUCTS, updated);
    notifyListeners();
  }
};

export async function saveSellerProduct(productData) {
  const payload = {
    name: productData.name || productData.title,
    category: productData.category || productData.department,
    description: productData.description || '',
    price: Number(productData.price),
    stock: Number(productData.stock || 10),
    imageUrl: productData.imageUrl || productData.image || '',
    sellerId: productData.sellerId || 'seller_default'
  };

  try {
    const saved = await createLiveProduct(payload);
    const existing = safeParse(STORAGE_KEY_PRODUCTS, []);
    safeSet(STORAGE_KEY_PRODUCTS, [saved, ...existing]);
    notifyListeners();
    return saved;
  } catch (err) {
    console.warn('[Seller Repo] Remote save failed, storing locally:', err);
    const fallback = { ...payload, id: `local_${Date.now()}` };
    const existing = safeParse(STORAGE_KEY_PRODUCTS, []);
    safeSet(STORAGE_KEY_PRODUCTS, [fallback, ...existing]);
    notifyListeners();
    return fallback;
  }
}

export const snapshot = () => sellerRepository.snapshot();
export default sellerRepository;