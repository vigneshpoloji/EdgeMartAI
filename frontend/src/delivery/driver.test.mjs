import test from 'node:test';
import assert from 'node:assert/strict';
import {mapUrls,driverStats,mergeDriverOrder,indianDate,completedAt} from './driver.model.js';

test('maps use only real valid coordinates and reject missing or malformed readings',()=>{
  for(const value of [null,{}, {lat:NaN,lng:80}, {lat:13,lng:181}, {lat:'13',lng:80}])assert.equal(mapUrls(value),null);
  const urls=mapUrls({lat:13.0827,lng:80.2707});
  const parsed=new URL(urls.embed);
  assert.equal(parsed.hostname,'www.openstreetmap.org');
  assert.equal(parsed.searchParams.get('marker'),'13.0827,80.2707');
  assert.match(urls.open,/mlat=13\.0827/);
});
test('cash to collect includes only the assigned active orders shown in the queue',()=>{
  const stats=driverStats([{status:'ready'},{status:'out_for_delivery',amount:{total:24800}},{status:'delivered',amount:{total:40000}}]);
  assert.deepEqual(stats,{ready:1,active:1,completed:1,cashDue:24800});
});
test('pickup and delivery API results immediately replace the card without duplicate orders',()=>{
  const orders=[{id:'one',status:'ready',store:{name:'A store'}},{id:'two',status:'ready'}];
  const updated=mergeDriverOrder(orders,{id:'one',status:'out_for_delivery',address:{name:'Buyer'}});
  assert.equal(updated.length,2);assert.equal(updated[0].address.name,'Buyer');assert.equal(updated[0].store.name,'A store');
  const completed=mergeDriverOrder(updated,{id:'one',status:'delivered',paymentStatus:'paid_cash'});
  assert.equal(completed[0].status,'delivered');assert.equal(completed[0].paymentStatus,'paid_cash');
  assert.throws(()=>mergeDriverOrder(orders,{}));
});
test('delivery dates are displayed in India and missing dates never invent an ETA',()=>{
  assert.equal(indianDate(''),'Not specified');assert.equal(indianDate('invalid'),'Not specified');
  assert.match(indianDate('2026-12-31T23:00:00Z'),/1 Jan 2027/);
  assert.match(indianDate('2026-10-20'),/20 Oct 2026/);
  assert.equal(completedAt({events:[{status:'confirmed',created_at:'first'},{status:'delivered',created_at:'last'}]}),'last');
});
