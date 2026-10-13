import React, { lazy, Suspense, useEffect } from 'react';
import { useSeller } from './SellerProvider';
import {useAuth} from '../authentication/AuthProvider';
import { sellerDepartment, sellerUrl } from './departments.js';
import SellerAuth from './authentication/SellerAuth';
const electronics = lazy(()=>import('./dashboards/electronics/ElectronicsSellerDashboard'));
const fruits = lazy(()=>import('./dashboards/fruits/FruitsSellerDashboard'));
const vegetables = lazy(()=>import('./dashboards/vegetables/VegetablesSellerDashboard'));
const jewellery = lazy(()=>import('./dashboards/jewellery/JewellerySellerDashboard'));
const meat = lazy(()=>import('./dashboards/meat/MeatSellerDashboard'));
const pharmacy = lazy(()=>import('./dashboards/pharmacy/PharmacySellerDashboard'));
const groceries = lazy(()=>import('./dashboards/groceries/GroceriesSellerDashboard'));
const books = lazy(()=>import('./dashboards/books/BooksSellerDashboard'));
const food = lazy(()=>import('./dashboards/food/FoodSellerDashboard'));
const plants = lazy(()=>import('./dashboards/plants/PlantsSellerDashboard'));
const dashboards={electronics,fruits,vegetables,jewellery,meat,pharmacy,groceries,books,food,plants};
import './sellers.css';
import DashboardEffects from '../components/DashboardEffects';
export default function SellerPortal({ mode, department, navigate }) {
  const repo = useSeller(), auth=useAuth(), dept = sellerDepartment(department), Dashboard = dashboards[dept.id];
  useEffect(() => { document.title = `${dept.name} Seller Studio · EdgeMart`; }, [dept.name]);
  useEffect(() => { if (repo.seller && mode !== 'dashboard') navigate(sellerUrl(dept.id)); }, [repo.seller, mode, dept.id]);
  if (repo.loading) return <p className="studio-empty">Loading your store…</p>;
  if (repo.error) return <main className="studio-empty"><p role="alert">{repo.error}</p><button onClick={()=>repo.refresh()}>Retry connection</button></main>;
  if (!repo.seller) return <SellerAuth mode={auth.user || mode === 'signup' ? 'signup' : 'login'} department={dept.id} navigate={navigate}/>;
  return <DashboardEffects key={dept.id} department={dept.id} seller><Suspense fallback={<p className="studio-empty">Opening your seller workspace…</p>}><Dashboard department={dept} navigate={navigate}/></Suspense></DashboardEffects>;
}
