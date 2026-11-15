import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './workspace-theme.css'
import {registerPwa} from './pwa'
registerPwa()
import './responsive-refinements.css'

document.documentElement.lang='en'
document.documentElement.dir='ltr'
try{localStorage.removeItem('omni_language')}catch{}

// Immediately initialize theme to avoid any flash of unstyled theme (default: 'light')
let initialTheme = localStorage.getItem('ai_theme')
if (!initialTheme || localStorage.getItem('ai_theme_init_light') !== 'v1') {
  initialTheme = 'light'
  localStorage.setItem('ai_theme', 'light')
  localStorage.setItem('ai_theme_init_light', 'v1')
}
document.documentElement.setAttribute('data-theme', initialTheme)
document.documentElement.classList.toggle('light-theme', initialTheme === 'light')
if (document.body) {
  document.body.setAttribute('data-theme', initialTheme)
  document.body.classList.toggle('light-theme', initialTheme === 'light')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
