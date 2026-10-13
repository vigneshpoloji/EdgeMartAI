export const DASHBOARD_COLOURS = [
  { name: 'Andrea', hex: '#CBE4F9' },
  { name: 'Aura', hex: '#CDF5F6' },
  { name: 'Silent Mint', hex: '#EFF9DA' },
  { name: 'Brown White', hex: '#F9EBDF' },
  { name: 'Light Baby Pink', hex: '#F9D8D6' },
  { name: 'Tender Violet', hex: '#D6CDEA' }
];
export function cursorColour(clientX, left, width) {
  const position = Number.isFinite(clientX) && Number.isFinite(left) && Number.isFinite(width) && width > 0 ? (clientX - left) / width : 0;
  return DASHBOARD_COLOURS[Math.max(0, Math.min(5, Math.floor(position * 6)))];
}
