import { useSeller } from '../sellers/SellerProvider';
import { validateSellerBasket } from '../sellers/catalogue-cart.js';
import { isOfferCode, OFFER_CODE } from '../components/shopping-benefits.js';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, MapPin, Truck, CreditCard, Smartphone, Landmark, Wallet, CalendarDays, Clock, ShoppingBag, Gift, Info, ChevronDown } from 'lucide-react';
import { useAuth } from '../authentication/AuthProvider';
import { useCheckout } from './CheckoutProvider';
import { METHODS, normalizeLines, totals, emptyAddress, validateAddress, validateDelivery, localDate, createPreviewOrder, money } from './checkout.model';
import OrderReceipt, { OrderLines, PriceSummary } from './OrderReceipt';
import {liveBackend} from '../integrations/api.client';
import {useLocation} from '../delivery/LocationProvider';
import OrderTracking from '../delivery/OrderTracking';
import {LocationPicker} from '../delivery/NearbyDelivery';
import {validateLocation} from '../delivery/location.model.js';
import './checkout.css';
const icons = { phone: Smartphone, card: CreditCard, bank: Landmark, wallet: Wallet, calendar: CalendarDays, clock: Clock, truck: Truck };
const STEPS = ['Address', 'Delivery', 'Payment', 'Review'];
const preferencesFor = method => ({ upi: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Other UPI app'], netbanking: ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Other bank'], wallet: ['Choose at provider checkout'], emi: ['3 months', '6 months', '9 months', '12 months'], paylater: ['Choose an eligible provider'] }[method] || []);
const initialPreferences = { delivery: 'standard', date: '', slot: 'Any time', tip: 0, cutlery: false, gift: false, rxAcknowledged: false };
function AddressFields({ address, setAddress }) {
  const fields = [['name', 'Full name', 'name'], ['email', 'Email address', 'email'], ['phone', 'Mobile number', 'tel-national'], ['pin', 'PIN code', 'postal-code'], ['street', 'Flat, building & street', 'address-line1'], ['area', 'Area / landmark (optional)', 'address-line2'], ['city', 'City', 'address-level2'], ['state', 'State', 'address-level1']];
  return <div className="em-pay-fields">{fields.map(([key, label, autoComplete]) => <label key={key} className={['street', 'area'].includes(key) ? 'wide' : ''}><span>{label}</span><input name={key} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} inputMode={['phone', 'pin'].includes(key) ? 'numeric' : undefined} autoComplete={autoComplete} required={key !== 'area'} minLength={key === 'street' ? 5 : ['name','city','state'].includes(key) ? 2 : undefined} pattern={key === 'phone' ? '[6-9][0-9]{9}' : key === 'pin' ? '[1-9][0-9]{5}' : undefined} maxLength={key === 'phone' ? 10 : key === 'pin' ? 6 : key === 'email' ? 254 : 160} placeholder={key === 'phone' ? '10-digit mobile number' : key === 'pin' ? '6-digit PIN' : undefined} value={address[key]} onChange={event => setAddress(old => ({ ...old, [key]: event.target.value }))}/></label>)}<label className="wide"><span>Delivery instructions (optional)</span><textarea maxLength={300} rows={2} value={address.instructions} onChange={event => setAddress(old => ({ ...old, instructions: event.target.value }))} placeholder="Landmark, gate or delivery preference"/></label></div>;
}
export default function Checkout({ items, onBack, onClose, onComplete, initialAddress }) {
  const auth = useAuth();
  const {location,choose}=useLocation();
  const sellers=useSeller();
  const store = useCheckout();
  const basket = useMemo(() => { try { return { lines: normalizeLines(items), error: '' }; } catch (error) { return { lines: [], error: error.message }; } }, [items]);
  const lines = basket.lines;
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState(() => ({ ...emptyAddress, name: auth.user?.name || '', email: auth.user?.email || '', ...initialAddress }));
  const [preferences, setPreferences] = useState(initialPreferences);
  const [payment, setPayment] = useState({ method: liveBackend ? 'cod' : 'upi', preference: liveBackend ? '' : 'Google Pay' });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [reviewAccepted, setReviewAccepted] = useState(false);
  const heading = useRef(null);
  const locked = useRef(false);
  const orderId = useRef(`EM-REQUEST-${crypto.randomUUID().toUpperCase()}`);
  const amount = totals(lines, { ...preferences, coupon });
  const hasFood = lines.some(line => line.category === 'food');
  const hasRx = lines.some(line => line.rxRequired);
  const giftEligible = lines.some(line => ['books', 'plants', 'jewellery'].includes(line.category));
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    heading.current?.closest('.em-pay-modal')?.scrollTo({ top: 0, behavior: 'auto' });
  }, [step, receipt]);
  function next(event) {
    event?.preventDefault();
    const sellerIssue=validateSellerBasket(lines,sellers.products,sellers.profiles);
    const issue = sellerIssue || (step === 0 ? validateAddress(address) || (liveBackend ? validateLocation(location) : '') : step === 1 ? validateDelivery(preferences, lines) : '');
    setError(issue);
    if (!issue) setStep(old => Math.min(old + 1, 3));
  }
  function applyCoupon(event) {
    event.preventDefault();
    const code = couponInput.trim().toUpperCase();
    if (!isOfferCode(code)) { setCouponError(`Use ${OFFER_CODE} for this offer.`); return; }
    if (amount.subtotal < 50000) { setCouponError('This offer needs an items subtotal of at least ₹500.'); return; }
    setCoupon(code); setCouponError('');
  }
  async function saveOrder() {
    if (locked.current || receipt) return;
    const issue = basket.error || validateSellerBasket(lines,sellers.products,sellers.profiles) || validateAddress(address) || (liveBackend ? validateLocation(location) : '') || validateDelivery(preferences, lines);
    if (issue || !reviewAccepted) { setError(issue || 'Confirm the order details before continuing.'); return; }
    locked.current = true; setPending(true); setError('');
    try {
      const order = createPreviewOrder({ id: orderId.current, lines, address, preferences, payment, coupon });
      const saved=await store.save(order,location); setReceipt(saved || order); onComplete?.(saved || order);
    } catch (err) { setError(err.message || 'Could not confirm this order. Please try again.'); locked.current = false; }
    finally { setPending(false); }
  }
  if (basket.error) return <div className="em-pay-empty"><ShoppingBag size={35}/><h2>Check your basket</h2><p role="alert">{basket.error}</p><button className="em-pay-primary" onClick={onBack}>Back to basket</button></div>;
  if (receipt) return <div className="em-pay-complete"><div className="em-pay-success-icon"><Check size={30}/></div><span className="em-pay-eyebrow">{liveBackend ? 'YOUR ORDER IS CONFIRMED' : 'YOUR CHECKOUT PREVIEW IS READY'}</span><h2 ref={heading} tabIndex={-1}>A little closer to your next find.</h2><OrderReceipt order={receipt}/>{liveBackend && <OrderTracking id={receipt.id}/>}<p className="em-pay-fine">{liveBackend ? 'Find this order and delivery tracking in My orders.' : store.persisted ? 'Find this receipt in Preview orders across all dashboards. Saved in this tab until sign-out.' : 'Browser storage is unavailable. Download the receipt to keep a copy.'}</p><div className="em-pay-actions"><button className="em-pay-primary" onClick={onClose}>Continue shopping<ArrowRight size={16}/></button></div></div>;
  return <div className="em-pay-checkout"><nav className="em-pay-steps" aria-label="Checkout progress">{STEPS.map((label, index) => <button key={label} disabled={index > step || pending} aria-current={step === index ? 'step' : undefined} onClick={() => { setError(''); setStep(index); }} className={step === index ? 'active' : index < step ? 'done' : ''}><span>{index < step ? <Check size={13}/> : index + 1}</span>{label}</button>)}</nav><div className="em-pay-notice"><Info size={18}/><p><strong>{liveBackend ? 'Secure checkout' : 'Checkout preview'}</strong> · {liveBackend ? 'Cash on delivery. Place one store’s products in each order.' : 'Use sample details. No payment is collected.'}</p></div>
    <div className="em-pay-layout"><section className="em-pay-main"><span className="em-pay-eyebrow">STEP 0{step+1} / A FEW LITTLE DETAILS</span><h2 ref={heading} tabIndex={-1}>{['Where should it arrive?', 'Delivery, your way.', 'Choose how you’d pay.', 'One final look.'][step]}</h2><p className="em-pay-intro">{[liveBackend ? 'Delivery address. India only.' : 'A delivery address for your order preview. India only.', 'Choose your delivery preferences. Availability and timing will be confirmed by the retailer.', 'Explore the available payment types. Your payment details belong in the provider’s checkout when connected.', 'Review your items, delivery preferences and total before saving.'][step]}</p>
      {error && <p className="em-pay-error" role="alert">{error}</p>}
      {step === 0 && <form onSubmit={next}>{liveBackend && <LocationPicker value={location} onChoose={choose}/>}<AddressFields address={address} setAddress={setAddress}/><fieldset className="em-pay-address-label"><legend>Address label</legend>{['Home','Office','Other'].map(label => <label key={label}><input type="radio" name="address-label" checked={address.label === label} onChange={() => setAddress(old => ({ ...old, label }))}/>{label}</label>)}</fieldset><div className="em-pay-actions"><button className="em-pay-text" type="button" onClick={onBack}><ArrowLeft size={15}/>Back to basket</button><button className="em-pay-primary" type="submit">Continue to delivery<ArrowRight size={16}/></button></div></form>}
      {step === 1 && <form onSubmit={next}><fieldset className="em-pay-choices"><legend>Delivery preference</legend>{[['standard','Standard delivery','₹49 estimate; free with an items subtotal of ₹999 or more'],['express','Express delivery','₹99 estimate; availability depends on your address']].map(([value,label,detail]) => <label className={preferences.delivery === value ? 'selected' : ''} key={value}><input type="radio" name="delivery" checked={preferences.delivery === value} onChange={() => setPreferences(old => ({ ...old, delivery: value }))}/><Truck size={22}/><span><strong>{label}</strong><small>{detail}</small></span><b>{value === 'express' ? '₹99' : amount.subtotal >= 99900 ? 'Free' : '₹49'}</b></label>)}</fieldset><div className="em-pay-fields"><label><span>Preferred date (optional)</span><input type="date" min={localDate()} value={preferences.date} onChange={event => setPreferences(old => ({ ...old, date: event.target.value }))}/></label><label><span>Preferred time</span><select value={preferences.slot} onChange={event => setPreferences(old => ({ ...old, slot: event.target.value }))}>{['Any time','Morning · 9 AM–12 PM','Afternoon · 12 PM–3 PM','Evening · 3 PM–6 PM'].map(slot => <option key={slot}>{slot}</option>)}</select></label></div>{giftEligible && <label className="em-pay-check"><input type="checkbox" checked={preferences.gift} onChange={event => setPreferences(old => ({ ...old, gift: event.target.checked }))}/><Gift size={17}/>Request gift wrapping for eligible items</label>}{hasFood && <><label className="em-pay-check"><input type="checkbox" checked={preferences.cutlery} onChange={event => setPreferences(old => ({ ...old, cutlery: event.target.checked }))}/>Request cutlery</label><fieldset className="em-pay-tip"><legend>Optional delivery tip</legend>{[0,20,30,50].map(tip => <label className={preferences.tip === tip ? 'selected' : ''} key={tip}><input type="radio" name="tip" checked={preferences.tip === tip} onChange={() => setPreferences(old => ({ ...old, tip }))}/>{tip === 0 ? 'No tip' : `₹${tip}`}</label>)}</fieldset></>}{hasRx && <div className="em-pay-rx"><strong>Pharmacist review required</strong><p>Prescription-labelled items require retailer approval before fulfilment. A selected file in this preview is not a verified prescription.</p><label className="em-pay-check"><input type="checkbox" required checked={preferences.rxAcknowledged} onChange={event => setPreferences(old => ({ ...old, rxAcknowledged: event.target.checked }))}/>I understand that these items need pharmacist approval.</label></div>}<div className="em-pay-actions"><button type="button" className="em-pay-text" onClick={() => setStep(0)}><ArrowLeft size={15}/>Back</button><button type="submit" className="em-pay-primary">Continue to payment<ArrowRight size={16}/></button></div></form>}
      {step === 2 && <><fieldset className="em-pay-methods"><legend>Payment method</legend>{METHODS.filter(method=>!liveBackend || method.id==='cod').map(method => { const Icon = icons[method.icon]; return <label key={method.id} className={payment.method === method.id ? 'selected' : ''}><input type="radio" name="payment-method" value={method.id} checked={payment.method === method.id} onChange={() => setPayment({ method: method.id, preference: preferencesFor(method.id)[0] || '' })}/><Icon size={23}/><span><strong>{method.name}</strong><small>{method.detail}</small></span></label>; })}</fieldset>{preferencesFor(payment.method).length > 0 && <label className="em-pay-payment-preference"><span>{payment.method === 'emi' ? 'Preferred tenure' : 'Preference for this preview'}</span><select value={payment.preference} onChange={event => setPayment(old => ({ ...old, preference: event.target.value }))}>{preferencesFor(payment.method).map(value => <option key={value}>{value}</option>)}</select></label>}<div className="em-pay-provider-note"><CreditCard size={18}/><p>{payment.method === 'cod' ? 'Choose cash on delivery. Online payment methods will appear when a payment provider is connected.' : payment.method === 'emi' || payment.method === 'paylater' ? 'Eligibility, interest, fees and lender terms must be confirmed by the provider. This preview does not apply for credit.' : 'No card number, CVV, UPI PIN, bank password is needed here. Live payment will open the connected provider’s checkout.'}</p></div><div className="em-pay-actions"><button className="em-pay-text" onClick={() => setStep(1)}><ArrowLeft size={15}/>Back</button><button className="em-pay-primary" onClick={next}>Review order<ArrowRight size={16}/></button></div></>}
      {step === 3 && <><div className="em-pay-review-card"><h3><MapPin size={17}/>Deliver to <button onClick={() => setStep(0)}>Edit</button></h3><strong>{address.name} · {address.label}</strong><p>{address.street}{address.area && `, ${address.area}`}<br/>{address.city}, {address.state} {address.pin}<br/>{address.phone} · {address.email}</p>{address.instructions && <small>{address.instructions}</small>}</div><div className="em-pay-review-grid"><div className="em-pay-review-card"><h3><Truck size={17}/>Delivery <button onClick={() => setStep(1)}>Edit</button></h3><p>{preferences.delivery === 'express' ? 'Express' : 'Standard'} preference<br/>{preferences.date || 'No preferred date'} · {preferences.slot}</p>{preferences.gift && <small>Gift wrapping requested</small>}{preferences.cutlery && <small>Cutlery requested</small>}</div><div className="em-pay-review-card"><h3><CreditCard size={17}/>Payment <button onClick={() => setStep(2)}>Edit</button></h3><p>{METHODS.find(method => method.id === payment.method)?.name}<br/>{payment.preference}</p><small>{liveBackend ? 'Pay cash when your order arrives' : 'Not paid · Preview only'}</small></div></div><label className="em-pay-check"><input type="checkbox" checked={reviewAccepted} onChange={event => setReviewAccepted(event.target.checked)}/>{liveBackend ? 'Confirm this order and pay cash on delivery.' : 'I understand this saves an unpaid preview.'}</label><div className="em-pay-actions"><button className="em-pay-text" disabled={pending} onClick={() => setStep(2)}><ArrowLeft size={15}/>Back</button><button className="em-pay-primary" disabled={pending || !reviewAccepted} onClick={saveOrder}>{pending ? 'Saving…' : liveBackend ? 'Confirm order' : 'Save preview order'}<Check size={17}/></button></div></>}
    </section><aside className={`em-pay-summary${summaryOpen ? ' is-open' : ''}`}><button className="em-pay-summary-toggle" aria-expanded={summaryOpen} onClick={() => setSummaryOpen(old => !old)}><span><ShoppingBag size={16}/>Order summary · {lines.reduce((sum,line) => sum + line.quantity,0)} items</span><strong>{money(amount.total)}<ChevronDown size={16}/></strong></button><div className="em-pay-summary-content"><div className="em-pay-summary-heading"><span><ShoppingBag size={18}/>Your order</span><small>{lines.reduce((sum,line) => sum + line.quantity,0)} items</small></div><OrderLines lines={lines}/><form className="em-pay-coupon" onSubmit={applyCoupon}><label><span>Promo code</span><div><input aria-label="Preview promo code" maxLength={30} placeholder={OFFER_CODE} value={couponInput} onChange={event => setCouponInput(event.target.value)}/><button type="submit">Apply</button></div></label>{couponError && <p role="alert">{couponError}</p>}{coupon ? <p className="applied">{coupon} applied <button type="button" onClick={() => { setCoupon(''); setCouponInput(''); setCouponError(''); }}>Remove</button></p> : <small>Offer: 10% off items from ₹500, up to ₹200.</small>}</form><PriceSummary amount={amount}/><p className="em-pay-fine">{liveBackend ? 'Availability, price and delivery area are checked before confirmation.' : 'Catalogue prices and estimated delivery. Final fees require confirmation.'}</p><div className="em-pay-summary-bottom"><span>ONE CHECKOUT.</span><strong>Ten worlds. A familiar finish.</strong><span>No payment details collected.</span></div></div></aside></div>
  </div>;
}
