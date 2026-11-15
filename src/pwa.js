let promptEvent=null,waiting=null;
const notify=()=>window.dispatchEvent(new Event('omni-pwa-change'));
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();promptEvent=event;notify();});
window.addEventListener('appinstalled',()=>{promptEvent=null;notify();});
export function getPwaState(){return {canInstall:Boolean(promptEvent),canUpdate:Boolean(waiting),installed:window.matchMedia('(display-mode: standalone)').matches || Boolean(navigator.standalone)};}
export async function installPwa(){if(!promptEvent)return false;const event=promptEvent;promptEvent=null;await event.prompt();const choice=await event.userChoice;notify();return choice.outcome==='accepted';}
export function updatePwa(){waiting?.postMessage({type:'ACTIVATE_UPDATE'});}
export function registerPwa(){
 if(!import.meta.env.PROD || !('serviceWorker' in navigator))return;
 let refreshing=false,hadController=Boolean(navigator.serviceWorker.controller);
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(!hadController){hadController=true;return;}if(refreshing)return;refreshing=true;window.location.reload();});
 const register=async()=>{try{const registration=await navigator.serviceWorker.register('/sw.js',{updateViaCache:'none'});if(registration.waiting){waiting=registration.waiting;notify();}registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller){waiting=registration.waiting || worker;notify();}});});}catch(error){console.warn('App installation is unavailable:',error.message);}};
 if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
}
