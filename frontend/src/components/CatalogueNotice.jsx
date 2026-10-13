import React from 'react';
import {Package,Store} from 'lucide-react';
import {sellerDepartment} from '../sellers/departments.js';
import './catalogue-notice.css';
export default function CatalogueNotice({department,location,radius=5}) {
  const dept=sellerDepartment(department),nearby=['fruits','food'].includes(department);
  return <section className="em-catalogue-notice" role="status"><Package size={24}/><div><strong>{nearby?location?'No published products nearby yet.':'Choose your delivery location.':`The ${dept.name.toLowerCase()} catalogue is getting ready.`}</strong><p>{nearby?`Stores within ${radius} km appear here after sellers publish active products and save their pickup location.`:'Your department is open. Active seller listings will appear here automatically.'}</p></div><a href={`/?seller=dashboard&department=${department}`}><Store size={15}/>Open Seller Studio</a></section>;
}
