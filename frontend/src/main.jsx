import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider, useAuth } from './authentication/AuthProvider';
import AuthPage from './authentication/AuthPage';
import AuthLoading from './authentication/AuthLoading';
import AccountBar from './authentication/AccountBar';
import { CheckoutProvider } from './checkout/CheckoutProvider';
import OrderHistory from './checkout/OrderHistory';
import {useSeller} from './sellers/SellerProvider';
import {LocationProvider,useLocation,distanceKm} from './delivery/LocationProvider';
import NearbyDelivery from './delivery/NearbyDelivery';
import {liveBackend} from './integrations/api.client';
const DriverDashboard=lazy(()=>import('./delivery/DeliveryPortal'));
import { SellerProvider } from './sellers/SellerProvider';
import DashboardEffects from './components/DashboardEffects';
import DashboardBoundary from './components/DashboardBoundary';
import CatalogueNotice from './components/CatalogueNotice';
import {marketplaceListings} from './sellers/seller.catalog.js';
import { AUTH_MODES, DEPARTMENT_IDS, safeReturnTo } from './authentication/auth.utils';
import './styles.css';
import './components/photo-dashboard.css';
const SellerPortal = lazy(() => import('./sellers/SellerPortal'));
const dashboards = {
  electronics: lazy(() => import('./pages/electronics/ElectronicsDashboard')),
  fruits: lazy(() => import('./pages/fruits/FruitsDashboard')),
  vegetables: lazy(() => import('./pages/vegetables/VegetablesDashboard')),
  jewellery: lazy(() => import('./pages/jewellery/JewelleryDashboard')),
  meat: lazy(() => import('./pages/meat/MeatDashboard')),
  pharmacy: lazy(() => import('./pages/pharmacy/PharmacyDashboard')),
  groceries: lazy(() => import('./pages/groceries/GroceriesDashboard')),
  books: lazy(() => import('./dashboards/books/BooksDashboard')),
  food: lazy(() => import('./pages/food/FoodDashboard')),
  plants: lazy(() => import('./pages/plants/PlantsDashboard'))
};
function readRoute() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get('auth') || params.get('panel');
  const department = params.get('department');
  return {
    driver: params.get('driver') === '1',
    seller: ['login', 'signup', 'dashboard'].includes(params.get('seller')) ? params.get('seller') : null,
    mode: AUTH_MODES.includes(requested) ? requested : null,
    oauthError: params.get('oauthError'),
    department: DEPARTMENT_IDS.includes(department) ? department : null,
    returnTo: safeReturnTo(params.get('returnTo') || (DEPARTMENT_IDS.includes(department) ? `/?department=${department}` : null), window.location.origin)
  };
}
function App() {
  const auth = useAuth(), catalogue = useSeller(), {location}=useLocation();
  const [route, setRoute] = useState(readRoute);
  useEffect(() => {
    const update = () => setRoute(readRoute());
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);
  useEffect(() => {
    if (route.seller || route.driver) return;
    if (!route.mode && !route.department) window.location.replace('/landing.html');else if (route.mode && !route.oauthError && !auth.loading && auth.canAccessDashboards) window.location.replace(route.returnTo);
  }, [route, auth.loading, auth.canAccessDashboards]);
  const navigate = url => { window.history.pushState({}, '', url); setRoute(readRoute()); window.scrollTo(0,0); };
  if (route.driver) return <Suspense fallback={<AuthLoading/>}><DriverDashboard/></Suspense>;
  if (route.seller) return <Suspense fallback={<AuthLoading dashboard />}><SellerPortal mode={route.seller} department={route.department} navigate={navigate}/></Suspense>;
  if (!route.mode && !route.department) return null;
  if (auth.loading) return <AuthLoading />;
  const name = route.department || new URL(route.returnTo, window.location.origin).searchParams.get('department');
  if (route.mode || !auth.canAccessDashboards) return <AuthPage mode={route.mode || 'login'} returnTo={route.returnTo} departmentName={name} onModeChange={mode => {
    const params = new URLSearchParams({
      auth: mode,
      returnTo: route.returnTo
    });
    window.history.pushState({}, '', `/?${params}`);
    setRoute(readRoute());
  }} />;
  if(liveBackend && catalogue.loading) return <AuthLoading dashboard/>;
  if(liveBackend && catalogue.error) return <main className="em-nearby-empty"><p role="alert">{catalogue.error}</p><button onClick={()=>catalogue.refresh()}>Retry loading products</button></main>;
  const emptyCatalogue=liveBackend && !marketplaceListings(catalogue.products,catalogue.profiles,route.department).some(p=>!['food','fruits'].includes(route.department) || (location && catalogue.profiles.find(s=>s.id===p.sellerId)?.location && distanceKm(location,catalogue.profiles.find(s=>s.id===p.sellerId).location) <= (catalogue.radiusKm||5)));
  const Dashboard = dashboards[route.department];
  return <DashboardEffects key={route.department} department={route.department}><AccountBar /><OrderHistory />{liveBackend && ['food','fruits'].includes(route.department) && <NearbyDelivery department={route.department}/> }<DashboardBoundary key={route.department}>{emptyCatalogue&&<CatalogueNotice department={route.department} location={location} radius={catalogue.radiusKm||5}/>}<Suspense fallback={<AuthLoading dashboard />}><Dashboard onBackToLanding={() => window.location.replace('/landing.html')} /></Suspense></DashboardBoundary></DashboardEffects>;
}
const deliveryRoute=window.location.pathname==='/delivery'||window.location.pathname.startsWith('/delivery/')||new URLSearchParams(window.location.search).get('driver')==='1';
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode>{deliveryRoute?<Suspense fallback={<AuthLoading/>}><DriverDashboard/></Suspense>:<AuthProvider><LocationProvider><SellerProvider><CheckoutProvider><App /></CheckoutProvider></SellerProvider></LocationProvider></AuthProvider>}</React.StrictMode>);

