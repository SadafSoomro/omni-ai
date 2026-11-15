import LoadingSpinner from '../../components/LoadingSpinner';
import {useEffect,useRef,useState} from 'react';
import {Link,useLocation} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {t} from '../../utils/text';
import {feedbackAPI} from '../../services/api';
import './Account.css';
export default function Feedback(){
  const {token,isLoading:authLoading}=useAuth();const locale='en-US';const location=useLocation();
  const [category,setCategory]=useState('feedback');const [subject,setSubject]=useState('');const [message,setMessage]=useState('');const [path,setPath]=useState(location.state?.from || '');
  const [sending,setSending]=useState(false);const [error,setError]=useState('');const [notice,setNotice]=useState('');const [historyError,setHistoryError]=useState('');const [history,setHistory]=useState(null);const [page,setPage]=useState(1);const [refresh,setRefresh]=useState(0);const [loading,setLoading]=useState(false);
  const requestId=useRef(null);const owner=useRef(token);
  useEffect(()=>{owner.current=token;},[token]);
  useEffect(()=>{
    let cancelled=false;if(!token)return;
    async function load(){setLoading(true);setHistoryError('');try{const data=await feedbackAPI.list(token,page);if(!cancelled)setHistory({...data,owner:token});}catch(err){if(!cancelled)setHistoryError(err.message);}finally{if(!cancelled)setLoading(false);}}
    load();return()=>{cancelled=true;};
  },[token,page,refresh]);
  const change=setter=>event=>{setter(event.target.value);requestId.current=null;setNotice('');};
  async function submit(event){
    event.preventDefault();if(sending)return;setError('');setNotice('');
    if(subject.trim().length<3 || subject.trim().length>120){setError('Please enter a subject between 3 and 120 characters.');return;}
    if(message.trim().length<10 || message.trim().length>5000){setError('Please enter a message between 10 and 5000 characters.');return;}
    if(path && (!path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#'))){setError('Use a page path such as /ai-chat, without query parameters.');return;}
    setSending(true);requestId.current ||= crypto.randomUUID();
    try{await feedbackAPI.submit(token,{category,subject:subject.trim(),message:message.trim(),page:path,locale:'en',requestId:requestId.current});if(owner.current!==token)return;setSubject('');setMessage('');requestId.current=null;setNotice('Report received. You can track it below.');setPage(1);setRefresh(value=>value+1);}
    catch(err){if(owner.current===token)setError(err.message);}finally{if(owner.current===token)setSending(false);}
  }
  const reports=history?.owner===token?history.reports:[];
  return <main className="account-page"><div className="account-wrap">
    <header className="account-header"><div><p className="account-eyebrow">{t('Feedback & Support')}</p><h1>{t('Help us improve Omni AI')}</h1><p>{t('Share feedback, suggest a feature, or report a problem.')}</p></div></header>
    {authLoading?<LoadingSpinner label="Loading..." className="loading-block" />:!token?<section className="account-card account-empty"><h2>{t('Sign in to continue')}</h2><p>{t('Sign in to submit feedback and view your reports.')}</p><Link className="account-button" to="/login" state={{from:'/feedback'}}>{t('Sign in')}</Link></section>:<div className="account-support-grid">
      <section className="account-card"><h2>{t('New report')}</h2>
        {error && <p className="account-alert error" role="alert">{t(error)}</p>}{notice && <p className="account-alert" role="status">{t(notice)}</p>}
        <form onSubmit={submit} className="account-form"><fieldset disabled={sending}>
          <label htmlFor="report-category">{t('Category')}</label><select id="report-category" value={category} onChange={change(setCategory)}>{[['feedback','Feedback'],['issue','Report an issue'],['feature','Feature request'],['billing','Billing question']].map(([value,label])=><option key={value} value={value}>{t(label)}</option>)}</select>
          <label htmlFor="report-subject">{t('Subject')}</label><input id="report-subject" value={subject} onChange={change(setSubject)} minLength={3} maxLength={120} placeholder={t('What would you like us to know?')} required />
          <label htmlFor="report-page">{t('Affected page')} <span>({t('Optional')})</span></label><input id="report-page" value={path} onChange={change(setPath)} maxLength={250} dir="ltr" placeholder="/ai-chat" />
          <label htmlFor="report-message">{t('Message')}</label><textarea id="report-message" dir="auto" rows={7} value={message} onChange={change(setMessage)} minLength={10} maxLength={5000} placeholder={t('Describe what happened, what you expected, and how to reproduce it.')} aria-describedby="report-hint" required />
          <div className="account-form-hint"><span id="report-hint">{t('Do not include passwords, API keys, or card details.')}</span><span>{message.length}/5000</span></div>
          <button className="account-button" type="submit">{t(sending?'Sending...':'Send report')}</button>
        </fieldset></form>
      </section>
      <section className="account-card"><div className="account-section-head"><h2>{t('Your reports')}</h2><button className="account-button secondary" disabled={loading || sending} onClick={()=>setRefresh(value=>value+1)}>{t('Refresh')}</button></div>
        {historyError && <p className="account-alert error" role="alert">{t(historyError)}</p>}{loading && <LoadingSpinner label="Loading..." className="loading-block" />}
        {!loading && !historyError && !reports.length && <div className="account-empty"><h3>{t('No reports yet')}</h3><p>{t('Your submitted feedback and issue reports will appear here.')}</p></div>}
        <div className="account-report-list">{reports.map(report=><article key={report._id} className="account-report"><div className="account-section-head"><span className="account-status">{t(report.category)}</span><span className="account-status">{t(report.status)}</span></div><h3 dir="auto">{report.subject}</h3><p dir="auto">{report.message}</p>{report.reply && <div className="account-support-reply"><strong>Support reply</strong><p dir="auto">{report.reply}</p></div>}{report.page && <code dir="ltr">{report.page}</code>}<footer><bdi>#{String(report._id).slice(-8).toUpperCase()}</bdi><time dateTime={report.createdAt}>{new Intl.DateTimeFormat(locale,{dateStyle:'medium',timeStyle:'short'}).format(new Date(report.createdAt))}</time></footer></article>)}</div>
        {(page>1 || history?.hasMore) && <div className="account-pagination"><button className="account-button secondary" disabled={page<=1 || loading} onClick={()=>setPage(value=>value-1)}>{t('Previous')}</button><span>{t('Page')} {page}</span><button className="account-button secondary" disabled={!history?.hasMore || loading} onClick={()=>setPage(value=>value+1)}>{t('Next')}</button></div>}
      </section>
    </div>}
  </div></main>;
}
