import LoadingSpinner from '../../components/LoadingSpinner';
import React, {useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {billingAPI,authAPI} from '../../services/api';
import {useAuth} from '../../context/AuthContext';
import {t} from '../../utils/text';
import './Subscription.css';
export default function Subscription(){
  const {user,token,updateUser}=useAuth();const navigate=useNavigate();
  const [plans,setPlans]=useState([]);const [planLoading,setPlanLoading]=useState(true);const [planError,setPlanError]=useState('');const [catalogRefresh,setCatalogRefresh]=useState(0);
  useEffect(()=>{let cancelled=false;async function load(){setPlanLoading(true);setPlanError('');try{const data=await billingAPI.plans();if(!cancelled)setPlans(data.plans);}catch(err){if(!cancelled)setPlanError(err.message);}finally{if(!cancelled)setPlanLoading(false);}}load();const focus=()=>setCatalogRefresh(value=>value+1);window.addEventListener('focus',focus);return()=>{cancelled=true;window.removeEventListener('focus',focus);};},[catalogRefresh]);
  const money=amount=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount/100);
  const styleFor=id=>({icon:({free:'\u25cb',pro:'\u26a1',enterprise:'\u265b'})[id],btnClass:'plan-btn-'+id,badge:id==='pro'?'Popular':''});
  const [billingCycle,setBillingCycle]=useState('monthly');const [subscription,setSubscription]=useState({plan:'free'});
  const [busy,setBusy]=useState(false);const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [notice,setNotice]=useState('');
  const [activeMobilePlan,setActiveMobilePlan]=useState('pro');const [selectedPlan,setSelectedPlan]=useState(null);
  const visibleMobilePlan=plans.some(plan=>plan.id===activeMobilePlan)?activeMobilePlan:plans[0]?.id;
  const isYearly=billingCycle==='yearly';const currentPlan=subscription.plan || 'free';
  useEffect(()=>{
    let cancelled=false;
    async function load(){
      if(!token){setSubscription({plan:'free'});setLoading(false);return;}
      setLoading(true);setError('');const params=new URLSearchParams(window.location.search);const sessionId=params.get('session_id');
      try{
        const data=sessionId?await billingAPI.confirm(token,sessionId):await billingAPI.subscription(token);if(cancelled)return;
        setSubscription(data.subscription || {plan:'free'});
        if(sessionId){setNotice('Payment verified. Your subscription is active.');window.history.replaceState({},'',window.location.pathname);}
        else if(params.get('checkout')==='cancelled'){setNotice('Checkout cancelled. No subscription was activated.');window.history.replaceState({},'',window.location.pathname);}
        const profile=await authAPI.getMe(token);if(!cancelled && profile.success)updateUser(profile.user);
      }catch(err){if(!cancelled)setError(err.message);}finally{if(!cancelled)setLoading(false);}
    }
    load();return()=>{cancelled=true;};
  },[token,updateUser]);
  async function manageBilling(){setBusy(true);setError('');try{window.location.assign((await billingAPI.portal(token)).url);}catch(err){setError(err.message);setBusy(false);}}
  function selectPlan(plan){
    if(!user || !token){navigate('/login',{state:{from:'/subscription'}});return;}
    if(plan.id===currentPlan)return;
    if(plan.id==='free' || subscription.stripeSubscriptionId){manageBilling();return;}
    setSelectedPlan(plan);
  }
  async function checkout(){if(!selectedPlan || busy)return;setBusy(true);setError('');try{window.location.assign((await billingAPI.checkout(token,selectedPlan.id,billingCycle,selectedPlan.version)).url);}catch(err){setError(err.message);setBusy(false);if(err.code==='PLAN_CHANGED'){setSelectedPlan(null);setCatalogRefresh(value=>value+1);}}}
  return <main className="subscription-page">
    <div className="subscription-glow-1"/><div className="subscription-glow-2"/>
    {notice && <div className={'sub-toast-notification '+(notice.startsWith('Checkout cancelled')?'is-neutral':'')} role="status"><span className="sub-toast-message">{t(notice)}</span><button type="button" className="sub-toast-close" aria-label={t('Dismiss notification')} onClick={()=>setNotice('')}>&times;</button></div>}
    {error && !selectedPlan && <p role="alert" style={{color:'#f87171',textAlign:'center'}}>{t(error)}</p>}
    {planError && <p role="alert" className="account-alert error">{planError} <button onClick={()=>setCatalogRefresh(value=>value+1)}>Retry loading plans</button></p>}
    {(planLoading || loading) && <LoadingSpinner label={planLoading ? 'Loading plans' : 'Loading subscription'} />}
    {subscription.stripeSubscriptionId && <div style={{textAlign:'center',marginBottom:20}}><p>{t('Subscription:')} {t(subscription.status)}{subscription.cancelAtPeriodEnd?t(' (cancels at period end)'):''}</p><button type="button" className="sub-modal-btn confirm" onClick={manageBilling} disabled={busy || loading}>{t('Manage subscription & payment card')}</button></div>}
    <header className="sub-header"><h1 className="sub-title">{t('Choose Your Plan')}</h1><p className="sub-subtitle">{t('Unlock unlimited AI intelligence, premium templates, and high-speed converters.')}</p><div className="billing-toggle-wrap"><button className={'billing-cycle-btn '+(!isYearly?'active':'')} onClick={()=>setBillingCycle('monthly')}>{t('Monthly')}</button><button className={'billing-cycle-btn '+(isYearly?'active':'')} onClick={()=>setBillingCycle('yearly')}>{t('Yearly')} <span className="discount-tag">Annual billing</span></button></div></header>
    <div className="sub-mobile-tabs">{plans.map(plan=><button key={plan.id} className={'sub-mobile-tab '+(visibleMobilePlan===plan.id?'active':'')} onClick={()=>setActiveMobilePlan(plan.id)}><span className="tab-icon">{styleFor(plan.id).icon}</span><span className="tab-name">{t(plan.name)}</span>{styleFor(plan.id).badge && <span className="tab-star">★</span>}</button>)}</div>
    <div className="pricing-grid">{plans.map(plan=>{
      const isCurrent=currentPlan===plan.id;const price=new Intl.NumberFormat('en-US',{maximumFractionDigits:2}).format(isYearly?plan.yearlyAmount/1200:plan.monthlyAmount/100);
      return <section key={plan.id} className={'plan-card '+(styleFor(plan.id).badge?'featured ':'')+(visibleMobilePlan===plan.id?'mobile-show':'mobile-hide')}>
        {styleFor(plan.id).badge && <div className="popular-badge">{t(plan.badgeText)}</div>}
        <div className="plan-header"><div className="plan-title-row"><span className="plan-icon">{styleFor(plan.id).icon}</span><div><h3 className="plan-name">{t(plan.name)}</h3><span className="plan-tagline">{t(plan.badgeText)}</span></div></div><p className="plan-desc">{t(plan.description)}</p></div>
        <div className="plan-pricing"><div className="price-wrapper"><span className="plan-currency">$</span><span className="plan-price">{price}</span><span className="plan-period">{t('per month')}</span></div>{isYearly && plan.yearlyAmount>0 && <span className="annual-badge">{t('Billed annually ({amount}/yr)',{amount:money(plan.yearlyAmount)})}</span>}</div>
        <ul className="plan-features">{plan.features.map(feature=><li key={feature} className="feature-item"><span className="feature-check">✓</span><span>{t(feature)}</span></li>)}</ul>
        <button className={'plan-btn '+styleFor(plan.id).btnClass+(isCurrent?' current':'')} disabled={isCurrent || busy || loading || planLoading || !!planError} onClick={()=>selectPlan(plan)}>{t(isCurrent?'Current Plan':(plan.buttonText || 'Choose '+plan.name))}</button>
      </section>;
    })}</div>
    {selectedPlan && <div className="sub-modal-backdrop" onClick={()=>{if(!busy)setSelectedPlan(null);}}><section className="sub-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onClick={event=>event.stopPropagation()}><h3 className="sub-modal-title" id="checkout-title">{t('Upgrade to')} {t(selectedPlan.name)}</h3><p className="sub-modal-subtitle">{t('Pay by card securely with Stripe. Access activates after payment is verified.')}</p>
      <div className="sub-modal-summary"><div className="summary-row"><span>{t('Plan')}</span><strong>{t(selectedPlan.name)}</strong></div><div className="summary-row"><span>{t('Billing Period')}</span><span>{t(isYearly?'Yearly':'Monthly')}</span></div><div className="summary-row total"><span>{t('Total Due Now')}</span><bdi>{money(isYearly?selectedPlan.yearlyAmount:selectedPlan.monthlyAmount)}</bdi></div></div>
      {error && <p role="alert" style={{color:'#f87171'}}>{t(error)}</p>}
      <div className="sub-modal-actions"><button className="sub-modal-btn cancel" disabled={busy} onClick={()=>setSelectedPlan(null)}>{t('Cancel')}</button><button className="sub-modal-btn confirm" disabled={busy} onClick={checkout}>{t(busy?'Opening secure checkout?':'Continue to card payment')}</button></div>
    </section></div>}
  </main>;
}
