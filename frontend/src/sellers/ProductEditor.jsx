import React, { useRef, useState } from 'react';
import { Save, Upload, Link, X, Image as ImageIcon } from 'lucide-react';
import CheckoutModal from '../checkout/CheckoutModal';
import { useSeller } from './SellerProvider';
import { prepareProductPhoto } from './product-photo.js';
import { DEPARTMENT_FIELDS, PRODUCT_CATEGORIES } from './department-fields.js';
import ProductImage from './ProductImage';
import {LocationPicker} from '../delivery/NearbyDelivery';
import {validateLocation} from '../delivery/location.model.js';
export const departmentStyle = dept => ({ '--seller-accent': dept.accent, '--seller-soft': dept.soft, '--seller-dark': dept.dark });
export default function ProductEditor({ department, product, onClose, onSaved }) {
  const repository = useSeller(), uploadRevision = useRef(0);
  const [values,setValues] = useState(product ? {...product,details:product.details || {},price:(product.unitPaise/100).toFixed(2)} : {name:'',sku:'',price:'',stock:'0',variant:department.unit,description:'',attribute:'',image:'',status:'active',rxRequired:false,subCategory:'other',details:{}});
  const [saving,setSaving] = useState(false), [error,setError] = useState(''), [uploading,setUploading] = useState(false), [photoMode,setPhotoMode] = useState(values.image.startsWith('data:') ? 'upload' : 'link');
  const [pickup,setPickup]=useState(repository.seller?.location||null);
  const needsPickup=repository.liveBackend&&['food','fruits'].includes(department.id);
  const save=async e=>{
    e.preventDefault();if(saving)return;setSaving(true);setError('');
    try {
      if(needsPickup&&values.status==='active') {
        const issue=validateLocation(pickup);
        if(issue)throw new Error('Set your store pickup location so nearby buyers can see this listing.');
        if(pickup.lat!==repository.seller?.location?.lat||pickup.lng!==repository.seller?.location?.lng)
          await repository.settings({...repository.seller,location:pickup});
      }
      await repository.saveProduct(values,department.id,product?.id);onSaved();
    } catch(err){setError(err.message);}finally{setSaving(false);}
  };
  const update = e => setValues(old=>({...old,[e.target.name]:e.target.value}));
  const field = (key,label,attrs={}) => <label key={key}>{label}<input name={key} value={values[key]} onChange={update} {...attrs}/></label>;
  const upload = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    const revision = ++uploadRevision.current; setUploading(true); setError('');
    try { const image = await prepareProductPhoto(file); if (revision === uploadRevision.current) setValues(old=>({...old,image})); }
    catch(err) { if(revision === uploadRevision.current) setError(err.message); }
    finally { if(revision === uploadRevision.current) setUploading(false); event.target.value = ''; }
  };
  const detailsField = ([key,label,type='text',options]) => <label key={key}>{label}{type === 'select' ? <select value={values.details[key] || ''} onChange={e=>setValues(old=>({...old,details:{...old.details,[key]:e.target.value}}))}><option value="">Choose…</option>{options.map(o=><option key={o}>{o}</option>)}</select> : <input type={type} min={type === 'number' ? 1 : undefined} max={type === 'number' ? 1440 : undefined} maxLength={300} value={values.details[key] || ''} onChange={e=>setValues(old=>({...old,details:{...old.details,[key]:e.target.value}}))}/>}</label>;
  return <CheckoutModal title={`${product ? 'Edit' : 'New'} ${department.name.toLowerCase()} listing`} onClose={onClose}><div className="em-seller-editor" style={departmentStyle(department)}><span className="em-seller-eyebrow">{department.name.toUpperCase()} / PRODUCT STUDIO</span><h2>{product ? 'Refine your listing.' : 'Your next great listing.'}</h2><p>Active products appear in the {department.name.toLowerCase()} buyer dashboard automatically.</p><form className="em-seller-form" onSubmit={save}>
    {needsPickup&&<section className="em-seller-card"><LocationPicker label="Store pickup location" value={pickup} onChoose={setPickup}/><p className="em-seller-hint">Food and fruit listings are shown to buyers within {repository.radiusKm||5} km of your store.</p></section>}
    <section className="em-photo-editor" aria-label="Product photograph"><div className="em-photo-preview"><ProductImage product={values} department={department}/></div><div><h3><ImageIcon size={18}/>Product photograph</h3><div className="em-photo-tabs" role="group" aria-label="Choose image source">{[['link','Image link',Link],['upload','Upload from device',Upload]].map(([id,label,Icon])=><button type="button" key={id} aria-pressed={photoMode===id} onClick={()=>setPhotoMode(id)}><Icon size={15}/>{label}</button>)}</div>{photoMode==='link' ? <label>Image link<input type="text" inputMode="url" placeholder="https://example.com/product.jpg" value={values.image.startsWith('data:') ? '' : values.image} maxLength={2000} onChange={e=>{uploadRevision.current++;setUploading(false);setValues(old=>({...old,image:e.target.value}));}}/><small>Use a publicly accessible HTTPS photograph.</small></label> : <label className="em-upload-label"><Upload size={20}/>{uploading ? 'Preparing your photo…' : 'Choose a photograph'}<input type="file" aria-label="Upload product photograph" accept="image/jpeg,image/png,image/webp" disabled={uploading || saving} onChange={upload}/><small>JPG, PNG or WebP · up to 5 MB</small></label>}{values.image && <button type="button" className="em-remove-photo" onClick={()=>{uploadRevision.current++;setUploading(false);setValues(old=>({...old,image:''}));}}><X size={13}/>Remove photo</button>}</div></section>
    <div className="em-seller-fields">{field('name','Product name',{required:true,minLength:3,maxLength:120})}{field('sku','SKU (optional)',{maxLength:60})}{field('price','Price per selling unit (₹)',{type:'number',required:true,min:'.01',max:'10000000',step:'.01'})}{field('stock','Available selling units',{type:'number',required:true,min:0,max:999999,step:1})}{field('variant','Pack / size / portion / unit',{required:true,maxLength:120})}<label>Product category<select name="subCategory" value={values.subCategory || 'other'} onChange={update}><option value="other">Other {department.name.toLowerCase()}</option>{PRODUCT_CATEGORIES[department.id].map(([id,label])=><option value={id} key={id}>{label}</option>)}</select></label><label>Listing status<select name="status" value={values.status} onChange={update}><option value="draft">Draft</option><option value="active">Active · visible to buyers</option><option value="paused">Paused</option></select></label><label className="wide">Description<textarea name="description" required minLength={10} maxLength={1000} rows={3} value={values.description} onChange={update}/></label>{field('attribute',department.attribute,{maxLength:300})}</div>
    <fieldset className="em-department-details"><legend>{department.name} details</legend><div className="em-seller-fields">{DEPARTMENT_FIELDS[department.id].map(detailsField)}</div></fieldset>{department.id==='pharmacy' && <label className="em-seller-check"><input type="checkbox" checked={values.rxRequired} onChange={e=>setValues(old=>({...old,rxRequired:e.target.checked}))}/>Prescription-required product</label>}<p className="em-seller-hint">Zero-stock listings show as sold out. Draft and paused products stay off the buyer catalogue.</p>{error && <p role="alert" className="em-seller-error">{error}</p>}<div className="em-seller-editor-actions"><button type="button" className="em-seller-secondary" onClick={onClose}>Cancel</button><button className="em-seller-primary" type="submit" disabled={uploading || saving}><Save size={16}/>{uploading ? 'Preparing photo…' : saving ? 'Saving…' : 'Save listing'}</button></div></form></div></CheckoutModal>;
}
