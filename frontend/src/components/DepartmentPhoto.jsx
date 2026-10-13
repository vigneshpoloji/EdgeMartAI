import React, { useEffect, useState } from 'react';
import { departmentPhotography } from './department-photography';

export function DepartmentPhoto({ department, audience = 'buyer', className = '', eager = false }) {
  const photo = departmentPhotography[department]?.[audience];
  if (!photo) return null;
  return <img className={`em-department-photo ${className}`} src={photo.src} alt={`${department.charAt(0).toUpperCase() + department.slice(1)} photographed in ${photo.location}${photo.location === 'India' ? '' : ', India'}`} loading={eager ? 'eager' : 'lazy'} fetchpriority={eager ? 'high' : 'auto'}/>;
}

export function ProductPhoto({ department, src, label, className = '' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return <figure className={`em-product-photo ${className}`}>
    {failed || !src ? <span className="em-photo-unavailable">Photo not available</span> : <img src={src} alt={`${label} — representative ${department} photography`} loading="lazy" onError={() => setFailed(true)}/>}
    {src && !failed && <figcaption>Representative photo</figcaption>}
  </figure>;
}
