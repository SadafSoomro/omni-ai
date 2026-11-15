import {createOcrWorker} from '../../services/ocr';
import {useEffect,useRef,useState} from 'react';
import {useUsage} from '../../context/UsageContext';
import {translatorAPI} from '../../services/api';
import {prepareScanFile} from '../../services/documentScanner';
import {LANGUAGES} from '../../services/translationLanguages';
import LoadingSpinner from '../../components/LoadingSpinner';
import './AiTranslator.css';
import './TranslatorRefinements.css';

const OCR_LANGUAGES={en:'eng',ur:'urd',es:'spa',fr:'fra',de:'deu',ar:'ara',hi:'hin',zh:'chi_sim',ja:'jpn',ru:'rus',pt:'por',it:'ita',tr:'tur',ko:'kor'};
const isRtl=code=>['ar','ur'].includes(code);
const language=code=>LANGUAGES.find(item=>item.code===code);
function ModeIcon({mode}) {
 return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={mode==='type'?'M4 5h16M12 5v14M8 19h8':mode==='speak'?'M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0ZM5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8':'M3 4h18v16H3ZM3 16l6-6 5 5 3-3 4 4M16 8h.01'} /></svg>;
}

export default function TranslatorWorkspace(){
 const consumeUsage=useUsage();
 const [activeTab,setActiveTab]=useState('type'),[sourceLang,setSourceLang]=useState('en'),[targetLang,setTargetLang]=useState('ur');
 const [inputText,setInputText]=useState(''),[translatedText,setTranslatedText]=useState(''),[error,setError]=useState(''),[copied,setCopied]=useState(false);
 const [isTranslating,setIsTranslating]=useState(false),[isListening,setIsListening]=useState(false),[micStarting,setMicStarting]=useState(false),[isTranscribing,setIsTranscribing]=useState(false);
 const [isOcrProcessing,setIsOcrProcessing]=useState(false),[ocrProgress,setOcrProgress]=useState(''),[imagePreview,setImagePreview]=useState(null),[isSpeaking,setIsSpeaking]=useState(false);
 const [voices,setVoices]=useState(()=>window.speechSynthesis?.getVoices() || []),[preparingSpeech,setPreparingSpeech]=useState(false);
 const audioRef=useRef(null),audioUrlRef=useRef(null),speechRequest=useRef(null),speechVersion=useRef(0);
 const mounted=useRef(true),requestRef=useRef(null),workerRef=useRef(null),recorderRef=useRef(null),streamRef=useRef(null),operationLock=useRef(false),translationLock=useRef(false),discardRecording=useRef(false),timerRef=useRef(null),copyTimer=useRef(null);
 const imageInputRef=useRef(null),audioInputRef=useRef(null);
 const busy=isTranslating || isOcrProcessing || isTranscribing || isListening || micStarting;
 useEffect(()=>{
  mounted.current=true;const synth=window.speechSynthesis;const refresh=()=>setVoices(synth?.getVoices() || []);synth?.addEventListener('voiceschanged',refresh);refresh();
  return()=>{mounted.current=false;speechVersion.current++;speechRequest.current?.abort();audioRef.current?.pause();if(audioUrlRef.current)URL.revokeObjectURL(audioUrlRef.current);requestRef.current?.abort();workerRef.current?.terminate().catch(()=>{});clearTimeout(timerRef.current);clearTimeout(copyTimer.current);if(recorderRef.current){recorderRef.current.onstop=null;if(recorderRef.current.state!=='inactive')recorderRef.current.stop();}streamRef.current?.getTracks().forEach(track=>track.stop());synth?.cancel();synth?.removeEventListener('voiceschanged',refresh);};
 },[]);
 const stopAudio=()=>{speechVersion.current++;speechRequest.current?.abort();speechRequest.current=null;audioRef.current?.pause();audioRef.current=null;if(audioUrlRef.current)URL.revokeObjectURL(audioUrlRef.current);audioUrlRef.current=null;window.speechSynthesis?.cancel();setIsSpeaking(false);setPreparingSpeech(false);};
 const updateInput=text=>{setInputText(text);setTranslatedText('');setCopied(false);stopAudio();};

 async function performTranslation(text=inputText,from=sourceLang,to=targetLang){
  if(translationLock.current)return;
  if(!text.trim()){setError('Enter some text to translate.');return;}
  if(text.length>6000){setError('Keep your text under 6,000 characters. Your text has been kept.');return;}
  setError('');setCopied(false);stopAudio();
  if(from===to){if(await consumeUsage())setTranslatedText(text.trim());return;}
  // Check allowance before setting loading, so a rejected request never leaves it stuck.
  if(!(await consumeUsage({server:true})))return;
  translationLock.current=true;setIsTranslating(true);setTranslatedText('');
  const controller=new AbortController();requestRef.current=controller;
  try{const data=await translatorAPI.translate({text,sourceLang:from,targetLang:to},controller.signal);if(mounted.current){if(!data.translatedText?.trim())throw new Error('No translation was returned. Please try again.');setTranslatedText(data.translatedText);}}
  catch(err){if(mounted.current)setError(err.message || 'Translation failed. Please try again.');}
  finally{translationLock.current=false;if(requestRef.current===controller)requestRef.current=null;if(mounted.current)setIsTranslating(false);}
 }

 function swapLanguages(){stopAudio();setSourceLang(targetLang);setTargetLang(sourceLang);setInputText(translatedText || inputText);setTranslatedText(translatedText?inputText:'');setError('');setCopied(false);}
 async function speakText(text,code){
  if(isSpeaking){stopAudio();return;}
  const available=voices.length?voices:(window.speechSynthesis?.getVoices() || []);
  const voice=available.find(item=>item.lang.replace('_','-').toLowerCase()===language(code).speechCode.toLowerCase()) || available.find(item=>item.lang.toLowerCase().split(/[-_]/)[0]===code);
  if(!(await consumeUsage({server:!voice || !window.SpeechSynthesisUtterance})))return;
  if(!voice || !window.SpeechSynthesisUtterance){
   stopAudio();setError('');setIsSpeaking(true);setPreparingSpeech(true);const version=++speechVersion.current,controller=new AbortController();speechRequest.current=controller;
   try {
    const data=await translatorAPI.speech({text,language:code},controller.signal);if(!mounted.current || version!==speechVersion.current)return;
    const bytes=Uint8Array.from(atob(data.audio),character=>character.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:data.mimeType}));audioUrlRef.current=url;const audio=new Audio(url);audioRef.current=audio;
    audio.onended=()=>{if(mounted.current && version===speechVersion.current)stopAudio();};audio.onerror=()=>{if(mounted.current && version===speechVersion.current){stopAudio();setError('Audio could not play. Please try Listen again.');}};
    setPreparingSpeech(false);await audio.play();
   }catch(err){if(mounted.current && version===speechVersion.current){stopAudio();setError(err.message || 'Audio could not be generated. Please try again.');}}
   finally{if(speechRequest.current===controller)speechRequest.current=null;}
   return;
  }
  stopAudio();setError('');const utterance=new SpeechSynthesisUtterance(text);utterance.voice=voice;utterance.lang=voice.lang;utterance.rate=.95;
  utterance.onstart=()=>{if(mounted.current)setIsSpeaking(true);};utterance.onend=()=>{if(mounted.current)setIsSpeaking(false);};utterance.onerror=event=>{if(mounted.current){setIsSpeaking(false);if(!['canceled','interrupted'].includes(event.error))setError('Audio could not play. Try another installed voice or browser.');}};
  window.speechSynthesis.speak(utterance);
 }
 async function handleCopy(){
  try {
   try{await navigator.clipboard.writeText(translatedText);}
   catch{const previous=document.activeElement,field=document.createElement('textarea');field.value=translatedText;field.style.cssText='position:fixed;left:-9999px;top:0';document.body.appendChild(field);field.focus();field.select();let copied=false;try{copied=document.execCommand('copy');}finally{field.remove();previous?.focus();}if(!copied)throw new Error('Clipboard unavailable');}
   if(!mounted.current)return;setCopied(true);setError('');clearTimeout(copyTimer.current);copyTimer.current=setTimeout(()=>{if(mounted.current)setCopied(false);},2000);
  }catch{setError('Clipboard is unavailable. Select the translation and copy it manually.');}
 }

 async function transcribeAudio(file,alreadyLocked=false){
  if(!file || (operationLock.current && !alreadyLocked))return;
  if(file.size>4*1024*1024){setError('Choose an audio file no larger than 4 MB.');operationLock.current=false;return;}
  if(!/\.(mp3|wav|m4a|ogg|webm|flac|aac)$/i.test(file.name)){setError('Choose MP3, WAV, M4A, OGG, WebM, FLAC or AAC audio.');operationLock.current=false;return;}
  operationLock.current=true;setIsTranscribing(true);setError('');setTranslatedText('');stopAudio();
  const controller=new AbortController();requestRef.current=controller;
  try{const data=await translatorAPI.transcribe(file,controller.signal);if(!mounted.current)return;const text=data.transcript?.trim();if(!text || text==='[No speech detected]')throw new Error('No clear speech was detected. Try recording again in a quieter place.');setInputText(text);await performTranslation(text);}
  catch(err){if(mounted.current)setError(err.message || 'Audio could not be transcribed.');}
  finally{operationLock.current=false;if(requestRef.current===controller)requestRef.current=null;if(mounted.current)setIsTranscribing(false);}
 }
 async function startRecording(){
  if(busy || operationLock.current)return;
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){setError('Recording is unavailable in this browser. Upload an audio file instead, or open this page on HTTPS.');return;}
  operationLock.current=true;discardRecording.current=false;setMicStarting(true);setError('');stopAudio();
  try{
   const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(!mounted.current){stream.getTracks().forEach(track=>track.stop());return;}streamRef.current=stream;
   const mime=['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(value=>MediaRecorder.isTypeSupported(value));
   const recorder=new MediaRecorder(stream,mime?{mimeType:mime}:undefined);recorderRef.current=recorder;const chunks=[];
   recorder.ondataavailable=event=>{if(event.data.size)chunks.push(event.data);};
   recorder.onerror=()=>{discardRecording.current=true;stream.getTracks().forEach(track=>track.stop());clearTimeout(timerRef.current);operationLock.current=false;if(mounted.current){setIsListening(false);setError('Recording failed. Upload an audio file instead.');}};
   recorder.onstop=async()=>{clearTimeout(timerRef.current);stream.getTracks().forEach(track=>track.stop());streamRef.current=null;recorderRef.current=null;if(!mounted.current)return;setIsListening(false);if(discardRecording.current){operationLock.current=false;return;}const type=recorder.mimeType || 'audio/webm',ext=type.includes('mp4')?'m4a':'webm';const blob=new Blob(chunks,{type});if(!blob.size){operationLock.current=false;setError('No audio was recorded. Please try again.');return;}await transcribeAudio(new File([blob],'recording.'+ext,{type}),true);};
   recorder.start(250);setIsListening(true);timerRef.current=setTimeout(()=>{if(recorder.state==='recording')recorder.stop();},60000);
  }catch(err){streamRef.current?.getTracks().forEach(track=>track.stop());operationLock.current=false;if(mounted.current)setError(err.name==='NotAllowedError'?'Microphone permission was denied. Allow access or upload an audio file.':err.name==='NotFoundError'?'No microphone found. Upload an audio file instead.':'The microphone could not start. Check whether another app is using it.');}
  finally{if(mounted.current)setMicStarting(false);}
 }
 function stopRecording(cancel=false){discardRecording.current=cancel;clearTimeout(timerRef.current);if(recorderRef.current?.state==='recording')recorderRef.current.stop();}

 async function handleImageUpload(event){
  const file=event.target.files?.[0];event.target.value='';if(!file || operationLock.current || busy)return;
  if(file.size>10*1024*1024){setError('Choose an image no larger than 10 MB.');return;}
  operationLock.current=true;setIsOcrProcessing(true);setOcrProgress('Preparing image');setError('');setTranslatedText('');setInputText('');stopAudio();let worker;
  try{
   const url=await prepareScanFile(file);if(!mounted.current)return;setImagePreview(url);
   worker=await createOcrWorker(OCR_LANGUAGES[sourceLang],message=>{if(mounted.current)setOcrProgress(message.status==='recognizing text'?'Reading image '+Math.round((message.progress || 0)*100)+'%':'Preparing '+language(sourceLang).name+' recognition');});
   if(!mounted.current)return;workerRef.current=worker;const result=await worker.recognize(url);if(!mounted.current)return;
   const text=result.data.text.trim();if(!text)throw new Error('No readable text found. Try a clearer photo and select the language used in the image.');setInputText(text);await performTranslation(text);
  }catch(err){if(mounted.current)setError(err.message || 'Image text could not be read. Please try again.');}
  finally{await worker?.terminate().catch(()=>{});if(workerRef.current===worker)workerRef.current=null;operationLock.current=false;if(mounted.current){setIsOcrProcessing(false);setOcrProgress('');}}
 }

 return <div className="translator-container"><main className="translator-main-area">
  <header className="translator-header"><span className="translator-eyebrow">14 LANGUAGES · ONE WORKSPACE</span><h1 className="trans-title">Multilingual AI Translator</h1><p className="translator-subtitle">Translate your words, voice, and document photos.</p></header>
  <div className="trans-mode-tabs" role="tablist" aria-label="Translation mode">{[['type','Type to Speak'],['speak','Voice'],['image','Image OCR']].map(([mode,label])=><button key={mode} type="button" role="tab" id={'translator-tab-'+mode} aria-selected={activeTab===mode} aria-controls="translator-workspace" disabled={busy} className={'mode-tab '+(activeTab===mode?'active':'')} onClick={()=>{stopAudio();setActiveTab(mode);setError('');}}><ModeIcon mode={mode}/><span>{label}</span></button>)}</div>
  <section id="translator-workspace" className="trans-main-card" role="tabpanel" aria-labelledby={'translator-tab-'+activeTab}>
   <div className="language-selector-bar"><label className="lang-box"><span className="lang-box-label">Translate from</span><select className="lang-select" aria-label="Source language" value={sourceLang} disabled={busy} onChange={event=>{stopAudio();setSourceLang(event.target.value);setTranslatedText('');setError('');}}>{LANGUAGES.map(item=><option key={item.code} value={item.code}>{item.name}{item.native!==item.name?' ('+item.native+')':''}</option>)}</select></label><button type="button" className="btn-swap-langs" disabled={busy} onClick={swapLanguages} aria-label="Swap languages">⇄</button><label className="lang-box"><span className="lang-box-label">Translate to</span><select className="lang-select" aria-label="Target language" value={targetLang} disabled={busy} onChange={event=>{stopAudio();setTargetLang(event.target.value);setTranslatedText('');setError('');}}>{LANGUAGES.map(item=><option key={item.code} value={item.code}>{item.name}{item.native!==item.name?' ('+item.native+')':''}</option>)}</select></label></div>
   {error && <p className="translator-error" role="alert">{error}</p>}
   {activeTab==='speak' && <div className={'translator-voice-card '+(isListening?'recording':'')}><div className="translator-mode-icon"><ModeIcon mode="speak"/></div><div className="translator-mode-copy"><h2>{isListening?'Recording your voice…':'Speak in '+language(sourceLang).name}</h2><p>{isListening?'Stop when you finish. Recordings are limited to 60 seconds.':'Record a message or upload audio. We will transcribe and translate it.'}</p></div><div className="translator-voice-actions">{isListening?<><button type="button" className="translator-small-primary" onClick={()=>stopRecording()}>Stop & translate</button><button type="button" className="btn-panel-action" onClick={()=>stopRecording(true)}>Cancel</button></>:<button type="button" className="translator-small-primary" disabled={busy} onClick={startRecording}>{micStarting || isTranscribing?<LoadingSpinner label={micStarting?'Starting microphone':'Transcribing audio'}/>:<><ModeIcon mode="speak"/>Record voice</>}</button>}<button type="button" className="translator-upload-audio" disabled={busy} onClick={()=>audioInputRef.current?.click()}>Upload audio</button><input ref={audioInputRef} type="file" hidden accept=".mp3,.wav,.m4a,.ogg,.webm,.flac,.aac" onChange={event=>{const file=event.target.files?.[0];event.target.value='';transcribeAudio(file);}}/></div></div>}
   {activeTab==='image' && <div className="translator-image-card"><div className="translator-mode-icon">{imagePreview?<img src={imagePreview} alt="Selected document for text recognition"/>:<ModeIcon mode="image"/>}</div><div className="translator-mode-copy"><h2>{imagePreview?'Your document image':'Translate text in a picture'}</h2><p>{isOcrProcessing?ocrProgress:'Select '+language(sourceLang).name+' as the source for '+language(sourceLang).name+' text. JPG, PNG or WebP · up to 10 MB.'}</p></div><button type="button" className="translator-small-primary" disabled={busy} onClick={()=>imageInputRef.current?.click()}>{isOcrProcessing?<LoadingSpinner label={ocrProgress}/>:imagePreview?'Change image':'Choose image'}</button><input ref={imageInputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/bmp" onChange={handleImageUpload}/></div>}
   <div className="trans-boxes-grid"><div className="trans-panel source-panel"><div className="panel-top"><label className="panel-title" htmlFor="translator-source-text">{language(sourceLang).name}</label>{inputText && <button type="button" className="btn-panel-action" disabled={busy} onClick={()=>{updateInput('');setError('');}}>Clear text</button>}</div><textarea id="translator-source-text" className="trans-textarea" dir={isRtl(sourceLang)?'rtl':'auto'} maxLength={6000} disabled={busy} value={inputText} onChange={event=>updateInput(event.target.value)} placeholder={activeTab==='speak'?'Your spoken words will appear here. You can also type.':activeTab==='image'?'Text from your image will appear here. You can edit it before translating.':'Enter the text you want to translate…'}/><div className="panel-bottom-tools"><button type="button" className="btn-tts" disabled={!inputText.trim() || busy} onClick={()=>speakText(inputText,sourceLang)}>Listen</button><span className="char-count">{inputText.length.toLocaleString()} / 6,000</span></div></div>
   <div className="trans-panel target-panel"><div className="panel-top"><span className="panel-title">{language(targetLang).name}</span><span className="translator-result-tag">Translation</span></div><div className="target-text-display" aria-live="polite" aria-busy={isTranslating} dir={isRtl(targetLang)?'rtl':'auto'}>{isTranslating?<LoadingSpinner label="Translating your text" className="loading-block"/>:translatedText?<p className="translated-result-text">{translatedText}</p>:<span className="target-placeholder">Your translation will appear here.</span>}</div><div className="panel-bottom-tools"><div className="target-action-btns"><button type="button" className="btn-tts primary" disabled={!translatedText || busy} onClick={()=>speakText(translatedText,targetLang)}>{isSpeaking?'Stop audio':'Listen'}</button><button type="button" className="btn-copy" disabled={!translatedText || busy} onClick={handleCopy}>{copied?'Copied':'Copy text'}</button></div></div></div></div>
   <div className="trans-action-footer"><span className="translator-footer-note">{activeTab==='image'?'Review the extracted text for accuracy.':activeTab==='speak'?'Your transcript stays editable.':'Meaning and formatting, in another language.'}</span><button type="button" className="btn-translate-now" disabled={!inputText.trim() || busy} onClick={()=>performTranslation()}>{isTranslating?<LoadingSpinner label="Translating"/>:'Translate text'}<span aria-hidden="true">→</span></button></div>
  </section>
 </main></div>;
}
