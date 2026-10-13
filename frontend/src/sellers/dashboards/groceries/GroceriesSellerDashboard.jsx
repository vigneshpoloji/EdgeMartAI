import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './groceries-seller.css';

function GroceriesSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE PANTRY SUPPLY ROOM",title:"Keep the everyday well stocked.",description:"A practical view of staples, batch numbers, ingredients and shelf life."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all');const selected=filter==='refill'?products.filter(p=>p.stock<=5):filter==='expiry'?products.filter(p=>expiresSoon(p,30)):products;return <><StudioHero {...hero}/><div className="studio-split"><aside className="studio-note"><span className="em-seller-eyebrow">THE REPLENISHMENT LIST</span><h2>{products.filter(p=>p.stock<=5).length} shelves to refill</h2><p>Keep popular staples available. Edit a listing to update pack size, stock and ingredient information.</p><StudioMetric label="Total selling units" value={products.reduce((s,p)=>s+p.stock,0)} detail="Across all pantry listings"/></aside><div><DepartmentTabs label="Pantry checks" values={[['all','All pantry items'],['refill','Restock shelves'],['expiry','Best-before checks']]} value={filter} onChange={setFilter}/><OperationsList title="The stockroom ledger" products={selected} {...tools} fields={[['brand','Brand'],['batch','Batch'],['expiry','Best before']]}/></div></div></>
}

export default function GroceriesSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={GroceriesSellerDashboardOverview}/>;
}
