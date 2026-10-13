import React,{useRef,useState} from 'react';
import {CheckCircle2,Clock,MapPin,Package,Phone,Truck,UserRound,CalendarDays,RefreshCw} from 'lucide-react';
import {useSeller} from './SellerProvider';
import {sellerMoney} from './departments.js';
import {indianDate} from '../delivery/driver.model.js';
import './seller-orders.css';

const statuses=[['all','All orders'],['confirmed','Confirmed'],['preparing','Preparing'],['ready','Ready for pickup'],['out_for_delivery','Out for delivery'],['delivered','Delivered'],['cancelled','Cancelled']];
export default function SellerOrders({department,orders}) {
  const repo=useSeller(),busy=useRef('');
  const [filter,setFilter]=useState('all'),[pending,setPending]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const changeStatus=async order=>{
    if(busy.current)return;
    busy.current=order.id;setPending(order.id);setError('');setNotice('');
    try {
      const status=order.status==='confirmed'?'preparing':'ready';
      await repo.orderStatus(order.id,status);
      setNotice(status==='preparing'?'Preparation started. Mark the order ready when it is packed.':'Order ready. Delivery partners can now accept this pickup.');
    } catch(e){setError(e.message);}finally{busy.current='';setPending('');}
  };
  const visible=orders.filter(order=>filter==='all'||order.status===filter);
  return <section className="seller-orders-board">
    <div className="em-seller-page-heading"><div><h1>Your customer orders.</h1><p>Prepare, pack and hand over your {department.name.toLowerCase()} orders here.</p></div><button className="em-seller-secondary" onClick={()=>repo.refresh()}><RefreshCw size={15}/>Refresh orders</button></div>
    <div className="seller-order-flow"><span><Package size={16}/>Order received</span><i>→</i><span><Clock size={16}/>Start preparation</span><i>→</i><span><Truck size={16}/>Ready for pickup</span><i>→</i><span><CheckCircle2 size={16}/>Driver completes delivery</span></div>
    <div className="seller-order-tabs" role="group" aria-label="Filter seller orders">{statuses.filter(([value])=>repo.liveBackend||['all','cancelled'].includes(value)).map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{label}<span>{orders.filter(order=>value==='all'||order.status===value).length}</span></button>)}</div>
    {error&&<p role="alert" className="em-seller-error">{error}</p>}{notice&&<p role="status" className="em-seller-success"><CheckCircle2 size={16}/>{notice}</p>}
    {visible.length?visible.map(order=>{
      const rxReview=order.items.some(item=>item.rxRequired);
      const waitingLocation=repo.liveBackend&&!order.location&&['confirmed','preparing','ready'].includes(order.status);
      return <article className="seller-order-detail" key={order.id}><header><div><span className="seller-order-id">{order.id}</span><small>Ordered {indianDate(order.date,true)}</small></div><span className={`seller-order-status ${order.status}`}>{order.status.replaceAll('_',' ')}</span></header>
        {repo.liveBackend&&<div className="seller-order-customer-grid"><div><strong><UserRound size={15}/>{order.address?.name||'Customer'}</strong><p><MapPin size={14}/><span>{order.address?.street}{order.address?.area&&`, ${order.address.area}`}<br/>{order.address?.city}, {order.address?.state} {order.address?.pin}</span></p>{order.address?.phone&&<a href={`tel:${order.address.phone}`}><Phone size={13}/>{order.address.phone}</a>}</div><div><strong><CalendarDays size={15}/>Preferred delivery</strong><p>{order.preferences?.date?indianDate(order.preferences.date):'Date not specified'}<br/>{order.preferences?.slot||'Any time'} · {order.preferences?.delivery==='express'?'Express':'Standard'}</p><small>{order.paymentStatus==='paid_cash'?'Cash payment recorded':'Cash on delivery'}</small></div></div>}
        {order.address?.instructions&&<p className="seller-order-note"><strong>Delivery instructions:</strong> {order.address.instructions}</p>}
        {order.items.map((item,index)=><div className="em-seller-order-line" key={`${item.id}-${index}`}><span>{item.quantity} × {item.name}<small>{item.variant}</small></span><strong>{sellerMoney(item.unitPaise*item.quantity)}</strong></div>)}
        <footer><div><small>Your items subtotal</small><strong>{sellerMoney(order.subtotal)}</strong></div>{repo.liveBackend&&['confirmed','preparing'].includes(order.status)&&<button className="em-seller-primary" disabled={Boolean(pending)||rxReview||order.status==='preparing'&&waitingLocation} onClick={()=>changeStatus(order)}>{pending===order.id?'Updating…':order.status==='confirmed'?'Start preparation':'Ready for driver pickup'}</button>}{order.status==='ready'&&<span className="seller-order-handoff"><Truck size={16}/>Waiting for driver pickup</span>}{order.status==='out_for_delivery'&&<span className="seller-order-handoff"><Truck size={16}/>With your delivery partner</span>}{order.status==='delivered'&&<span className="seller-order-handoff"><CheckCircle2 size={16}/>Delivery complete</span>}</footer>
        {waitingLocation&&<p className="seller-order-note">The buyer must add a delivery location in My orders before the driver can accept pickup.</p>}{rxReview&&['confirmed','preparing'].includes(order.status)&&<p className="seller-order-note">Prescription fulfilment requires the pharmacist approval workflow before preparation can proceed.</p>}
      </article>;
    }):<div className="em-seller-card em-seller-empty"><Package size={34}/><h3>No orders in this view.</h3><p>Buyer checkout creates orders automatically. Your store's orders appear here.</p></div>}
  </section>;
}
