export async function createOcrWorker(languages,logger){
  const {createWorker}=await import('tesseract.js');
  let fail,timer,finished=false;
  const failure=new Promise((_,reject)=>{fail=reject;timer=setTimeout(()=>reject(new Error('Text recognition could not start. Please try again.')),45000);});
  const loading=createWorker(languages,1,{
    workerPath:new URL('tesseract.js/dist/worker.min.js',import.meta.url).href,
    corePath:new URL('tesseract.js-core/tesseract-core-lstm.wasm.js',import.meta.url).href,
    langPath:new URL('/ocr/lang',window.location.origin).href,
    gzip:true,
    logger,
    errorHandler:error=>fail(new Error(String(error || 'Text recognition failed.'))),
  });
  loading.then(worker=>{if(finished)worker.terminate();}).catch(()=>{});
  try{return await Promise.race([loading,failure]);}finally{finished=true;clearTimeout(timer);}
}
