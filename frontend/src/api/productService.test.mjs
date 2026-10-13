import test from 'node:test';
import assert from 'node:assert/strict';
import {createProductService} from './productService.js';
import {normalizeLiveProducts,PRODUCT_CATEGORIES} from './product.model.js';
import {normalizeLines} from '../checkout/checkout.model.js';
const response=(data,status=200)=>({ok:status>=200&&status<300,status,json:async()=>data});

test('category requests use exact Mongo names, URL encoding and the configured API prefix',async()=>{
 const urls=[];const service=createProductService({baseUrl:'http://localhost:8080/api/',fetcher:async url=>{urls.push(url);return response([]);}});
 for(const category of Object.values(PRODUCT_CATEGORIES))await service.getLiveProductsByCategory(category);
 assert.deepEqual(urls,Object.values(PRODUCT_CATEGORIES).map(category=>`http://localhost:8080/api/products?category=${category}`));
 await service.fetchProducts('Books & Literary');assert.equal(urls.at(-1),'http://localhost:8080/api/products?category=Books%20%26%20Literary');
});
test('offline, server error, non-array and invalid JSON responses fail softly; empty arrays stay empty',async()=>{
 for(const fetcher of [async()=>{throw Error('offline');},async()=>response(null,500),async()=>response({content:[]}),async()=>({ok:true,json:async()=>{throw Error('invalid json');}})]){
  const service=createProductService({fetcher,warn:()=>{}});assert.equal(await service.getLiveProductsByCategory('Books'),null);
 }
 assert.deepEqual(await createProductService({fetcher:async()=>response([])}).getLiveProductsByCategory('Books'),[]);
});
test('slow requests time out and caller cancellation never leaves an unresolved product request',async()=>{
 const fetcher=async(_url,{signal})=>new Promise((_resolve,reject)=>{const fail=()=>reject(new DOMException('Aborted','AbortError'));if(signal.aborted)fail();else signal.addEventListener('abort',fail,{once:true});});
 const service=createProductService({fetcher,timeoutMs:10,warn:()=>{}});assert.equal(await service.getLiveProductsByCategory('Books'),null);
 const controller=new AbortController();controller.abort();assert.equal(await service.getLiveProductsByCategory('Books',{signal:controller.signal}),null);
});
test('existing single-product and create methods preserve their endpoint and JSON body',async()=>{
 const calls=[];const service=createProductService({fetcher:async(url,options)=>{calls.push({url,options});return response(url.endsWith('/auth/session') ? {csrfToken:'test-csrf'} : {id:'test'});}});
 await service.fetchProductById('id/with spaces');await service.createProduct({name:'Book',category:'Books'});
 assert.ok(calls[0].url.endsWith('/products/id%2Fwith%20spaces'));assert.ok(calls[1].url.endsWith('/auth/session'));assert.equal(calls[2].options.method,'POST');assert.equal(calls[2].options.headers['X-CSRF-Token'],'test-csrf');assert.equal(calls[2].options.credentials,'include');assert.deepEqual(JSON.parse(calls[2].options.body),{name:'Book',category:'Books'});
});
test('minimal Spring products adapt to all ten card, configurator and checkout shapes',()=>{
 for(const [department,category]of Object.entries(PRODUCT_CATEGORIES)){
  const [p]=normalizeLiveProducts([{id:`mongo-${department}`,name:`Live ${category}`,category,price:'249.50',stock:3,imageUrl:'https://example.test/product.jpg'}],department);
  assert.equal(p.name,`Live ${category}`);assert.equal(p.title,p.name);assert.equal(p.category,department);assert.equal(p.sourceCategory,category);assert.equal(p.price,249.5);assert.equal(p.stock,3);assert.equal(p.image,'https://example.test/product.jpg');assert.equal(p.packSizes[0].price,p.price);
  assert.ok(Array.isArray(p.sizes));assert.ok(Array.isArray(p.customizations.portions));assert.ok(Array.isArray(p.allergens));assert.ok(p.bookMeta);
  assert.equal(normalizeLines([{...p,quantity:1}])[0].unitPaise,24950);
 }
});
test('Mongo IDs, empty image URLs, null containers and sold-out products are handled safely',()=>{
 const [p]=normalizeLiveProducts([{_id:'mongo-book',name:'Book',category:'Books',price:100,stock:0,imageUrl:'',images:null,packs:null,bookMeta:null,variants:null}], 'books');
 assert.equal(p.id,'mongo-book');assert.equal(p.image,'/images/hero-books.jpg');assert.deepEqual(p.images,[p.image]);assert.equal(p.inStock,false);assert.ok(p.bookMeta);assert.ok(Array.isArray(p.packs));assert.ok(p.variants.colors.length);
 const [q]=normalizeLiveProducts([{id:'fruit',name:'Fruit',category:'Fruits',price:20,stock:2,imageUrl:'javascript:alert(1)',image:'/images/products/f1.jpg'}],'fruits');assert.equal(q.image,'/images/products/f1.jpg');
});
test('invalid, wrong-category and duplicate rows cannot replace a usable fallback',()=>{
 const good={id:'book',name:'Book',category:'Books',price:100,stock:2};
 assert.equal(normalizeLiveProducts([good,good,{...good,id:'nan',price:'invalid'},{...good,id:'wrong',category:'Fruits'},null], 'books').length,1);
 for(const records of [null,{},[],[{id:'bad',price:20}],[{...good,price:null}]])assert.deepEqual(normalizeLiveProducts(records,'books'),[]);
});
test('server image, price and identity take precedence while supplied metadata is retained',()=>{
 const [p]=normalizeLiveProducts([{id:'book',name:'Mongo title',title:'Obsolete title',category:'Books',price:125,stock:'4',imageUrl:'https://example.test/current.jpg',image:'https://example.test/old.jpg',author:'Writer',bookMeta:{author:'Writer',isbn:'123',format:'Paperback'},collection:'Programming'}],'books');
 assert.equal(p.title,'Mongo title');assert.equal(p.image,'https://example.test/current.jpg');assert.equal(p.bookMeta.author,'Writer');assert.equal(p.collection,'Programming');assert.equal(p.stock,4);
});
