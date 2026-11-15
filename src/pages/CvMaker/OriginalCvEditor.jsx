import LoadingSpinner from '../../components/LoadingSpinner';
import {useEffect,useRef,useState} from 'react';
import {useUsage} from '../../context/UsageContext';
import {markDocxText,editedDocx,readPdfScenes,paintPdfPage,downloadCvBlob,originalMime} from '../../services/originalCv';
import './OriginalCvEditor.css';
function PdfPage({scene,edits,selected,onSelect,onAdd,adding}){
 const canvas=useRef(null);
 useEffect(()=>{const painted=paintPdfPage(scene,edits);const target=canvas.current;target.width=painted.width;target.height=painted.height;target.getContext('2d').drawImage(painted,0,0);},[scene,edits]);
 return <div className={'original-pdf-page '+(adding?'adding-text':'')} style={{width:scene.width,height:scene.height}} onClick={event=>{if(adding){const rect=event.currentTarget.getBoundingClientRect();onAdd(scene.pageNumber,(event.clientX-rect.left)/rect.width*scene.width,(event.clientY-rect.top)/rect.height*scene.height);}}}>
  <canvas ref={canvas} style={{width:scene.width,height:scene.height}} aria-label={'Original CV page '+scene.pageNumber}/>
  {!adding && scene.items.map(item=><button type="button" key={item.key} className={'original-pdf-hit '+(selected===item.key?'selected':'')} style={{left:item.x,top:item.y,width:item.width,height:item.height}} aria-label={'Edit text: '+(edits[item.key] ?? item.text)} onClick={()=>onSelect(item.key)}/>)}
 </div>;
}
export default function OriginalCvEditor({document:source,onEdit,onChange,onTextChange}){
 const consumeUsage=useUsage();const host=useRef(null),wordContent=useRef(null),wordStyles=useRef(null),lastEdit=useRef(onEdit),detailsInput=useRef(null);
 const [scenes,setScenes]=useState([]),[entries,setEntries]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[saving,setSaving]=useState(false),[selected,setSelected]=useState(null),[adding,setAdding]=useState(false),[zoom,setZoom]=useState('fit'),[fit,setFit]=useState(1),[pageWidth,setPageWidth]=useState(794),[renderKey,setRenderKey]=useState(0);
 function selectDetail(key){setSelected(key);requestAnimationFrame(()=>{detailsInput.current?.focus();detailsInput.current?.scrollIntoView({block:'nearest',behavior:'smooth'});});}
 useEffect(()=>{lastEdit.current=onEdit;},[onEdit]);
 useEffect(()=>{
  let cancelled=false,cleanup;setLoading(true);setError('');setScenes([]);setEntries([]);setSelected(null);
  async function load(){try{
   if(source.type==='pdf'){const result=await readPdfScenes(source.data);cleanup=result.destroy;if(cancelled){await cleanup();return;}setScenes(result.scenes);setPageWidth(Math.max(...result.scenes.map(scene=>scene.width)));}
   if(source.type==='docx'){
    const marked=await markDocxText(source.data);const {renderAsync,defaultOptions}=await import('docx-preview');if(cancelled)return;
    const root=host.current.shadowRoot || host.current.attachShadow({mode:'open'});root.replaceChildren();const styles=document.createElement('div'),content=document.createElement('div');root.append(styles,content);wordContent.current=content;wordStyles.current=styles;
    const localStyle=document.createElement('style');localStyle.textContent=':host{display:block;color:#111} .original-docx-wrapper{background:transparent!important;padding:0!important} section.original-docx{margin:0 auto 20px;box-shadow:0 4px 25px #0001} .original-word-run{white-space:pre-wrap;outline:0;cursor:text} .original-word-run:hover{background:#8b5cf60d;outline:1px dashed #8b5cf655} .original-word-run:focus{outline:1px solid #8b5cf6;background:#8b5cf610} a{pointer-events:none}';styles.appendChild(localStyle);
    await renderAsync(marked.data,content,styles,{className:'original-docx',inWrapper:true,ignoreWidth:false,ignoreHeight:false,ignoreFonts:false,useBase64URL:true,renderHeaders:true,renderFooters:true,renderAltChunks:false,ignoreLastRenderedPageBreak:false,h:props=>{
      if(typeof props==='string' && marked.tokens.has(props)){const entry=marked.tokens.get(props),span=document.createElement('span');span.className='original-word-run';span.dataset.key=entry.key;span.contentEditable='plaintext-only';span.setAttribute('role','textbox');span.setAttribute('aria-label','Edit CV text: '+entry.text.slice(0,80));span.textContent=source.edits?.[entry.key] ?? entry.text;span.addEventListener('input',()=>{const text=span.innerText.replaceAll('\r','');lastEdit.current(entry.key,text,entry.text);for(const copy of content.querySelectorAll('.original-word-run'))if(copy!==span && copy.dataset.key===entry.key)copy.textContent=text;});return span;}return defaultOptions.h(props);
    }});
    if(cancelled)return;styles.appendChild(localStyle);setEntries(marked.entries);
    content.addEventListener('click',event=>{const run=event.target.closest('.original-word-run');if(run)selectDetail(run.dataset.key);});
    const pages=[...content.querySelectorAll('section.original-docx')];setPageWidth(Math.max(794,...pages.map(page=>page.offsetWidth)));
   }
   if(source.type==='txt')setPageWidth(794);
  }catch(err){if(!cancelled)setError(err.message || 'Could not display this document.');}finally{if(!cancelled)setLoading(false);}}
  load();return()=>{cancelled=true;cleanup?.();};
 },[source.id,renderKey]);
 useEffect(()=>{const element=host.current.parentElement;const update=()=>setFit(Math.min(1,(element.clientWidth-28)/pageWidth));const observer=new ResizeObserver(update);observer.observe(element);update();return()=>observer.disconnect();},[pageWidth]);
 const annotations=source.annotations || [];const displayScenes=scenes.map(scene=>({...scene,items:[...scene.items,...annotations.filter(item=>item.pageNumber===scene.pageNumber)]}));
 const selectedItem=source.type==='docx'?entries.find(item=>item.key===selected):displayScenes.flatMap(scene=>scene.items).find(item=>item.key===selected);
 useEffect(()=>{if(selected){detailsInput.current?.focus();detailsInput.current?.scrollIntoView({block:'nearest',behavior:'smooth'});}},[selected]);
 function changeSelected(value){
  onEdit(selectedItem.key,value,selectedItem.text);
  if(source.type==='docx')for(const run of wordContent.current?.querySelectorAll('.original-word-run') || [])if(run.dataset.key===selectedItem.key)run.textContent=value;
 }
 const scale=zoom==='fit'?fit:Number(zoom)/100;const edits=source.edits || {};
 useEffect(()=>{let text='';if(source.type==='pdf')text=displayScenes.map(scene=>scene.items.map(item=>edits[item.key] ?? item.text).join(' ')).join('\n');if(source.type==='docx')text=entries.map(entry=>edits[entry.key] ?? entry.text).join('\n');if(source.type==='txt')text=edits.text ?? new TextDecoder().decode(source.data);onTextChange(text);},[scenes,entries,source.edits,source.annotations,source.type,source.data,onTextChange]);
 const changed=Object.keys(edits).length>0 || annotations.length>0;
 async function downloadNative(){if(saving || !(await consumeUsage()))return;setSaving(true);setError('');try{let blob;if(source.type==='docx' && changed)blob=await editedDocx(source.data,edits);else if(source.type==='txt')blob=new Blob([edits.text ?? new TextDecoder().decode(source.data)],{type:originalMime('txt')});else blob=new Blob([source.data],{type:originalMime(source.type)});downloadCvBlob(blob,source.name);}catch(err){setError(err.message);}finally{setSaving(false);}}
 async function downloadPdf(){if(saving || loading || !(await consumeUsage()))return;setSaving(true);setError('');let frame;try{
  if(source.type==='pdf' && !changed){downloadCvBlob(new Blob([source.data],{type:'application/pdf'}),source.name);return;}
  const {jsPDF}=await import('jspdf');let pdf;
  if(source.type==='pdf')for(const scene of displayScenes){const canvas=paintPdfPage(scene,edits);if(!pdf)pdf=new jsPDF({unit:'pt',format:[scene.width,scene.height],orientation:scene.width>scene.height?'landscape':'portrait'});else pdf.addPage([scene.width,scene.height],scene.width>scene.height?'landscape':'portrait');pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,scene.width,scene.height);}
  else if(source.type==='docx'){
   const {default:html2canvas}=await import('html2canvas');frame=document.createElement('iframe');frame.style.cssText='position:fixed;left:-12000px;top:0;width:1200px;height:1800px;border:0';document.body.appendChild(frame);const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html><head></head><body style="margin:0;background:white"></body></html>');doc.close();for(const style of wordStyles.current.querySelectorAll('style'))doc.head.appendChild(style.cloneNode(true));const clean=doc.createElement('style');clean.textContent='.original-word-run{outline:none!important;background:transparent!important}.original-docx-wrapper{padding:0!important;background:transparent!important}';doc.head.appendChild(clean);
   for(const page of wordContent.current.querySelectorAll('section.original-docx')){const clone=page.cloneNode(true);clone.style.margin='0';clone.style.boxShadow='none';clone.style.width=page.offsetWidth+'px';for(const editable of clone.querySelectorAll('[contenteditable]'))editable.removeAttribute('contenteditable');doc.body.replaceChildren(clone);await doc.fonts.ready;await Promise.all([...clone.querySelectorAll('img')].map(image=>image.decode().catch(()=>{})));const canvas=await html2canvas(clone,{scale:2,backgroundColor:'#ffffff',useCORS:true,logging:false});const width=page.offsetWidth*.75,height=Math.max(page.offsetHeight,page.scrollHeight)*.75;if(!pdf)pdf=new jsPDF({unit:'pt',format:[width,height],orientation:width>height?'landscape':'portrait'});else pdf.addPage([width,height],width>height?'landscape':'portrait');pdf.addImage(canvas.toDataURL('image/png'),'PNG',0,0,width,height);}
  }else{pdf=new jsPDF();const text=edits.text ?? new TextDecoder().decode(source.data);const lines=pdf.splitTextToSize(text,180);for(let offset=0;offset<lines.length;offset+=50){if(offset)pdf.addPage();pdf.setFont('courier');pdf.setFontSize(10);pdf.text(lines.slice(offset,offset+50),15,20);}}
  if(!pdf)throw new Error('No document pages are ready.');downloadCvBlob(pdf.output('blob'),source.name.replace(/\.[^.]+$/,'')+'-edited.pdf');
 }catch(err){setError(err.message || 'Could not export the document.');}finally{frame?.remove();setSaving(false);}}
 function addText(pageNumber,x,y){const id=crypto.randomUUID();const key='added:'+id;onChange({...source,annotations:[...annotations,{key,pageNumber,x,y,width:200,height:22,baseline:y+14,fontSize:14,family:'Arial',font:'14px Arial',text:'',background:'transparent',color:'#222'}],edits:{...edits,[key]:'New text'}});setSelected(key);setAdding(false);}
 return <section className="original-cv" aria-label="Original CV editor"><header className="original-cv-toolbar"><div><strong>Original format</strong><span>{source.name}</span></div><div className="original-cv-actions"><label>Zoom<select aria-label="Original CV zoom" value={zoom} onChange={event=>setZoom(event.target.value)}>{['fit','50','75','100','125'].map(value=><option key={value} value={value}>{value==='fit'?'Fit page':value+'%'}</option>)}</select></label>{source.type==='pdf' && <button disabled={loading || saving} className={adding?'active':''} onClick={()=>setAdding(value=>!value)}>{adding?'Click page to place text':'Add text'}</button>}<button disabled={loading || saving || !changed} onClick={()=>{if(window.confirm('Discard edits and restore the uploaded document?')){onChange({...source,edits:{},annotations:[]});setRenderKey(value=>value+1);}}}>Reset edits</button>{source.type!=='pdf' && <button disabled={loading || saving} onClick={downloadNative}>Download {source.type==='docx'?'Word':'text'}</button>}<button disabled={loading || saving} className="original-cv-download" onClick={downloadPdf}>{saving?'Preparing file...':'Download PDF'}</button></div></header>
  <p className="original-cv-help">{source.type==='pdf'?'Click a text line to change it in its original position. For image-only pages, use Add text. Edited PDFs download as image-based PDFs.':source.type==='docx'?'Click the document text to edit it. Word downloads keep the original styles, tables, images and page settings. Complex Word layouts may look slightly different in browser preview.':'Edit your original text below. Line breaks are preserved.'} Choose a template above only when you want a new design.</p>
  {error && <p className="original-cv-error" role="alert">{error}</p>}{loading && <LoadingSpinner label="Opening your original document..." className="loading-block" />}
  <div className="original-cv-workspace">
  <aside className="original-cv-details" aria-label="Edit CV details">
    <h2>Edit details</h2>
    {source.type==='txt'?<label>CV text<textarea ref={detailsInput} aria-label="Edit CV details text" value={edits.text ?? new TextDecoder().decode(source.data)} onChange={event=>onEdit('text',event.target.value,new TextDecoder().decode(source.data))}/></label>:selectedItem?<>
      <label htmlFor="original-pdf-text">Edit selected text<textarea ref={detailsInput} id="original-pdf-text" aria-label="Edit selected text" rows={7} value={edits[selectedItem.key] ?? selectedItem.text} onChange={event=>changeSelected(event.target.value)}/></label>
      <div className="original-details-actions"><button onClick={()=>changeSelected(selectedItem.text)}>Reset text</button><button onClick={()=>setSelected(null)}>Done</button></div>
    </>:<p>Click text in your CV to edit it here.</p>}
  </aside>
  <div className="original-cv-viewport"><div key={source.id} ref={host} className="original-cv-content" style={{width:pageWidth,zoom:scale}}>{source.type==='pdf' && displayScenes.map(scene=><PdfPage key={scene.pageNumber} scene={scene} edits={edits} selected={selected} onSelect={selectDetail} onAdd={addText} adding={adding}/>)}{source.type==='txt' && <textarea className="original-text-file" aria-label="Edit original CV text" value={edits.text ?? new TextDecoder().decode(source.data)} onChange={event=>onEdit('text',event.target.value,new TextDecoder().decode(source.data))}/>}</div></div>
  </div>
 </section>;
}
