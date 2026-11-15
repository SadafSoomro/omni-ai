import { toolFetch } from './toolAccess'
import {API_BASE_URL} from './config'

export const chatAPI = {
  send: async ({ message, history = [], token = null }) => {
    const response = await toolFetch(`${API_BASE_URL}/chat`, {method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({message,history})});
    const data=await response.json().catch(()=>({}));
    if(!response.ok || !data.reply)throw new Error(data.message || 'Could not generate a reply. Please try again.');
    return data;
  },
};
async function authRequest(path,options={}) {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
  try {
    const response=await toolFetch(API_BASE_URL+path,{...options,signal:controller.signal});
    const data=await response.json().catch(()=>({success:false,message:'The authentication server returned an invalid response.'}));
    return {...data,status:response.status};
  } finally {clearTimeout(timer);}
}
const authJson=(path,body)=>authRequest(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
export const authAPI={
  register:body=>authRequest('/auth/register',{method:'POST',body}),
  verifyCode:body=>authJson('/auth/verify-code',body),
  resendCode:body=>authJson('/auth/resend-code',body),
  login:body=>authJson('/auth/login',body),
  forgotPassword:body=>authJson('/auth/forgot-password',body),
  resetPassword:body=>authJson('/auth/reset-password',body),
  getMe:token=>authRequest('/auth/me',{headers:{Authorization:'Bearer '+token}}),
  updateProfile:(body,token)=>authRequest('/auth/profile',{method:'PUT',headers:{Authorization:'Bearer '+token},body}),
};
async function integrationRequest(path,{token,body,method,timeoutMs=15000}={}) {
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),timeoutMs);
  try {
  const response=await toolFetch(API_BASE_URL+path,{signal:controller.signal,method:method || (body===undefined?'GET':'POST'),headers:{'Accept-Language':'en',...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const data=await response.json();if(!response.ok) throw Object.assign(new Error(data.message || 'Request failed. Please try again.'),{status:response.status,code:data.code});return data;
  } catch(error) {
    if(error.name==='AbortError')throw new Error('The server took too long to respond. Please try again.');
    throw error;
  } finally {clearTimeout(timeout);}
}
export const googleAPI={config:()=>integrationRequest('/auth/google/config'),login:credential=>integrationRequest('/auth/google',{body:{credential}})};
export const cvAPI={importText:text=>integrationRequest('/cv/import',{body:{text},timeoutMs:60000})};
export const billingAPI={plans:()=>integrationRequest('/billing/plans'),details:(token,after)=>integrationRequest('/billing/details'+(after?'?after='+encodeURIComponent(after):''),{token}),subscription:token=>integrationRequest('/billing/subscription',{token}),checkout:(token,plan,billingCycle,planVersion)=>integrationRequest('/billing/checkout',{token,body:{plan,billingCycle,planVersion}}),confirm:(token,sessionId)=>integrationRequest('/billing/confirm',{token,body:{sessionId}}),portal:token=>integrationRequest('/billing/portal',{token,body:{}})};

export const feedbackAPI={list:(token,page=1)=>integrationRequest('/feedback?page='+page,{token}),submit:(token,body)=>integrationRequest('/feedback',{token,body})};

const queryString=query=>new URLSearchParams(Object.entries(query).filter(([,value])=>value!==undefined && value!==null)).toString();
export const adminAPI={
  revenue:(token,days)=>integrationRequest('/admin/revenue?days='+days,{token}),
  plans:token=>integrationRequest('/admin/plans',{token}),
  updatePlan:(token,id,body)=>integrationRequest('/admin/plans/'+id,{token,method:'PUT',body}),
  overview:(token,days)=>integrationRequest('/admin/overview?days='+days,{token}),
  users:(token,query)=>integrationRequest('/admin/users?'+queryString(query),{token}),
  reports:(token,query)=>integrationRequest('/admin/reports?'+queryString(query),{token}),
  setUserStatus:(token,id,isSuspended)=>integrationRequest('/admin/users/'+id+'/status',{token,method:'PUT',body:{isSuspended}}),
  syncSubscription:(token,id)=>integrationRequest('/admin/users/'+id+'/sync-subscription',{token,body:{}}),
  updateReport:(token,id,status,reply)=>integrationRequest('/admin/reports/'+id,{token,method:'PUT',body:{status,reply}}),
};

export const careerAPI={analyze:body=>integrationRequest('/career/analyze',{body,timeoutMs:60000}),evaluate:body=>integrationRequest('/career/evaluate',{body,timeoutMs:60000})};

async function translatorRequest(path,body,signal) {
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
  const cancel=()=>controller.abort();
  if(signal?.aborted)controller.abort();else signal?.addEventListener('abort',cancel,{once:true});
  try {
    const multipart=body instanceof FormData;
    const response=await toolFetch(API_BASE_URL+path,{method:'POST',signal:controller.signal,headers:multipart?{}:{'Content-Type':'application/json'},body:multipart?body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.message || 'The request could not be completed. Please try again.');
    return data;
  }catch(error){if(error.name==='AbortError')throw new Error(signal?.aborted?'Request cancelled.':'The server took too long to respond. Please try again.');throw error;}
  finally{clearTimeout(timer);signal?.removeEventListener('abort',cancel);}
}
export const translatorAPI={translate:(body,signal)=>translatorRequest('/translate',body,signal),speech:(body,signal)=>translatorRequest('/translate/speech',body,signal),transcribe:(file,signal)=>{const body=new FormData();body.append('audio',file);return translatorRequest('/voice/transcribe',body,signal);}};
