import React,{useState} from 'react';
import {MapPin,Navigation} from 'lucide-react';
import {useLocation} from './LocationProvider';
import {parseCoordinates,validateLocation} from './location.model.js';
import './delivery.css';

export function LocationPicker({onChoose,value,label='Delivery location'}) {
  const [error,setError]=useState(''),[pending,setPending]=useState(false),[manual,setManual]=useState(false);
  const [coords,setCoords]=useState({lat:value?.lat??'',lng:value?.lng??''});
  const choose=loc=>{
    try {
      const issue=validateLocation(loc);
      if(issue)throw new Error(issue);
      onChoose(loc);setCoords(loc);setError('');
    } catch(e) {setError(e.message);}
  };
  const locate=()=>{
    if(!navigator.geolocation){setError('Location is unavailable. Enter coordinates instead.');return;}
    setPending(true);
    navigator.geolocation.getCurrentPosition(p=>{
      choose({lat:p.coords.latitude,lng:p.coords.longitude});setPending(false);
    },()=>{
      setError('Location permission was denied or GPS is unavailable. Enter coordinates instead.');setPending(false);
    },{enableHighAccuracy:true,timeout:15000,maximumAge:60000});
  };
  const setManualLocation=()=>{
    try {choose(parseCoordinates(coords));}catch(e){setError(e.message);}
  };
  return <div className="em-location-picker">
    <strong><MapPin size={16}/>{label}</strong>
    {value&&<small>{value.lat.toFixed(5)}, {value.lng.toFixed(5)}</small>}
    <div>
      <button type="button" disabled={pending} onClick={locate}><Navigation size={14}/>{pending?'Finding location…':'Use my location'}</button>
      <button type="button" onClick={()=>setManual(!manual)}>{manual?'Hide coordinates':'Enter coordinates'}</button>
    </div>
    {manual&&<div className="em-coordinate-fields">
      <label>Latitude<input type="number" min="-90" max="90" step="any" value={coords.lat} onChange={e=>setCoords({...coords,lat:e.target.value})}/></label>
      <label>Longitude<input type="number" min="-180" max="180" step="any" value={coords.lng} onChange={e=>setCoords({...coords,lng:e.target.value})}/></label>
      <button type="button" onClick={setManualLocation}>Set location</button>
    </div>}
    {error&&<p role="alert">{error}</p>}
  </div>;
}

export default function NearbyDelivery({department}){
  const {location,choose}=useLocation();
  return <section className="em-nearby"><div><span className="em-delivery-eyebrow">YOUR NEIGHBOURHOOD, DELIVERED</span><h2>{department==='food'?'Fresh from nearby kitchens.':'Fresh picks, closer to you.'}</h2><p>Browse stores within 5 km. Availability is checked again when you confirm your order.</p></div><LocationPicker onChoose={choose} value={location}/></section>;
}
