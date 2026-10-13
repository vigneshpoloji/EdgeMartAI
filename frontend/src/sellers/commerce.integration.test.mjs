import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueProduct, mergeCatalogue } from './buyer.catalog.js';
import { createSellerRepository, parseSellerData, SELLER_DATA_KEY, validateProduct, validImage } from './seller.model.js';
import { validatePhotoFile, validPhotoData, MAX_STORED_PHOTO } from './product-photo.js';
import { pruneCatalogueCart, validateSellerBasket } from './catalogue-cart.js';
import { totals, normalizeLines } from '../checkout/checkout.model.js';
import { deliveryEstimate, OFFER_CODE } from '../components/shopping-benefits.js';
import { assistantReply } from '../components/assistant.model.js';
import { SELLER_DEPARTMENTS } from './departments.js';
import { addLine, hydrateCart, totals as electronicsTotals } from '../pages/electronics/commerce.js';
const profile={id:'seller-test',store:'Test store'};
const values={name:'Test product',description:'A detailed product description',price:'123.45',stock:'3',variant:'One pack',status:'active',image:'',details:{},subCategory:'other'};
const listing=department=>({...validateProduct(values,department),id:'seller-product-test',sellerId:profile.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
test('all ten native catalogue adapters retain selling price, unit, image, department and stock',()=>{
  for(const d of SELLER_DEPARTMENTS){const p=catalogueProduct(listing(d.id),profile);assert.equal(p.price,123.45);assert.equal(p.category,d.id);assert.equal(p.packSizes[0].price,123.45);assert.equal(p.packs[0].label,'One pack');assert.deepEqual(p.sizes,['One pack']);assert.equal(p.stock,3);assert.equal(p.brand,profile.store);assert.equal(p.rating,0);assert.equal(p.sellerProduct,true);assert.equal(p.inStock,true);assert.equal(p.customizations.portions[0].priceDelta,0);assert.equal(p.bookMeta.format,'One pack');}
});
test('seller entries merge into the normal array with no duplicate IDs and active status only',()=>{const p=listing('fruits'),native=[{id:'f1',name:'Native fruit'}];assert.deepEqual(mergeCatalogue('fruits',native,[p,{...p,id:'f1'},{...p,id:'seller-product-paused',status:'paused'}],[profile]).map(p=>p.id),['f1',p.id]);assert.equal(mergeCatalogue('books',native,[p],[profile]).length,1);});
test('sold out, unknown pet safety and prescription classifications are represented honestly',()=>{let p=catalogueProduct({...listing('pharmacy'),stock:0,rxRequired:true},profile);assert.equal(p.inStock,false);assert.equal(p.rxRequired,true);p=catalogueProduct(listing('plants'),profile);assert.equal(p.petSafe,null);assert.equal(p.petSource,'');assert.equal(p.light,'Care details not supplied');});
test('department fields whitelist metadata and survive repository reload with uploaded raster photo',()=>{
  const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};let n=0;
  const repo=createSellerRepository({storage,sessionStorage:storage,uuid:()=>String(++n)});repo.signup({name:'Test seller',email:'qa@example.com',store:'Test shop',city:'Mumbai',phone:'',department:'pharmacy'});
  const image='data:image/jpeg;base64,/9j/AAAA';const p=repo.saveProduct({...values,image,rxRequired:true,details:{batch:'B123',expiry:'2027-01-01',injected:'discard'}},'pharmacy');
  assert.equal(p.image,image);assert.equal(p.details.batch,'B123');assert.equal(p.details.injected,undefined);assert.equal(parseSellerData(data.get(SELLER_DATA_KEY)).products[0].image,image);
});
test('photo validation blocks active content, forged data formats and oversized uploads',()=>{
  for(const bad of ['data:image/svg+xml;base64,PHN2Zz4=','data:text/html;base64,PGgxPg==','data:image/jpeg;base64,PGgxPg==','data:image/png;base64,/9j/AAAA','javascript:alert(1)'])assert.throws(()=>validImage(bad));
  assert.equal(validPhotoData('data:image/jpeg;base64,/9j/AAAA'),true);assert.equal(validPhotoData('data:image/jpeg;base64,'+'/9j/'+ 'A'.repeat(MAX_STORED_PHOTO)),false);
  assert.throws(()=>validatePhotoFile({type:'image/svg+xml',size:20}));assert.throws(()=>validatePhotoFile({type:'image/jpeg',size:6*1024*1024}));assert.doesNotThrow(()=>validatePhotoFile({type:'image/png',size:1024}));assert.throws(()=>validImage('https://user:password@example.com/image.jpg'));
});
test('seller cart quantities respect stock and vanished products are safely pruned in every native cart shape',()=>{
  const p=catalogueProduct(listing('fruits'),profile);assert.deepEqual(pruneCatalogueCart([{id:p.id,quantity:8},{id:'deleted',quantity:1}],[p]),[{id:p.id,quantity:3}]);
  assert.deepEqual(pruneCatalogueCart({a:{id:p.id,pack:0,quantity:8},b:{id:p.id,pack:4,quantity:1}},[p]),{a:{id:p.id,pack:0,quantity:3}});
  assert.deepEqual(pruneCatalogueCart({[`${p.id}:0`]:8,deleted:1},[p]),{[`${p.id}:0`]:3});
});
test('checkout rechecks publication, stock, combined quantities, price, ownership and Rx requirements',()=>{
  const p=listing('pharmacy'),line={id:p.id,name:p.name,category:p.department,quantity:2,unitPrice:123.45};assert.equal(validateSellerBasket([line],[p],[profile]),'');
  for(const [lines,products,profiles] of [[[line],[],[profile]],[[line],[{...p,status:'paused'}],[profile]],[[line],[{...p,stock:0}],[profile]],[[line,line],[p],[profile]],[[line],[{...p,unitPaise:14000}],[profile]],[[line],[p],[]],[[line],[{...p,rxRequired:true}],[profile]]])assert.ok(validateSellerBasket(lines,products,profiles));
});
test('all departments apply the advertised offer using exactly the checkout minimum and cap',()=>{
  for(const d of SELLER_DEPARTMENTS){const lines=normalizeLines([{id:'item',name:'Test',category:d.id,price:500,quantity:1}]);assert.equal(totals(lines,{coupon:OFFER_CODE}).discount,5000);assert.equal(totals(normalizeLines([{id:'item',name:'Test',category:d.id,price:499,quantity:1}]),{coupon:OFFER_CODE}).discount,0);assert.equal(totals(normalizeLines([{id:'item',name:'Test',category:d.id,price:3000,quantity:1}]),{coupon:OFFER_CODE}).discount,20000);}
});
test('electronics quote uses the shared offer and delivery threshold and caps seller quantities',()=>{const p=catalogueProduct({...listing('electronics'),unitPaise:60000},profile);const cart=addLine([],p,'One pack',10),lines=hydrateCart(cart,[p]);assert.equal(lines[0].quantity,3);assert.equal(electronicsTotals([{...p,quantity:1,unitPrice:600}],OFFER_CODE).shipping,49);assert.equal(electronicsTotals([{...p,quantity:1,unitPrice:600}],OFFER_CODE).discount,60);});
test('delivery estimates use the Indian calendar date at month and year boundaries',()=>{assert.equal(deliveryEstimate('fruits',new Date('2026-12-31T23:00:00Z')),'Sat, 2 Jan – Sun, 3 Jan');assert.equal(deliveryEstimate('food',new Date('2026-10-08T18:45:00Z')),'Fri, 9 Oct · timing confirmed at checkout');assert.throws(()=>deliveryEstimate('books','invalid'));});
test('assistant searches real products and does not invent orders, AI connectivity or medical advice',()=>{
  const products=[catalogueProduct(listing('plants'),profile)];const result=assistantReply('find Test product',{department:'plants',products});assert.equal(result.products[0].id,products[0].id);assert.equal(result.products[0].price,123.45);assert.match(assistantReply('offers',{department:'plants'}).text,/EDGEMART10/);assert.match(assistantReply('upload photo',{department:'plants',seller:true}).text,/5 MB/);assert.match(assistantReply('medicine dose',{department:'pharmacy'}).text,/qualified pharmacist/);assert.match(assistantReply('payment',{department:'books'}).text,/does not collect money/);
});
