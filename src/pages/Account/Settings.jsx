import { Link } from 'react-router-dom'
import PwaControls from '../../components/PwaControls'
import './Account.css'
import './Settings.css'

const options = [
  { title: 'Edit Profile', description: 'Update your personal details and account information.', path: '/edit-profile', icon: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2' },
  { title: 'Subscription Plans', description: 'Explore plans and find the right fit for you.', path: '/subscription', icon: 'M12 3 3 9l9 12 9-12Z M3 9h18 M8 9l4 12 4-12 M8 9l4-6 4 6' },
  { title: 'Subscription Details', description: 'View your current plan, payments, and invoices.', path: '/subscription-details', icon: 'M4 3h16v18l-4-2-4 2-4-2-4 2Z M8 8h8 M8 12h8 M8 16h4' },
  { title: 'Feedback & Support', description: 'Share your feedback or get help with Omni AI.', path: '/feedback', icon: 'M21 11a8 8 0 0 1-8 8H8l-5 3V11a9 9 0 0 1 18 0Z M12 7v5 M12 15h.01' },
]

export default function Settings() {
  return (
    <main className="account-page settings-page">
      <div className="account-wrap">
        <header className="account-header">
          <div><p className="account-eyebrow">YOUR WORKSPACE</p><h1>Settings</h1><p>Manage your profile, subscription, and support in one place.</p></div>
        </header>
        <nav className="settings-options" aria-label="Account settings">
          {options.map(option => (
            <Link className="settings-option" key={option.path} to={option.path} state={option.path === '/feedback' ? { from: '/settings' } : undefined}>
              <span className="settings-option-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={option.icon} /></svg></span>
              <span className="settings-option-copy"><strong>{option.title}</strong><span>{option.description}</span></span>
              <span className="settings-option-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </nav>
        <PwaControls />
      </div>
    </main>
  )
}
