import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';

const originalWindow=globalThis.window,originalFixture=globalThis.__sellerAccessFixture;
globalThis.window={location:{search:'',origin:'http://localhost:5173'}};
globalThis.__sellerAccessFixture={auth:{user:null,capabilities:{providers:['google','github']}},repo:{seller:null,loading:false,error:'',liveBackend:true,previewEnabled:false}};
const server=await createServer({configFile:false,cacheDir:'.seller-access-render-cache',server:{middlewareMode:true},appType:'custom',plugins:[{
 name:'seller-access-fixtures',enforce:'pre',load(id){const path=id.replaceAll('\\','/');
  if(path.endsWith('/authentication/AuthProvider.jsx'))return 'export function useAuth(){return globalThis.__sellerAccessFixture.auth;}';
  if(path.endsWith('/sellers/SellerProvider.jsx'))return 'export function useSeller(){return globalThis.__sellerAccessFixture.repo;}';
 }
}]});
try{
 const{default:Portal}=await server.ssrLoadModule('/src/sellers/SellerPortal.jsx');
 for(const provider of ['google','github']){
  globalThis.__sellerAccessFixture.auth.user={id:provider,name:'New '+provider+' seller',email:provider+'@example.test'};
  const html=renderToStaticMarkup(React.createElement(Portal,{mode:'login',department:'books',navigate:()=>{}}));
  assert.match(html,/Finish your store setup/);assert.match(html,/Save store and open dashboard/);
  assert.match(html,/name="email"[^>]*readonly/i);assert.ok(!html.includes('type="password"'));assert.ok(!html.includes('em-seller-social-options'));
  console.log('PASS '+provider+': signed-in new account reaches its own store setup');
 }
 globalThis.__sellerAccessFixture.auth.user=null;
 for(const mode of ['login','signup']){
  const html=renderToStaticMarkup(React.createElement(Portal,{mode,department:'books',navigate:()=>{}}));
  assert.match(html,/type="password"/);assert.match(html,/Google/);assert.match(html,/GitHub/);assert.ok(!html.includes('Microsoft'));
  assert.match(html,mode==='signup'?/Create seller account/:/If you signed up with Google or GitHub/);
  console.log('PASS anonymous '+mode+': email and social methods are clearly available');
 }
}finally{
 await server.close();
 if(originalWindow===undefined)delete globalThis.window;else globalThis.window=originalWindow;
 if(originalFixture===undefined)delete globalThis.__sellerAccessFixture;else globalThis.__sellerAccessFixture=originalFixture;
}
