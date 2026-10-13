import { catalogueProduct } from '../sellers/buyer.catalog.js';
import { validImage } from '../sellers/seller.model.js';

export const PRODUCT_CATEGORIES = Object.freeze({ books: 'Books', electronics: 'Electronics', groceries: 'Groceries', fruits: 'Fruits', vegetables: 'Vegetables', pharmacy: 'Pharmacy', plants: 'Plants', meat: 'Meat', jewellery: 'Jewellery', food: 'Food' });
const string = (value, fallback = '') => typeof value === 'string' && value.trim() ? value.trim() : fallback;
function photo(value) {
  try { return validImage(value); } catch {
    // A local Spring server may serve uploaded photos over HTTP during development.
    try { const url = new URL(value); if (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) && !url.username && !url.password) return url.href; } catch { /* Use department fallback. */ }
    return '';
  }
}
export function normalizeLiveProducts(records, department) {
  if (!Array.isArray(records) || !PRODUCT_CATEGORIES[department]) return [];
  const ids = new Set();
  return records.flatMap(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const id = string(item.id, string(item._id?.$oid, string(item._id)));
    const name = string(item.name, string(item.title));
    const category = string(item.category);
    const price = typeof item.price === 'number' || typeof item.price === 'string' && item.price.trim() ? Number(item.price) : NaN;
    if (!id || ids.has(id) || !name || !Number.isFinite(price) || price < 0 || price > 10000000 || category && category.toLowerCase() !== department) return [];
    ids.add(id);
    const rawStock = typeof item.stock === 'number' || typeof item.stock === 'string' && item.stock.trim() ? Number(item.stock) : NaN;
    const stock = Number.isSafeInteger(rawStock) && rawStock >= 0 ? rawStock : 0;
    const unitPaise = Math.round(price * 100), description = string(item.description);
    const image = photo(item.imageUrl) || photo(item.image) || `/images/hero-${department}.jpg`;
    const variant = string(item.variant, string(item.packSize, '1 selling unit'));
    const details = item.details && typeof item.details === 'object' && !Array.isArray(item.details) ? item.details : {};
    const record = { ...item, id, name, description, department, stock, unitPaise, image, variant, details, rxRequired: item.rxRequired === true || item.scheduleH === true };
    const defaults = catalogueProduct(record, { store: string(item.store, string(item.brand, 'Brand not supplied')) });
    const normalized = { ...defaults };
    // Preserve supplied metadata without allowing null containers to break cards/modals.
    for (const [key, value] of Object.entries(item)) if (value !== null && value !== undefined && (typeof defaults[key] !== 'object' || Array.isArray(defaults[key]) === Array.isArray(value) && typeof value === 'object')) normalized[key] = value;
    return [{ ...normalized, id, name, title: name, short: string(item.short, name), description, price: unitPaise / 100, unitPaise, image,
      images: Array.isArray(item.images) && item.images.some(photo) ? item.images.map(photo).filter(Boolean) : [image],
      category: department, department, sourceCategory: category || PRODUCT_CATEGORIES[department], stock, inStock: stock > 0 && item.inStock !== false,
      liveProduct: true, sellerProduct: true, details, variant, rxRequired: record.rxRequired }];
  });
}
