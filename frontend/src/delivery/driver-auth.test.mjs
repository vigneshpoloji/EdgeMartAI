import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthClient} from '../authentication/auth.client.js';
test('delivery authentication uses its own session and mutation endpoints with CSRF',async()=>{
  const calls=[];const client=createAuthClient({baseUrl:'https://api.example.test',origin:'https://shop.example.test',authPrefix:'/auth/driver',fetcher:async(url,options)=>{calls.push({path:new URL(url).pathname,options});return {ok:true,status:200,json:async()=>({user:null,csrfToken:'delivery-csrf'})};}});
  await client.login({email:'driver@example.test',password:'hidden'});await client.signup({name:'New Driver',email:'new@example.test',password:'hidden',phone:'9876543210',city:'Chennai',vehicle:'bicycle'});await client.logout();
  assert.deepEqual(calls.map(c=>c.path),['/auth/driver/session','/auth/driver/login','/auth/driver/signup','/auth/driver/logout']);
  for(const call of calls.slice(1))assert.equal(call.options.headers['X-CSRF-Token'],'delivery-csrf');
  assert.throws(()=>createAuthClient({authPrefix:'https://untrusted.test'}));
});
