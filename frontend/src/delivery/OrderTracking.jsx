import React,{useEffect,useState,useRef} from 'react';
import {backend} from '../integrations/api.client';
import DeliveryLocationForm from './DeliveryLocationForm';
import './delivery.css';
const labels={confirmed:'Order confirmed',preparing:'Preparing your order',ready:'Ready for pickup',out_for_delivery:'On the way',delivered:'Delivered',cancelled:'Cancelled'};
export default function OrderTracking({id}){
  const [data,setData]=useState(null),[error,setError]=useState('');
  const revision=useRef(0);
  useEffect(()=>{
    let live=true,running=false;
    setData(null);setError('');
    const refresh=async()=>{
      if(running)return;
      running=true;
      const current=revision.current;
      try {
        const value=await backend.api(`/api/orders/${encodeURIComponent(id)}/tracking`);
        if(live&&current===revision.current){setData(value);setError('');}
      } catch(e) {if(live&&current===revision.current)setError(e.message);} finally {running=false;}
    };
    void refresh();
    const timer=setInterval(refresh,5000);
    return()=>{live=false;clearInterval(timer);};
  },[id]);
  const saved=order=>{revision.current++;setData(old=>({...old,order}));setError('');};
  const loc=data?.location,map=loc?`https://www.openstreetmap.org/export/embed.html?bbox=${loc.lng-.008},${loc.lat-.008},${loc.lng+.008},${loc.lat+.008}&layer=mapnik&marker=${loc.lat},${loc.lng}`:null;
  return <section className="em-tracking">
    <h3>{labels[data?.order.status]||'Loading delivery updates…'}</h3>
    <p><strong>Order ID:</strong> {id}</p>
    {error&&<p role="alert">{error}</p>}
    {data?.order&&<DeliveryLocationForm key={id} order={data.order} onSaved={saved}/>}
    {data?.order.location&&['confirmed','preparing','ready'].includes(data.order.status)&&<p role="status">Delivery location saved. {data.order.status==='ready'?'Waiting for a delivery partner to accept pickup.':'Waiting for the seller to prepare this order and mark it ready for pickup.'}</p>}
    <p>{data?.driver?`Delivery partner: ${data.driver.name}`:'A delivery partner will appear after pickup is assigned.'}</p>
    {loc?<>
      <small>{loc.stale?'Location update is delayed.':'Location received from the driver’s device.'} Last update: {new Date(loc.recordedAt).toLocaleTimeString('en-IN')} · GPS accuracy ±{Math.round(loc.accuracy)} m</small>
      <iframe title="Delivery partner location" src={map} loading="lazy" referrerPolicy="no-referrer"/>
      <a href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=16/${loc.lat}/${loc.lng}`} target="_blank" rel="noreferrer">Open map · © OpenStreetMap contributors</a>
    </>:<p>{data?.order.status==='delivered'?'Delivery is complete. Location sharing has stopped.':data?.driver?'Waiting for the assigned driver to share live location.':'Live driver location will appear after pickup is assigned.'}</p>}
    <ol>{data?.events.map((event,index)=><li key={index}>{labels[event.status]}<small>{new Date(event.created_at).toLocaleString('en-IN')}</small></li>)}</ol>
    <small>Updates every 5 seconds. The map displays actual device updates; travel time is not guaranteed.</small>
  </section>;
}
