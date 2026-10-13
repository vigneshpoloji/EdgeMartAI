export function marketplaceListings(products, profiles, department, query = '') {
  const term = query.trim().toLowerCase();
  return products.filter(product => product.department === department && product.status === 'active' && profiles.some(profile => profile.id === product.sellerId) &&
    `${product.name} ${product.description} ${product.sku} ${product.variant} ${product.attribute} ${profiles.find(profile => profile.id === product.sellerId)?.store || ''}`.toLowerCase().includes(term));
}
