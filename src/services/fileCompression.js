import JSZip from 'jszip';

const ZIP_FORMATS = /\.(zip|docx|xlsx|pptx)$/i;
const MAX_SIZE = 100 * 1024 * 1024;

export async function compressArchive(file) {
  if (file.size > MAX_SIZE) throw new Error('Choose a file smaller than 100 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const archive = ZIP_FORMATS.test(file.name);
  let zip;
  if (archive) {
    zip = await JSZip.loadAsync(bytes, {checkCRC32:false});
    const entries = Object.values(zip.files);
    if (entries.length > 5000 || entries.reduce((sum, entry) => sum + (entry._data?.uncompressedSize || 0), 0) > MAX_SIZE) {
      throw new Error('This archive is too large to unpack safely in your browser.');
    }
    // Rebuild entries so already-deflated files are actually recompressed at level 9.
    const rebuilt = new JSZip();
    rebuilt.comment = zip.comment;
    for (const entry of entries) {
      if (entry.unsafeOriginalName && entry.unsafeOriginalName !== entry.name) throw new Error('This archive contains unsupported file paths. The original file has been kept.');
      rebuilt.file(entry.name, entry.dir ? null : await entry.async('uint8array'), {dir:entry.dir,date:entry.date,comment:entry.comment,unixPermissions:entry.unixPermissions,dosPermissions:entry.dosPermissions,createFolders:false});
    }
    zip = rebuilt;
  } else {
    zip = new JSZip();
    zip.file(file.name, bytes);
  }
  const packed = await zip.generateAsync({type:'uint8array',compression:'DEFLATE',compressionOptions:{level:9},platform:'UNIX'});
  if (packed.byteLength >= file.size) return {blob:file,name:file.name,reduced:false,note:'This file is already well compressed. Further lossless compression would make it larger, so your original file has been kept.'};
  const name = archive ? file.name : file.name + '.zip';
  const mime = archive && !/\.zip$/i.test(file.name) ? file.type : 'application/zip';
  return {blob:new Blob([packed],{type:mime || 'application/zip'}),name,reduced:true,note:archive?'Archive entries recompressed at maximum lossless compression.':'Saved as a ZIP archive. Extract it to recover your original file.'};
}

export async function compressImage(file, mode = 'balanced') {
  if (file.size > MAX_SIZE) throw new Error('Choose an image smaller than 100 MB.');
  // Preserve animation and vector graphics rather than silently flattening them.
  if (/\.(gif|svg|apng)$/i.test(file.name)) return compressArchive(file);
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise((resolve,reject) => {image.onload=resolve;image.onerror=()=>reject(new Error('This image could not be read. Please choose a valid image file.'));image.src=url;});
    const limit = mode === 'maximum' ? 960 : 1600;
    const scale = Math.min(1,limit / Math.max(image.naturalWidth,image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
    const context=canvas.getContext('2d');
    if (!context) throw new Error('Image compression is unavailable in this browser.');
    context.drawImage(image,0,0,canvas.width,canvas.height);
    const quality=mode==='maximum'?.45:.72;
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));
    if (!blob) throw new Error('The image could not be compressed. Your original file has been kept.');
    if (blob.size >= file.size) return {blob:file,name:file.name,reduced:false,note:'This image is already small. Your original image has been kept.'};
    const ext=blob.type==='image/webp'?'.webp':'.png';
    return {blob,name:file.name.replace(/\.[^.]+$/,'')+ext,reduced:true,note:mode==='maximum'?'Smaller WebP image; dimensions and image quality have been reduced.':'Optimized WebP image; large dimensions have been reduced while preserving transparency.'};
  } finally {URL.revokeObjectURL(url);}
}
