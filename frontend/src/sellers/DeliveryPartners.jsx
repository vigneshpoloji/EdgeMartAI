import React,{useEffect,useState} from 'react';
import {Truck,RefreshCw} from 'lucide-react';
import {backend} from '../integrations/api.client';
import {useSeller} from './SellerProvider';
import '../delivery/delivery-portal.css';
export default function DeliveryPartners(){
  const repo=useSeller(),[drivers,setDrivers]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(false);
  const refresh=async()=>{setLoading(true);try{const result=await backend.api('/api/seller/drivers');setDrivers(result.drivers);setError('');}catch(e){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{if(repo.liveBackend)void refresh();},[repo.seller?.id]);
  return <><div className="em-seller-page-heading"><div><h1>Your delivery partners.</h1><p>Drivers handling your store's deliveries appear here after accepting a pickup.</p></div><button className="em-seller-secondary" disabled={loading||!repo.liveBackend} onClick={refresh}><RefreshCw size={16}/>{loading?'Refreshing…':'Refresh'}</button></div>{error&&<p role="alert" className="em-seller-error">{error}</p>}<section className="em-seller-card"><h2><Truck size={20}/>Your store's partners</h2>{drivers.length?<div className="delivery-partners-grid">{drivers.map(driver=><article key={driver.email}><strong>{driver.name}</strong><p>{driver.email}<br/>{driver.phone}<br/>{driver.city} · {driver.vehicle}</p><span>{driver.available?'Online for pickups':'Offline'}</span></article>)}</div>:<p>{loading?'Loading your delivery partners…':'No driver has accepted your store orders yet. Mark prepared orders ready for pickup to make them available in the delivery dashboard.'}</p>}<a className="em-seller-secondary" href="/delivery/signup">Create a delivery account</a><a className="em-seller-secondary" href="/delivery">Open delivery portal</a></section></>;
}