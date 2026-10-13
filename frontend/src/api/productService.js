const API_BASE = (import.meta.env?.VITE_API_BASE_URL || 'http://localhost:8081/api').trim().replace(/\/+$/, '');

export function normalizeProduct(item, defaultCategory = '') {
  if (!item) return null;
  const category = item.category || defaultCategory;
  const fallbackImage = `/images/hero-${category.toLowerCase() || 'electronics'}.jpg`;
  return {
    ...item,
    id: item.id || item._id,
    title: item.name || item.title || 'Untitled Product',
    name: item.name || item.title || 'Untitled Product',
    image: item.imageUrl || item.image || fallbackImage,
    imageUrl: item.imageUrl || item.image || fallbackImage,
    category,
    price: Number(item.price || 0),
    stock: Number(item.stock ?? 0),
    description: item.description || ''
  };
}

export function createProductService({
  baseUrl = API_BASE,
  fetcher = (...args) => fetch(...args),
  timeoutMs = 12000,
  warn = (...args) => console.warn(...args)
} = {}) {
  const api = baseUrl.trim().replace(/\/+$/, '');
  const auth = api.replace(/\/api$/, '');

  async function request(url, { signal, method = 'GET', body, csrfToken } = {}) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    if (signal?.aborted) abort();
    else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    try {
      const res = await fetcher(url, {
        method,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {})
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Product request failed (HTTP ${res.status}).`);
      }
      return res.status === 204 ? null : await res.json();
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }

  async function read(path, options, normalize) {
    try {
      return normalize(await request(`${api}${path}`, options));
    } catch (error) {
      warn('[EdgeMart API] Product request failed:', error);
      return null;
    }
  }

  async function mutate(path, method, body) {
    const session = await request(`${auth}/auth/session`);
    if (!session?.csrfToken) throw new Error('Refresh your session before saving products.');
    return request(`${api}${path}`, { method, body, csrfToken: session.csrfToken });
  }

  const getLiveProductsByCategory = (category, options) => read(
    `/products${category ? `?category=${encodeURIComponent(category)}` : ''}`,
    options,
    rows => {
      if (!Array.isArray(rows)) throw new Error('Invalid product response.');
      return rows.map(item => normalizeProduct(item, category));
    }
  );
  const getLiveProductById = (id, options) => read(`/products/${encodeURIComponent(id)}`, options, normalizeProduct);
  const createLiveProduct = async product => normalizeProduct(await mutate('/products', 'POST', product), product.category);
  const updateLiveProduct = async (id, product) => normalizeProduct(await mutate(`/products/${encodeURIComponent(id)}`, 'PUT', product), product.category);
  const deleteLiveProduct = async id => { await mutate(`/products/${encodeURIComponent(id)}`, 'DELETE'); return true; };

  return {
    getLiveProductsByCategory, getLiveProductById, createLiveProduct, updateLiveProduct, deleteLiveProduct,
    fetchProducts: getLiveProductsByCategory,
    fetchProductById: getLiveProductById,
    createProduct: createLiveProduct
  };
}

export const { getLiveProductsByCategory, getLiveProductById, createLiveProduct, updateLiveProduct, deleteLiveProduct } = createProductService();
