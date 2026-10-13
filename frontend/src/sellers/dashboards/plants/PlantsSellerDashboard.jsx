import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './plants-seller.css';

function PlantsSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE NURSERY FIELD NOTES",title:"Room for a little more growth.",description:"Care for your collection with light, watering, pot and pet-safety information."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all');const selected=filter==='care'?products.filter(p=>!p.details?.light||!p.details?.water):filter==='pets'?products.filter(p=>p.details?.petSafe==='Yes'):products;return <><StudioHero {...hero}/><div className="studio-split"><aside className="studio-note"><span className="em-seller-eyebrow">THE CARE CHECKLIST</span><h2>{products.filter(p=>!p.details?.light||!p.details?.water).length} care notes to finish</h2><p>Tell buyers how to care for each plant. Only mark a plant pet-safe when you have verified its classification.</p><StudioMetric label="Nursery plants" value={products.length} detail="Every listing in your collection"/></aside><div><DepartmentTabs label="Nursery care filters" values={[['all','All plants'],['care','Complete care notes'],['pets','Marked pet-safe']]} value={filter} onChange={setFilter}/><div className="studio-tile-grid">{selected.map(p=><ListingTile key={p.id} product={p} {...tools}><p>{p.details?.botanicalName||'Botanical name not supplied'}<br/>Light: {p.details?.light||'Not supplied'}<br/>Water: {p.details?.water||'Not supplied'}<br/>{p.details?.pot||'Pot details not supplied'}</p></ListingTile>)}</div>{!selected.length&&<p className="studio-empty">Add a plant or change your care filter.</p>}</div></div></>
}

export default function PlantsSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={PlantsSellerDashboardOverview}/>;
}
