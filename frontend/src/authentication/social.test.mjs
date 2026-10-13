import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthClient} from './auth.client.js';
import {authMessage} from './auth.utils.js';
const origin='https://edgemart.example.test';
const endpoints={google:'https://accounts.google.com/o/oauth2/v2/auth',github:'https://github.com/login/oauth/authorize'};
for(const [provider,url]of Object.entries(endpoints))test(`${provider} OAuth keeps seller destination and uses server CSRF/cookies`,async()=>{
 const calls=[];
 const client=createAuthClient({baseUrl:'/api',origin,fetcher:async(path,options)=>{calls.push({path,options});return {ok:true,status:200,json:async()=>path.endsWith('/session')?{user:null,csrfToken:'server-csrf'}:{url}};}});
 assert.equal(await client.oauth(provider,'/?seller=signup&department=fruits'),url);
 const request=calls.find(c=>c.path.endsWith('/oauth/start'));
 assert.deepEqual(JSON.parse(request.options.body),{provider,returnTo:origin+'/?seller=signup&department=fruits'});
 assert.equal(request.options.headers['X-CSRF-Token'],'server-csrf');
 assert.equal(request.options.credentials,'include');
});
test('social access cannot fabricate a login without a configured API',async()=>{
 let requests=0;
 const client=createAuthClient({origin,fetcher:async()=>{requests++;}});
 for(const provider of Object.keys(endpoints))await assert.rejects(client.oauth(provider,'/?department=fruits'),{code:'NOT_CONFIGURED'});
 assert.equal(requests,0);
 assert.match(authMessage({code:'OAUTH_NOT_CONFIGURED'}),/OAuth configuration/);
});
test('removed Microsoft sign-in cannot start an OAuth request',async()=>{
 let requests=0;const client=createAuthClient({baseUrl:'/api',origin,fetcher:async()=>{requests++;}});
 await assert.rejects(client.oauth('microsoft','/?department=books'),{code:'SERVICE_UNAVAILABLE'});assert.equal(requests,0);
});
