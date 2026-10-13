import React from 'react';
import Checkout from '../checkout/Checkout';
import CheckoutModal from '../checkout/CheckoutModal';
// Every dashboard uses this shared ordering and payment flow.
export default function CheckoutLifecycle({ item, items, quantity = 1, onBack, onClose, onComplete, initialAddress }) {
  const lines = items || item?.lines || (item ? [{ ...item, quantity }] : []);
  return <CheckoutModal onClose={onClose}><Checkout items={lines} onBack={onBack} onClose={onClose} onComplete={onComplete} initialAddress={initialAddress}/></CheckoutModal>;
}
