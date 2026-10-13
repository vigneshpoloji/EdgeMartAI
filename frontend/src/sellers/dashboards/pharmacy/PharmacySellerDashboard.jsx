import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './pharmacy-seller.css';

function PharmacySellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE PHARMACY OPERATIONS DESK",title:"Clear details. Better care.",description:"Review batches, expiry dates, cold-chain details and prescription requirements."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all'); const selected=filter==='rx'?products.filter(p=>p.rxRequired):filter==='expiry'?products.filter(p=>expiresSoon(p,30)):filter==='missing'?products.filter(p=>!p.details?.batch||!p.details?.expiry):products;return <><StudioHero {...hero}/><div className="studio-metrics"><StudioMetric label="Prescription products" value={products.filter(p=>p.rxRequired).length} detail="Marked as Rx required"/><StudioMetric label="Expiry review" value={products.filter(p=>expiresSoon(p,30)).length} detail="Expires within 30 days or overdue"/><StudioMetric label="Incomplete batches" value={products.filter(p=>!p.details?.batch||!p.details?.expiry).length} detail="Batch or expiry date missing"/></div><DepartmentTabs label="Pharmacy review" values={[['all','All healthcare'],['rx','Prescription required'],['expiry','Expiry checks'],['missing','Complete batch details']]} value={filter} onChange={setFilter}/><OperationsList title="Batch & prescription register" products={selected} {...tools} fields={[['batch','Batch'],['expiry','Expiry'],['rxRequired','Prescription'],['coldChain','Cold chain']]}/></>
}

export default function PharmacySellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={PharmacySellerDashboardOverview}/>;
}
