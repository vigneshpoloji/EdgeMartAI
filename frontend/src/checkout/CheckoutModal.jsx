import React, { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ShoppingBag } from 'lucide-react';
import './checkout.css';
export default function CheckoutModal({ children, title = 'EdgeMart checkout', onClose }) {
  const titleId = useId();
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const root = document.getElementById('root');
    const wasInert = root?.inert;
    const overflow = document.body.style.overflow;
    if (root) root.inert = true;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const keyboard = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current?.(); }
      if (event.key === 'Tab') {
        const focusable = [...dialog.current.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')].filter(node => !node.disabled && node.getClientRects().length);
        const first = focusable[0], last = focusable.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keyboard);
    return () => {
      document.removeEventListener('keydown', keyboard);
      if (root) root.inert = wasInert;
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return createPortal(<div className="em-pay-overlay"><section ref={dialog} className="em-pay-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>
    <header className="em-pay-modal-header"><span className="em-pay-logo"><ShoppingBag size={22}/><span>EdgeMart<small id={titleId}>{title}</small></span></span><button className="em-pay-close" onClick={onClose} aria-label={`Close ${title}`}><X size={20}/></button></header>{children}
  </section></div>, document.body);
}
