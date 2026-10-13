import test from 'node:test';
import assert from 'node:assert/strict';
import { cursorColour, DASHBOARD_COLOURS } from './dashboard-colours.js';
test('all six requested colours follow the mouse across equal width zones', () => {
  assert.deepEqual(DASHBOARD_COLOURS.map(c => [c.name,c.hex]), [['Andrea','#CBE4F9'],['Aura','#CDF5F6'],['Silent Mint','#EFF9DA'],['Brown White','#F9EBDF'],['Light Baby Pink','#F9D8D6'],['Tender Violet','#D6CDEA']]);
  for(let i=0;i<6;i++) assert.equal(cursorColour(120+i*100+50,120,600),DASHBOARD_COLOURS[i]);
});
test('pointer outside the surface and invalid geometry stay within the palette', () => {
  assert.equal(cursorColour(-100,0,600),DASHBOARD_COLOURS[0]);
  assert.equal(cursorColour(600,0,600),DASHBOARD_COLOURS[5]);
  assert.equal(cursorColour(900,0,600),DASHBOARD_COLOURS[5]);
  assert.equal(cursorColour(10,0,0),DASHBOARD_COLOURS[0]);
  assert.equal(cursorColour(NaN,0,600),DASHBOARD_COLOURS[0]);
});
