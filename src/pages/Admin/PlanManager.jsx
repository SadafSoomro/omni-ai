import LoadingSpinner from '../../components/LoadingSpinner';
import {useEffect,useState} from 'react';
import {adminAPI} from '../../services/api';
function dollarsToCents(value){
  if(!/^\d+(\.\d{1,2})?$/.test(value))throw new Error('Enter prices with at most two decimal places.');
  const [whole,decimal='']=value.split('.');const amount=Number(whole)*100+Number(decimal.padEnd(2,'0'));
  if(!Number.isSafeInteger(amount) || amount>99999999)throw new Error('Price must be no more than $999,999.99.');return amount;
}
function PlanEditor({plan,onSave,busy}){
  const [name,setName]=useState(plan.name);const [description,setDescription]=useState(plan.description);const [features,setFeatures]=useState(plan.features.join('\n'));const [monthly,setMonthly]=useState((plan.monthlyAmount/100).toFixed(2));const [annual,setAnnual]=useState((plan.yearlyAmount/100).toFixed(2));const [badge,setBadge]=useState(plan.badgeText || '');const [button,setButton]=useState(plan.buttonText || '');const [active,setActive]=useState(plan.active);const [error,setError]=useState('');
  const free=plan.id==='free';
  function submit(event){event.preventDefault();setError('');try{onSave(plan.id,{name,description,features:features.split('\n').map(value=>value.trim()).filter(Boolean),monthlyAmount:dollarsToCents(monthly),yearlyAmount:dollarsToCents(annual),badgeText:badge,buttonText:button,active,version:plan.version});}catch(err){setError(err.message);}}
  return <section className="account-card admin-plan-editor"><div className="account-section-head"><div><h2>{plan.name}</h2><p className="account-note">{plan.id.toUpperCase()} | Version {plan.version}</p></div><span className="account-status">{plan.active?'Available':'Hidden from new purchases'}</span></div>
    <form onSubmit={submit}><fieldset disabled={busy}>
      <label>Plan name<input aria-label={plan.id+' plan name'} value={name} onChange={event=>setName(event.target.value)} maxLength={80} required /></label>
      <label>Description<textarea aria-label={plan.id+' description'} value={description} onChange={event=>setDescription(event.target.value)} maxLength={300} rows={3} required /></label>
      <div className="admin-plan-prices"><label>Monthly price (USD)<input aria-label={plan.id+' monthly price'} type="number" min={free?0:0.5} max="999999.99" step="0.01" value={monthly} onChange={event=>setMonthly(event.target.value)} disabled={free} required /></label><label>Annual total (USD)<input aria-label={plan.id+' annual total'} type="number" min={free?0:0.5} max="999999.99" step="0.01" value={annual} onChange={event=>setAnnual(event.target.value)} disabled={free} required /></label></div>
      <p className="account-note">{free?'Starter remains free and available.':'The annual total is charged once per year, not every month.'}</p>
      <label>Features (one per line)<textarea aria-label={plan.id+' features'} value={features} onChange={event=>setFeatures(event.target.value)} rows={7} maxLength={3220} required /></label>
      <div className="admin-plan-prices"><label>Badge label<input aria-label={plan.id+' badge label'} value={badge} onChange={event=>setBadge(event.target.value)} maxLength={40} /></label><label>Button label<input aria-label={plan.id+' button label'} value={button} onChange={event=>setButton(event.target.value)} maxLength={40} /></label></div>
      <label className="admin-plan-availability"><input type="checkbox" aria-label={plan.id+' available for purchase'} checked={active} onChange={event=>setActive(event.target.checked)} disabled={free} />Available for new purchases</label>
      {error && <p className="account-alert error" role="alert">{error}</p>}
      <button type="submit" className="account-button">{busy?'Saving...':'Save '+plan.name}</button>
    </fieldset></form>
  </section>;
}
export default function PlanManager({token,refreshKey}){
  const [plans,setPlans]=useState([]);const [loading,setLoading]=useState(true);const [busy,setBusy]=useState('');const [error,setError]=useState('');const [notice,setNotice]=useState('');const [retry,setRetry]=useState(0);
  useEffect(()=>{let cancelled=false;async function load(){setLoading(true);setError('');try{const data=await adminAPI.plans(token);if(!cancelled)setPlans(data.plans);}catch(err){if(!cancelled)setError(err.message);}finally{if(!cancelled)setLoading(false);}}load();return()=>{cancelled=true;};},[token,refreshKey,retry]);
  async function save(id,body){setBusy(id);setError('');setNotice('');try{const data=await adminAPI.updatePlan(token,id,body);setPlans(previous=>previous.map(plan=>plan.id===id?data.plan:plan));setNotice(data.plan.name+' saved. New checkout sessions use these prices. Existing subscriptions keep their current billing.');}catch(err){setError(err.message);}finally{setBusy('');}}
  return <section aria-label="Plan settings"><div className="account-card"><h2>Edit subscription plans</h2><p className="account-note">Change plan prices, descriptions, features, and availability. Prices are in USD. New checkout sessions use the saved values; existing subscriptions keep their agreed prices.</p></div>
    {error && <div className="account-alert error" role="alert">{error} <button disabled={loading || !!busy} onClick={()=>setRetry(value=>value+1)}>Reload plans</button></div>}{notice && <p className="account-alert" role="status">{notice}</p>}{loading && <LoadingSpinner label="Loading plans..." className="loading-block" />}
    <div className="admin-plan-grid">{plans.map(plan=><PlanEditor key={plan.id+'-'+plan.version} plan={plan} onSave={save} busy={busy===plan.id || loading} />)}</div>
  </section>;
}
