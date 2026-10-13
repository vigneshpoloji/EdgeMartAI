import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthClient} from './auth.client.js';
for(const provider of ['google','github'])test(provider+' accepts only its own Spring OAuth start route',async()=>{
 for(const destination of ['http://localhost:8080/oauth2/authorization/'+provider,'http://localhost:8080/evil','http://localhost:8080/oauth2/authorization/'+provider+'?redirect=https://evil.test']){
  const client=createAuthClient({baseUrl:'http://localhost:8080',origin:'http://localhost:5173',fetcher:async url=>({ok:true,json:async()=>url.endsWith('/session')?{user:null,csrfToken:'csrf'}:{url:destination}})});
  if(destination.endsWith('/'+provider))assert.equal(await client.oauth(provider,'/?department=books'),destination);else await assert.rejects(client.oauth(provider,'/?department=books'),{code:'SERVICE_UNAVAILABLE'});
 }
});
for(const mode of ['signup','link'])test(`OAuth ${mode} is sent explicitly without exposing credentials`,async()=>{
 const bodies=[];
 const client=createAuthClient({baseUrl:'http://localhost:8081',origin:'http://localhost:5173',fetcher:async(url,options)=>{
  if(url.endsWith('/session'))return {ok:true,json:async()=>({user:null,csrfToken:'csrf'})};
  bodies.push(JSON.parse(options.body));return {ok:true,json:async()=>({url:'http://localhost:8081/oauth2/authorization/google'})};
 }});
 await client.oauth('google','/?department=books',mode);
 assert.deepEqual(bodies,[{provider:'google',mode,returnTo:'http://localhost:5173/?department=books'}]);
});
