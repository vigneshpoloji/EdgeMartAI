import test from 'node:test';
import assert from 'node:assert/strict';
import {validateLocation,parseCoordinates,needsDeliveryLocation} from './location.model.js';

test('checkout requires finite coordinates within geographic bounds',()=>{
  for(const value of [null,{}, {lat:'13',lng:80}, {lat:91,lng:80}, {lat:13,lng:-181}, {lat:NaN,lng:80}, {lat:13,lng:Infinity}])
    assert.ok(validateLocation(value));
  assert.equal(validateLocation({lat:13.0827,lng:80.2707}),'');
  assert.equal(validateLocation({lat:0,lng:0}),'');
});

test('manual coordinates reject empty fields rather than silently saving zero',()=>{
  for(const coords of [{lat:'',lng:''},{lat:' ',lng:'80'}, {lat:'13',lng:''}, {lat:null,lng:80}, {lat:'text',lng:80}, {lat:13,lng:200}])
    assert.throws(()=>parseCoordinates(coords));
  assert.deepEqual(parseCoordinates({lat:'13.0827',lng:'80.2707'}),{lat:13.0827,lng:80.2707});
  assert.deepEqual(parseCoordinates({lat:'0',lng:'0'}),{lat:0,lng:0});
});

test('only orders missing a location before pickup offer buyer repair',()=>{
  for(const status of ['confirmed','preparing','ready']) {
    assert.equal(needsDeliveryLocation({status,location:null}),true);
    assert.equal(needsDeliveryLocation({status,location:{lat:13,lng:80}}),false);
  }
  for(const status of ['out_for_delivery','delivered','cancelled'])
    assert.equal(needsDeliveryLocation({status,location:null}),false);
});
