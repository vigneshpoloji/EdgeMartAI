import { useEffect, useState } from 'react';
import { getLiveProductsByCategory } from './productService.js';
import { normalizeLiveProducts, PRODUCT_CATEGORIES } from './product.model.js';

// Share the result with product configurators so a live ID never opens against mock data.
const catalogueCache = new Map();
function loadCatalogue(department, category) {
  const key = `${department}:${category}`, cached = catalogueCache.get(key);
  if (cached?.promise) return cached.promise;
  if (cached && Date.now() - cached.loadedAt < 30000) return Promise.resolve(cached.products);
  const entry = cached || { products: null, loadedAt: 0 };
  entry.promise = getLiveProductsByCategory(category).then(records => {
    const products = normalizeLiveProducts(records, department);
    entry.products = products.length ? products : null;
    entry.loadedAt = Date.now();
    return entry.products;
  }).finally(() => { entry.promise = null; });
  catalogueCache.set(key, entry);
  return entry.promise;
}
export default function useLiveProducts(department, category = PRODUCT_CATEGORIES[department], enabled = true) {
  const key = `${department}:${category}`;
  const [state, setState] = useState(() => ({ key, products: catalogueCache.get(key)?.products || null, isLoading: true }));
  useEffect(() => {
    let isMounted = true;
    setState({ key, products: catalogueCache.get(key)?.products || null, isLoading: true });
    if (!enabled || !category) { setState({ key, products: null, isLoading: false }); return; }
    loadCatalogue(department, category).then(products => {
      if (isMounted) setState({ key, products, isLoading: false });
    }).catch(() => {
      if (isMounted) setState({ key, products: null, isLoading: false });
    });
    return () => { isMounted = false; };
  }, [department, category, key, enabled]);
  return state.key === key ? state : { key, products: null, isLoading: true };
}
