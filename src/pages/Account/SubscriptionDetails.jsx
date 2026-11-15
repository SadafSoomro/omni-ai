import LoadingSpinner from '../../components/LoadingSpinner';
import {useEffect,useRef,useState} from 'react';
import {Link} from 'react-router-dom';
import {useAuth} from '../../context/AuthContext';
import {t} from '../../utils/text';
import {billingAPI} from '../../services/api';
import './Account.css';
const invoiceLink=value=>{try{const url=new URL(value);return url.protocol==='https:'?url.href:null;}catch{return null;}};
export default function SubscriptionDetails(){
  const {token,isLoading:authLoading}=useAuth();const locale='en-US';
  const [result,setResult]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [refresh,setRefresh]=useState(0);const [busy,setBusy]=useState(false);const owner=useRef(token);
  useEffect(()=>{owner.current=token;},[token]);
  useEffect(()=>{
    let cancelled=false;
    if(!token)return;
    async function load(){
      setLoading(true);setError('');
      try{const data=await billingAPI.details(token);if(!cancelled)setResult({...data,owner:token});}
      catch(err){if(!cancelled)setError(err.message);}
      finally{if(!cancelled)setLoading(false);}
    }
    load();return()=>{cancelled=true;};
  },[token,refresh]);
  const details=result?.owner===token?result:null;
  const money=(amount,currency='usd')=>new Intl.NumberFormat(locale,{style:'currency',currency:currency.toUpperCase()}).format((amount || 0)/(currency.toLowerCase()==='isk'?100:10**new Intl.NumberFormat('en',{style:'currency',currency:currency.toUpperCase()}).resolvedOptions().maximumFractionDigits));
  const date=value=>value?new Intl.DateTimeFormat(locale,{dateStyle:'medium'}).format(new Date(value)):t('Not scheduled');
  async function portal(){setBusy(true);setError('');try{const data=await billingAPI.portal(token);if(owner.current===token)window.location.assign(data.url);}catch(err){if(owner.current===token)setError(err.message);}finally{if(owner.current===token)setBusy(false);}}
  async function more(){setBusy(true);setError('');try{const data=await billingAPI.details(token,details.nextCursor);if(owner.current===token)setResult(previous=>({...data,owner:token,invoices:[...previous.invoices,...data.invoices.filter(item=>!previous.invoices.some(old=>old.id===item.id))]}));}catch(err){if(owner.current===token)setError(err.message);}finally{if(owner.current===token)setBusy(false);}}
  return <main className="account-page"><div className="account-wrap">
    <header className="account-header"><div><p className="account-eyebrow">{t('Account')}</p><h1>{t('Subscription Details')}</h1><p>{t('Your plan, payments, and invoices in one place.')}</p></div><div className="account-actions"><Link className="account-button secondary" to="/subscription">{t('View plans')}</Link>{token && <button className="account-button secondary" disabled={loading || busy} onClick={()=>setRefresh(value=>value+1)}>{t('Refresh')}</button>}</div></header>
    {authLoading?<LoadingSpinner label="Loading..." className="loading-block" />:!token?<section className="account-card account-empty"><h2>{t('Sign in to continue')}</h2><p>{t('Sign in to view your private billing details.')}</p><Link className="account-button" to="/login" state={{from:'/subscription-details'}}>{t('Sign in')}</Link></section>:<>
      {error && <div className="account-alert error" role="alert">{t(error)} <button onClick={()=>setRefresh(value=>value+1)} disabled={loading}>{t('Try again')}</button></div>}
      {loading && <LoadingSpinner label="Loading..." className="loading-block" />}
      {details && <>
        <section className="account-card"><div className="account-section-head"><h2>{t('Billing and invoices')}</h2>{details.subscription?.stripeSubscriptionId && <button className="account-button" disabled={busy || loading} onClick={portal}>{t('Manage billing')}</button>}</div>
          <dl className="account-stats">
            <div><dt>{t('Current plan')}</dt><dd>{t(({free:'Starter',pro:'Pro Creator',enterprise:'Enterprise'})[details.subscription?.plan] || 'Starter')}</dd></div>
            <div><dt>{t('Status')}</dt><dd><span className="account-status">{t(details.renewal?.status || details.subscription?.status || 'inactive')}</span></dd></div>
            <div><dt>{t('Billing period')}</dt><dd>{details.renewal?.interval?t(details.renewal.interval):t('Not applicable')}</dd></div>
            <div><dt>{t('Next renewal')}</dt><dd>{date(details.renewal?.nextBillingDate)}</dd></div>
            <div><dt>{t('Recurring amount')}</dt><dd>{details.renewal?.recurringAmount==null?t('Not applicable'):<bdi>{money(details.renewal.recurringAmount,details.renewal.currency)}</bdi>}</dd></div>
            <div><dt>{t('Payment card')}</dt><dd>{details.card?<bdi dir="ltr">{details.card.brand.toUpperCase()} •••• {details.card.last4} · {details.card.expMonth}/{details.card.expYear}</bdi>:t('No saved card')}</dd></div>
            {details.renewal?.cancellationDate && <div><dt>{t('Cancellation date')}</dt><dd>{date(details.renewal.cancellationDate)}</dd></div>}
          </dl>
          {details.renewal?.status==='canceled'?<p className="account-note">{t('Your subscription has ended. You will not be charged for renewal.')}</p>:details.renewal?.cancelAtPeriodEnd?<p className="account-note">{t('Cancellation is scheduled. Access continues until the end of the paid period.')}</p>:null}
          {['past_due','unpaid','incomplete'].includes(details.renewal?.status) && <p className="account-alert error">{t('Payment needs attention. Open billing to review your invoice.')}</p>}
          {details.renewal?.recurringAmount!=null && <p className="account-note">{t('Prices exclude any applicable tax or discounts.')}</p>}
        </section>
        <section className="account-card"><h2>{t('Payment history')}</h2><p className="account-note">{t('Invoices come directly from your Stripe billing account.')}</p>
          {!details.invoices.length?<div className="account-empty"><h3>{t('No invoices yet')}</h3><p>{t('Your invoices will appear here after checkout.')}</p></div>:<div className="account-table-wrap"><table><caption className="sr-only">{t('Payment history')}</caption><thead><tr>{['Invoice','Date','Total','Paid','Remaining','Status','Actions'].map(label=><th key={label} scope="col">{t(label)}</th>)}</tr></thead><tbody>{details.invoices.map(invoice=><tr key={invoice.id}><td><bdi>{invoice.number}</bdi></td><td>{date(invoice.created*1000)}</td><td><bdi>{money(invoice.total,invoice.currency)}</bdi></td><td><bdi>{money(invoice.amountPaid,invoice.currency)}</bdi></td><td><bdi>{money(invoice.amountRemaining,invoice.currency)}</bdi></td><td><span className="account-status">{t(invoice.status)}</span></td><td><div className="account-actions">{invoiceLink(invoice.invoiceUrl) && <a href={invoiceLink(invoice.invoiceUrl)} target="_blank" rel="noopener noreferrer">{t('View invoice')}</a>}{invoiceLink(invoice.pdfUrl) && <a href={invoiceLink(invoice.pdfUrl)} target="_blank" rel="noopener noreferrer">{t('Download PDF')}</a>}</div></td></tr>)}</tbody></table></div>}
          {details.hasMore && <button className="account-button secondary" disabled={busy || loading} onClick={more}>{busy ? <LoadingSpinner label="Loading more invoices" /> : t('Load more')}</button>}
        </section>
      </>}
    </>}
  </div></main>;
}
