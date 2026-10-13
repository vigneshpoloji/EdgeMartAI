import { POT_OPTIONS, SOIL_ADDONS } from '../data.js';
export function pruneCatalogueCart(cart, products) {
  const byId = new Map(products.map(p=>[p.id,p]));
  const cleanLine = (id,line) => {
    const p=byId.get(id); if(!p)return null;
    const quantity=typeof line==='number'?line:line.quantity;
    if(!Number.isInteger(quantity)||quantity<1)return null;
    const packs=p.packSizes||p.packs;
    if(typeof line==='object' && Number.isInteger(line.pack) && !packs?.[line.pack])return null;
    const capped=p.sellerProduct&&p.stock>0?Math.min(quantity,p.stock):quantity;
    return typeof line==='number'?capped:{...line,quantity:capped};
  };
  if(Array.isArray(cart))return cart.flatMap(line=>{const clean=cleanLine(line?.id,line);return clean?[clean]:[];});
  return Object.fromEntries(Object.entries(cart || {}).flatMap(([key,line])=>{const id=typeof line==='object'?line?.id:key.split(':')[0];const clean=cleanLine(id,line);return clean!==null?[[key,clean]]:[];}));
}
export function validateSellerBasket(lines, products, profiles) {
  const quantities = new Map();
  for(const line of lines) {
    if(!line.id?.startsWith('seller-product-'))continue;
    const p=products.find(p=>p.id===line.id);
    if(!p || p.status!=='active' || !profiles.some(s=>s.id===p.sellerId))return 'A product is no longer available. Close checkout and review your basket.';
    if(p.department!==line.category)return 'A product department changed. Review your basket.';
    if(p.rxRequired && !line.rxRequired)return 'Prescription requirements changed. Close checkout and add this product again.';
    // The nursery configurator can add explicitly selected catalogue extras.
    const unitPaise=line.unitPaise??Math.round((line.unitPrice??line.price)*100);
    const extras = p.department==='plants' ? (POT_OPTIONS.find(pot=>pot.id===line.options?.pot)?.price || 0) + (line.options?.addons || []).reduce((s,id)=>s+(SOIL_ADDONS.find(a=>a.id===id)?.price || 0),0) : 0;
    if(unitPaise!==p.unitPaise+Math.round(extras*100))return 'A product price changed. Close checkout and review your basket.';
    quantities.set(p.id,(quantities.get(p.id)||0)+line.quantity);
    if(!p.stock || quantities.get(p.id)>p.stock)return `Only ${p.stock} selling units of ${p.name} are available. Review your basket.`;
  }
  return '';
}
