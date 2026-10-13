import React, { useState } from 'react';
import { Download, Package, MapPin, CreditCard, Check, Clock } from 'lucide-react';
import { METHODS, money, receiptText } from './checkout.model';
import './checkout.css';
export function downloadReceipt(order) {
  const url = URL.createObjectURL(new Blob([receiptText(order)], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `${order.id}-preview.txt`;
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
export function OrderLines({ lines }) {
  return <div className="em-pay-lines">{lines.map(line => <div className="em-pay-line" key={line.key}>{line.image ? <img src={line.image} alt=""/> : <span className="em-pay-product-placeholder"><Package size={19}/></span>}<div><strong>{line.name}</strong>{line.variant && <small>{line.variant}</small>}<small>{line.quantity} × {money(line.unitPaise)}</small></div><b>{money(line.unitPaise * line.quantity)}</b></div>)}</div>;
}
export function PriceSummary({ amount }) {
  return <dl className="em-pay-prices"><div><dt>Items subtotal</dt><dd>{money(amount.subtotal)}</dd></div><div><dt>Delivery fee</dt><dd>{amount.shipping ? money(amount.shipping) : 'Free'}</dd></div>{amount.discount > 0 && <div className="em-pay-discount"><dt>Discount</dt><dd>−{money(amount.discount)}</dd></div>}{amount.tip > 0 && <div><dt>Optional tip</dt><dd>{money(amount.tip)}</dd></div>}<div className="em-pay-total"><dt>Total</dt><dd>{money(amount.total)}</dd></div></dl>;
}
export default function OrderReceipt({ order, compact = false }) {
  const [showText, setShowText] = useState(false);
  if(order.paymentStatus!=='not_paid')return <div className="em-pay-receipt"><div className="em-pay-receipt-meta"><span>{order.status.replaceAll('_',' ').toUpperCase()}</span><strong>{order.id}</strong><small>{new Date(order.date).toLocaleString('en-IN')}</small></div><div className="em-pay-notice"><p>{order.paymentStatus==='paid_cash'?'Cash collected at delivery.':'Cash on delivery · payment due when your order arrives.'}</p></div><OrderLines lines={order.items}/><PriceSummary amount={order.amount}/><p>Delivery to {order.address.name}: {order.address.street}, {order.address.city} {order.address.pin}</p><p className="em-pay-fine">Order confirmation. This is not a tax invoice.</p></div>;
  return <div className="em-pay-receipt"><div className="em-pay-receipt-meta"><span>{order.status === 'cancelled' ? 'CANCELLED PREVIEW' : 'PREVIEW ORDER SAVED'}</span><strong>{order.id}</strong><small>{new Date(order.date).toLocaleString('en-IN')}</small></div><div className="em-pay-notice"><Clock size={17}/><p><strong>Not paid · No retailer order sent</strong><br/>This is a checkout preview. No money, stock reservation or delivery booking is involved.</p></div>
    <OrderLines lines={order.items}/><PriceSummary amount={order.amount}/>
    {!compact && <div className="em-pay-receipt-grid"><section><h3><MapPin size={16}/>Delivery details</h3><strong>{order.address.name}</strong><p>{order.address.street}{order.address.area && `, ${order.address.area}`}<br/>{order.address.city}, {order.address.state} {order.address.pin}<br/>{order.address.phone}</p>{order.address.instructions && <p>Instructions: {order.address.instructions}</p>}<small>{order.preferences.delivery === 'express' ? 'Express preference' : 'Standard preference'}{order.preferences.date ? ` · ${order.preferences.date}` : ''} · {order.preferences.slot}</small>{order.preferences.gift && <small>Gift wrapping requested</small>}{order.preferences.cutlery && <small>Cutlery requested</small>}</section><section><h3><CreditCard size={16}/>Selected payment</h3><strong>{METHODS.find(method => method.id === order.payment.method)?.name}</strong><p>{order.payment.preference || 'No provider selected'}<br/>Payment has not been collected.</p><small>Final delivery, fees and available payment methods will be confirmed when ordering is connected.</small></section></div>}
    {!compact && <div className="em-pay-timeline"><span className="done"><Check size={15}/>Preview saved</span><span><Clock size={15}/>Payment & confirmation pending</span><span><Package size={15}/>Delivery not booked</span></div>}
    <div className="em-pay-receipt-actions"><button className="em-pay-secondary" onClick={() => downloadReceipt(order)}><Download size={16}/>Download preview receipt</button><button className="em-pay-text" aria-expanded={showText} onClick={() => setShowText(old => !old)}>{showText ? 'Hide receipt text' : 'View receipt text'}</button></div>{showText && <textarea className="em-pay-receipt-text" aria-label="Preview receipt text" readOnly rows={15} value={receiptText(order)}/>}<p className="em-pay-fine">Preview receipt only. This is not a tax invoice.</p>
  </div>;
}
