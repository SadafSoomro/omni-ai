import {useEffect,useState} from 'react';
import {getPwaState,installPwa,updatePwa} from '../pwa';
export default function PwaControls(){
 const [state,setState]=useState(getPwaState),[help,setHelp]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const refresh=()=>setState(getPwaState());window.addEventListener('omni-pwa-change',refresh);return()=>window.removeEventListener('omni-pwa-change',refresh);},[]);
 async function install(){setError('');if(!state.canInstall){setHelp(value=>!value);return;}try{await installPwa();}catch{setError('Installation could not start. Try your browser menu.');}}
 return <section className="pwa-settings" aria-label="Install Omni AI"><div><h2>{state.installed?'Omni AI is installed':'Install Omni AI'}</h2><p>{state.installed?'Open Omni AI from your home screen.':'Add Omni AI to your device for quick access.'}</p></div><div className="account-actions">{!state.installed&&<button className="account-button" onClick={install}>Install Omni AI</button>}{state.canUpdate&&<button className="account-button secondary" onClick={updatePwa}>Update app</button>}</div>{!state.installed&&help&&<p role="status">Open your browser?s menu or Share options and choose Install app or Add to Home Screen.</p>}{error&&<p role="alert">{error}</p>}</section>;
}
