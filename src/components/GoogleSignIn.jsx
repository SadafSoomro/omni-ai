import LoadingSpinner from './LoadingSpinner';
import {t} from '../utils/text'
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { googleAPI } from '../services/api';
let scriptPromise;
function loadGoogle(){
  if(window.google?.accounts?.id) return Promise.resolve();
  if(!scriptPromise) scriptPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://accounts.google.com/gsi/client';script.async=true;script.onload=resolve;script.onerror=()=>{scriptPromise=null;script.remove();reject(new Error('Google sign-in could not load. Check your connection.'));};document.head.appendChild(script);});
  return scriptPromise;
}
export default function GoogleSignIn(){
  const container=useRef(null);const {login}=useAuth();const navigate=useNavigate();const location=useLocation();
  const [error,setError]=useState('');const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);
  useEffect(()=>{
    let disposed=false;
    Promise.all([loadGoogle(),googleAPI.config()]).then(([,config])=>{
      if(disposed) return;
      if(!config.clientId) throw new Error('Google login is not configured.');
      window.google.accounts.id.initialize({client_id:config.clientId,auto_select:false,callback:async response=>{
        setBusy(true);setError('');
        try {const data=await googleAPI.login(response.credential);if(disposed)return;login(data.user,data.token);const from=location.state?.from;navigate(typeof from==='string' && from.startsWith('/') && !from.startsWith('//') ? from:(data.user?.role==='admin'?'/admin':'/'));}
        catch(err){if(!disposed)setError(err.message);}finally{if(!disposed)setBusy(false);}
      }});
      window.google.accounts.id.renderButton(container.current,{theme:'outline',size:'large',width:Math.min(360,container.current.clientWidth || 300),text:'continue_with',shape:'pill'});
      setLoading(false);
    }).catch(err=>{if(!disposed){setError(err.message);setLoading(false);}});
    return()=>{disposed=true;};
  },[login,navigate,location.state]);
  return <div style={{margin:'20px 0',display:'grid',justifyItems:'center',gap:10}}>
    <span style={{fontSize:13,color:'var(--text-secondary)'}}>{t("Or continue with Google")}</span>
    <div ref={container} style={{minHeight:44,width:'100%',maxWidth:360,pointerEvents:busy?'none':'auto'}} />
    {(loading || busy) && <LoadingSpinner label={busy ? 'Signing in' : 'Loading Google sign-in'} />}
    {error && <p role="alert" style={{color:'#f87171'}}>{t(error)}</p>}
  </div>;
}
