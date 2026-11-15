import {t} from '../../utils/text'
import { useUsage } from '../../context/UsageContext'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cvAPI } from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { prepareOriginalCv, readOriginalDraft, saveOriginalDraft } from '../../services/originalCv'
import OriginalCvEditor from './OriginalCvEditor'
import './CvMaker.css'

// ── COLOR THEMES ──
const COLOR_THEMES = [
  { id: 'indigo', label: 'Royal Indigo', primary: '#4338ca', accent: '#6366f1', light: '#eef2ff' },
  { id: 'sapphire', label: 'Sapphire Navy', primary: '#1e3a8a', accent: '#0284c7', light: '#f0f9ff' },
  { id: 'emerald', label: 'Emerald Forest', primary: '#065f46', accent: '#10b981', light: '#ecfdf5' },
  { id: 'crimson', label: 'Crimson Rose', primary: '#9f1239', accent: '#f43f5e', light: '#fff1f2' },
  { id: 'obsidian', label: 'Obsidian Slate', primary: '#0f172a', accent: '#475569', light: '#f8fafc' },
  { id: 'amber', label: 'Warm Amber', primary: '#78350f', accent: '#d97706', light: '#fffbeb' },
]

// ── FONTS ──
const FONT_OPTIONS = [
  { id: 'sans', label: 'Modern Sans', family: "'Inter', system-ui, -apple-system, sans-serif" },
  { id: 'grotesk', label: 'Tech Grotesk', family: "'Outfit', 'Roboto', sans-serif" },
  { id: 'serif', label: 'Executive Serif', family: "'Georgia', 'Merriweather', serif" },
]

// ── TEMPLATES ──
const TEMPLATES = [
  { id: 'executive', label: 'Executive', icon: '👑', desc: 'Two-column executive layout with dark sidebar' },
  { id: 'tech_pro', label: 'Tech Pro', icon: '💻', desc: 'Developer resume with tech chips & GitHub' },
  { id: 'creative', label: 'Creative', icon: '🎨', desc: 'Modern asymmetric layout with accent cards' },
  { id: 'ats_classic', label: 'ATS Classic', icon: '📄', desc: '100% ATS-friendly single column format' },
  { id: 'compact', label: 'Compact', icon: '🔷', desc: 'Dense format with colored accent lines' },
  { id: 'minimal', label: 'Minimal', icon: '🌿', desc: 'Typographic simplicity & clean spacing' },
]

const FORM_SECTIONS = [
  { id: 'personal', label: '👤 Personal' },
  { id: 'summary', label: '📝 Summary' },
  { id: 'skills', label: '🛠️ Skills' },
  { id: 'experience', label: '💼 Experience' },
  { id: 'education', label: '🎓 Education' },
  { id: 'projects', label: '🚀 Projects' },
  { id: 'certifications', label: '🏅 Certs' },
  { id: 'languages', label: '🌐 Languages' },
]

const SAMPLE_TECH = {
  name: 'Sarah Johnson',
  title: 'Senior Full Stack Developer & Cloud Architect',
  email: 'sarah.johnson@email.com',
  phone: '+1 (555) 234-5678',
  location: 'San Francisco, CA',
  linkedin: 'linkedin.com/in/sarahjohnson',
  github: 'github.com/sarahjohnson',
  website: 'sarahjohnson.dev',
  photo: '',
  showPhoto: true,
  summary: 'Innovative Full Stack Developer with 5+ years building scalable distributed web applications serving 250K+ daily active users. Expert in React, Node.js, and AWS cloud architectures with proven track record of reducing latency by 40% and mentoring 8+ junior engineers.',
  skills: 'React.js, Next.js, TypeScript, Node.js, Express, PostgreSQL, MongoDB, Docker, AWS (EC2/S3/Lambda), Redis, GraphQL, CI/CD, Git, Tailwind CSS',
  experience: [
    {
      company: 'TechCorp Solutions',
      role: 'Senior Full Stack Engineer',
      dates: 'Jan 2022 – Present',
      location: 'San Francisco, CA',
      bullets: 'Architected high-throughput microservices handling 250K+ daily requests with 99.99% uptime.\nReduced API response latency by 42% via Redis multi-tier caching and SQL indexing.\nImplemented automated CI/CD pipeline using GitHub Actions and Docker, reducing release cycle by 60%.\nMentored 4 junior engineers through weekly technical design reviews and pair programming.',
    },
    {
      company: 'Digital Nexus Inc.',
      role: 'Frontend React Developer',
      dates: 'Mar 2019 – Dec 2021',
      location: 'San Jose, CA',
      bullets: 'Spearheaded conversion of legacy jQuery platform to Next.js, increasing Google PageSpeed score from 48 to 96.\nDesigned reusable component library adopted across 6 company-wide client applications.\nIntegrated Stripe and PayPal checkout flows generating $3.2M annual processing volume.',
    },
  ],
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'B.Sc. in Computer Science',
      dates: '2015 – 2019',
      location: 'Berkeley, CA',
      details: 'Graduated Magna Cum Laude | Dean’s Honor List (2017–2019)',
    },
  ],
  projects: [
    {
      name: 'OpenFlow — Cloud Workflow Engine',
      tech: 'React, Node.js, Redis, Docker',
      link: 'github.com/sarahjohnson/openflow',
      desc: 'Distributed workflow automation engine with visual DAG builder. 2.4K+ GitHub stars and 50+ community contributors.',
    },
    {
      name: 'TaskMetrics Analytics Dashboard',
      tech: 'TypeScript, Next.js, PostgreSQL',
      link: 'taskmetrics.io',
      desc: 'Real-time telemetry dashboard for monitoring microservice health and database query performance.',
    },
  ],
  certifications: 'AWS Certified Solutions Architect – Professional (2024)\nGoogle Cloud Professional Data Engineer (2023)\nDocker Certified Associate (DCA)',
  languages: [
    { name: 'English', level: 'Native / Bilingual' },
    { name: 'Spanish', level: 'Professional Working' },
    { name: 'German', level: 'Conversational' },
  ],
}

const SAMPLE_EXECUTIVE = {
  name: 'Alexander Mitchell',
  title: 'Director of Product Management',
  email: 'alex.mitchell@executive.com',
  phone: '+1 (415) 890-1234',
  location: 'New York, NY',
  linkedin: 'linkedin.com/in/alexmitchell-pm',
  github: '',
  website: 'alexmitchell.me',
  photo: '',
  showPhoto: true,
  summary: 'Visionary Product Leader with 8+ years scaling B2B enterprise SaaS products from 0 to $25M ARR. Proven track record leading cross-functional teams of 30+ engineers, designers, and marketers in agile high-growth environments.',
  skills: 'Product Strategy, Agile & Scrum, Roadmap Planning, Go-To-Market (GTM), Data Analytics, User Research, Stakeholder Management, OKRs & KPIs, P&L Ownership',
  experience: [
    {
      company: 'Enterprise Cloud Technologies',
      role: 'Director of Product',
      dates: '2021 – Present',
      location: 'New York, NY',
      bullets: 'Led global product team of 24 across US and Europe, overseeing enterprise analytics product line.\nDelivered 140% YoY ARR growth ($10M to $24M) through high-value tier pricing and AI features.\nReduced customer churn from 5.2% to 1.8% by overhauling enterprise onboarding workflows.',
    },
    {
      company: 'SaaSify Global',
      role: 'Senior Product Manager',
      dates: '2018 – 2021',
      location: 'Boston, MA',
      bullets: 'Defined product vision and technical specifications for flagship collaborative workflow suite.\nCollaborated directly with Fortune 500 enterprise customers to prioritize critical security features.',
    },
  ],
  education: [
    {
      school: 'Columbia University',
      degree: 'Master of Business Administration (MBA)',
      dates: '2016 – 2018',
      location: 'New York, NY',
      details: 'Specialization in Technology Management & Venture Capital',
    },
    {
      school: 'University of Michigan',
      degree: 'B.Sc. in Industrial & Operations Engineering',
      dates: '2012 – 2016',
      location: 'Ann Arbor, MI',
      details: 'Summa Cum Laude',
    },
  ],
  projects: [
    {
      name: 'AI Insights Module Launch',
      tech: 'Product Discovery, ML Integration',
      link: 'enterprisecloud.com/ai',
      desc: 'Launched predictive forecasting feature used by 85 enterprise accounts within 60 days.',
    },
  ],
  certifications: 'Certified Scrum Product Owner (CSPO)\nPMP – Project Management Professional (PMI)\nPragmatic Institute Certified (PMC-III)',
  languages: [
    { name: 'English', level: 'Native' },
    { name: 'French', level: 'Professional Working' },
  ],
}

