import { useCallback, useMemo, useState } from 'react';
import { pruneCatalogueCart } from './catalogue-cart.js';
export default function useCatalogueCart(initial, products) {
  const [raw,setRaw]=useState(initial);
  const cart=useMemo(()=>pruneCatalogueCart(raw,products),[raw,products]);
  const setCart=useCallback(value=>setRaw(old=>pruneCatalogueCart(typeof value==='function'?value(pruneCatalogueCart(old,products)):value,products)),[products]);
  return [cart,setCart];
}
