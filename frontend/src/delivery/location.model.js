export function validateLocation(value) {
  if (!value || !Number.isFinite(value.lat) || !Number.isFinite(value.lng) || Math.abs(value.lat) > 90 || Math.abs(value.lng) > 180)
    return 'Choose a delivery location using your device or enter valid coordinates.';
  return '';
}

export function parseCoordinates(coords) {
  if (coords.lat == null || coords.lng == null || String(coords.lat).trim() === '' || String(coords.lng).trim() === '')
    throw new Error('Enter both latitude and longitude.');
  const location = {lat: Number(coords.lat), lng: Number(coords.lng)};
  const error = validateLocation(location);
  if (error) throw new Error(error);
  return location;
}

export const needsDeliveryLocation = order => Boolean(order && !order.location && ['confirmed', 'preparing', 'ready'].includes(order.status));
