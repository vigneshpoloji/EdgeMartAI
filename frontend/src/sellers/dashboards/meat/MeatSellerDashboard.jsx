import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './meat-seller.css';

function MeatSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE BUTCHER & FISHMONGER COUNTER",title:"Every cut. Carefully considered.",description:"Organise your cuts, packing dates and chilled or frozen storage instructions."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all'); const selected=filter==='due'?products.filter(p=>expiresSoon(p,2)):filter==='storage'?products.filter(p=>!p.details?.storage):products;return <><StudioHero {...hero}/><div className="studio-split"><aside className="studio-note"><span className="em-seller-eyebrow">COUNTER CHECK</span><h2>{products.filter(p=>expiresSoon(p,2)).length} use-by checks</h2><p>Review products with a use-by date in the next two days, including overdue dates. Pause listings that are no longer suitable for sale.</p><StudioMetric label="Storage documented" value={products.filter(p=>p.details?.storage).length} detail="Chilled / frozen information entered"/></aside><div><DepartmentTabs label="Counter filters" values={[['all','All cuts'],['due','Use-by checks'],['storage','Add storage details']]} value={filter} onChange={setFilter}/><OperationsList title="Cut & packing register" products={selected} {...tools} fields={[['cut','Cut'],['packed','Packed on'],['storage','Storage'],['expiry','Use by']]}/></div></div></>
}

export default function MeatSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={MeatSellerDashboardOverview}/>;
}
