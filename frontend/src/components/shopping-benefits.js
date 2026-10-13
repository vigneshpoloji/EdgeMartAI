export const OFFER_CODE = 'EDGEMART10';
export const isOfferCode = code => ['PREVIEW10', OFFER_CODE].includes(code);
const windows = { food: [0,0], fruits:[1,2], vegetables:[1,2], meat:[1,2], pharmacy:[1,3], groceries:[1,3], plants:[2,4], books:[2,5], electronics:[2,5], jewellery:[3,6] };
export function deliveryEstimate(department, now = new Date()) {
  if (Number.isNaN(new Date(now).getTime())) throw new Error('A valid date is required.');
  const [min,max] = windows[department] || [2,5];
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Kolkata', year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(new Date(now));
  const get = type => Number(parts.find(p => p.type === type).value);
  const day = new Date(Date.UTC(get('year'),get('month')-1,get('day'),12));
  const date = offset => { const d = new Date(day); d.setUTCDate(d.getUTCDate()+offset); return new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',weekday:'short',day:'numeric',month:'short'}).format(d); };
  return min === max ? `${date(min)} · timing confirmed at checkout` : `${date(min)} – ${date(max)}`;
}
