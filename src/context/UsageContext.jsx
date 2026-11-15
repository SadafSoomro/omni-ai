import {t} from '../utils/text'
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { requestToolAccess, clearToolPermits } from '../services/toolAccess'
import './UsageContext.css'

const UsageContext = createContext(null)
const toolPaths=new Set(['/ai-chat','/ai-file','/ai-voice','/ai-translator','/ai-presentation','/ai-career','/cam-scanner','/cv-maker','/word-to-pdf','/pdf-to-word','/file-size-converter','/file-converter'])
const featureFor=pathname=>(pathname==='/file-converter'?'/file-size-converter':pathname).replace(/^\//,'')

export function UsageProvider({ children }) {
  const { token, isLoading } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [blocked, setBlocked] = useState(null)
  const closeRef = useRef(null)
  const previousFocus = useRef(null)
  const pending = useRef(new Set())
  const activeRoute=useRef({pathname,token})
  activeRoute.current={pathname,token}
  const [checked,setChecked]=useState(null)
  const [refresh,setRefresh]=useState(0)
  const retry=()=>setRefresh(value=>value+1)
  useEffect(()=>{clearToolPermits();setBlocked(null)},[token,pathname])
  useEffect(()=>{const onAccess=event=>{if(!toolPaths.has(pathname) || event.detail.feature!==featureFor(pathname))return;setBlocked({...event.detail,from:pathname});setChecked({pathname,token,...event.detail,allowed:false})};window.addEventListener('omni-tool-access',onAccess);return()=>window.removeEventListener('omni-tool-access',onAccess)},[pathname,token])
  useEffect(()=>{
    if(isLoading || !toolPaths.has(pathname))return
    let cancelled=false
    requestToolAccess(featureFor(pathname),token,false,{checkOnly:true}).then(state=>{if(!cancelled){setChecked({pathname,token,...state});if(!state.allowed)setBlocked({...state,from:pathname})}}).catch(error=>{if(!cancelled)setChecked({pathname,token,allowed:false,code:'USAGE_UNAVAILABLE',message:error.message})})
    return()=>{cancelled=true}
  },[pathname,token,isLoading,refresh])

  useEffect(() => {
    if (!blocked) return
    previousFocus.current = document.activeElement
    closeRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') setBlocked(null)
      if (event.key === 'Tab') {
        const buttons = event.currentTarget.querySelectorAll('[data-usage-dialog] button')
        const first = buttons[0]
        const last = buttons[buttons.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previousFocus.current?.focus()
    }
  }, [blocked])

  const consume = async ({server=false}={}) => {
    const operationKey=JSON.stringify([token,featureFor(pathname)])
    if (isLoading || pending.current.has(operationKey)) return false
    pending.current.add(operationKey)
    try {
      const feature=featureFor(pathname)
      const result=await requestToolAccess(feature,token,server)
      if(!result.allowed && activeRoute.current.pathname===pathname && activeRoute.current.token===token){setBlocked({...result,from:pathname});setChecked({pathname,token,...result})}
      return Boolean(result.allowed)
    }catch(error){const state={code:'USAGE_UNAVAILABLE',message:error.message,allowed:false};if(activeRoute.current.pathname===pathname && activeRoute.current.token===token){setBlocked({...state,from:pathname});setChecked({pathname,token,...state})}return false}
    finally{pending.current.delete(operationKey)}
  }

  const restriction=toolPaths.has(pathname)?{checking:isLoading || checked?.pathname!==pathname || checked?.token!==token,blocked:checked?.pathname===pathname && checked?.token===token && !checked.allowed,code:checked?.code,message:checked?.message}:null
  return <UsageContext.Provider value={{consume,restriction,retry,openGate:()=>setBlocked({...checked,from:pathname})}}>
    {children}
    {blocked && <div className="usage-backdrop">
      <div className="usage-dialog" data-usage-dialog role="dialog" aria-modal="true" aria-labelledby="usage-title" aria-describedby="usage-description">
        <div className="usage-icon" aria-hidden="true">
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="5" y="10" width="14" height="11" rx="3" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
          </svg>
        </div>
        <h2 id="usage-title">{blocked.code==='SUBSCRIPTION_REQUIRED'?'Subscribe to continue':blocked.code==='LOGIN_REQUIRED'?'Log in to continue':'Unable to use this tool'}</h2>
        <p id="usage-description">{blocked.message || (blocked.code==='SUBSCRIPTION_REQUIRED'?"You've reached your usage limit. Subscribe to access more.":blocked.code==='LOGIN_REQUIRED'?"You've reached the guest usage limit. Please log in to access more.":'Access could not be verified. Please try again.')}</p>
        <div className="usage-actions">
          <button ref={closeRef} onClick={() => setBlocked(null)}>{t("Close")}</button>
          {blocked.code==='LOGIN_REQUIRED' && <button className="usage-primary" onClick={() => { setBlocked(null); navigate('/login', { state: { from: blocked.from } }) }}>Log in</button>}
          {blocked.code==='SUBSCRIPTION_REQUIRED' && <button className="usage-primary" onClick={() => { setBlocked(null); navigate('/subscription') }}>View subscription plans</button>}
        </div>
      </div>
    </div>}
  </UsageContext.Provider>
}

export function useUsage() {
  return useContext(UsageContext).consume
}
export function useToolRestriction(){return useContext(UsageContext)}
