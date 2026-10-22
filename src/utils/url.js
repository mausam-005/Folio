export function getFolioUrl(filePath, isThumb = false) {
  if (!filePath) return '';
  const cleanPath = filePath.startsWith('/') ? filePath : '/' + filePath;
  const encodedPath = cleanPath.split('/').map(encodeURIComponent).join('/');
  return `folio://${encodedPath}${isThumb ? '?thumb=1' : ''}`;
}
