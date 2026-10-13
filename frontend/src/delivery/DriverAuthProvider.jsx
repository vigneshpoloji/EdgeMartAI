import React,{createContext,useContext,useState,useEffect,useCallback,useRef} from 'react';
import {createAuthClient} from '../authentication/auth.client.js';
import {authMessage} from '../authentication/auth.utils.js';
export const driverClient=createAuthClient({baseUrl:import.meta.env.VITE_AUTH_API_URL||'',origin:window.location.origin,authPrefix:'/auth/driver'});
const Context=createContext(null);
export function DriverAuthProvider({children}){
  const [user,setUser]=useState(null),[profile,setProfile]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
  const revision=useRef(0),channel=useRef(null);
  const refreshSession=useCallback(async()=>{const current=++revision.current;try{const account=await driverClient.session();const details=account?await driverClient.api('/api/driver/profile'):null;if(current===revision.current){setUser(account);setProfile(details?.profile||null);setError('');}return account;}catch(e){if(current===revision.current){setUser(null);setProfile(null);setError(authMessage(e));}throw e;}finally{if(current===revision.current)setLoading(false);}},[]);
  useEffect(()=>{void refreshSession().catch(()=>{});const focus=()=>{if(!document.hidden)void refreshSession().catch(()=>{});};window.addEventListener('focus',focus);const timer=setInterval(focus,60000);if('BroadcastChannel' in window){channel.current=new BroadcastChannel('edgemart-driver-session');channel.current.onmessage=focus;}return()=>{revision.current++;clearInterval(timer);window.removeEventListener('focus',focus);channel.current?.close();};},[refreshSession]);
  const authenticate=async(method,values)=>{const result=await driverClient[method](values);if(method==='signup')return result.user;const account=await refreshSession();channel.current?.postMessage('refresh');return account;};
  const updateProfile=async(values,path='/api/driver/profile')=>{const result=await driverClient.api(path,{method:'POST',body:values});setProfile(result.profile);if(path==='/api/driver/profile')setUser(before=>({...before,name:result.profile.name}));channel.current?.postMessage('refresh');return result.profile;};
  return <Context.Provider value={{user,profile,loading,error,configured:driverClient.configured,refreshSession,login:values=>authenticate('login',values),signup:values=>authenticate('signup',values),updateProfile,setAvailability:available=>updateProfile({available},'/api/driver/availability'),logout:async()=>{await driverClient.logout();revision.current++;setUser(null);setProfile(null);setError('');channel.current?.postMessage('refresh');}}}>{children}</Context.Provider>;
}
export function useDriverAuth(){return useContext(Context);}
