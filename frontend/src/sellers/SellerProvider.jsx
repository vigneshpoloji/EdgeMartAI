import React,{createContext,useContext,useEffect,useState,useCallback,useRef} from 'react';
import {sellerPreviewEnabled,sellerRepository as repository} from './seller.repository.js';
import {backend,liveBackend} from '../integrations/api.client.js';
import {useAuth} from '../authentication/AuthProvider';
import {emptySellerState,loadSellerState} from './live-workspace.js';
import {registerSeller,signInSeller} from './seller.access.js';
import {announceCommerceChange,subscribeCommerceChanges} from '../integrations/commerce.events.js';
const Context=createContext(null);
export function SellerProvider({children}) {
  const auth=useAuth(),[state,setState]=useState(()=>({...repository.snapshot(),seller:sellerPreviewEnabled?repository.current():null,loading:liveBackend}));
  const revision=useRef(0);
  const refresh=useCallback(async(currentUser=auth.user)=>{
    if(!liveBackend)return;
    const current=++revision.current;
    if(!currentUser || currentUser.role==='driver'){setState({...emptySellerState(),loading:auth.loading});return;}
    try{
      const user=await backend.session();
      const next=await loadSellerState(backend,user);
      if(current===revision.current)setState(next);
    }catch(e){if(current===revision.current)setState(old=>({...((old.seller&&old.seller.id!==`seller-${currentUser.id}`)?emptySellerState():old),loading:false,error:e.message}));}
  },[auth.user?.id,auth.user?.role,auth.loading]);
  useEffect(()=>{
    if(liveBackend){let live=true;const update=()=>{if(live&&!document.hidden)void refresh();};void refresh();if(auth.user?.role==='driver')return()=>{revision.current++;};window.addEventListener('focus',update);const unsubscribe=subscribeCommerceChanges(update);const timer=setInterval(update,5000);return()=>{live=false;revision.current++;unsubscribe();clearInterval(timer);window.removeEventListener('focus',update);};}
    const update=()=>setState({...repository.snapshot(),seller:sellerPreviewEnabled?repository.current():null,loading:false});const reload=()=>{repository.reload();update();};const unsub=repository.subscribe(update);window.addEventListener('storage',reload);window.addEventListener('focus',reload);const timer=setInterval(reload,60000);return()=>{unsub();clearInterval(timer);window.removeEventListener('storage',reload);window.removeEventListener('focus',reload);};
  },[refresh]);
  const commit=async(path,body,method='POST')=>{const result=await backend.api(path,{method,body});await refresh();announceCommerceChange();return result;};
  const completeSignup=values=>commit('/api/seller/profile',values);
  const visibleState=liveBackend&&state.seller&&state.seller.id!==`seller-${auth.user?.id}`?{...emptySellerState(),loading:Boolean(auth.user)}:state;
  return <Context.Provider value={{...visibleState,previewEnabled:sellerPreviewEnabled,liveBackend,refresh,
    signup:async values=>{if(!liveBackend){const result=repository.signup(values);repository.signout();return result;}return registerSeller(auth,completeSignup,values);},completeSignup,
    signin:async(email,password)=>{if(!liveBackend)return repository.signin(email);return signInSeller(auth,refresh,{email:email.trim().toLowerCase(),password});},
    signout:async()=>{if(!liveBackend)return repository.signout();await auth.logout();revision.current++;setState({products:[],profiles:[],orders:[],seller:null,persistent:true,loading:false});},
    saveProduct:async(values,department,id)=>liveBackend?commit('/api/seller/products',{values,department,id}):repository.saveProduct(values,department,id),
    deleteProduct:async id=>liveBackend?commit(`/api/seller/products/${encodeURIComponent(id)}`,undefined,'DELETE'):repository.deleteProduct(id),
    settings:async values=>liveBackend?completeSignup(values):repository.settings(values),
    orderStatus:async(id,status)=>commit(`/api/seller/orders/${encodeURIComponent(id)}/status`,{status})
  }}>{children}</Context.Provider>;
}
export const useSeller=()=>{const value=useContext(Context);if(!value)throw new Error('SellerProvider is required');return value;};
