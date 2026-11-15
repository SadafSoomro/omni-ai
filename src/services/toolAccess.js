import {API_BASE_URL as API} from './config';
let permits=[];
const featuresFor=url=>{
  const path=new URL(url,window.location.href).pathname;
  if(/\/chat\/?$/.test(path))return ['ai-chat','ai-file'];
  if(/\/cv\/import$/.test(path))return ['cv-maker'];
  if(/\/career\//.test(path))return ['ai-career'];
  if(/\/presentation\/generate$/.test(path))return ['ai-presentation'];
  if(/\/voice\/transcribe$/.test(path))return ['ai-voice','ai-translator'];
  if(/\/translate(?:\/|$)/.test(path))return ['ai-translator'];
  return [];
};
export function reportAccess(state){window.dispatchEvent(new CustomEvent('omni-tool-access',{detail:state}));}
export function clearToolPermits(){permits=[];}
export async function requestToolAccess(feature,token,server=false,{checkOnly=false}={}){
  const response=await fetch(API+'/usage'+(checkOnly?'?feature='+encodeURIComponent(feature):'/consume'),{credentials:'include',method:checkOnly?'GET':'POST',headers:{...(token?{Authorization:'Bearer '+token}:{}),...(!checkOnly?{'Content-Type':'application/json'}:{})},...(!checkOnly?{body:JSON.stringify({feature,server})}:{}),signal:AbortSignal.timeout(15000)});
  const data=await response.json();
  if(!checkOnly && data.allowed && data.permit){permits=permits.filter(p=>p.expires>Date.now());permits.push({feature,token:token || '',permit:data.permit,expires:Date.now()+290000});}
  if(!response.ok && !['LOGIN_REQUIRED','SUBSCRIPTION_REQUIRED'].includes(data.code))throw new Error(data.message || 'Unable to check access. Please retry.');
  return data;
}
export async function toolFetch(url,options={}){
  const features=featuresFor(url);
  if(!features.length)return fetch(url,options);
  const headers=new Headers(options.headers);
  const token=headers.get('Authorization')?.replace(/^Bearer /,'') || localStorage.getItem('token') || '';
  if(token)headers.set('Authorization','Bearer '+token);
  permits=permits.filter(p=>p.expires>Date.now() && p.token===token);
  const currentFeature=window.location.pathname.replace(/^\//,'');
  const selectedFeature=features.includes(currentFeature)?currentFeature:features[0];
  const index=permits.findIndex(p=>p.feature===selectedFeature);
  if(index>=0)headers.set('X-Usage-Permit',permits.splice(index,1)[0].permit);
  const response=await fetch(url,{...options,headers,credentials:'include',signal:options.signal || AbortSignal.timeout(60000)});
  if(!response.ok){const data=await response.clone().json().catch(()=>({}));if(['LOGIN_REQUIRED','SUBSCRIPTION_REQUIRED','ACCOUNT_SUSPENDED'].includes(data.code))reportAccess(data);}
  return response;
}
