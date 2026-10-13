import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../authentication/AuthProvider';
import { appendOrder, cancelPreviewOrder, loadOrders, persistOrders } from './preview.orders';
import { sellerPreviewEnabled, sellerRepository } from '../sellers/seller.repository';
import { backend, liveBackend } from '../integrations/api.client';
import {announceCommerceChange,subscribeCommerceChanges} from '../integrations/commerce.events.js';

const Context = createContext(null);
let storage;
try {
  storage = window.sessionStorage;
} catch {
  /* In-memory orders remain available. */
}

export function CheckoutProvider({ children }) {
  const auth = useAuth();
  const owner = auth.user?.id || '';
  const [state, setState] = useState(() => ({
    owner,
    orders: liveBackend ? [] : loadOrders(storage, owner)
  }));
  const orders = state.owner === owner ? state.orders : [];
  const [persisted, setPersisted] = useState(Boolean(storage));
  const [historyOpen, setHistoryOpen] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!liveBackend || !owner || auth.user?.role === 'driver') return;
    let active = true;
    const refresh = () =>
      backend
        .api('/api/orders')
        .then(({ orders }) => {
          if (active) {
            setState({ owner, orders });
            setError('');
          }
        })
        .catch(e => {
          if (active) setError(e.message);
        });

    void refresh();
    const timer = setInterval(refresh, 5000);
    const unsubscribe = subscribeCommerceChanges(refresh);
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      clearInterval(timer);
      unsubscribe();
      window.removeEventListener('focus', refresh);
    };
  }, [owner,auth.user?.role]);

  useEffect(() => {
    if (auth.loading) return;
    if (state.owner !== owner) {
      setState({ owner, orders: loadOrders(storage, owner) });
      setHistoryOpen(false);
      return;
    }
    if (!liveBackend) setPersisted(persistOrders(storage, owner, state.orders));
    else setPersisted(true);
  }, [owner, state, auth.loading]);

  const update = action =>
    setState(old => ({ owner, orders: action(old.owner === owner ? old.orders : []) }));

  return (
    <Context.Provider
      value={{
        orders,
        persisted,
        historyOpen,
        setHistoryOpen,
        error,
        liveBackend,
        save: async (order, location) => {
          if (liveBackend) {
            const { order: saved } = await backend.api('/api/orders', {
              method: 'POST',
              body: {
                items: order.items,
                address: order.address,
                preferences: order.preferences,
                payment: order.payment,
                coupon: order.coupon,
                location,
                idempotencyKey: order.id
              }
            });
            update(old => [saved, ...old.filter(o => o.id !== saved.id)]);
            announceCommerceChange();
            return saved;
          }
          if (sellerPreviewEnabled) sellerRepository.recordOrder(order);
          update(old => appendOrder(old, order));
          return order;
        },
        cancel: async id => {
          if (liveBackend) {
            const { order } = await backend.api(`/api/orders/${encodeURIComponent(id)}/cancel`, {
              method: 'POST',
              body: {}
            });
            update(old => old.map(o => (o.id === id ? order : o)));
            announceCommerceChange();
            return;
          }
          const order = orders.find(o => o.id === id);
          if (order && sellerPreviewEnabled) {
            sellerRepository.recordOrder({ ...order, status: 'cancelled' });
          }
          update(old => cancelPreviewOrder(old, id));
        }
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function useCheckout() {
  const context = useContext(Context);
  if (!context) throw new Error('CheckoutProvider is required');
  return context;
}
