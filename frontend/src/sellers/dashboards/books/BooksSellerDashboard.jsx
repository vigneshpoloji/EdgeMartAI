import React, { useState } from 'react';
import SellerWorkspace from '../../SellerWorkspace';
import { sellerMoney } from '../../departments.js';
import { StudioHero, StudioMetric, OperationsList, ListingTile, DepartmentTabs, expiresSoon } from '../WorkspaceParts';
import './books-seller.css';

function BooksSellerDashboardOverview({ department, products, orders, create, edit }) {
  const hero={department,create,eyebrow:"THE BOOKSELLER’S READING ROOM",title:"A shelf with a point of view.",description:"Give every title an author, ISBN, format and honest condition description."};
  const tools={department,edit};
  const [filter,setFilter]=useState('all');const selected=filter==='isbn'?products.filter(p=>!p.details?.isbn):filter==='used'?products.filter(p=>p.details?.condition?.startsWith('Used')):products;return <><StudioHero {...hero}/><DepartmentTabs label="Bookseller shelf" values={[['all','The entire shelf'],['isbn','Add ISBN information'],['used','Pre-loved books']]} value={filter} onChange={setFilter}/><div className="studio-tile-grid">{selected.map(p=><ListingTile key={p.id} product={p} {...tools}><p>{p.details?.author||'Author not supplied'}<br/>{p.details?.format||p.variant} · {p.details?.condition||'Condition not supplied'}<br/>ISBN {p.details?.isbn||'not supplied'}</p></ListingTile>)}</div>{!selected.length&&<p className="studio-empty">Add a title to begin your bookseller shelf.</p>}<div className="studio-metrics"><StudioMetric label="Titles on your shelf" value={products.length} detail="Your books, across every format"/><StudioMetric label="Authors recorded" value={new Set(products.map(p=>p.details?.author).filter(Boolean)).size} detail="Distinct authors entered"/><StudioMetric label="ISBNs to add" value={products.filter(p=>!p.details?.isbn).length} detail="Help readers identify the edition"/></div></>
}

export default function BooksSellerDashboard(props) {
  return <SellerWorkspace {...props} Overview={BooksSellerDashboardOverview}/>;
}