const EMPTY_FORM = {
  name: '',
  title: '',
  email: '',
  phone: '',
  location: '',
  linkedin: '',
  github: '',
  website: '',
  photo: '',
  showPhoto: true,
  summary: '',
  skills: '',
  experience: [{ company: '', role: '', dates: '', location: '', bullets: '' }],
  education: [{ school: '', degree: '', dates: '', location: '', details: '' }],
  projects: [{ name: '', tech: '', link: '', desc: '' }],
  certifications: '',
  languages: [{ name: '', level: '' }],
}

function SectionTabs({ children }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    const element = scrollRef.current
    const wheel = event => {
      if (element.scrollWidth <= element.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientWidth : 1)
      const canScroll = delta > 0 ? element.scrollLeft < element.scrollWidth - element.clientWidth - 1 : element.scrollLeft > 0
      if (canScroll) { event.preventDefault(); element.scrollLeft += delta }
    }
    element.addEventListener('wheel', wheel, { passive: false })
    return () => element.removeEventListener('wheel', wheel)
  }, [])
  const scroll = direction => scrollRef.current?.scrollBy({ left: direction * 180, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  return <div className="cv-section-navigation">
    <button type="button" className="cv-tabs-arrow" aria-label="Scroll sections left" onClick={() => scroll(-1)}>&#8249;</button>
    <div className="cv-section-tabs" ref={scrollRef} aria-label="CV sections" onFocusCapture={event => event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' })}>{children}</div>
    <button type="button" className="cv-tabs-arrow" aria-label="Scroll sections right" onClick={() => scroll(1)}>&#8250;</button>
  </div>
}

export default function CvMaker() {
  const consumeUsage = useUsage()
  const navigate = useNavigate()
  const { user } = useAuth()
  const owner = user?._id || user?.id || 'guest'
  const [originalCv, setOriginalCv] = useState(null)
  const [draftOwner, setDraftOwner] = useState(null)
  const originalText = useRef('')
  const onOriginalText = useCallback(text => { originalText.current = text }, [])
  const isOriginal = originalCv?.mode === 'original'
  useEffect(() => {
    let cancelled = false
    setDraftOwner(null)
    setOriginalCv(null)
    readOriginalDraft(owner).then(saved => {
      if (cancelled) return
      setOriginalCv(saved)
      if (saved?.template) setTemplate(saved.template)
      setDraftOwner(owner)
    }).catch(() => { if (!cancelled) { setDraftOwner(owner); setImportError('Local draft storage is unavailable. Keep this page open until you download your CV.') } })
    return () => { cancelled = true }
  }, [owner])
  useEffect(() => {
    if (draftOwner !== owner) return
    const timer = setTimeout(() => { saveOriginalDraft(owner, originalCv).catch(() => setImportError('Could not save this draft locally. Download your CV before leaving.')) }, 250)
    return () => clearTimeout(timer)
  }, [originalCv, owner, draftOwner])
  async function chooseTemplate(id) {
    if (importBusy) return
    if (!isOriginal) { setTemplate(id); setOriginalCv(current => current ? { ...current, template: id } : current); return }
    const text = originalText.current
    if (text.trim().length < 30) { setImportError('This document has too little readable text for a template. You can still edit it in Original format.'); return }
    if (!(await consumeUsage({server:true}))) return
    const version = ++importVersion.current
    setImportBusy(true); setImportError('')
    try {
      const { cv } = await cvAPI.importText(text.slice(0, 40000))
      if (version !== importVersion.current) return
      setForm({ ...EMPTY_FORM, ...cv }); setTemplate(id)
      setOriginalCv(current => ({ ...current, mode: 'template', template: id }))
      setImportNotice('Template applied. Your original document and its edits are available under Original format.')
    } catch (error) { setImportError(error.message || 'Could not apply this template. Your original CV is unchanged.') }
    finally { if (version === importVersion.current) setImportBusy(false) }
  }
  function editOriginal(key, value, initial) {
    setOriginalCv(current => {
      if (!current) return current
      const edits = { ...current.edits }
      if (value === initial) delete edits[key]; else edits[key] = value
      return { ...current, edits }
    })
  }
  const photoInputRef = useRef(null)
  const cvInputRef = useRef(null)
  const importVersion = useRef(0)
  const [importBusy, setImportBusy] = useState(false)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState(null)
  const [importNotice, setImportNotice] = useState('')
  useEffect(() => () => { importVersion.current += 1 }, [])

  async function importExistingCv(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || importBusy) return
    const version = ++importVersion.current
    setImportBusy(true)
    setImportError('')
    setImportNotice('')
    setImportResult(null)
    try {
      const source = await prepareOriginalCv(file)
      if (!(await consumeUsage())) return
      if (version === importVersion.current) setImportResult({ source, fileName: file.name })
    } catch (error) {
      if (version === importVersion.current) setImportError(error.message || 'Could not import this CV. Please try again.')
    } finally {
      if (version === importVersion.current) setImportBusy(false)
    }
  }

  function applyImportedCv() {
    originalText.current = ''
    setOriginalCv(importResult.source)
    setActiveSection('personal')
    setMobileTab('editor')
    setImportResult(null)
    setImportNotice('Original CV opened. Edit it here, or choose a template above to change its design.')
  }

  const [form, setForm] = useState(() => {
    try {
      const saved = localStorage.getItem('cv_maker_draft_v2')
      return saved ? JSON.parse(saved) : SAMPLE_TECH
    } catch {
      return SAMPLE_TECH
    }
  })

  const [template, setTemplate] = useState('executive')
  const [colorTheme, setColorTheme] = useState('indigo')
  const [fontOption, setFontOption] = useState('sans')
  const [activeSection, setActiveSection] = useState('personal')
  const [copiedNotice, setCopiedNotice] = useState(false)
  const [previewZoom, setPreviewZoom] = useState(() => (typeof window !== 'undefined' && window.innerWidth < 768 ? 40 : 75))
  const [mobileTab, setMobileTab] = useState('editor') // 'editor' | 'preview'
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  // Auto-save form draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cv_maker_draft_v2', JSON.stringify(form))
    } catch (e) {
      console.warn('Draft save error:', e)
    }
  }, [form])

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }))
  function editPreviewDetail(event) {
    const clicked = event.target.textContent?.trim()
    if (!clicked) return
    const candidates = [
      ...['name','title','email','phone','location','linkedin','github','website'].map(key => ['personal',form[key]]),
      ...['summary','skills','certifications'].map(key => [key,form[key]]),
      ...['experience','education','projects','languages'].flatMap(section => (form[section] || []).flatMap(row => Object.values(row).map(value => [section,value]))),
    ].filter(([,value]) => typeof value === 'string' && value.trim())
    let match = candidates.find(([,value]) => value.trim() === clicked)
    if (!match) match = candidates.find(([,value]) => value.split('\n').some(line => line.trim() === clicked))
    if (!match) {
      const section = event.target.closest('section')
      const heading = section?.querySelector('h2,h3,h4')?.textContent?.toLowerCase() || ''
      const id = ['summary','skills','experience','education','projects','certifications','languages'].find(key => heading.includes(key))
      if (id) match = [id,'']
    }
    if (!match) return
    setShowReviewModal(false)
    setActiveSection(match[0])
    setMobileTab('editor')
    requestAnimationFrame(() => {
      const fields = [...document.querySelectorAll('.cv-form-body input:not([type=file]):not([type=checkbox]),.cv-form-body textarea,.cv-form-body select')]
      const field = fields.find(input => input.value === match[1]) || fields[0]
      field?.focus()
      field?.scrollIntoView({block:'center',behavior:'smooth'})
    })
  }

  // Experience handlers
  const setExpField = (i, key, val) =>
    setForm((f) => {
      const e = [...f.experience]
      e[i] = { ...e[i], [key]: val }
      return { ...f, experience: e }
    })
  const addExp = () =>
    setForm((f) => ({
      ...f,
      experience: [...f.experience, { company: '', role: '', dates: '', location: '', bullets: '' }],
    }))
  const removeExp = (i) =>
    setForm((f) => ({ ...f, experience: f.experience.filter((_, idx) => idx !== i) }))

  // Education handlers
  const setEduField = (i, key, val) =>
    setForm((f) => {
      const e = [...f.education]
      e[i] = { ...e[i], [key]: val }
      return { ...f, education: e }
    })
  const addEdu = () =>
    setForm((f) => ({
      ...f,
      education: [...f.education, { school: '', degree: '', dates: '', location: '', details: '' }],
    }))
  const removeEdu = (i) =>
    setForm((f) => ({ ...f, education: f.education.filter((_, idx) => idx !== i) }))

  // Project handlers
  const setProjField = (i, key, val) =>
    setForm((f) => {
      const p = [...f.projects]
      p[i] = { ...p[i], [key]: val }
      return { ...f, projects: p }
    })
  const addProj = () =>
    setForm((f) => ({
      ...f,
      projects: [...f.projects, { name: '', tech: '', link: '', desc: '' }],
    }))
  const removeProj = (i) =>
    setForm((f) => ({ ...f, projects: f.projects.filter((_, idx) => idx !== i) }))

  // Language handlers
  const setLangField = (i, key, val) =>
    setForm((f) => {
      const l = [...(f.languages || [])]
      l[i] = { ...l[i], [key]: val }
      return { ...f, languages: l }
    })
  const addLang = () =>
    setForm((f) => ({
      ...f,
      languages: [...(f.languages || []), { name: '', level: 'Fluent' }],
    }))
  const removeLang = (i) =>
    setForm((f) => ({
      ...f,
      languages: (f.languages || []).filter((_, idx) => idx !== i),
    }))

  // Photo upload handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (uploadEvent) => {
      setField('photo', uploadEvent.target.result)
    }
    reader.readAsDataURL(file)
  }

  // Quick skill add
  const handleAddSkillTag = (skillName) => {
    const existing = form.skills ? form.skills.split(',').map((s) => s.trim()) : []
    if (!existing.includes(skillName)) {
      const updated = existing.length > 0 ? `${form.skills.trim()}, ${skillName}` : skillName
      setField('skills', updated)
    }
  }

  // Convert current CV to clean plain text format for copy / transfer
  const getCvAsPlainText = () => {
    const lines = []
    if (form.name) lines.push(form.name.toUpperCase())
    if (form.title) lines.push(form.title)
    const contacts = [form.email, form.phone, form.location, form.linkedin, form.github, form.website].filter(Boolean)
    if (contacts.length > 0) lines.push(contacts.join(' | '))
    lines.push('')

    if (form.summary) {
      lines.push('PROFESSIONAL SUMMARY:')
      lines.push(form.summary)
      lines.push('')
    }

    if (form.skills) {
      lines.push('TECHNICAL & PROFESSIONAL SKILLS:')
      lines.push(form.skills)
      lines.push('')
    }

    const validExp = form.experience.filter((e) => e.company || e.role)
    if (validExp.length > 0) {
      lines.push('WORK EXPERIENCE:')
      validExp.forEach((e) => {
        lines.push(`${e.role || 'Position'} | ${e.company || 'Company'} (${e.dates || 'Dates'})${e.location ? ` - ${e.location}` : ''}`)
        if (e.bullets) {
          e.bullets
            .split('\n')
            .filter(Boolean)
            .forEach((b) => lines.push(`• ${b}`))
        }
      })
      lines.push('')
    }

    const validEdu = form.education.filter((e) => e.school || e.degree)
    if (validEdu.length > 0) {
      lines.push('EDUCATION:')
      validEdu.forEach((e) => {
        lines.push(`${e.degree || 'Degree'} - ${e.school || 'School'} (${e.dates || 'Dates'})${e.details ? ` | ${e.details}` : ''}`)
      })
      lines.push('')
    }

    const validProj = form.projects.filter((p) => p.name)
    if (validProj.length > 0) {
      lines.push('KEY PROJECTS:')
      validProj.forEach((p) => {
        lines.push(`• ${p.name}${p.tech ? ` [${p.tech}]` : ''}: ${p.desc || ''}${p.link ? ` (Link: ${p.link})` : ''}`)
      })
      lines.push('')
    }

    if (form.certifications) {
      lines.push('CERTIFICATIONS & AWARDS:')
      lines.push(form.certifications)
      lines.push('')
    }

    const validLangs = (form.languages || []).filter((l) => l.name)
    if (validLangs.length > 0) {
      lines.push('LANGUAGES:')
      lines.push(validLangs.map((l) => `${l.name} (${l.level || 'Fluent'})`).join(', '))
    }

    return lines.join('\n')
  }

  // Copy text to clipboard
  const handleCopyText = async () => {
    const text = getCvAsPlainText()
    try {
      await navigator.clipboard.writeText(text)
      setCopiedNotice(true)
      setTimeout(() => setCopiedNotice(false), 2000)
    } catch (e) {
      console.warn('Copy failed:', e)
    }
  }

  // Transfer CV directly to AI Career Coach
  const handleTestInAiCareer = () => {
    const text = getCvAsPlainText()
    if (!text.trim()) {
      alert('Please fill in your CV details first.')
      return
    }
    localStorage.setItem('career_cv_transfer', text)
    localStorage.setItem('career_cv_name', form.name ? `${form.name}'s CV` : 'CV from CV Maker')
    navigate('/ai-career')
  }

  // Direct PDF Download Handler
  const handleDownloadPdf = async () => {
    if (isExportingPdf) return
    if (!(await consumeUsage())) return
    setIsExportingPdf(true)

    try {
      // Find the currently rendered CV document
      const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])
      const cvElement =
        document.querySelector('.cv-review-modal-body .cv-document') ||
        document.querySelector('.cv-preview-panel .cv-document')

      if (!cvElement) {
        throw new Error('CV document element not found')
      }

      // Clone element off-screen to ensure accurate capture at 100% scale regardless of UI zoom
      const clone = cvElement.cloneNode(true)
      clone.style.transform = 'none'
      clone.style.margin = '0'
      clone.style.boxShadow = 'none'
      clone.style.position = 'fixed'
      clone.style.top = '-9999px'
      clone.style.left = '-9999px'
      clone.style.width = '760px'
      clone.style.zIndex = '-9999'
      clone.style.background = '#ffffff'
      document.body.appendChild(clone)

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      })

      document.body.removeChild(clone)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgHeight = (canvas.height * pdfWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
      heightLeft -= pdfHeight

      while (heightLeft > 5) {
        position -= pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight)
        heightLeft -= pdfHeight
      }

      const safeName = (form.name || 'Resume').trim().replace(/[^a-zA-Z0-9_-]/g, '_')
      pdf.save(`${safeName}_CV.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Could not download PDF directly. Please try again.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const selectedTheme = COLOR_THEMES.find((c) => c.id === colorTheme) || COLOR_THEMES[0]
  const selectedFont = FONT_OPTIONS.find((f) => f.id === fontOption) || FONT_OPTIONS[0]

  return (
    <div className="cv-page">
      <div className="cv-glow-orb" />

      {/* Header */}
      <header className="cv-header">
        <div className="converter-badge">
          <span className="badge-sparkle">✦</span>
          <span>Executive CV Studio</span>
        </div>
        <h1 className="converter-title">Premium CV Maker</h1>
      </header>

      {/* Top Controls: Design Bar + Action Bar */}
      <div className="cv-controls-wrapper">
        {/* Row 1: Design Controls */}
        <div className="cv-design-bar">
          <div className="cv-design-row cv-template-row">
            <span className="cv-bar-label">Template:</span>
            <div className="cv-tpl-scroll">
              {originalCv && <button type="button" className={`cv-tpl-btn ${isOriginal ? 'active' : ''}`} aria-pressed={isOriginal} disabled={importBusy} onClick={() => setOriginalCv(current => ({ ...current, mode: 'original' }))}>Original format</button>}
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`cv-tpl-btn ${!isOriginal && template === t.id ? 'active' : ''}`}
                  onClick={() => chooseTemplate(t.id)}
                  disabled={importBusy}
                  aria-pressed={!isOriginal && template === t.id}
                  title={t.desc}
                >
                  <svg className="tpl-icon" width="16" height="18" viewBox="0 0 20 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><rect x="3" y="2" width="14" height="20" rx="2" /><path d="M6 7h8M6 11h8M6 15h5M6 18h7" /></svg>
                  <span className="tpl-name">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color Swatches */}
          {!isOriginal && <div className="cv-design-row cv-color-row">
            <span className="cv-bar-label">Color:</span>
            <div className="cv-color-scroll">
              <div className="cv-color-swatches">
                {COLOR_THEMES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`color-swatch-btn ${colorTheme === c.id ? 'active' : ''}`}
                    style={{ background: c.primary }}
                    onClick={() => setColorTheme(c.id)}
                    title={c.label}
                    aria-label={c.label}
                    aria-pressed={colorTheme === c.id}
                  />
                ))}
              </div>
            </div>
          </div>}
        </div>

        {/* Row 2: Actions Bar */}
        <div className="cv-action-bar">
          <div className="cv-action-left">
            <input ref={cvInputRef} hidden type="file" accept=".pdf,.docx,.txt" aria-label="Upload existing CV file" onChange={importExistingCv} disabled={importBusy} tabIndex={-1} />
            <button type="button" className="cv-action-btn cv-import-button" onClick={() => cvInputRef.current?.click()} disabled={importBusy}>
              {importBusy ? 'Reading your CV…' : '↑ Upload existing CV'}
            </button>
            <button type="button" className="cv-action-btn clear" disabled={importBusy} onClick={() => { setForm(EMPTY_FORM); setOriginalCv(null); setImportResult(null); setImportNotice(''); setImportError('') }}>
              🗑️ Clear
            </button>
          </div>
          <div className="cv-action-right" style={isOriginal ? { display: 'none' } : undefined}>
            <button
              type="button"
              className="cv-action-btn cv-review-main-btn"
              onClick={() => setShowReviewModal(true)}
            >
              👁️ Preview
            </button>
          </div>
        </div>
      </div>

      {/* Mobile/Tablet View Switcher (< 1024px) */}
      {(importBusy || importResult || importNotice || importError) && <section className="cv-import-status" aria-label="Import existing CV">
        {importBusy && <p role="status">Preparing your document. Your current draft stays intact until you apply the import.</p>}
        {importError && <p role="alert" className="cv-import-error">{importError}</p>}
        {importNotice && <p role="status">{importNotice}</p>}
        {importResult && <div className="cv-import-review">
          <div><h2>Ready to edit your existing CV</h2><p>{importResult.fileName}</p></div>
<p>Your original document opens without applying a template. Edit its text while keeping its layout, images and colors. Templates are applied only when you select one.</p>
          <div className="cv-import-actions"><button type="button" className="cv-action-btn cv-import-button" onClick={applyImportedCv}>Apply & edit CV</button><button type="button" className="cv-action-btn" onClick={() => setImportResult(null)}>Cancel</button></div>
        </div>}
      </section>}
      {isOriginal ? <OriginalCvEditor key={originalCv.id} document={originalCv} onEdit={editOriginal} onChange={setOriginalCv} onTextChange={onOriginalText} /> : <>
      <div className="mobile-view-switcher">
        <button
          type="button"
          className={`mobile-view-btn ${mobileTab === 'editor' ? 'active' : ''}`}
          onClick={() => setMobileTab('editor')}
        >
          ✏️ Edit Details
        </button>
        <button
          type="button"
          className={`mobile-view-btn ${mobileTab === 'preview' ? 'active' : ''}`}
          onClick={() => setMobileTab('preview')}
        >
          👁️ Preview
        </button>
      </div>

      {/* Main Workspace */}
      <div className={`cv-workspace ${mobileTab === 'preview' ? 'show-preview-mobile' : 'show-editor-mobile'}`}>
        {/* LEFT: Form Editor Panel */}
        <div className="cv-form-panel">
          <SectionTabs>
            {FORM_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                className={`cv-tab ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </SectionTabs>

          <div className="cv-form-body">
            {/* 1. PERSONAL INFO & PHOTO */}
            {activeSection === 'personal' && (
              <div className="cv-form-section">
                <div className="photo-upload-row">
                  <div className="photo-preview-wrap">
                    {form.photo ? (
                      <img src={form.photo} alt="Profile" className="user-avatar-img" />
                    ) : (
                      <div className="user-avatar-placeholder">
                        {form.name
                          ? form.name
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                          : '📷'}
                      </div>
                    )}
                  </div>
                  <div className="photo-actions">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn-upload-photo"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      📷 {form.photo ? 'Change Photo' : 'Upload Headshot Photo'}
                    </button>
                    {form.photo && (
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => setField('photo', '')}
                      >
                        Remove Photo
                      </button>
                    )}
                    <label className="toggle-photo-check">
                      <input
                        type="checkbox"
                        checked={form.showPhoto}
                        onChange={(e) => setField('showPhoto', e.target.checked)}
                      />
                      <span>Show Photo on CV Document</span>
                    </label>
                  </div>
                </div>

                <div className="cv-field-grid">
                  <div className="cv-field">
                    <label>{t("Full Name *")}</label>
                    <input
                      placeholder="e.g. Sarah Johnson"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                    />
                  </div>
                  <div className="cv-field">
                    <label>Professional Job Title *</label>
                    <input
                      placeholder="e.g. Senior Full Stack Developer"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                    />
                  </div>
                  <div className="cv-field">
                    <label>{t("Email Address")}</label>
                    <input
                      placeholder="sarah@example.com"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                    />
                  </div>
                  <div className="cv-field">
                    <label>{t("Phone Number")}</label>
                    <input
                      placeholder="+1 (555) 000-0000"
                      value={form.phone}
                      onChange={(e) => setField('phone', e.target.value)}
                    />
                  </div>
                  <div className="cv-field">
                    <label>Location (City, Country)</label>
                    <input
                      placeholder="San Francisco, CA"
                      value={form.location}
                      onChange={(e) => setField('location', e.target.value)}
                    />
                  </div>
                  <div className="cv-field">
                    <label>LinkedIn Profile</label>
                    <input
                      placeholder="linkedin.com/in/username"
                      value={form.linkedin}
                      onChange={(e) => setField('linkedin', e.target.value)}
                    />
                  </div>
                  <div className="cv-field">
                    <label>GitHub Profile / Portfolio</label>
                    <input
                      placeholder="github.com/username"
                      value={form.github}
                      onChange={(e) => setField('github', e.target.value)}
                    />
                  </div>
                  <div className="cv-field">
                    <label>Personal Website</label>
                    <input
                      placeholder="portfolio.dev"
                      value={form.website}
                      onChange={(e) => setField('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. SUMMARY */}
            {activeSection === 'summary' && (
              <div className="cv-form-section">
                <div className="cv-field">
                  <label>Executive Professional Summary</label>
                  <textarea
                    rows={8}
                    placeholder="Brief summary of your professional experience and key strengths..."
                    value={form.summary}
                    onChange={(e) => setField('summary', e.target.value)}
                  />
                  <div className="field-hint">
                    💡 <strong>Pro Tip:</strong> Quantify your achievements (e.g. "Increased performance by 40%", "Led team of 6 engineers", "Served 100K+ active users").
                  </div>
                </div>
              </div>
            )}

            {/* 3. SKILLS */}
            {activeSection === 'skills' && (
              <div className="cv-form-section">
                <div className="cv-field">
                  <label>Skills &amp; Technologies (comma-separated)</label>
                  <textarea
                    rows={5}
                    placeholder="e.g. React, Node.js, TypeScript, Python, SQL..."
                    value={form.skills}
                    onChange={(e) => setField('skills', e.target.value)}
                  />
                </div>

                {/* Quick Add Skill Chips */}
                <div className="quick-skills-panel">
                  <span className="quick-skills-title">Click to add popular skills:</span>
                  <div className="skill-category-chips">
                    {[
                      'React.js', 'Next.js', 'TypeScript', 'Node.js', 'Python',
                      'PostgreSQL', 'MongoDB', 'Docker', 'Kubernetes', 'AWS',
                      'Redis', 'CI/CD', 'GraphQL', 'Tailwind CSS', 'Git',
                      'REST APIs', 'System Design', 'Microservices', 'Jest', 'Figma'
                    ].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="quick-skill-tag"
                        onClick={() => handleAddSkillTag(s)}
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. EXPERIENCE */}
            {activeSection === 'experience' && (
              <div className="cv-form-section">
                <div className="cv-repeatable-list">
                  {form.experience.map((exp, i) => (
                    <div key={i} className="cv-repeatable-block">
                      <div className="cv-block-header">
                        <span className="cv-block-num">💼 Experience #{i + 1}</span>
                        {form.experience.length > 1 && (
                          <button type="button" className="cv-remove-btn" onClick={() => removeExp(i)}>
                            ✕ Remove
                          </button>
                        )}
                      </div>
                      <div className="cv-field-grid">
                        <div className="cv-field">
                          <label>Company / Organization *</label>
                          <input
                            placeholder="TechCorp Inc."
                            value={exp.company}
                            onChange={(e) => setExpField(i, 'company', e.target.value)}
                          />
                        </div>
                        <div className="cv-field">
                          <label>Job Title / Role *</label>
                          <input
                            placeholder="Senior Developer"
                            value={exp.role}
                            onChange={(e) => setExpField(i, 'role', e.target.value)}
                          />
                        </div>
                        <div className="cv-field">
                          <label>Dates / Duration</label>
                          <input
                            placeholder="Jan 2022 – Present"
                            value={exp.dates}
                            onChange={(e) => setExpField(i, 'dates', e.target.value)}
                          />
                        </div>
                        <div className="cv-field">
                          <label>Location</label>
                          <input
                            placeholder="San Francisco, CA (or Remote)"
                            value={exp.location || ''}
                            onChange={(e) => setExpField(i, 'location', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="cv-field">
                        <label>Key Responsibilities &amp; Achievements (one bullet per line)</label>
                        <textarea
                          rows={4}
                          placeholder="Key responsibilities and achievements (one per line)..."
                          value={exp.bullets}
                          onChange={(e) => setExpField(i, 'bullets', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="cv-add-btn" onClick={addExp}>
                  + Add Another Work Experience
                </button>
              </div>
            )}

            {/* 5. EDUCATION */}
            {activeSection === 'education' && (
              <div className="cv-form-section">
                <div className="cv-repeatable-list">
                  {form.education.map((edu, i) => (
                    <div key={i} className="cv-repeatable-block">
                      <div className="cv-block-header">
                        <span className="cv-block-num">🎓 Education #{i + 1}</span>
                        {form.education.length > 1 && (
                          <button type="button" className="cv-remove-btn" onClick={() => removeEdu(i)}>
                            ✕ Remove
                          </button>
                        )}
                      </div>
                      <div className="cv-field-grid">
                        <div className="cv-field">
                          <label>University / School *</label>
                          <input
                            placeholder="University of California, Berkeley"
                            value={edu.school}
                            onChange={(e) => setEduField(i, 'school', e.target.value)}
                          />
                        </div>
                        <div className="cv-field">
                          <label>Degree / Major *</label>
                          <input
                            placeholder="B.Sc. in Computer Science"
                            value={edu.degree}
                            onChange={(e) => setEduField(i, 'degree', e.target.value)}
                          />
                        </div>
                        <div className="cv-field">
                          <label>Graduation Year / Dates</label>
                          <input
                            placeholder="2016 – 2020"
                            value={edu.dates}
                            onChange={(e) => setEduField(i, 'dates', e.target.value)}
                          />
                        </div>
                        <div className="cv-field">
                          <label>Location</label>
                          <input
                            placeholder="Berkeley, CA"
                            value={edu.location || ''}
                            onChange={(e) => setEduField(i, 'location', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="cv-field">
                        <label>Honors / GPA / Activities (Optional)</label>
                        <input
                          placeholder="e.g. Magna Cum Laude, GPA 3.8"
                          value={edu.details || ''}
                          onChange={(e) => setEduField(i, 'details', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="cv-add-btn" onClick={addEdu}>
                  + Add Another Degree
                </button>
              </div>
            )}

            {/* 6. PROJECTS */}
            {activeSection === 'projects' && (
              <div className="cv-form-section">
                <div className="cv-repeatable-list">
                  {form.projects.map((proj, i) => (
                    <div key={i} className="cv-repeatable-block">
                      <div className="cv-block-header">
                        <span className="cv-block-num">🚀 Project #{i + 1}</span>
                        {form.projects.length > 1 && (
                          <button type="button" className="cv-remove-btn" onClick={() => removeProj(i)}>
                            ✕ Remove
                          </button>
                        )}
                      </div>
                      <div className="cv-field-grid">
                        <div className="cv-field">
                          <label>Project Name *</label>
                          <input
                            placeholder="e.g. OpenFlow Cloud Automation"
                            value={proj.name}
                            onChange={(e) => setProjField(i, 'name', e.target.value)}
                          />
                        </div>
                        <div className="cv-field">
                          <label>Tech Stack</label>
                          <input
                            placeholder="e.g. React, Node.js, Redis, Docker"
                            value={proj.tech || ''}
                            onChange={(e) => setProjField(i, 'tech', e.target.value)}
                          />
                        </div>
                        <div className="cv-field cv-field-full">
                          <label>Live URL / GitHub Repository</label>
                          <input
                            placeholder="github.com/username/project"
                            value={proj.link || ''}
                            onChange={(e) => setProjField(i, 'link', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="cv-field">
                        <label>Project Description &amp; Impact</label>
                        <textarea
                          rows={3}
                          placeholder="Brief description of the project and key results..."
                          value={proj.desc}
                          onChange={(e) => setProjField(i, 'desc', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" className="cv-add-btn" onClick={addProj}>
                  + Add Another Project
                </button>
              </div>
            )}

            {/* 7. CERTIFICATIONS */}
            {activeSection === 'certifications' && (
              <div className="cv-form-section">
                <div className="cv-field">
                  <label>Certifications, Awards &amp; Licenses (one per line)</label>
                  <textarea
                    rows={6}
                    placeholder="e.g. AWS Solutions Architect, PMP Certification..."
                    value={form.certifications}
                    onChange={(e) => setField('certifications', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 8. LANGUAGES */}
            {activeSection === 'languages' && (
              <div className="cv-form-section">
                {(form.languages || []).map((lang, i) => (
                  <div key={i} className="cv-repeatable-block lang-block">
                    <div className="cv-field-grid">
                      <div className="cv-field">
                        <label>{t("Language")}</label>
                        <input
                          placeholder="e.g. English, Urdu, Spanish"
                          value={lang.name}
                          onChange={(e) => setLangField(i, 'name', e.target.value)}
                        />
                      </div>
                      <div className="cv-field">
                        <label>Proficiency Level</label>
                        <input
                          placeholder="e.g. Native, Fluent, Professional"
                          value={lang.level}
                          onChange={(e) => setLangField(i, 'level', e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="cv-remove-btn"
                      onClick={() => removeLang(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button type="button" className="cv-add-btn" onClick={addLang}>
                  + Add Language
                </button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Live Preview Panel */}
        <div className="cv-preview-panel">
          <div className="cv-preview-header">
            <div className="cv-preview-title">
              <span className="preview-indicator-dot" />
              <span>A4 Document Preview</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="preview-zoom-controls">
                <button
                  type="button"
                  className={`zoom-btn ${previewZoom === 50 ? 'active' : ''}`}
                  onClick={() => setPreviewZoom(50)}
                  title="50% Zoom"
                >
                  50%
                </button>
                <button
                  type="button"
                  className={`zoom-btn ${previewZoom === 75 ? 'active' : ''}`}
                  onClick={() => setPreviewZoom(75)}
                  title="75% Zoom"
                >
                  75%
                </button>
                <button
                  type="button"
                  className={`zoom-btn ${previewZoom === 100 ? 'active' : ''}`}
                  onClick={() => setPreviewZoom(100)}
                  title="100% Zoom"
                >
                  100%
                </button>
              </div>
              <button
                type="button"
                className="cv-preview-download-btn"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                title="Download CV as PDF"
              >
                {isExportingPdf ? '⏳ Downloading...' : '⬇️ Download PDF'}
              </button>
            </div>
          </div>

          <div
            className={`cv-document-frame cv-theme-${colorTheme}`}
            style={{
              fontFamily: selectedFont.family,
            }}
          >
            <div
              className={`cv-document cv-tpl-${template}`}
              onClick={editPreviewDetail}
              style={{
                '--theme-primary': selectedTheme.primary,
                '--theme-accent': selectedTheme.accent,
                '--theme-light': selectedTheme.light,
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <CvRenderer form={form} template={template} theme={selectedTheme} />
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal Dialog ("khulne kai baad pdf download kro") */}
      {showReviewModal && (
        <div className="cv-review-modal-backdrop" onClick={() => setShowReviewModal(false)}>
          <div className="cv-review-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cv-review-modal-header">
              <div className="cv-review-modal-title">
                <span className="preview-indicator-dot" />
                <span>Document Preview</span>
              </div>

              <div className="cv-review-modal-actions">
                <div className="preview-zoom-controls">
                  <button
                    type="button"
                    className={`zoom-btn ${previewZoom === 50 ? 'active' : ''}`}
                    onClick={() => setPreviewZoom(50)}
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    className={`zoom-btn ${previewZoom === 75 ? 'active' : ''}`}
                    onClick={() => setPreviewZoom(75)}
                  >
                    75%
                  </button>
                  <button
                    type="button"
                    className={`zoom-btn ${previewZoom === 100 ? 'active' : ''}`}
                    onClick={() => setPreviewZoom(100)}
                  >
                    100%
                  </button>
                </div>

                <button
                  type="button"
                  className="cv-modal-download-btn"
                  onClick={handleDownloadPdf}
                  disabled={isExportingPdf}
                  title="Download CV as PDF"
                >
                  {isExportingPdf ? '⏳ Downloading...' : '⬇️ Download PDF'}
                </button>

                <button
                  type="button"
                  className="cv-modal-close-btn"
                  onClick={() => setShowReviewModal(false)}
                  title="Close Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="cv-review-modal-body">
              <div
                className={`cv-document-frame cv-theme-${colorTheme}`}
                style={{
                  fontFamily: selectedFont.family,
                  '--theme-primary': selectedTheme.primary,
                  '--theme-accent': selectedTheme.accent,
                  '--theme-light': selectedTheme.light,
                }}
              >
                <div
                  className={`cv-document cv-tpl-${template}`}
                  onClick={editPreviewDetail}
                  style={{
                    '--theme-primary': selectedTheme.primary,
                    '--theme-accent': selectedTheme.accent,
                    '--theme-light': selectedTheme.light,
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <CvRenderer form={form} template={template} theme={selectedTheme} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  )
}

// ── TEMPLATE ROUTER ──
function CvRenderer({ form, template, theme }) {
  const skills = form.skills
    ? form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : []
  const certs = form.certifications
    ? form.certifications
        .split('\n')
        .map((c) => c.trim())
        .filter(Boolean)
    : []

  switch (template) {
    case 'tech_pro':
      return <TechProTemplate form={form} skills={skills} certs={certs} theme={theme} />
    case 'creative':
      return <CreativeTemplate form={form} skills={skills} certs={certs} theme={theme} />
    case 'ats_classic':
      return <AtsClassicTemplate form={form} skills={skills} certs={certs} theme={theme} />
    case 'compact':
      return <CompactTemplate form={form} skills={skills} certs={certs} theme={theme} />
    case 'minimal':
      return <MinimalTemplate form={form} skills={skills} certs={certs} theme={theme} />
    case 'executive':
    default:
      return <ExecutiveTemplate form={form} skills={skills} certs={certs} theme={theme} />
  }
}

// ─────────────────────────────────────────────────────────────
// 1. EXECUTIVE LUXE TEMPLATE (Sapphire/Navy Sidebar + Monogram)
// ─────────────────────────────────────────────────────────────
function ExecutiveTemplate({ form, skills, certs, theme }) {
  const initials = (form.name || 'YN')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')

  return (
    <div className="tpl-executive">
      {/* Sidebar */}
      <aside className="exec-sidebar">
        {/* Photo / Avatar */}
        <div className="exec-avatar-block">
          {form.photo && form.showPhoto ? (
            <img src={form.photo} alt={form.name} className="exec-avatar-img" />
          ) : (
            <div className="exec-initials-badge">{initials}</div>
          )}
          <h1 className="exec-name">{form.name || 'Your Full Name'}</h1>
          <p className="exec-title">{form.title || 'Professional Title'}</p>
        </div>

        {/* Contact */}
        <div className="exec-side-section">
          <h3 className="exec-side-heading">Contact</h3>
          <div className="exec-contact-list">
            {form.email && <div className="exec-contact-item">✉ {form.email}</div>}
            {form.phone && <div className="exec-contact-item">📱 {form.phone}</div>}
            {form.location && <div className="exec-contact-item">📍 {form.location}</div>}
            {form.linkedin && <div className="exec-contact-item">🔗 {form.linkedin}</div>}
            {form.github && <div className="exec-contact-item">⌥ {form.github}</div>}
            {form.website && <div className="exec-contact-item">🌐 {form.website}</div>}
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div className="exec-side-section">
            <h3 className="exec-side-heading">Core Competencies</h3>
            <div className="exec-skills-grid">
              {skills.map((s, idx) => (
                <span key={idx} className="exec-skill-tag">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certs.length > 0 && (
          <div className="exec-side-section">
            <h3 className="exec-side-heading">Certifications</h3>
            <div className="exec-certs-list">
              {certs.map((c, idx) => (
                <div key={idx} className="exec-cert-item">
                  🏅 {c}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Languages */}
        {form.languages && form.languages.some((l) => l.name) && (
          <div className="exec-side-section">
            <h3 className="exec-side-heading">Languages</h3>
            <div className="exec-lang-list">
              {form.languages
                .filter((l) => l.name)
                .map((l, idx) => (
                  <div key={idx} className="exec-lang-item">
                    <strong>{l.name}</strong>: <span>{l.level || 'Fluent'}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="exec-main">
        {/* Summary */}
        {form.summary && (
          <section className="exec-section">
            <h2 className="exec-main-heading">Executive Profile</h2>
            <p className="exec-summary-text">{form.summary}</p>
          </section>
        )}

        {/* Work Experience */}
        {form.experience.some((e) => e.company || e.role) && (
          <section className="exec-section">
            <h2 className="exec-main-heading">Professional Experience</h2>
            <div className="exec-timeline">
              {form.experience.map(
                (exp, idx) =>
                  (exp.company || exp.role) && (
                    <div key={idx} className="exec-timeline-item">
                      <div className="exec-timeline-dot" />
                      <div className="exec-exp-header">
                        <div>
                          <div className="exec-exp-role">{exp.role || 'Position Title'}</div>
                          <div className="exec-exp-company">
                            {exp.company} {exp.location ? `· ${exp.location}` : ''}
                          </div>
                        </div>
                        <span className="exec-exp-dates">{exp.dates}</span>
                      </div>
                      {exp.bullets && (
                        <ul className="exec-bullets">
                          {exp.bullets
                            .split('\n')
                            .filter(Boolean)
                            .map((b, bi) => (
                              <li key={bi}>{b}</li>
                            ))}
                        </ul>
                      )}
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {/* Education */}
        {form.education.some((e) => e.school || e.degree) && (
          <section className="exec-section">
            <h2 className="exec-main-heading">{t("Education")}</h2>
            <div className="exec-edu-list">
              {form.education.map(
                (edu, idx) =>
                  edu.school && (
                    <div key={idx} className="exec-edu-item">
                      <div className="exec-edu-header">
                        <div>
                          <div className="exec-edu-degree">{edu.degree}</div>
                          <div className="exec-edu-school">
                            {edu.school} {edu.location ? `· ${edu.location}` : ''}
                          </div>
                        </div>
                        <span className="exec-edu-dates">{edu.dates}</span>
                      </div>
                      {edu.details && <div className="exec-edu-details">{edu.details}</div>}
                    </div>
                  )
              )}
            </div>
          </section>
        )}

        {/* Projects */}
        {form.projects.some((p) => p.name) && (
          <section className="exec-section">
            <h2 className="exec-main-heading">Key Projects</h2>
            <div className="exec-proj-list">
              {form.projects.map(
                (proj, idx) =>
                  proj.name && (
                    <div key={idx} className="exec-proj-item">
                      <div className="exec-proj-header">
                        <span className="exec-proj-title">{proj.name}</span>
                        {proj.tech && <span className="exec-proj-tech">[{proj.tech}]</span>}
                      </div>
                      {proj.desc && <p className="exec-proj-desc">{proj.desc}</p>}
                      {proj.link && <div className="exec-proj-link">🔗 {proj.link}</div>}
                    </div>
                  )
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. TECH PRO TEMPLATE (Modern Banner, Monospace Skills, Metrics)
// ─────────────────────────────────────────────────────────────
function TechProTemplate({ form, skills, certs }) {
  return (
    <div className="tpl-tech-pro">
      {/* Top Banner */}
      <header className="tech-header">
        <div className="tech-header-main">
          {form.photo && form.showPhoto && (
            <img src={form.photo} alt={form.name} className="tech-avatar-img" />
          )}
          <div className="tech-header-text">
            <h1 className="tech-name">{form.name || 'Your Full Name'}</h1>
            <div className="tech-title-badge">⚡ {form.title || 'Senior Software Engineer'}</div>
            <div className="tech-contacts-row">
              {form.email && <span>✉ {form.email}</span>}
              {form.phone && <span>📱 {form.phone}</span>}
              {form.location && <span>📍 {form.location}</span>}
              {form.github && <span className="tech-link">⌥ {form.github}</span>}
              {form.linkedin && <span className="tech-link">🔗 {form.linkedin}</span>}
              {form.website && <span className="tech-link">🌐 {form.website}</span>}
            </div>
          </div>
        </div>
      </header>

      <div className="tech-body-grid">
        {/* Main Column */}
        <div className="tech-main-col">
          {form.summary && (
            <section className="tech-card">
              <h3 className="tech-section-title">README.md — About Me</h3>
              <p className="tech-summary-text">{form.summary}</p>
            </section>
          )}

          {form.experience.some((e) => e.company || e.role) && (
            <section className="tech-card">
              <h3 className="tech-section-title">Work Experience</h3>
              <div className="tech-exp-list">
                {form.experience.map(
                  (exp, idx) =>
                    (exp.company || exp.role) && (
                      <div key={idx} className="tech-exp-item">
                        <div className="tech-exp-header">
                          <div>
                            <span className="tech-role">{exp.role}</span>
                            <span className="tech-company"> @ {exp.company}</span>
                          </div>
                          <span className="tech-dates">{exp.dates}</span>
                        </div>
                        {exp.bullets && (
                          <ul className="tech-bullets">
                            {exp.bullets
                              .split('\n')
                              .filter(Boolean)
                              .map((b, bi) => (
                                <li key={bi}>{b}</li>
                              ))}
                          </ul>
                        )}
                      </div>
                    )
                )}
              </div>
            </section>
          )}

          {form.projects.some((p) => p.name) && (
            <section className="tech-card">
              <h3 className="tech-section-title">Open Source &amp; Projects</h3>
              <div className="tech-proj-grid">
                {form.projects.map(
                  (p, idx) =>
                    p.name && (
                      <div key={idx} className="tech-proj-card">
                        <div className="tech-proj-name">
                          <strong>{p.name}</strong>
                          {p.link && <span className="tech-p-link">{p.link}</span>}
                        </div>
                        {p.tech && <div className="tech-p-tags">{p.tech}</div>}
                        {p.desc && <p className="tech-p-desc">{p.desc}</p>}
                      </div>
                    )
                )}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="tech-side-col">
          {skills.length > 0 && (
            <section className="tech-side-card">
              <h4 className="tech-side-title">Tech Stack</h4>
              <div className="tech-pills-wrap">
                {skills.map((s, idx) => (
                  <span key={idx} className="tech-pill">
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {form.education.some((e) => e.school) && (
            <section className="tech-side-card">
              <h4 className="tech-side-title">{t("Education")}</h4>
              {form.education.map(
                (edu, idx) =>
                  edu.school && (
                    <div key={idx} className="tech-edu-block">
                      <div className="tech-edu-deg">{edu.degree}</div>
                      <div className="tech-edu-sch">{edu.school}</div>
                      <div className="tech-edu-date">{edu.dates}</div>
                      {edu.details && <div className="tech-edu-det">{edu.details}</div>}
                    </div>
                  )
              )}
            </section>
          )}

          {certs.length > 0 && (
            <section className="tech-side-card">
              <h4 className="tech-side-title">Certifications</h4>
              <div className="tech-certs">
                {certs.map((c, idx) => (
                  <div key={idx} className="tech-cert-line">
                    ✓ {c}
                  </div>
                ))}
              </div>
            </section>
          )}

          {form.languages && form.languages.some((l) => l.name) && (
            <section className="tech-side-card">
              <h4 className="tech-side-title">Languages</h4>
              <div className="tech-langs">
                {form.languages
                  .filter((l) => l.name)
                  .map((l, idx) => (
                    <div key={idx} className="tech-lang-line">
                      <span>{l.name}</span>
                      <small>{l.level || 'Fluent'}</small>
                    </div>
                  ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. NORDIC CREATIVE TEMPLATE (Asymmetric, Tint Cards, Clean)
// ─────────────────────────────────────────────────────────────
function CreativeTemplate({ form, skills, certs }) {
  return (
    <div className="tpl-creative">
      <header className="creative-header">
        <div className="creative-title-wrap">
          {form.photo && form.showPhoto && (
            <img src={form.photo} alt={form.name} className="creative-avatar" />
          )}
          <div>
            <h1 className="creative-name">{form.name || 'Your Full Name'}</h1>
            <p className="creative-subtitle">{form.title || 'Creative Professional'}</p>
          </div>
        </div>
        <div className="creative-contact-pills">
          {[form.email, form.phone, form.location, form.linkedin, form.website]
            .filter(Boolean)
            .map((item, idx) => (
              <span key={idx} className="creative-c-pill">
                {item}
              </span>
            ))}
        </div>
      </header>

      {form.summary && (
        <section className="creative-summary-box">
          <p>{form.summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="creative-skills-row">
          <span className="creative-row-label">SKILLS &amp; TOOLS</span>
          <div className="creative-chips">
            {skills.map((s, idx) => (
              <span key={idx} className="creative-chip">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="creative-two-col">
        {/* Left Column: Experience */}
        <div className="creative-col">
          <h3 className="creative-col-title">EXPERIENCE</h3>
          {form.experience.map(
            (exp, idx) =>
              (exp.company || exp.role) && (
                <div key={idx} className="creative-exp-card">
                  <div className="c-exp-top">
                    <div>
                      <div className="c-role">{exp.role}</div>
                      <div className="c-company">{exp.company}</div>
                    </div>
                    <span className="c-dates">{exp.dates}</span>
                  </div>
                  {exp.bullets && (
                    <ul className="c-bullets">
                      {exp.bullets
                        .split('\n')
                        .filter(Boolean)
                        .map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                    </ul>
                  )}
                </div>
              )
          )}
        </div>

        {/* Right Column: Education & Projects */}
        <div className="creative-col">
          {form.education.some((e) => e.school) && (
            <div className="creative-sub-block">
              <h3 className="creative-col-title">EDUCATION</h3>
              {form.education.map(
                (edu, idx) =>
                  edu.school && (
                    <div key={idx} className="creative-edu-card">
                      <div className="c-edu-deg">{edu.degree}</div>
                      <div className="c-edu-sch">
                        {edu.school} · {edu.dates}
                      </div>
                      {edu.details && <div className="c-edu-det">{edu.details}</div>}
                    </div>
                  )
              )}
            </div>
          )}

          {form.projects.some((p) => p.name) && (
            <div className="creative-sub-block">
              <h3 className="creative-col-title">FEATURED PROJECTS</h3>
              {form.projects.map(
                (p, idx) =>
                  p.name && (
                    <div key={idx} className="creative-proj-card">
                      <div className="c-p-name">{p.name}</div>
                      {p.tech && <div className="c-p-tech">{p.tech}</div>}
                      {p.desc && <div className="c-p-desc">{p.desc}</div>}
                    </div>
                  )
              )}
            </div>
          )}

          {certs.length > 0 && (
            <div className="creative-sub-block">
              <h3 className="creative-col-title">CERTIFICATIONS</h3>
              <div className="c-certs-list">
                {certs.map((c, idx) => (
                  <div key={idx} className="c-cert-pill">
                    🏅 {c}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 4. ATS CLASSIC TEMPLATE (100% ATS Compliant, Single Column)
// ─────────────────────────────────────────────────────────────
function AtsClassicTemplate({ form, skills, certs }) {
  return (
    <div className="tpl-ats-classic">
      <header className="ats-header">
        <h1 className="ats-name">{form.name || 'Your Name'}</h1>
        {form.title && <div className="ats-title">{form.title}</div>}
        <div className="ats-contact-line">
          {[form.email, form.phone, form.location, form.linkedin, form.github]
            .filter(Boolean)
            .join(' | ')}
        </div>
      </header>

      {form.summary && (
        <section className="ats-section">
          <h2 className="ats-section-heading">PROFESSIONAL SUMMARY</h2>
          <p className="ats-text">{form.summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="ats-section">
          <h2 className="ats-section-heading">TECHNICAL &amp; CORE SKILLS</h2>
          <p className="ats-skills-text">{skills.join(' • ')}</p>
        </section>
      )}

      {form.experience.some((e) => e.company || e.role) && (
        <section className="ats-section">
          <h2 className="ats-section-heading">PROFESSIONAL EXPERIENCE</h2>
          {form.experience.map(
            (exp, idx) =>
              (exp.company || exp.role) && (
                <div key={idx} className="ats-exp-item">
                  <div className="ats-item-header">
                    <div>
                      <strong className="ats-item-role">{exp.role}</strong> —{' '}
                      <span className="ats-item-company">{exp.company}</span>
                    </div>
                    <span className="ats-item-dates">{exp.dates}</span>
                  </div>
                  {exp.bullets && (
                    <ul className="ats-bullets">
                      {exp.bullets
                        .split('\n')
                        .filter(Boolean)
                        .map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                    </ul>
                  )}
                </div>
              )
          )}
        </section>
      )}

      {form.education.some((e) => e.school) && (
        <section className="ats-section">
          <h2 className="ats-section-heading">EDUCATION</h2>
          {form.education.map(
            (edu, idx) =>
              edu.school && (
                <div key={idx} className="ats-edu-item">
                  <div className="ats-item-header">
                    <div>
                      <strong>{edu.degree}</strong> — {edu.school}
                    </div>
                    <span className="ats-item-dates">{edu.dates}</span>
                  </div>
                  {edu.details && <div className="ats-edu-details">{edu.details}</div>}
                </div>
              )
          )}
        </section>
      )}

      {form.projects.some((p) => p.name) && (
        <section className="ats-section">
          <h2 className="ats-section-heading">KEY PROJECTS</h2>
          {form.projects.map(
            (p, idx) =>
              p.name && (
                <div key={idx} className="ats-proj-item">
                  <strong>{p.name}</strong> {p.tech ? `[${p.tech}]` : ''}: {p.desc}
                </div>
              )
          )}
        </section>
      )}

      {certs.length > 0 && (
        <section className="ats-section">
          <h2 className="ats-section-heading">CERTIFICATIONS</h2>
          <ul className="ats-bullets">
            {certs.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 5. COMPACT DUAL-TONE TEMPLATE (High Density & Accent Borders)
// ─────────────────────────────────────────────────────────────
function CompactTemplate({ form, skills, certs }) {
  return (
    <div className="tpl-compact">
      <header className="compact-header">
        <div className="compact-title-row">
          <div>
            <h1 className="compact-name">{form.name || 'Your Name'}</h1>
            <p className="compact-title">{form.title || 'Professional Title'}</p>
          </div>
          {form.photo && form.showPhoto && (
            <img src={form.photo} alt={form.name} className="compact-avatar" />
          )}
        </div>
        <div className="compact-meta-bar">
          {[form.email, form.phone, form.location, form.linkedin, form.github]
            .filter(Boolean)
            .map((item, idx) => (
              <span key={idx} className="compact-meta-chip">
                {item}
              </span>
            ))}
        </div>
      </header>

      {form.summary && (
        <section className="compact-section">
          <div className="compact-sec-heading">PROFILE SUMMARY</div>
          <p className="compact-text">{form.summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="compact-section">
          <div className="compact-sec-heading">CORE SKILLS</div>
          <div className="compact-skills-wrap">
            {skills.map((s, idx) => (
              <span key={idx} className="compact-skill-pill">
                {s}
              </span>
            ))}
          </div>
        </section>
      )}

      {form.experience.some((e) => e.company || e.role) && (
        <section className="compact-section">
          <div className="compact-sec-heading">PROFESSIONAL EXPERIENCE</div>
          <div className="compact-exp-list">
            {form.experience.map(
              (exp, idx) =>
                (exp.company || exp.role) && (
                  <div key={idx} className="compact-exp-card">
                    <div className="compact-exp-top">
                      <div>
                        <strong>{exp.role}</strong> <span className="compact-at">at {exp.company}</span>
                      </div>
                      <span className="compact-date-badge">{exp.dates}</span>
                    </div>
                    {exp.bullets && (
                      <ul className="compact-bullets">
                        {exp.bullets
                          .split('\n')
                          .filter(Boolean)
                          .map((b, bi) => (
                            <li key={bi}>{b}</li>
                          ))}
                      </ul>
                    )}
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {form.education.some((e) => e.school) && (
        <section className="compact-section">
          <div className="compact-sec-heading">EDUCATION</div>
          {form.education.map(
            (edu, idx) =>
              edu.school && (
                <div key={idx} className="compact-edu-row">
                  <div>
                    <strong>{edu.degree}</strong> — {edu.school}
                  </div>
                  <span className="compact-date-badge">{edu.dates}</span>
                </div>
              )
          )}
        </section>
      )}

      {form.projects.some((p) => p.name) && (
        <section className="compact-section">
          <div className="compact-sec-heading">PROJECTS</div>
          <div className="compact-proj-list">
            {form.projects.map(
              (p, idx) =>
                p.name && (
                  <div key={idx} className="compact-proj-card">
                    <strong>{p.name}</strong> {p.tech ? `[${p.tech}]` : ''} — {p.desc}
                  </div>
                )
            )}
          </div>
        </section>
      )}

      {certs.length > 0 && (
        <section className="compact-section">
          <div className="compact-sec-heading">CERTIFICATIONS</div>
          <div className="compact-certs-row">
            {certs.map((c, idx) => (
              <span key={idx} className="compact-cert-tag">
                🏅 {c}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 6. SWISS MINIMALIST TEMPLATE (Clean Whitespace, Typographic)
// ─────────────────────────────────────────────────────────────
function MinimalTemplate({ form, skills, certs }) {
  return (
    <div className="tpl-minimal">
      <header className="min-header">
        <h1 className="min-name">{form.name || 'Your Name'}</h1>
        <p className="min-role">{form.title || 'Professional Title'}</p>
        <div className="min-contact-row">
          {[form.email, form.phone, form.location, form.linkedin, form.website]
            .filter(Boolean)
            .join('  ·  ')}
        </div>
      </header>

      {form.summary && (
        <section className="min-section">
          <p className="min-summary">{form.summary}</p>
        </section>
      )}

      {skills.length > 0 && (
        <section className="min-section">
          <h3 className="min-heading">{t("Skills")}</h3>
          <p className="min-skills-line">{skills.join('  /  ')}</p>
        </section>
      )}

      {form.experience.some((e) => e.company || e.role) && (
        <section className="min-section">
          <h3 className="min-heading">{t("Experience")}</h3>
          {form.experience.map(
            (exp, idx) =>
              (exp.company || exp.role) && (
                <div key={idx} className="min-item">
                  <div className="min-item-row">
                    <span>
                      <strong>{exp.role}</strong>, {exp.company}
                    </span>
                    <span className="min-item-dates">{exp.dates}</span>
                  </div>
                  {exp.bullets && (
                    <ul className="min-bullets">
                      {exp.bullets
                        .split('\n')
                        .filter(Boolean)
                        .map((b, bi) => (
                          <li key={bi}>{b}</li>
                        ))}
                    </ul>
                  )}
                </div>
              )
          )}
        </section>
      )}

      {form.education.some((e) => e.school) && (
        <section className="min-section">
          <h3 className="min-heading">{t("Education")}</h3>
          {form.education.map(
            (edu, idx) =>
              edu.school && (
                <div key={idx} className="min-item">
                  <div className="min-item-row">
                    <span>
                      <strong>{edu.degree}</strong> — {edu.school}
                    </span>
                    <span className="min-item-dates">{edu.dates}</span>
                  </div>
                </div>
              )
          )}
        </section>
      )}

      {form.projects.some((p) => p.name) && (
        <section className="min-section">
          <h3 className="min-heading">{t("Projects")}</h3>
          {form.projects.map(
            (p, idx) =>
              p.name && (
                <div key={idx} className="min-item">
                  <strong>{p.name}</strong>: {p.desc}
                </div>
              )
          )}
        </section>
      )}

      {certs.length > 0 && (
        <section className="min-section">
          <h3 className="min-heading">Certifications</h3>
          <p className="min-certs-line">{certs.join('  ·  ')}</p>
        </section>
      )}
    </div>
  )
}
