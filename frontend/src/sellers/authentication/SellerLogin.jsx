import React from 'react';
import { ArrowRight } from 'lucide-react';
export default function SellerLogin({ values, setValues, onSubmit, enabled,secure }) {
  return <form onSubmit={onSubmit} className="em-seller-form"><label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} value={values.email} onChange={e=>setValues({...values,email:e.target.value})} placeholder="seller@example.com"/></label>{secure&&<label>Password<input type="password" required autoComplete="current-password" maxLength={128} value={values.password} onChange={e=>setValues({...values,password:e.target.value})}/></label>}<p className="em-seller-hint">Use your EdgeMart password. If you signed up with Google or GitHub, choose that provider below.</p><button className="em-seller-primary" disabled={!enabled} type="submit">Sign in <ArrowRight size={17}/></button></form>;
}
