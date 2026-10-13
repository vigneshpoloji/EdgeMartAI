import { isOfferCode } from '../components/shopping-benefits.js';
import { validImage } from '../sellers/seller.model.js';
const photo = value => {try{return typeof value==='string'?validImage(value):'';}catch{return '';}};
export const METHODS = [
  { id: 'upi', name: 'UPI', detail: 'Google Pay, PhonePe, Paytm & BHIM', icon: 'phone' },
  { id: 'card', name: 'Credit / debit card', detail: 'Choose a card in the payment provider’s checkout', icon: 'card' },
  { id: 'netbanking', name: 'Net banking', detail: 'Pay through your bank', icon: 'bank' },
  { id: 'wallet', name: 'Wallet', detail: 'Choose an eligible wallet', icon: 'wallet' },
  { id: 'emi', name: 'EMI', detail: 'Provider eligibility, interest & fees apply', icon: 'calendar' },
  { id: 'paylater', name: 'Pay later', detail: 'Subject to provider approval and terms', icon: 'clock' },
  { id: 'cod', name: 'Cash on delivery', detail: 'Pay at delivery when offered by the retailer', icon: 'truck' }
];
export const DEPARTMENTS = ['electronics', 'fruits', 'vegetables', 'jewellery', 'meat', 'pharmacy', 'groceries', 'books', 'food', 'plants'];
export const money = paise => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);
export function normalizeLines(lines) {
  if (!Array.isArray(lines) || !lines.length || lines.length > 200) throw new Error('Your basket is empty or too large.');
  return lines.map((line, index) => {
    const price = line?.unitPrice ?? line?.price;
    if (!line || typeof line.id !== 'string' || !line.id || typeof line.name !== 'string' || !line.name.trim() ||
      !DEPARTMENTS.includes(line.category) || typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 10000000 ||
      !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 99 || line.inStock === false) throw new Error('Check the items and quantities in your basket.');
    const unitPaise = Math.round(price * 100);
    return { key: String(line.key || `${line.id}-${index}`), id: line.id, name: line.name.slice(0, 500), category: line.category,
      variant: String(line.variant || '').slice(0, 500), options: line.options && typeof line.options === 'object' ? JSON.parse(JSON.stringify(line.options)) : {},
      image: photo(line.image), quantity: line.quantity, unitPaise, rxRequired: Boolean(line.rxRequired) };
  });
}
export function totals(lines, { delivery = 'standard', tip = 0, coupon = '' } = {}) {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPaise * line.quantity, 0);
  const shipping = delivery === 'express' ? 9900 : subtotal >= 99900 ? 0 : 4900;
  const discount = isOfferCode(coupon) && subtotal >= 50000 ? Math.min(Math.round(subtotal * .1), 20000) : 0;
  const tipPaise = [0, 20, 30, 50].includes(tip) && lines.some(line => line.category === 'food') ? tip * 100 : 0;
  return { subtotal, shipping, discount, tip: tipPaise, total: subtotal + shipping + tipPaise - discount };
}
export const emptyAddress = { name: '', email: '', phone: '', street: '', area: '', city: '', state: '', pin: '', label: 'Home', instructions: '' };
export function validateAddress(address) {
  if (!address || address.name.trim().length < 2) return 'Enter the recipient’s full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email.trim())) return 'Enter a valid email address.';
  if (!/^[6-9][0-9]{9}$/.test(address.phone.trim())) return 'Enter a valid 10-digit Indian mobile number.';
  if (address.street.trim().length < 5) return 'Enter your flat, building and street address.';
  if (address.city.trim().length < 2 || address.state.trim().length < 2) return 'Enter your city and state.';
  if (!/^[1-9][0-9]{5}$/.test(address.pin.trim())) return 'Enter a valid six-digit PIN code.';
  return '';
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function validateDelivery(preferences, lines, today = localDate()) {
  if (!['standard', 'express'].includes(preferences.delivery)) return 'Choose a delivery option.';
  if (preferences.date && (!/^\d{4}-\d{2}-\d{2}$/.test(preferences.date) || preferences.date < today || Number.isNaN(Date.parse(preferences.date)) || new Date(preferences.date).toISOString().slice(0, 10) !== preferences.date)) return 'Choose today or a future delivery date.';
  if (lines.some(line => line.rxRequired) && !preferences.rxAcknowledged) return 'Acknowledge the pharmacist review requirement for Rx items.';
  return '';
}
export function createPreviewOrder({ id, lines, address, preferences, payment, coupon = '', now = new Date().toISOString() }) {
  const error = validateAddress(address) || validateDelivery(preferences, lines);
  if (error) throw new Error(error);
  if (!id || !METHODS.some(method => method.id === payment.method)) throw new Error('Choose a payment method.');
  return { version: 1, id, date: now, status: 'preview', paymentStatus: 'not_paid', currency: 'INR',
    items: JSON.parse(JSON.stringify(lines)), address: { ...address }, preferences: { ...preferences }, payment: { ...payment }, coupon,
    amount: totals(lines, { ...preferences, coupon }) };
}
export function receiptText(order) {
  return ['EDGEMART · PREVIEW RECEIPT', 'Not a tax invoice. No payment, retailer order or delivery booking.', order.id,
    new Date(order.date).toLocaleString('en-IN'), `Status: ${order.status === 'cancelled' ? 'Cancelled preview' : 'Preview saved'} · NOT PAID`,
    ...order.items.map(line => `${line.quantity} × ${line.name}${line.variant ? ` (${line.variant})` : ''} — ${money(line.unitPaise * line.quantity)}`),
    `Items: ${money(order.amount.subtotal)}`, `Delivery estimate: ${money(order.amount.shipping)}`, `Preview discount: -${money(order.amount.discount)}`,
    `Optional tip: ${money(order.amount.tip)}`, `Preview total: ${money(order.amount.total)}`,
    `Selected method: ${METHODS.find(method => method.id === order.payment.method)?.name || order.payment.method}`,
    `Delivery: ${order.address.name}, ${order.address.street}, ${order.address.area}, ${order.address.city}, ${order.address.state} ${order.address.pin}`,
    `Preferences: ${order.preferences.delivery}, ${order.preferences.date || 'No date selected'}, ${order.preferences.slot || 'Any time'}`
  ].join('\n');
}
