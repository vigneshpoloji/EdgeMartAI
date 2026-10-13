import {validateLocation} from './location.model.js';

export const DRIVER_VIEWS = [
  ['all','All deliveries'],['ready','Pickup queue'],['out_for_delivery','On the road'],['delivered','Completed']
];
export const driverStatus = status => ({ready:'Ready for pickup',out_for_delivery:'Out for delivery',delivered:'Delivered'}[status]||status?.replaceAll('_',' ')||'Awaiting update');
export const driverMoney = paise => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format((paise||0)/100);
export function indianDate(value, withTime=false) {
  if(!value)return 'Not specified';
  const date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(value)?`${value}T12:00:00+05:30`:value);
  if(Number.isNaN(date.getTime()))return 'Not specified';
  return new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',day:'numeric',month:'short',year:'numeric',...(withTime?{hour:'numeric',minute:'2-digit'}:{})}).format(date);
}
export function mapUrls(point) {
  if(validateLocation(point))return null;
  const query=new URLSearchParams({bbox:[Math.max(-180,point.lng-.012),Math.max(-90,point.lat-.009),Math.min(180,point.lng+.012),Math.min(90,point.lat+.009)].join(','),layer:'mapnik',marker:`${point.lat},${point.lng}`});
  return {embed:`https://www.openstreetmap.org/export/embed.html?${query}`,open:`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=16/${point.lat}/${point.lng}`};
}
export function driverStats(orders) {
  return {ready:orders.filter(o=>o.status==='ready').length,active:orders.filter(o=>o.status==='out_for_delivery').length,completed:orders.filter(o=>o.status==='delivered').length,
    cashDue:orders.filter(o=>o.status==='out_for_delivery').reduce((sum,o)=>sum+(o.amount?.total||0),0)};
}
export function mergeDriverOrder(orders,order) {
  if(!order?.id||!['ready','out_for_delivery','delivered'].includes(order.status))throw new Error('Refresh your deliveries to confirm the order status.');
  return orders.some(o=>o.id===order.id)?orders.map(o=>o.id===order.id?{...o,...order}:o):[order,...orders];
}
export const completedAt = order => order.events?.findLast(event=>event.status==='delivered')?.created_at;
