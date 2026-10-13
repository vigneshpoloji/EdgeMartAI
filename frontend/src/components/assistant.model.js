import { OFFER_CODE, deliveryEstimate } from './shopping-benefits.js';
import { SELLER_DEPARTMENTS, sellerUrl } from '../sellers/departments.js';
export function assistantReply(message, { department, products=[], seller=false }) {
  const text = message.trim().toLowerCase();
  if (/offer|coupon|discount|promo/.test(text)) return {text:`Use ${OFFER_CODE} at checkout for 10% off orders from ₹500, up to ₹200. Standard delivery is free from ₹999 before discounts.`};
  if (/deliver|shipping|arriv|when/.test(text)) return {text:`Estimated delivery for ${department}: ${deliveryEstimate(department)}. Your address, availability and fulfilment confirmation determine the final delivery date. Standard delivery costs ₹49 below ₹999; express is ₹99 when available.`};
  if (seller && /photo|image|upload/.test(text)) return {text:'Choose Add product or Edit, then select Image link for a public HTTPS URL, or Upload from device for a JPG, PNG or WebP photo up to 5 MB. Save the listing to update its photo.'};
  if (seller && /publish|listing|sell|product|stock|start/.test(text)) return {text:`Add a ${department} product with its name, price, selling unit and stock. Complete the department details and choose Active to show it in the buyer catalogue. Draft or Paused hides it. Products with zero stock show as unavailable.`};
  if (/prescription|medicine|dose|symptom/.test(text) && department==='pharmacy') return {text:'Prescription products require pharmacist verification before fulfilment. Ask a qualified pharmacist or clinician about suitability, dosage or symptoms.'};
  if (/order|track|cancel/.test(text)) return {text:seller ? 'Open Orders in your seller menu to accept orders, start preparation and mark them ready for pickup.' : 'Open My orders in the account bar to view saved order details and available cancellation actions. Tracking appears there when fulfilment information is available.'};
  if (/payment|upi|card|emi|pay/.test(text)) return {text:'Add items to your bag and continue to checkout. Enter your address, choose delivery and confirm cash on delivery. Pay the delivery partner when your order arrives; the current checkout does not collect money online.'};
  if (/hi|hello|help|namaste/.test(text) && text.length<20) return {text:seller ? 'I can help with photos, publishing, stock, offers and your department details. What would you like to work on?' : 'Ask me about products, offers, estimated delivery, checkout or orders.'};
  const destination=SELLER_DEPARTMENTS.find(d=>d.id!==department && new RegExp(`\\b${d.id}\\b`).test(text));
  if(destination && /open|browse|visit|switch|show|shop|dashboard/.test(text)) return {text:`Explore the ${destination.name.toLowerCase()} ${seller ? 'seller workspace' : 'collection'}.`,departments:[{name:destination.name,url:seller?sellerUrl(destination.id):`/?department=${destination.id}`}]};
  const tokens=text.replace(/[^\p{L}\p{N}\s]/gu,' ').split(/\s+/).filter(t=>t.length>2 && !['the','for','show','find','want','looking','buy','have','you','can','price','product','products'].includes(t));
  const matches=products.filter(p=>tokens.length && tokens.every(t=>`${p.name} ${p.brand||''} ${p.description||''} ${p.subCategory||''}`.toLowerCase().includes(t))).slice(0,3);
  if(matches.length) return {text:`Here are matching products in ${department}.`,products:matches.map(p=>({id:p.id,name:p.name,price:p.price??p.packSizes?.[0]?.price??p.weights?.[0]?.price,inStock:p.inStock!==false && p.stock!==0}))};
  return {text:seller ? 'Try “upload photo”, “publish product”, “stock”, “offers” or “orders”. Your department workspace also has checks for incomplete product details.' : 'I could not match that to this catalogue. Try a product name, or ask about offers, delivery, payment or orders.'};
}
