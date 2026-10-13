export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const MAX_STORED_PHOTO = 360000;
export function validatePhotoFile(file) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP photograph.');
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) throw new Error('Choose a photograph smaller than 5 MB.');
}
export function validPhotoData(value) {
  if (typeof value !== 'string' || value.length > MAX_STORED_PHOTO) return false;
  const match = value.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match || match[2].length % 4 !== 0) return false;
  return match[1] === 'jpeg' ? match[2].startsWith('/9j/') : match[1] === 'png' ? match[2].startsWith('iVBORw0KGgo') : match[2].startsWith('UklGR');
}
export async function prepareProductPhoto(file) {
  validatePhotoFile(file);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = url; await img.decode();
    if (!img.naturalWidth || !img.naturalHeight || img.naturalWidth * img.naturalHeight > 50000000) throw new Error('Choose a photograph below 50 megapixels.');
    const ratio = Math.min(1,1200/Math.max(img.naturalWidth,img.naturalHeight));
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1,Math.round(img.naturalWidth*ratio)); canvas.height = Math.max(1,Math.round(img.naturalHeight*ratio));
    const context = canvas.getContext('2d'); if (!context) throw new Error('Your browser cannot prepare this photo. Use an image link.');
    context.fillStyle = '#ffffff'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(img,0,0,canvas.width,canvas.height);
    for (const quality of [.82,.65,.45,.3]) { const data = canvas.toDataURL('image/jpeg',quality); if (validPhotoData(data)) return data; }
    throw new Error('This photo is too detailed to save. Choose a smaller photograph.');
  } catch (error) { if (error.name === 'EncodingError') throw new Error('This file could not be read as a photograph.'); throw error; }
  finally { URL.revokeObjectURL(url); }
}
