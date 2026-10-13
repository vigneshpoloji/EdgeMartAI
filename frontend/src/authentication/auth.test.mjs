import test from 'node:test';
import assert from 'node:assert/strict';
import {createAuthClient} from './auth.client.js';
import {safeReturnTo,passwordChecks,authMessage,oauthFailureMessage} from './auth.utils.js';
const origin='https://shop.example.test';
const response=(body,status=200)=>({ok:status>=200&&status<300,status,json:async()=>body});
test('return destinations accept only known same-origin dashboards',()=>{assert.equal(safeReturnTo('/?department=books',origin),'/?department=books');for(const value of ['https://evil.test/?department=books','//evil.test/?department=books','javascript:alert(1)','/?department=admin','/arbitrary','/?department=books&auth=signup&next=https://evil.test'])assert.equal(safeReturnTo(value,origin),value.startsWith('/?department=books&')?'/?department=books':'/landing.html');});
test('unconfigured authentication cannot fabricate a session',async()=>{let calls=0;const client=createAuthClient({origin,fetcher:()=>{calls++;}});await assert.rejects(client.login({}),{code:'NOT_CONFIGURED'});assert.equal(calls,0);});
test('unsafe API configurations remain disabled',()=>{for(const baseUrl of ['http://remote.example','javascript:alert(1)','https://user:pass@api.example','https://api.example?token=1'])assert.equal(createAuthClient({baseUrl,origin}).configured,false);assert.equal(createAuthClient({baseUrl:'/api',origin}).configured,true);});
test('session payload rejects malformed account identities',async()=>{for(const user of [{id:'',email:'a@test'},{email:'a@test'},{id:'1',email:1},undefined]){const client=createAuthClient({baseUrl:'/api',origin,fetcher:async()=>response({user,csrfToken:'token'})});await assert.rejects(client.session(),{code:'SERVICE_UNAVAILABLE'});}});
test('session requires a CSRF token before mutations',async()=>{let calls=0;const client=createAuthClient({baseUrl:'/api',origin,fetcher:async()=>{calls++;return response({user:null});}});await assert.rejects(client.signup({}),{code:'SERVICE_UNAVAILABLE'});assert.equal(calls,1);});
test('login uses server session bootstrap, HttpOnly-compatible cookies and CSRF',async()=>{const calls=[];const client=createAuthClient({baseUrl:'/api',origin,fetcher:async(url,options)=>{calls.push({url,options});return response(url.endsWith('/session')?{user:null,csrfToken:'server-csrf'}:{ok:true});}});await client.login({email:'fictional@example.test',password:'Test!2026',remember:false});assert.equal(calls.length,2);assert.equal(calls[1].options.headers['X-CSRF-Token'],'server-csrf');assert.equal(calls[1].options.credentials,'include');assert.equal(calls[1].options.cache,'no-store');assert.equal(calls[1].options.method,'POST');assert.ok(!calls[1].url.includes('Test!2026'));assert.equal(JSON.parse(calls[1].options.body).remember,false);});
test('logout clears the in-memory CSRF token and next login rechecks the session',async()=>{const calls=[];const client=createAuthClient({baseUrl:'/api',origin,fetcher:async(url)=>{calls.push(url);return response(url.endsWith('/session')?{user:null,csrfToken:'token'}:{ok:true});}});await client.logout();await client.login({});assert.equal(calls.filter(url=>url.endsWith('/session')).length,2);});

for (const code of ['CSRF_EXPIRED', 'ACCESS_DENIED']) {
  test(`sign-in recovers once from ${code} after a server session expires`, async () => {
    const calls = [];
    let sessions = 0;
    const credentials = {email: 'buyer@example.test', password: 'Example!2026'};
    const client = createAuthClient({baseUrl: '/api', origin, fetcher: async (url, options) => {
      calls.push({url, options});
      if (url.endsWith('/session')) return response({user: null, csrfToken: ++sessions === 1 ? 'expired-token' : 'fresh-token'});
      if (options.headers['X-CSRF-Token'] === 'expired-token') return response({code}, 403);
      return response({user: {id: 'buyer-1', email: credentials.email}});
    }});
    await client.session();
    assert.equal((await client.login(credentials)).user.id, 'buyer-1');
    assert.equal(sessions, 2);
    assert.deepEqual(calls.filter(call => call.url.endsWith('/login')).map(call => call.options.headers['X-CSRF-Token']), ['expired-token', 'fresh-token']);
    for (const call of calls.filter(call => call.url.endsWith('/login'))) {
      assert.deepEqual(JSON.parse(call.options.body), credentials);
      assert.equal(call.options.credentials, 'include');
    }
  });
}

test('a repeated CSRF rejection stops after one retry and shows a useful message', async () => {
  let attempts = 0;
  const client = createAuthClient({baseUrl: '/api', origin, fetcher: async url => {
    if (url.endsWith('/session')) return response({user: null, csrfToken: 'token'});
    attempts++;
    return response({code: 'CSRF_EXPIRED'}, 403);
  }});
  await assert.rejects(client.login({}), {code: 'CSRF_EXPIRED'});
  assert.equal(attempts, 2);
  assert.match(authMessage({code: 'CSRF_EXPIRED'}), /Refresh the page/);
});

test('invalid credentials, permissions and ambiguous failures never replay a mutation', async () => {
  for (const [code, status] of [['INVALID_CREDENTIALS', 401], ['FORBIDDEN', 403], ['SERVICE_UNAVAILABLE', 503], ['ACCESS_DENIED', 500]]) {
    let attempts = 0;
    const client = createAuthClient({baseUrl: '/api', origin, fetcher: async url => {
      if (url.endsWith('/session')) return response({user: null, csrfToken: 'token'});
      attempts++;
      return response({code}, status);
    }});
    await assert.rejects(client.login({}), {code});
    assert.equal(attempts, 1);
  }
});

