import React,{createContext,useContext,useState} from 'react';
const Context=createContext(null);
export function LocationProvider({children}) {
  const [location,setLocation]=useState(()=>{try{return JSON.parse(sessionStorage.getItem('em-delivery-location')||'null');}catch{return null;}});
  const choose=value=>{if(!Number.isFinite(value?.lat)||!Number.isFinite(value?.lng)||Math.abs(value.lat)>90||Math.abs(value.lng)>180)throw new Error('Enter valid coordinates.');setLocation(value);try{sessionStorage.setItem('em-delivery-location',JSON.stringify(value));}catch{}};
  return <Context.Provider value={{location,choose}}>{children}</Context.Provider>;
}
export const useLocation=()=>useContext(Context);
export function distanceKm(a,b){const r=n=>n*Math.PI/180,h=Math.sin(r(b.lat-a.lat)/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lng-a.lng)/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));}
