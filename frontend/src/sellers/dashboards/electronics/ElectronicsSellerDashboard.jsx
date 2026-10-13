import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './electronics-seller.css';

function ElectronicsSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE DEVICE WORKBENCH",title:"Your technology. In focus.",description:"Keep model numbers, connectivity and warranty details ready for every customer."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all'); const missing=products.filter(p=>!p.details?.model || !p.details?.warranty); const selected=filter==='missing'?missing:filter==='low'?products.filter(p=>p.stock<=5):products; return <><StudioHero {...hero}/><div className="studio-metrics"><StudioMetric label="Devices & accessories" value={products.length} detail="Your entire technology range"/><StudioMetric label="Specifications to complete" value={missing.length} detail="Model or warranty information missing"/><StudioMetric label="Inventory value" value={sellerMoney(products.reduce((s,p)=>s+p.stock*p.unitPaise,0))} detail="Listed units × selling price"/></div><DepartmentTabs label="Device checks" values={[['all','All devices'],['missing','Complete specifications'],['low','Replenish stock']]} value={filter} onChange={setFilter}/><OperationsList title="Specification workbench" products={selected} {...tools} fields={[['model','Model'],['warranty','Warranty'],['connectivity','Connection']]}/></>
}

export default function ElectronicsSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={ElectronicsSellerDashboardOverview}/>;
}
