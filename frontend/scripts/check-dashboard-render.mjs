import assert from 'node:assert/strict';
import {createServer} from 'vite';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {catalogueProduct} from '../src/sellers/buyer.catalog.js';

// Render the actual department components with empty and minimal live listings.
// Only their data/auth hooks are substituted; no API or database is contacted.
const modules={books:'dashboards/books/BooksDashboard',...Object.fromEntries(['electronics','fruits','vegetables','jewellery','meat','pharmacy','groceries','food','plants'].map(d=>[d,`pages/${d}/${d[0].toUpperCase()+d.slice(1)}Dashboard`]))};
const originals={window:globalThis.window,localStorage:globalThis.localStorage,catalogue:globalThis.__dashboardCatalogue};
globalThis.localStorage={getItem:()=>null,setItem:()=>{}};
globalThis.window={location:{search:'',origin:'http://localhost',href:'http://localhost/'},localStorage:globalThis.localStorage};
globalThis.__dashboardCatalogue={};
const server=await createServer({configFile:false,cacheDir:'.dashboard-render-cache',server:{middlewareMode:true},appType:'custom',plugins:[{
  name:'dashboard-render-fixtures',enforce:'pre',
  load(id){
    const path=id.replaceAll('\\','/');
    if(/\/useBuyerCatalogue\.(jsx?|tsx?)$/.test(path))return 'export default function useBuyerCatalogue(department){return globalThis.__dashboardCatalogue[department]||[];}';
    if(path.endsWith('/authentication/AuthProvider.jsx'))return 'export function useAuth(){return {user:{name:"Catalogue Tester",email:"test@example.com"},canAccessDashboards:true};}';
    if(path.endsWith('/components/CheckoutLifecycle.jsx'))return 'export default function CheckoutLifecycle(){return null;}';
    if(path.endsWith('/checkout/OrderHistory.jsx'))return 'export function OrderHistoryContent(){return null;} export default function OrderHistory(){return null;}';
  }
}]});
let checks=0;
try{
  for(const [department,path] of Object.entries(modules)){
    const {default:Dashboard}=await server.ssrLoadModule(`/src/${path}.jsx`);
    window.location.search=`?department=${department}`;
    for(const populated of [false,true]){
      globalThis.__dashboardCatalogue[department]=populated?[catalogueProduct({id:`render-${department}`,sellerId:'seller-test',department,name:'Minimal live listing',description:'Published by the seller dashboard.',variant:'1 pack',unitPaise:19900,stock:3,status:'active',image:'',details:{}},{store:'Test store'})]:[];
      const html=renderToStaticMarkup(React.createElement(Dashboard,{onBackToLanding:()=>{}}));
      assert.match(html,/<h1[ >]/,`${department} must keep its layout`);
      if(populated)assert.match(html,/Minimal live listing/,`${department} must render the seller listing`);
      console.log(`PASS ${department}: ${populated?'one minimal live product':'empty catalogue'}`);
      checks++;
    }
  }
  console.log(`${checks} dashboard rendering checks passed.`);
}finally{
  await server.close();
  for(const [name,value] of Object.entries({window:originals.window,localStorage:originals.localStorage,__dashboardCatalogue:originals.catalogue})){
    if(value===undefined)delete globalThis[name];else globalThis[name]=value;
  }
}
