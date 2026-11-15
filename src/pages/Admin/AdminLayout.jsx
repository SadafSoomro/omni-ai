import LoadingSpinner from '../../components/LoadingSpinner';
import {useEffect,useRef,useState} from 'react';
import {Navigate,useLocation,useNavigate,useSearchParams} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import BrandLogo from '../../components/BrandLogo/BrandLogo';
import AdminDashboard from './AdminDashboard';
import './AdminShell.css';
const sections=[['overview','Overview','M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z'],['users','Users','M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87'],['subscriptions','Subscriptions','M3 6h18v14H3Z M3 10h18 M7 15h4'],['plans','Plans','M12 3 3 9l9 12 9-12Z M3 9h18 M8 9l4 12 4-12'],['reports','Reports','M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z M12 7v5 M12 15h.01']];
export default function AdminLayout(){
 const {user,token,isLoading,logout}=useAuth();const location=useLocation();const navigate=useNavigate();const [params]=useSearchParams();const tab=sections.some(([key])=>key===params.get('tab'))?params.get('tab'):'overview';
 const [open,setOpen]=useState(false);const [theme,setTheme]=useState(()=>localStorage.getItem('ai_theme') || 'light');const panel=useRef(null),toggle=useRef(null);
 useEffect(()=>{document.documentElement.setAttribute('data-theme',theme);document.documentElement.classList.toggle('light-theme',theme==='light');document.body.setAttribute('data-theme',theme);document.body.classList.toggle('light-theme',theme==='light');localStorage.setItem('ai_theme',theme);},[theme]);
 useEffect(()=>{if(!open)return;panel.current?.querySelector('button')?.focus();const onKey=event=>{if(event.key==='Escape'){setOpen(false);toggle.current?.focus();}if(event.key==='Tab'){const items=panel.current?.querySelectorAll('button');const first=items?.[0],last=items?.[items.length-1];if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}}};document.addEventListener('keydown',onKey);return()=>document.removeEventListener('keydown',onKey);},[open]);
 const signOut=()=>{logout();navigate('/login',{replace:true});};
 if(isLoading)return <main className="admin-access"><LoadingSpinner label="Checking administrator access..." className="loading-block" /></main>;
 if(!token)return <Navigate to="/login" replace state={{from:location.pathname+location.search}} />;
 if(user?.role!=='admin')return <main className="admin-access"><BrandLogo showWordmark/><h1>Access restricted</h1><p>This control center is available to administrators only.</p><button className="account-button" onClick={signOut}>Use administrator account</button></main>;
 return <div className="admin-shell">
  {open && <button className="admin-mobile-backdrop" aria-label="Close admin navigation" onClick={()=>setOpen(false)}/>}
  <aside ref={panel} className={'admin-sidebar '+(open?'is-open':'')} aria-label="Admin navigation"><div className="admin-brand"><BrandLogo size={34} showWordmark/><span>ADMIN</span><button className="admin-close-menu" aria-label="Close menu" onClick={()=>setOpen(false)}>&times;</button></div><p className="admin-nav-caption">MANAGEMENT</p><nav aria-label="Admin sections">{sections.map(([key,name,icon])=><button key={key} aria-current={tab===key?'page':undefined} className={tab===key?'selected':''} onClick={()=>{navigate('/admin'+(key==='overview'?'':'?tab='+key));setOpen(false);}}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={icon}/></svg>{name}</button>)}</nav><div className="admin-sidebar-footer"><span className="admin-security-dot"/>Administrator access<div>{user.email}</div></div></aside>
  <div className="admin-main"><header className="admin-topbar"><div><button ref={toggle} className="admin-menu-toggle" aria-label="Open admin navigation" aria-expanded={open} onClick={()=>setOpen(value=>!value)}>&#9776;</button><span>Control center <span className="admin-breadcrumb-divider">/</span><strong>{sections.find(([key])=>key===tab)?.[1]}</strong></span></div><div className="admin-topbar-actions"><button aria-label="Toggle admin theme" onClick={()=>setTheme(theme==='light'?'dark':'light')}>{theme==='light'?'Dark mode':'Light mode'}</button><span className="admin-avatar" title={user.email}>{user.name?.[0] || 'A'}</span><button onClick={signOut}>Sign out</button></div></header><AdminDashboard key={tab}/></div>
 </div>;
}
