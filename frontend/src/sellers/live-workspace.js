export const emptySellerState = () => ({
  products: [], profiles: [], orders: [], seller: null,
  persistent: true, loading: false, error: ''
});

export async function loadSellerState(client, user) {
  if (!user || user.role === 'driver') return emptySellerState();
  const catalogue = await client.api('/api/catalogue');
  let workspace = { products: [], orders: [], seller: null };
  if (catalogue.profiles.some(profile => profile.id === `seller-${user.id}`)) {
    try {
      workspace = await client.api('/api/seller/workspace');
    } catch (error) {
      if (error.code !== 'SELLER_REQUIRED') throw error;
    }
  }
  return {
    ...catalogue,
    products: [...catalogue.products.filter(product => product.sellerId !== workspace.seller?.id), ...workspace.products],
    orders: workspace.orders, seller: workspace.seller,
    persistent: true, loading: false, error: ''
  };
}
