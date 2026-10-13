import { marketplaceListings } from './seller.catalog.js';
import { getLiveProductsByCategory } from '../api/productService.js';

// Seller records are adapted to the same shape used by each department's cards.
export function catalogueProduct(product, profile) {
  const price = product.unitPaise / 100;
  const details = product.details || {};
  const pack = { label: product.variant, price, originalPrice: price };
  const information = product.attribute || 'Details not supplied';
  return {
    ...product, ...details, category: product.department, subCategory: product.subCategory || 'other',
    price, originalPrice: price, discountPercent: 0, inStock: product.stock > 0,
    sellerId: product.sellerId, sellerProduct: true, brand: profile.store, store: profile.store,
    title: product.name, short: product.name, subtitle: product.description, caption: product.description,
    collection: product.department==='books'?({fiction:'Fiction',nonfiction:'Non-fiction',education:'Education'}[product.subCategory]||'Other books'):product.collection,
    images: product.image ? [product.image] : [], rating: 0, ratingsCount: 0, reviewsCount: 0,
    tag: product.stock ? 'Available' : 'Sold out', tone: 'mint', colour: 'violet',
    packSizes: [pack], packs: [pack], weights: [pack], sizes: [product.variant],
    variants: { colors: [{ name: product.variant }] }, aboutItem: [product.description, information],
    specs: { Information: information }, featuresTable: { Information: information },
    returnDays: 0, primeDelivery: false, organic: false, isOrganic: false,
    use: product.description, origin: details.origin || information, botanical: '', scientific: '',
    ripeness: details.ripeness || 'Not specified', nutrients: 'Not specified', shelfLife: details.expiry || 'Not specified', storage: details.storage || information,
    edit: 'classics', mood: product.description, metal: details.material || information, purity: details.purity || 'Not specified',
    grossWeight: details.weight || product.variant, netWeight: product.variant, makingCharges: 'Not specified', diamondWeight: 'Not specified',
    certAgency: details.certification || 'Certification not supplied',
    note: information, serves: product.variant, cutType: details.cut || information, temperatureZone: details.storage || 'Not specified',
    packaging: 'Contact the seller for packaging details', cookingTime: 'Not specified', certifications: 'Not supplied',
    packSize: product.variant, manufacturer: details.manufacturer || information, dosageForm: details.form || 'Not specified',
    saltComposition: details.composition || 'Not specified', uses: product.description, sideEffects: 'Consult a pharmacist',
    scheduleH: Boolean(product.rxRequired), coldChain: details.coldChain === 'Yes',
    format: details.format || product.variant, bookMeta: { author: details.author || information, isbn: details.isbn || 'Not supplied', format: details.format || product.variant },
    prepTime: details.prepTime ? `${details.prepTime} mins` : 'Not practical', portion: product.variant,
    allergens: details.allergens ? details.allergens.split(',').map(s => s.trim()).filter(Boolean) : ['Allergen information not supplied'],
    isVeg: details.diet === 'Vegetarian', customizations: { portions: [{ label: product.variant, priceDelta: 0 }], spices: ['As prepared'], addons: [] },
    lights: details.light ? [details.light] : [], light: details.light || 'Care details not supplied', water: details.water || 'Care details not supplied',
    lowWater: false, petSafe: details.petSafe === 'Yes' ? true : details.petSafe === 'No' ? false : null,
    petSource: '', botanicalName: details.botanicalName || '', care: { light: details.light || information, water: details.water || information },
  };
}

export function mergeCatalogue(department, native, products, profiles) {
  const listings = marketplaceListings(products, profiles, department);
  const ids = new Set(native.map(p => p.id));
  return [...native, ...listings.filter(p => !ids.has(p.id)).map(p => catalogueProduct(p, profiles.find(s => s.id === p.sellerId)))];
}

export async function getBuyerDepartmentCatalog(departmentName, fallbackItems = []) {
  const liveItems = await getLiveProductsByCategory(departmentName);
  
  if (liveItems && liveItems.length > 0) {
    // If backend has items, combine live products with existing fallback catalog
    // so default items still render alongside newly added items
    const liveIds = new Set(liveItems.map(i => i.id || i.name));
    const uniqueFallbacks = fallbackItems.filter(f => !liveIds.has(f.id || f.title));
    return [...liveItems, ...uniqueFallbacks];
  }
  
  return fallbackItems;
}
