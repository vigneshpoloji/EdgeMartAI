import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './jewellery-seller.css';

function JewellerySellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE PRIVATE JEWELLERY ATELIER",title:"The atelier. Your signature.",description:"Curate your pieces with clear material, weight, purity and hallmark information."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all');const selected=filter==='details'?products.filter(p=>!p.details?.purity||!p.details?.certification):products; return <><StudioHero {...hero}/><div className="studio-metrics"><StudioMetric label="Signature pieces" value={products.length} detail="In your atelier"/><StudioMetric label="Purity documented" value={products.filter(p=>p.details?.purity).length} detail="Entered product information"/><StudioMetric label="Collection value" value={sellerMoney(products.reduce((s,p)=>s+p.stock*p.unitPaise,0))} detail="Current selling prices × units"/></div><DepartmentTabs label="Atelier collection" values={[['all','The collection'],['details','Complete hallmark & purity']]} value={filter} onChange={setFilter}/><div className="studio-tile-grid">{selected.map(p=><ListingTile key={p.id} product={p} {...tools}><p>{p.details?.material||'Material not supplied'} · {p.details?.purity||'Purity not supplied'}<br/>{p.details?.weight||'Weight not supplied'}<br/>{p.details?.certification||'Hallmark information not supplied'}</p></ListingTile>)}</div>{!selected.length&&<p className="studio-empty">Your next signature piece belongs here.</p>}</>
}

export default function JewellerySellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={JewellerySellerDashboardOverview}/>;
}
