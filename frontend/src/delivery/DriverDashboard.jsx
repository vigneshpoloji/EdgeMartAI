import React,{useCallback,useEffect,useRef,useState} from 'react';
import {useDriverAuth,driverClient as backend} from './DriverAuthProvider';
import DeliveryAccess from './DeliveryAccess';
import DriverProfile from './DriverProfile';
import {authMessage} from '../authentication/auth.utils.js';

import {announceCommerceChange,subscribeCommerceChanges} from '../integrations/commerce.events.js';
import {mergeDriverOrder} from './driver.model.js';
import DriverWorkspace from './DriverWorkspace';
import './driver.css';

export default function DriverDashboard(){
  const auth=useDriverAuth();
  useEffect(()=>{if(auth.user)document.title='Delivery dashboard · EdgeMart';},[auth.user?.id]);
  const [view,setView]=useState('dashboard'),[availabilityPending,setAvailabilityPending]=useState(false);
  const [orders,setOrders]=useState([]),[selectedId,setSelectedId]=useState(''),[filter,setFilter]=useState('all');
  const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[lastSync,setLastSync]=useState(null);
  const [loadError,setLoadError]=useState(''),[actionError,setActionError]=useState(''),[notice,setNotice]=useState('');
  const [sharingId,setSharingId]=useState(''),[points,setPoints]=useState({}),[pendingId,setPendingId]=useState('');

  const watch=useRef(null),gpsRun=useRef(0),gpsUpdating=useRef(false),lastSent=useRef(0);
  const busy=useRef(''),fetching=useRef(null),revision=useRef(0),ownerRef=useRef('');
  ownerRef.current=auth.user?.id||'';
  const stop=useCallback(()=>{
    gpsRun.current++;
    if(watch.current!==null)navigator.geolocation?.clearWatch(watch.current);
    watch.current=null;setSharingId('');
  },[]);
  const refresh=useCallback(async()=>{
    const current=revision.current;
    if(fetching.current===current||busy.current||auth.user?.role!=='driver')return;
    fetching.current=current;setRefreshing(true);
    try {
      const data=await backend.api('/api/driver/orders');
      if(current===revision.current){setOrders(data.orders);setLastSync(Date.now());setLoadError('');setLoading(false);}
    } catch(e){if(current===revision.current){setLoadError(e.message);setLoading(false);}}
    finally {if(fetching.current===current){fetching.current=null;setRefreshing(false);}}
  },[auth.user?.id,auth.user?.role]);
  useEffect(()=>{
    revision.current++;setView('dashboard');setOrders([]);setSelectedId('');setPoints({});setNotice('');setActionError('');setLoadError('');setLastSync(null);stop();
    if(auth.user?.role!=='driver'){setLoading(false);return;}
    setLoading(true);void refresh();
    const update=()=>{if(!document.hidden)void refresh();};
    const timer=setInterval(update,5000),unsubscribe=subscribeCommerceChanges(update);
    window.addEventListener('focus',update);
    return()=>{revision.current++;clearInterval(timer);unsubscribe();window.removeEventListener('focus',update);stop();};
  },[refresh,stop]);
  useEffect(()=>()=>stop(),[stop]);
  useEffect(()=>{if(sharingId&&!orders.some(order=>order.id===sharingId&&order.status==='out_for_delivery'))stop();},[orders,sharingId,stop]);

  const run=async(order,action,body)=>{
    if(busy.current)return;
    const owner=ownerRef.current;
    busy.current=order.id;revision.current++;setPendingId(order.id);setActionError('');setNotice('');
    try {
      const result=await backend.api(`/api/driver/orders/${encodeURIComponent(order.id)}/${action}`,{method:'POST',body});
      if(ownerRef.current!==owner)return;
      revision.current++;
      setOrders(previous=>mergeDriverOrder(previous,result.order));setSelectedId(order.id);setLastSync(Date.now());
      if(action==='claim'){setFilter('out_for_delivery');setNotice('Pickup accepted. Your customer and delivery details are ready.');}
      else {
        stop();setPoints(previous=>{const next={...previous};delete next[order.id];return next;});
        setFilter('delivered');setNotice('Delivery completed. Cash payment recorded and live location sharing stopped.');
      }
      announceCommerceChange();
    } catch(e){if(ownerRef.current===owner)setActionError(e.message);}
    finally {busy.current='';setPendingId('');if(ownerRef.current===owner)void refresh();}
  };
  const share=id=>{
    stop();setActionError('');setNotice('');lastSent.current=0;
    if(!navigator.geolocation){setActionError('GPS is unavailable on this device.');return;}
    const currentRun=gpsRun.current;setSharingId(id);
    setNotice('Allow location access and keep this page open during delivery.');
    watch.current=navigator.geolocation.watchPosition(async position=>{
      if(currentRun!==gpsRun.current||gpsUpdating.current||Date.now()-lastSent.current<4000)return;
      gpsUpdating.current=true;
      const location={lat:position.coords.latitude,lng:position.coords.longitude,accuracy:position.coords.accuracy};
      try {
        await backend.api(`/api/driver/orders/${encodeURIComponent(id)}/location`,{method:'POST',body:location});
        if(currentRun===gpsRun.current){lastSent.current=Date.now();setPoints(previous=>({...previous,[id]:{...location,recordedAt:new Date().toISOString()}}));setNotice('Live device location sent to your customer.');}
      } catch(e){if(currentRun===gpsRun.current)setActionError(e.message);}
      finally {gpsUpdating.current=false;}
    },()=>{
      if(currentRun===gpsRun.current){setActionError('Location permission was denied or a GPS reading is unavailable. Enable location access and try again.');stop();}
    },{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  };
  const signout=async()=>{stop();await auth.logout();};
  if(auth.loading)return <div className="driver-shell"><main className="driver-empty">Loading delivery access…</main></div>;
  if(!auth.user||auth.user.role!=='driver')return <DeliveryAccess/>;
  if(view==='profile')return <DriverProfile onBack={()=>setView('dashboard')}/>;
  return <DriverWorkspace user={auth.user} available={auth.profile?.available!==false} availabilityPending={availabilityPending} onProfile={()=>setView("profile")} onAvailability={async()=>{if(availabilityPending)return;setAvailabilityPending(true);try{await auth.setAvailability(auth.profile?.available===false);void refresh();}catch(e){setActionError(e.message);}finally{setAvailabilityPending(false);}}} orders={orders} loading={loading} refreshing={refreshing} lastSync={lastSync} error={actionError||loadError} notice={notice} selectedId={selectedId} onSelect={setSelectedId} filter={filter} onFilter={setFilter} onRefresh={()=>void refresh()} onSignout={signout} pendingId={pendingId} onClaim={order=>void run(order,'claim',{})} onComplete={(order,cashCollected)=>void run(order,'complete',{cashCollected})} sharingId={sharingId} onShare={share} onStop={stop} points={points}/>;
}

