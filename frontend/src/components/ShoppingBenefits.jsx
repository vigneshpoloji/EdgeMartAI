import React, { useState } from 'react';
import { Tag, Copy, Check, Truck } from 'lucide-react';
import { OFFER_CODE, deliveryEstimate } from './shopping-benefits.js';
import './shopping-benefits.css';
export function DeliveryEstimate({ department, product }) {
  const unavailable = product?.inStock === false || product?.stock === 0;
  return <p className="em-delivery-estimate"><Truck size={14} aria-hidden="true"/><span>{unavailable ? 'Currently unavailable' : <>Estimated delivery <strong>{deliveryEstimate(department)}</strong></>}</span></p>;
}
export function DepartmentOffers({ department }) {
  const [copied,setCopied] = useState(false), [manual,setManual] = useState(false);
  return <aside className={`em-department-offer offer-${department}`} aria-label="Department offer"><span className="em-offer-icon"><Tag size={21}/></span><div><strong>A little extra, on us. Save 10%.</strong><span>Orders from ₹500 · up to ₹200 off · apply at checkout</span></div><button type="button" onClick={async()=>{try { await navigator.clipboard.writeText(OFFER_CODE); setCopied(true); } catch { setManual(true); }}}>{copied ? <Check size={15}/> : <Copy size={15}/>} {OFFER_CODE}</button><span className="em-offer-feedback" role="status">{copied ? 'Code copied' : manual ? `Enter ${OFFER_CODE} at checkout` : ''}</span></aside>;
}
