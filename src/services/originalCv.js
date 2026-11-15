const WORD_NS='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const XML_NS='http://www.w3.org/XML/1998/namespace';
export async function prepareOriginalCv(file){
 const type=file.name.split('.').pop().toLowerCase();if(!['pdf','docx','txt'].includes(type))throw new Error('Choose a PDF, Word (.docx), or text (.txt) file.');
 if(file.size>10*1024*1024)throw new Error('Please choose a CV smaller than 10 MB.');if(!file.size)throw new Error('This file is empty.');
 const data=await file.arrayBuffer();
 if(type==='pdf'){
  const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;
  const task=pdfjs.getDocument({data:data.slice(0)});try{const pdf=await task.promise;if(pdf.numPages>20)throw new Error('Please choose a CV with no more than 20 pages.');}finally{await task.destroy();}
 }
 if(type==='docx'){const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(data);validateArchive(zip);if(!zip.file('word/document.xml'))throw new Error('This file is not a valid Word document.');}
 return {id:crypto.randomUUID(),name:file.name,type,data,edits:{},mode:'original',updatedAt:Date.now()};
}
export function validateArchive(zip){const files=Object.values(zip.files);const size=files.reduce((sum,file)=>sum+(file._data?.uncompressedSize || 0),0);if(files.length>2000 || size>40*1024*1024)throw new Error('This Word document is too large to preview safely.');}
export function parseWordXml(text){if(/<!DOCTYPE|<!ENTITY/i.test(text))throw new Error('Unsupported document XML.');const xml=new DOMParser().parseFromString(text,'application/xml');if(xml.querySelector('parsererror'))throw new Error('This Word document contains invalid XML.');return xml;}
export async function markDocxText(data){
 const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(data);validateArchive(zip);const entries=[];const tokens=new Map();const prefix='OMNICV'+crypto.randomUUID().replaceAll('-','');
 for(const part of Object.keys(zip.files).filter(name=>/^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(name))){
  const xml=parseWordXml(await zip.file(part).async('string'));const nodes=[...xml.getElementsByTagNameNS(WORD_NS,'t')];
  nodes.forEach((node,index)=>{const entry={key:part+':'+index,text:node.textContent,part,index};entries.push(entry);const token=prefix+'T'+entries.length;tokens.set(token,entry);node.textContent=token;});zip.file(part,new XMLSerializer().serializeToString(xml));
 }
 return {data:await zip.generateAsync({type:'arraybuffer'}),entries,tokens};
}
export async function editedDocx(data,edits){
 const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(data);validateArchive(zip);
 for(const part of Object.keys(zip.files).filter(name=>/^word\/(document|header\d*|footer\d*|footnotes|endnotes)\.xml$/.test(name))){
  const xml=parseWordXml(await zip.file(part).async('string'));const nodes=[...xml.getElementsByTagNameNS(WORD_NS,'t')];let changed=false;
  nodes.forEach((node,index)=>{const key=part+':'+index;if(!Object.hasOwn(edits,key))return;changed=true;const lines=String(edits[key]).split('\n');const fragment=xml.createDocumentFragment();lines.forEach((line,i)=>{if(i)fragment.appendChild(xml.createElementNS(WORD_NS,'w:br'));const text=xml.createElementNS(WORD_NS,'w:t');text.setAttributeNS(XML_NS,'xml:space','preserve');text.textContent=line;fragment.appendChild(text);});node.replaceWith(fragment);});
  if(changed)zip.file(part,new XMLSerializer().serializeToString(xml));
 }
 return zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function openDraftDb(){return new Promise((resolve,reject)=>{const request=indexedDB.open('omni-original-cv',1);request.onupgradeneeded=()=>request.result.createObjectStore('drafts');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function readOriginalDraft(owner){const db=await openDraftDb();try{return await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),request=tx.objectStore('drafts').get(owner);request.onsuccess=()=>resolve(request.result || null);request.onerror=()=>reject(request.error);});}finally{db.close();}}
export async function saveOriginalDraft(owner,value){const db=await openDraftDb();try{await new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readwrite');const store=tx.objectStore('drafts');if(value)store.put(value,owner);else store.delete(owner);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}finally{db.close();}}
export function downloadCvBlob(blob,name){const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
export function originalMime(type){return {pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',txt:'text/plain;charset=utf-8'}[type];}
export function samplePdfColors(canvas,box,scale){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});const x=Math.max(0,Math.floor(box.x*scale)),y=Math.max(0,Math.floor(box.y*scale)),width=Math.max(1,Math.min(canvas.width-x,Math.ceil(box.width*scale))),height=Math.max(1,Math.min(canvas.height-y,Math.ceil(box.height*scale)));const frequencies=new Map();
 const sample=ctx.getImageData(x,Math.max(0,y-2),width,1).data;for(let i=0;i<sample.length;i+=4){const key=sample[i]+','+sample[i+1]+','+sample[i+2];frequencies.set(key,(frequencies.get(key)||0)+1);}
 const background=[...(frequencies.entries())].sort((a,b)=>b[1]-a[1])[0]?.[0] || '255,255,255';const bg=background.split(',').map(Number);frequencies.clear();
 const data=ctx.getImageData(x,y,width,height).data;for(let i=0;i<data.length;i+=4){if(Math.abs(data[i]-bg[0])+Math.abs(data[i+1]-bg[1])+Math.abs(data[i+2]-bg[2])<120)continue;const rgb=[data[i],data[i+1],data[i+2]].map(value=>Math.round(value/16)*16).map(value=>Math.min(255,value));const key=rgb.join(',');frequencies.set(key,(frequencies.get(key)||0)+1);}
 const foreground=[...(frequencies.entries())].sort((a,b)=>b[1]-a[1])[0]?.[0] || (bg.reduce((sum,value)=>sum+value,0)>380?'25,25,25':'245,245,245');return {background:'rgb('+background+')',color:'rgb('+foreground+')'};
}
export function paintPdfPage(scene,edits){
 const canvas=document.createElement('canvas');canvas.width=scene.canvas.width;canvas.height=scene.canvas.height;const ctx=canvas.getContext('2d');ctx.drawImage(scene.canvas,0,0);ctx.scale(scene.scale,scene.scale);
 for(const item of scene.items){if(!Object.hasOwn(edits,item.key) || edits[item.key]===item.text)continue;ctx.save();ctx.fillStyle=item.background;ctx.fillRect(item.x-1,item.y-1,item.width+2,item.height+2);ctx.font=item.font;ctx.fillStyle=item.color;ctx.textBaseline='alphabetic';const lines=String(edits[item.key]).split('\n');const size=Math.min(item.fontSize,item.height/Math.max(1,lines.length));ctx.font=(item.italic?'italic ':'')+(item.bold?'bold ':'')+size+'px '+item.family;lines.forEach((line,index)=>ctx.fillText(line,item.x,item.baseline+index*size,Math.max(1,item.width)));ctx.restore();}
 return canvas;
}
export async function readPdfScenes(data){
 const pdfjs=await import('pdfjs-dist');pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).href;const task=pdfjs.getDocument({data:data.slice(0)});
 try{const pdf=await task.promise;if(pdf.numPages>20)throw new Error('Please choose a CV with no more than 20 pages.');const scenes=[];
  for(let pageNumber=1;pageNumber<=pdf.numPages;pageNumber++){
   const page=await pdf.getPage(pageNumber),viewport=page.getViewport({scale:1});if(viewport.width>3000 || viewport.height>5000)throw new Error('This PDF page is too large to edit.');const scale=Math.min(2,Math.sqrt(4000000/(viewport.width*viewport.height)));const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width*scale);canvas.height=Math.ceil(viewport.height*scale);await page.render({canvasContext:canvas.getContext('2d'),viewport:page.getViewport({scale})}).promise;const content=await page.getTextContent();const items=[];
   content.items.forEach((item,index)=>{if(!item.str?.trim())return;const transform=pdfjs.Util.transform(viewport.transform,item.transform),fontSize=Math.hypot(transform[2],transform[3]);if(!fontSize || Math.abs(transform[1])>.1)return;const style=content.styles[item.fontName] || {};let fontObject;try{fontObject=page.commonObjs.get(item.fontName);}catch{}const family=fontObject?.loadedName || style.fontFamily || 'sans-serif';const ascent=style.ascent || .8;const box={x:transform[4],y:transform[5]-fontSize*ascent,width:Math.max(item.width,3),height:fontSize*1.18};if(box.x<0 || box.y<0 || box.x>=viewport.width || box.y>=viewport.height)return;box.width=Math.min(box.width,viewport.width-box.x);box.height=Math.min(box.height,viewport.height-box.y);const colors=samplePdfColors(canvas,box,scale);items.push({...box,...colors,key:'pdf:'+pageNumber+':'+index,text:item.str,baseline:transform[5],fontSize,family,bold:!!fontObject?.bold,italic:!!fontObject?.italic,font:(fontObject?.italic?'italic ':'')+(fontObject?.bold?'bold ':'')+fontSize+'px '+family});});
   scenes.push({canvas,width:viewport.width,height:viewport.height,scale,items,pageNumber});
  }
  return {scenes,destroy:()=>task.destroy()};
 }catch(error){await task.destroy();throw error;}
}
