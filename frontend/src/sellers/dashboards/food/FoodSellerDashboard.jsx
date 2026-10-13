import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './food-seller.css';

function FoodSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE CHEF’S SERVICE BOARD",title:"Your kitchen. On the menu.",description:"Manage dishes, preparation times, portions and allergen information before service."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all');const selected=filter==='veg'?products.filter(p=>p.details?.diet==='Vegetarian'):filter==='allergens'?products.filter(p=>!p.details?.allergens):filter==='paused'?products.filter(p=>p.status==='paused'):products;return <><StudioHero {...hero}/><div className="studio-metrics"><StudioMetric label="On the menu" value={products.filter(p=>p.status==='active'&&p.stock>0).length} detail="Active dishes available to buyers"/><StudioMetric label="Allergen details to add" value={products.filter(p=>!p.details?.allergens).length} detail="Keep ingredient information clear"/><StudioMetric label="Off the menu" value={products.filter(p=>p.status!=='active').length} detail="Draft and paused dishes"/></div><DepartmentTabs label="Kitchen menu filters" values={[['all','Full menu'],['veg','Vegetarian'],['allergens','Add allergens'],['paused','Paused dishes']]} value={filter} onChange={setFilter}/><OperationsList title="Tonight’s service board" products={selected} {...tools} fields={[['prepTime','Prep time (min)'],['diet','Diet'],['allergens','Allergens']]}/></>
}

export default function FoodSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={FoodSellerDashboardOverview}/>;
}
