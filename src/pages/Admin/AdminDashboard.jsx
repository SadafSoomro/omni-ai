import LoadingSpinner from '../../components/LoadingSpinner';
import AdminOverview from './AdminOverview';
import PlanManager from './PlanManager';
import {useEffect,useState} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {adminAPI} from '../../services/api';
import '../Account/Account.css';
import './AdminDashboard.css';
const tabs=['overview','users','subscriptions','plans','reports'];
const label=value=>String(value || 'none').replaceAll('_',' ').replace(/\b[a-z]/g,letter=>letter.toUpperCase());
const date=value=>value?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value)):'Not scheduled';
function ReportEditor({report,onSave,busy}){
  const [status,setStatus]=useState(report.status);const [reply,setReply]=useState(report.reply || '');
  return <article className="admin-report"><div className="account-section-head"><div><h3>{report.subject}</h3><p className="account-note">{report.user?.name || 'Deleted user'} ? <bdi>{report.user?.email || ''}</bdi> ? {label(report.category)}</p></div><span className="account-status">{label(report.status)}</span></div><p className="admin-report-message">{report.message}</p><div className="admin-report-meta"><span>{date(report.createdAt)}</span><code>{report.page || 'No page specified'}</code><span>#{String(report._id).slice(-8).toUpperCase()}</span></div>
    <form className="admin-reply" onSubmit={event=>{event.preventDefault();onSave(report._id,status,reply);}}><label>Status<select aria-label={'Status for '+report.subject} value={status} onChange={event=>setStatus(event.target.value)} disabled={busy}>{['received','in_review','resolved'].map(value=><option key={value} value={value}>{label(value)}</option>)}</select></label><label>Reply to user<textarea aria-label={'Reply for '+report.subject} rows={3} maxLength={5000} value={reply} onChange={event=>setReply(event.target.value)} disabled={busy} placeholder="This reply will appear in the user's report history." /></label><button className="account-button" disabled={busy} type="submit">{busy?'Saving...':'Save report'}</button></form>
  </article>;
}
export default function AdminDashboard(){
  const {user,token,isLoading:authLoading}=useAuth();const [params]=useSearchParams();const tab=tabs.includes(params.get('tab'))?params.get('tab'):'overview';
  const [days,setDays]=useState(7);const [page,setPage]=useState(1);const [search,setSearch]=useState('');const [searchDraft,setSearchDraft]=useState('');const [status,setStatus]=useState('all');const [plan,setPlan]=useState('all');
  const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [refresh,setRefresh]=useState(0);const [busy,setBusy]=useState('');
  useEffect(()=>{
    let cancelled=false;if(tab==='plans' || !token || user?.role!=='admin' || authLoading)return;
    async function load(){setLoading(true);setError('');
      try{const result=tab==='overview'?await adminAPI.overview(token,days):tab==='reports'?await adminAPI.reports(token,{page,search,status}):await adminAPI.users(token,{page,search,status,plan,...(tab==='subscriptions'?{subscriptions:'true'}:{})});if(!cancelled)setData({tab,owner:token,...result});}
      catch(err){if(!cancelled)setError(err.message);}finally{if(!cancelled)setLoading(false);}
    }
    load();return()=>{cancelled=true;};
  },[token,user?.role,authLoading,tab,days,page,search,status,plan,refresh]);
  const current=data?.tab===tab && data?.owner===token?data:null;
  async function changeStatus(account){
    const suspend=!account.isSuspended;if(!window.confirm((suspend?'Suspend ':'Restore ')+account.email+'?'+(suspend?' This prevents sign-in and authenticated account access.':'')))return;
    setBusy(account._id);setError('');setNotice('');try{await adminAPI.setUserStatus(token,account._id,suspend);setNotice('Account '+(suspend?'suspended.':'restored.'));setRefresh(value=>value+1);}catch(err){setError(err.message);}finally{setBusy('');}
  }
  async function sync(account){setBusy(account._id);setError('');setNotice('');try{await adminAPI.syncSubscription(token,account._id);setNotice('Subscription refreshed from Stripe.');setRefresh(value=>value+1);}catch(err){setError(err.message);}finally{setBusy('');}}
  async function saveReport(id,nextStatus,reply){setBusy(id);setError('');setNotice('');try{await adminAPI.updateReport(token,id,nextStatus,reply);setNotice('Report updated. The user can see your reply in their report history.');setRefresh(value=>value+1);}catch(err){setError(err.message);}finally{setBusy('');}}
  return <main className="account-page admin-page"><div className="account-wrap">
    <header className="account-header"><div><p className="account-eyebrow">OMNI AI ADMIN</p><h1>{tab==='overview'?'Business overview':label(tab)}</h1><p>Manage accounts, subscriptions, support, and API activity.</p></div>{user?.role==='admin' && <button className="account-button secondary" disabled={(loading && tab!=='plans') || !!busy} onClick={()=>setRefresh(value=>value+1)}>Refresh data</button>}</header>
    {authLoading?<LoadingSpinner label="Loading admin access..." className="loading-block" />:!token?<section className="account-card account-empty"><h2>Admin sign-in required</h2><p>Sign in with your administrator account to continue.</p><Link className="account-button" to="/login" state={{from:'/admin'}}>Admin sign in</Link></section>:user?.role!=='admin'?<section className="account-card account-empty"><h2>Access restricted</h2><p>This page is available to administrators only.</p><Link className="account-button secondary" to="/">Back to workspace</Link></section>:<>
      {error && <p className="account-alert error" role="alert">{error}</p>}{notice && <p className="account-alert" role="status">{notice}</p>}
      {tab==='plans'?<PlanManager token={token} refreshKey={refresh} />:tab==='overview'?<AdminOverview data={current} days={days} onDaysChange={setDays} token={token} refreshKey={refresh}/>:<>
        <form className="admin-toolbar" onSubmit={event=>{event.preventDefault();setSearch(searchDraft.trim());setPage(1);}}><label className="admin-search">Search<input aria-label={tab==='reports'?'Search reports':'Search users'} value={searchDraft} onChange={event=>setSearchDraft(event.target.value)} maxLength={100} placeholder={tab==='reports'?'Subject or message':'Name or email'} /></label><label>Status<select aria-label="Filter status" value={status} onChange={event=>{setStatus(event.target.value);setPage(1);}}>{(tab==='reports'?['all','received','in_review','resolved']:['all','active','suspended','unverified']).map(value=><option key={value} value={value}>{label(value)}</option>)}</select></label>{tab!=='reports' && <label>Plan<select aria-label="Filter plan" value={plan} onChange={event=>{setPlan(event.target.value);setPage(1);}}>{['all','free','pro','enterprise'].map(value=><option key={value} value={value}>{label(value)}</option>)}</select></label>}<button className="account-button" type="submit" disabled={loading}>Search</button></form>
        {current && <section className="account-card"><div className="account-section-head"><h2>{label(tab)}</h2><span className="account-note">{current.total} records</span></div>
          {tab==='reports'?(!current.reports.length?<p className="account-empty">No matching reports.</p>:current.reports.map(report=><ReportEditor key={report._id+report.updatedAt} report={report} onSave={saveReport} busy={busy===report._id} />)):
          !current.users.length?<p className="account-empty">No matching accounts.</p>:<div className="account-table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Account</th><th>Plan</th><th>Subscription</th><th>Period end</th><th>Actions</th></tr></thead><tbody>{current.users.map(account=><tr key={account._id}><td><strong>{account.name}</strong><br/><span className="account-note">{account.email}</span></td><td>{label(account.role)}</td><td><span className="account-status">{account.isSuspended?'Suspended':account.isVerified?'Active':'Unverified'}</span></td><td>{label(account.subscription?.plan || 'free')}</td><td>{label(account.subscription?.status || 'inactive')}{account.subscription?.cancelAtPeriodEnd && <small className="admin-cancel">Cancellation scheduled</small>}</td><td>{date(account.subscription?.currentPeriodEnd)}</td><td><div className="account-actions">{account.role!=='admin' && <button className="account-button secondary" disabled={!!busy} onClick={()=>changeStatus(account)}>{account.isSuspended?'Restore access':'Suspend'}</button>}{account.subscription?.stripeSubscriptionId && <button className="account-button secondary" disabled={!!busy} onClick={()=>sync(account)}>Sync Stripe</button>}</div></td></tr>)}</tbody></table></div>}
          {current.pages>1 && <div className="account-pagination"><button className="account-button secondary" disabled={page<=1 || loading} onClick={()=>setPage(value=>value-1)}>Previous</button><span>Page {page} of {current.pages}</span><button className="account-button secondary" disabled={page>=current.pages || loading} onClick={()=>setPage(value=>value+1)}>Next</button></div>}
        </section>}
      </>}
      {loading && tab!=='plans' && <LoadingSpinner label="Loading admin data..." className="loading-block" />}
    </>}
  </div></main>;
}