test('seller profile mutations recover the session token before retrying', async () => {
  let sessions = 0;
  const calls = [];
  const client = createAuthClient({baseUrl: '/api', origin, fetcher: async (url, options) => {
    if (url.endsWith('/session')) return response({user: null, csrfToken: ++sessions === 1 ? 'old' : 'new'});
    calls.push(options);
    return options.headers['X-CSRF-Token'] === 'old' ? response({code: 'CSRF_EXPIRED'}, 403) : response({seller: {id: 'seller-1'}});
  }});
  const body = {store: 'Test store'};
  assert.equal((await client.api('/api/seller/profile', {method: 'POST', body})).seller.id, 'seller-1');
  assert.equal(sessions, 2);
  assert.equal(calls.length, 2);
  assert.deepEqual(JSON.parse(calls[1].body), body);
});
test('OAuth return path is sanitized and only trusted HTTPS destinations are accepted',async()=>{let body;const client=createAuthClient({baseUrl:'/api',origin,fetcher:async(url,options)=>{if(url.endsWith('/session'))return response({user:null,csrfToken:'token'});body=JSON.parse(options.body);return response({url:'https://accounts.google.com/o/oauth2/v2/auth?state=test'});}});assert.match(await client.oauth('google','https://evil.test'),/^https:\/\/accounts.google.com/);assert.equal(body.returnTo,origin+'/landing.html');await assert.rejects(client.oauth('unknown','/'),{code:'SERVICE_UNAVAILABLE'});});
test('OAuth rejects unknown origins, insecure URLs and URLs containing credentials',async()=>{for(const url of ['https://evil.test','http://accounts.google.com','https://user:pass@accounts.google.com/']){const client=createAuthClient({baseUrl:'/api',origin,fetcher:async(path)=>response(path.endsWith('/session')?{user:null,csrfToken:'token'}:{url})});await assert.rejects(client.oauth('google','/'),{code:'SERVICE_UNAVAILABLE'});}});
test('Cognito OAuth origin may be explicitly configured',async()=>{const hosted='https://test.auth.ap-south-1.amazoncognito.com';const client=createAuthClient({baseUrl:'/api',origin,oauthOrigins:[hosted],fetcher:async(path)=>response(path.endsWith('/session')?{user:null,csrfToken:'token'}:{url:hosted+'/oauth2/authorize'})});assert.equal(await client.oauth('google','/'),hosted+'/oauth2/authorize');});
test('signup uses the session cookie and CSRF without a verification step',async()=>{const calls=[];const user={id:'account-1',email:'a@example.test',name:'Buyer',role:'buyer'};const client=createAuthClient({baseUrl:'/api',origin,fetcher:async(url,options)=>{calls.push({url,options});return response(url.endsWith('/session')?{user,csrfToken:'token'}:{user});}});await client.signup({email:user.email,password:'Example!2026'});assert.equal(calls[1].url,origin+'/api/auth/signup');assert.equal(calls[1].options.headers['X-CSRF-Token'],'token');assert.deepEqual(await client.session(),user);});
test('rate limits and network failures produce safe error messages',async()=>{const limited=createAuthClient({baseUrl:'/api',origin,fetcher:async()=>response({message:'private backend details'},429)});await assert.rejects(limited.session(),{code:'RATE_LIMITED'});const offline=createAuthClient({baseUrl:'/api',origin,fetcher:async()=>{throw new Error('private backend details');}});await assert.rejects(offline.session(),{code:'NETWORK_ERROR'});assert.ok(!authMessage(new Error('private backend details')).includes('private'));});
test('password requirements accept strong passwords and reject missing classes',()=>{assert.ok(passwordChecks('Example!2026').every(rule=>rule.passed));for(const value of ['short','lowercase1!','UPPERCASE1!','NoNumbers!!','NoSymbols2026'])assert.ok(passwordChecks(value).some(rule=>!rule.passed));});
test('OAuth errors explain account linking and never reflect arbitrary provider error text',()=>{
  assert.match(oauthFailureMessage('account_link_required'),/original method \(Google, GitHub or email\/password\)/);
  assert.match(oauthFailureMessage('account_link_mismatch'),/same email/);
  assert.match(oauthFailureMessage('identity_conflict'),/another EdgeMart account/);
  assert.match(oauthFailureMessage('link_session_expired'),/expired/);
  assert.equal(oauthFailureMessage(null),'');assert.equal(oauthFailureMessage('private-provider-token'),oauthFailureMessage('failed'));assert.ok(!oauthFailureMessage('private-provider-token').includes('private-provider-token'));
});
test('chat gets enough time for the backend retry while other requests keep their shorter timeout',async()=>{
 const original=globalThis.setTimeout,delays=[];globalThis.setTimeout=(callback,delay,...args)=>{delays.push(delay);return original(callback,delay,...args);};
 try{const client=createAuthClient({baseUrl:'/api',origin,fetcher:async url=>response(url.endsWith('/session')?{user:null,csrfToken:'token'}:{text:'Answer',source:'gemini'})});
 await client.api('/api/assistant/chat',{method:'POST',timeoutMs:30000,body:{message:'hello'}});await client.api('/api/catalogue');assert.deepEqual(delays,[12000,30000,12000]);
 }finally{globalThis.setTimeout=original;}
});
