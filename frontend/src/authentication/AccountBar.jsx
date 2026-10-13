import React from 'react';
import {Store} from 'lucide-react';
import {useAuth} from './AuthProvider';
import {useCheckout} from '../checkout/CheckoutProvider';
import {SELLER_DEPARTMENTS} from '../sellers/departments.js';
import ProfileMenu from './ProfileMenu';
import './authentication.css';
export default function AccountBar(){const auth=useAuth(),checkout=useCheckout(),department=new URLSearchParams(window.location.search).get('department')||'books';return <div data-department={department} className="em-account-bar"><a className="em-account-brand" href="/landing.html"><img src="/logo.svg" width="25" height="25" alt=""/><b>EdgeMart</b></a><div><label className="em-account-department"><span className="sr-only">Switch shopping department</span><select aria-label="Switch shopping department" value={department} onChange={e=>window.location.assign(`/?department=${e.target.value}`)}>{SELLER_DEPARTMENTS.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><a className="em-account-studio" href={`/?seller=dashboard&department=${department}`}><Store size={13}/>Seller Studio</a><button onClick={()=>checkout.setHistoryOpen(true)}>My orders</button><ProfileMenu user={auth.user} onLogout={auth.logout} providers={auth.capabilities.providers} onConnect={async provider=>window.location.assign(await auth.oauth(provider,`/?department=${department}`,'link'))}/></div></div>;}
