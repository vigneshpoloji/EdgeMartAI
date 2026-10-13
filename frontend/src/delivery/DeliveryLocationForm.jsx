import React,{useState} from 'react';
import {backend} from '../integrations/api.client';
import {LocationPicker} from './NearbyDelivery';
import {needsDeliveryLocation,validateLocation} from './location.model.js';

export default function DeliveryLocationForm({order,onSaved}) {
  const [location,setLocation]=useState(null),[pending,setPending]=useState(false),[error,setError]=useState('');
  if(!needsDeliveryLocation(order))return null;
  const save=async event=>{
    event.preventDefault();
    const issue=validateLocation(location);
    if(issue){setError(issue);return;}
    setPending(true);setError('');
    try {
      const result=await backend.api(`/api/orders/${encodeURIComponent(order.id)}/delivery-location`,{method:'POST',body:{location}});
      onSaved(result.order);
    } catch(e) {setError(e.message);} finally {setPending(false);}
  };
  return <form onSubmit={save} className="em-delivery-location-form">
    <h4>Add your delivery location</h4>
    <p>Your driver needs the location of your delivery address before accepting pickup.</p>
    <LocationPicker value={location} onChoose={setLocation}/>
    {error&&<p role="alert">{error}</p>}
    <button type="submit" disabled={pending||Boolean(validateLocation(location))}>{pending?'Saving…':'Save delivery location'}</button>
  </form>;
}
