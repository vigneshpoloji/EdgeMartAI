import React from 'react';
import { Plus, ArrowUpRight, Pencil } from 'lucide-react';
import { DepartmentPhoto } from '../../components/DepartmentPhoto';
import ProductImage from '../ProductImage';
import { sellerMoney } from '../departments.js';
import './workspace-parts.css';
export function StudioHero({ department, eyebrow, title, description, create }) {
  return <section className="seller-studio-hero"><div><span className="em-seller-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p><button className="em-seller-primary" onClick={create}><Plus size={17}/>Add {department.id === 'food' ? 'menu item' : department.id === 'books' ? 'book' : department.id === 'plants' ? 'plant' : 'product'}</button><a href={`/?department=${department.id}`}>Visit storefront <ArrowUpRight size={14}/></a></div><DepartmentPhoto department={department.id} audience="seller" eager/></section>;
}
export function StudioMetric({ label, value, detail }) {
  return <article className="studio-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}
export function ListingTile({ product, department, edit, children }) {
  return <article className="studio-listing-tile"><ProductImage product={product} department={department}/><div><small>{product.status} · {product.stock} available</small><h3>{product.name}</h3><strong>{sellerMoney(product.unitPaise)}</strong>{children}<button onClick={()=>edit(product)}><Pencil size={13}/>Edit details</button></div></article>;
}
export function OperationsList({ title, products, department, edit, fields, empty='No products in this view. Add a listing or try another filter.' }) {
  return <section className="studio-operations"><header><span className="em-seller-eyebrow">YOUR WORKING COLLECTION</span><h2>{title}</h2><span>{products.length} products</span></header>{products.length ? products.map(p=><article key={p.id}><div><strong>{p.name}</strong><small>{p.variant} · {p.stock} units · {p.status}</small></div><dl>{fields.map(([key,label])=><div key={key}><dt>{label}</dt><dd>{key==='rxRequired' ? (p.rxRequired ? 'Prescription required' : 'Not marked as Rx') : p.details?.[key] || 'Not supplied'}</dd></div>)}</dl><button onClick={()=>edit(p)} aria-label={`Edit ${p.name}`}><Pencil size={15}/><span>Edit</span></button></article>) : <p className="studio-empty">{empty}</p>}</section>;
}
export function DepartmentTabs({ values, value, onChange, label }) {
  return <div className="studio-tabs" role="group" aria-label={label}>{values.map(([id,text])=><button key={id} aria-pressed={value===id} onClick={()=>onChange(id)}>{text}</button>)}</div>;
}
export function expiresSoon(product, days=30, now=new Date()) {
  const date = product.details?.expiry;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return false;
  return new Date(`${date}T23:59:59+05:30`).getTime()-now.getTime() <= days*86400000;
}
