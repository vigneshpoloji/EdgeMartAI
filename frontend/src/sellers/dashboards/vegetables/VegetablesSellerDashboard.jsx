import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './vegetables-seller.css';

function VegetablesSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE GROWER’S DESK",title:"A market that grows with you.",description:"Bring harvest records, farm origins and storage instructions into your daily market."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all'); const selected=filter==='missing'?products.filter(p=>!p.details?.origin||!p.details?.harvest):filter==='stock'?products.filter(p=>p.stock<=5):products;return <><StudioHero {...hero}/><div className="studio-metrics"><StudioMetric label="Market produce" value={products.length} detail="Your vegetable collection"/><StudioMetric label="Harvest records" value={products.filter(p=>p.details?.harvest).length} detail="Listings with a harvest date"/><StudioMetric label="Low stock" value={products.filter(p=>p.stock<=5).length} detail="Five or fewer selling units"/></div><DepartmentTabs label="Farm record filters" values={[['all','Market ledger'],['missing','Complete farm details'],['stock','Restock']]} value={filter} onChange={setFilter}/><OperationsList title="From farm to market" products={selected} {...tools} fields={[['origin','Farm'],['harvest','Harvest date'],['storage','Storage']]}/></>
}

export default function VegetablesSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={VegetablesSellerDashboardOverview}/>;
}
