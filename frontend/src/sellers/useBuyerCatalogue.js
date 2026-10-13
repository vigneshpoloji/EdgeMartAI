import { useMemo } from 'react';
import { useSeller } from './SellerProvider';
import { mergeCatalogue } from './buyer.catalog.js';
import {useLocation,distanceKm} from '../delivery/LocationProvider';
import useLiveProducts from '../api/useLiveProducts';
export default function useBuyerCatalogue(department, native, apiCategory) {
  const {products,profiles,previewEnabled,liveBackend,radiusKm=5}=useSeller();
  const {location}=useLocation();
  const {products:liveProducts}=useLiveProducts(department,apiCategory,!liveBackend);
  return useMemo(()=>{
    const initial=liveProducts?.length?liveProducts:native;
    const catalogue=liveBackend?mergeCatalogue(department,[],products,profiles):liveProducts?.length?mergeCatalogue(department,initial,products,profiles):previewEnabled?mergeCatalogue(department,native,products,profiles):native;
    if(!liveBackend||!['food','fruits'].includes(department))return catalogue;
    if(!location)return [];
    return catalogue.filter(p=>{const store=profiles.find(s=>s.id===p.sellerId);return store?.location&&distanceKm(location,store.location)<=radiusKm;});
  },[department,native,liveProducts,products,profiles,previewEnabled,liveBackend,location,radiusKm]);
}
