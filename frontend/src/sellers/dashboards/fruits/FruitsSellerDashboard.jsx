import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './fruits-seller.css';

function FruitsSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE HARVEST HOUSE",title:"Good mornings begin at the orchard.",description:"Track the harvest, ripeness and shelf life of your fresh fruit collection."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all'); const batches=products.filter(p=>p.details?.harvest); const selected=filter==='harvest'?batches:filter==='soon'?products.filter(p=>expiresSoon(p,3)):products;return <><StudioHero {...hero}/><div className="studio-split"><aside className="studio-note"><span className="em-seller-eyebrow">TODAY'S HARVEST</span><h2>{batches.length} documented batches</h2><p>Record orchard origin and harvest dates so buyers know more about their fruit.</p><StudioMetric label="Ready to buy" value={products.filter(p=>p.status==='active'&&p.stock>0).length} detail="Active, stocked fruit listings"/></aside><div><DepartmentTabs label="Harvest filter" values={[['all','All fruit'],['harvest','Dated harvests'],['soon','Best before in 3 days']]} value={filter} onChange={setFilter}/><OperationsList title="Orchard batch journal" products={selected} {...tools} fields={[['origin','Orchard'],['harvest','Harvested'],['ripeness','Ripeness']]}/></div></div></>
}

export default function FruitsSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={FruitsSellerDashboardOverview}/>;
}
