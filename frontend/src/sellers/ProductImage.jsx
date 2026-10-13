import React, { useEffect, useState } from 'react';
export default function ProductImage({ product, department }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.image]);
  return <span className="em-seller-product-image">{product.image && !failed ? <img src={product.image} alt={product.name} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)}/> : <span className="em-photo-unavailable">Add product photo</span>}</span>;
}
