import {t} from '../../utils/text'
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './Home.css'

const tools = [
  { name: 'AI Chat', text: 'A fresh perspective on any question.', path: '/ai-chat', category: 'Chat & Voice', icon: 'chat', color: 'purple' },
  { name: 'AI Voice', text: 'Turn spoken thoughts into written words.', path: '/ai-voice', category: 'Chat & Voice', icon: 'voice', color: 'teal' },
  { name: 'AI Translator', text: 'Make your words work in another language.', path: '/ai-translator', category: 'Chat & Voice', icon: 'translate', color: 'blue' },
  { name: 'AI File', text: 'Upload a document. Find the answers inside.', path: '/ai-file', category: 'Documents', icon: 'file', color: 'blue' },
  { name: 'AI Presentation', text: 'Give your next big idea a slide deck.', path: '/ai-presentation', category: 'Documents', icon: 'slides', color: 'purple' },
  { name: 'Cam Scanner', text: 'Bring paper into your digital workspace.', path: '/cam-scanner', category: 'Documents', icon: 'scan', color: 'teal' },
  { name: 'Word to PDF', text: 'Get your document ready to share.', path: '/word-to-pdf', category: 'Converters', icon: 'file', color: 'pink' },
  { name: 'PDF to Word', text: 'Turn a PDF into an editable document.', path: '/pdf-to-word', category: 'Converters', icon: 'file', color: 'blue' },
  { name: 'File Converter', text: 'Compress files for easier sharing.', path: '/file-size-converter', category: 'Converters', icon: 'convert', color: 'teal' },
  { name: 'AI Career & Skill Gap', text: 'See your strengths and your next steps.', path: '/ai-career', category: 'Career', icon: 'career', color: 'pink' },
  { name: 'CV Maker', text: 'Build a resume that feels like you.', path: '/cv-maker', category: 'Career', icon: 'file', color: 'purple' },
]
const categories = ['All tools', 'Chat & Voice', 'Documents', 'Converters', 'Career']

function ToolIcon({ type, size = 22 }) {
  const paths = {
    chat: <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
    voice: <><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></>,
    translate: <><path d="M3 5h12M9 3v2M12 5c-1 6-4 9-9 11M5 9c2 3 4 5 7 6M13 21l4-10 4 10M15 17h4"/></>,
    slides: <><rect x="3" y="3" width="18" height="13" rx="2"/><path d="M12 16v5M8 21h8M7 11V8M12 11V6M17 11V9"/></>,
    scan: <><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M3 12h18M8 7h8M8 17h8"/></>,
    convert: <><path d="M4 7h16l-4-4M20 17H4l4 4M20 7l-4 4M4 17l4-4"/></>,
    career: <><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a24 24 0 0 0 18 0M12 11v4"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type] || paths.chat}</svg>
}

export default function Home() {
  const { user } = useAuth()
  const [category, setCategory] = useState('All tools')
  const [search, setSearch] = useState('')
  const visible = tools.filter(tool => (category === 'All tools' || tool.category === category) && `${tool.name} ${tool.text} ${tool.category} ${t(tool.name)} ${t(tool.text)} ${t(tool.category)}`.toLowerCase().includes(search.toLowerCase().trim()))
  return <main className="home-content">
    <div className="overview-wrap">
      <header className="overview-heading">
        <div><div className="overview-eyebrow">{t("YOUR WORKSPACE")}</div><h1>{user ? t('Welcome back, {name}', {name:user.name?.split(' ')[0] || ''}) : t('A little help. A lot of possibility.')}</h1><p>{t("One workspace for your ideas, documents, and next big move.")}</p></div>
        <span className="overview-account"><span />{t(user ? 'Personal workspace' : 'Guest workspace')}</span>
      </header>

      <section className="overview-hero" aria-labelledby="hero-title">
        <div className="overview-hero-copy"><span className="overview-hero-label"><span className="overview-spark">&#10022;</span>{t("MEET YOUR EVERYDAY ASSISTANT")}</span><h2 id="hero-title">{t("From a blank page")}<br />{t("to your")} <span>{t("next great idea.")}</span></h2><p>{t("Ask a question, untangle a thought, or create something new. Start a conversation and take it from there.")}</p><Link className="overview-primary" to="/ai-chat">{t("Start a conversation")}<span aria-hidden="true">&#8599;</span></Link><span className="overview-hero-note">{t(user ? '10 free uses per tool' : '2 free uses per tool. No sign-up needed.')}</span></div>
        <div className="overview-hero-art" aria-hidden="true"><div className="overview-orbit orbit-one"/><div className="overview-orbit orbit-two"/><div className="overview-orbit orbit-three"/><div className="overview-art-core">&#10022;</div><div className="overview-floating float-chat"><ToolIcon type="chat"/>{t("A fresh idea")}</div><div className="overview-floating float-file"><ToolIcon type="file"/>{t("A clearer document")}</div><div className="overview-art-dot"/></div>
      </section>

      <section className="overview-shortcuts" aria-label="Quick actions">
        <Link to="/ai-file"><span className="overview-tool-icon blue"><ToolIcon type="file"/></span><div><strong>{t("Understand a document")}</strong><span>{t("Upload, ask, discover")}</span></div><span className="overview-arrow">&#8599;</span></Link>
        <Link to="/ai-presentation"><span className="overview-tool-icon purple"><ToolIcon type="slides"/></span><div><strong>{t("Bring an idea to life")}</strong><span>{t("Create your next presentation")}</span></div><span className="overview-arrow">&#8599;</span></Link>
        <Link to="/cv-maker"><span className="overview-tool-icon teal"><ToolIcon type="career"/></span><div><strong>{t("Make your next move")}</strong><span>{t("Build a standout resume")}</span></div><span className="overview-arrow">&#8599;</span></Link>
      </section>

      <section aria-labelledby="overview-tools-title" className="overview-tools">
        <div className="overview-section-heading"><div><h2 id="overview-tools-title">{t("Find your next tool")}<span>11</span></h2><p>{t("A small toolkit for getting more done.")}</p></div><label className="overview-search"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><input type="search" placeholder={t("Search tools...")} aria-label={t("Search tools")} value={search} onChange={e => setSearch(e.target.value)}/></label></div>
        <div className="overview-filters" aria-label={t("Filter tools")}>{categories.map(item => <button key={item} aria-pressed={category === item} className={category === item ? 'selected' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
        <div className="overview-tool-grid">{visible.map(tool => <Link className="overview-tool-card" to={tool.path} key={tool.path}><div className="overview-card-top"><span className={`overview-tool-icon ${tool.color}`}><ToolIcon type={tool.icon}/></span><span className="overview-arrow">&#8599;</span></div><h3>{tool.name}</h3><p>{tool.text}</p><span className="overview-card-category">{tool.category}</span></Link>)}</div>
        {!visible.length && <div className="overview-no-results"><h3>{t("No tools found")}</h3><p>{t("Try another search or choose a different category.")}</p><button onClick={() => { setSearch(''); setCategory('All tools') }}>{t("Show all tools")}</button></div>}
      </section>
      <footer className="overview-footer"><span>&#10022; {t("Built for your everyday possibilities.")}</span>{user ? <Link to="/subscription">{t("Explore plans")}<span aria-hidden="true">&#8599;</span></Link> : <Link to="/register">{t("Make this workspace yours")}<span aria-hidden="true">&#8599;</span></Link>}</footer>
    </div>
  </main>
}
