import test from 'node:test';
import assert from 'node:assert/strict';
import {registerSeller,signInSeller} from './seller.access.js';

test('new email seller signup creates an account while signed-in social users complete their own store',async()=>{
 const values={email:'new@example.test',store:'New Store',password:'Example!2026'};let saved;
 const account=await registerSeller({user:null,signup:async body=>{saved=body;return{id:'new'};}},()=>{throw Error('Anonymous profile creation');},values);
 assert.equal(account.id,'new');assert.deepEqual(saved.sellerProfile,values);
 for(const provider of ['google','github']){
  const user={id:provider,email:provider+'@example.test'};
  const result=await registerSeller({user,signup:()=>{throw Error('A signed-in user does not need another account');},logout:()=>{throw Error('Store setup must preserve the session');}},async body=>{saved=body;return{seller:{id:'seller-'+user.id}};},values);
  assert.equal(saved.email,user.email);assert.equal(result.seller.id,'seller-'+user.id);
 }
});

test('seller login refreshes the newly authenticated identity even when the prior account had no store',async()=>{
 for(const id of ['first','second']){
  const user={id,email:id+'@example.test'};const events=[];
  assert.equal(await signInSeller({user:null,login:async credentials=>{events.push('login');assert.equal(credentials.email,user.email);return user;}},async refreshed=>{events.push('refresh');assert.equal(refreshed,user);},{email:user.email,password:'Example!2026'}),user);
  assert.deepEqual(events,['login','refresh']);
 }
});

test('failed login never refreshes another seller workspace',async()=>{
 await assert.rejects(signInSeller({login:async()=>{throw Error('Invalid credentials');}},()=>{throw Error('Unexpected refresh');},{}),/Invalid credentials/);
});
