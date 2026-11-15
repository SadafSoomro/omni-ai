import {t} from '../../utils/text'
import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef, useEffect } from 'react'
import {readCvFile} from '../../services/cvImport'
import {careerAPI} from '../../services/api'
import './AiCareer.css'
import './CareerRefinements.css'

const DEFAULT_ROLE = { title: 'Full Stack Developer' }

const SAMPLE_RESUME = `John Doe
Full Stack Web Developer | 3 Years Experience
Email: john.doe@email.com | GitHub: github.com/johndoe

SUMMARY:
Passionate Web Developer with 3 years building responsive web applications using React, JavaScript, Node.js, and MongoDB. Experienced in creating REST APIs, designing clean responsive interfaces, and collaborating in agile teams.

SKILLS:
- Languages & Frontend: JavaScript (ES6+), React.js, Redux, HTML5, CSS3, Tailwind CSS
- Backend & DB: Node.js, Express.js, MongoDB, RESTful APIs
- Tools: Git, GitHub, Postman, VS Code, npm

EXPERIENCE:
Full Stack Developer | TechSolutions Inc. (2023 - Present)
- Developed and maintained 4 customer-facing web applications using React and Express.
- Built reusable UI component libraries reducing frontend development time by 25%.
- Implemented JWT authentication and secure user authorization.
- Integrated third-party payment gateways (Stripe).

Junior Frontend Developer | Digital Craft Co. (2021 - 2023)
- Converted Figma prototypes into responsive React screens.
- Optimized web page load speeds by 30% through code splitting and asset optimization.
- Fixed 100+ UI bugs and collaborated in bi-weekly agile sprints.

EDUCATION:
Bachelor of Science in Computer Science (2021)`

const SAMPLE_JOB = {
  jobTitle: 'Senior Full Stack Developer',
  companyName: 'TechVista Solutions',
  jobDescriptionText: `About TechVista Solutions:
We are a fast-growing SaaS company building next-generation project management tools used by 100K+ teams worldwide.

Role: Senior Full Stack Developer
Location: Remote (Pakistan / UAE / US)
Type: Full-Time

Responsibilities:
- Design, build, and maintain scalable web applications using React, Node.js, and PostgreSQL
- Lead code reviews and mentor junior developers
- Implement CI/CD pipelines and automated testing
- Collaborate with product and design teams in agile sprints
- Optimize application performance and ensure 99.9% uptime
- Build and consume RESTful and GraphQL APIs

Requirements:
- 3+ years of experience with React.js and Node.js
- Strong knowledge of TypeScript, PostgreSQL, and MongoDB
- Experience with Docker, AWS (EC2, S3, Lambda), and Redis
- Familiarity with CI/CD tools (GitHub Actions, Jenkins)
- Excellent communication and problem-solving skills
- Experience with unit testing (Jest, Cypress)

Nice to Have:
- Experience with Kubernetes and microservices architecture
- Knowledge of WebSockets and real-time systems
- Open-source contributions

Benefits:
- Competitive salary + equity
- Flexible remote work
- Learning & development budget
- Health insurance`,
}


export default function AiCareer() {
  const consumeUsage = useUsage()
  const [error, setError] = useState('')
  const [ratingBusy, setRatingBusy] = useState(false)
  const requestVersion = useRef(0)
  const requestBusy = useRef(false)
  useEffect(() => () => { requestVersion.current += 1 }, [])
  const [inputMode, setInputMode] = useState('upload') // 'upload' | 'paste'
  const [cvText, setCvText] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStatus, setProcessingStatus] = useState('')
  const [results, setResults] = useState(null)
  const [openTips, setOpenTips] = useState({})
  const [customRoleTitle, setCustomRoleTitle] = useState('') // free-text role override
  const fileInputRef = useRef(null)

  // ── Job Details State ──
  const [jobTitle, setJobTitle] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [jobDescriptionText, setJobDescriptionText] = useState('')

  // ── Multi-step wizard ──
  const [wizardStep, setWizardStep] = useState(1)  // 1 = CV, 2 = Job Details, 3 = (auto-proceed to results)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [wizardStep])

  // Auto-detect CV sent from CV Maker
  useEffect(() => {
    try {
      const transferredCv = localStorage.getItem('career_cv_transfer')
      const transferredName = localStorage.getItem('career_cv_name')
      if (transferredCv && transferredCv.trim().length > 10) {
        setCvText(transferredCv)
        setUploadedFileName(transferredName || 'CV from CV Maker')
        setWizardStep(2)
        localStorage.removeItem('career_cv_transfer')
        localStorage.removeItem('career_cv_name')
      }
    } catch (e) {
      console.warn('Error reading transferred CV:', e)
    }
  }, [])

  // ── Interview Practice Mode ──
  const [interviewMode, setInterviewMode] = useState(false)   // is user in mock interview?
  const [interviewStep, setInterviewStep] = useState(0)       // which question index (0-based)
  const [userAnswers, setUserAnswers] = useState({})          // { [questionId]: string }
  const [ratings, setRatings] = useState({})                  // { [questionId]: { score, grade, feedback } }
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState('')      // text in active textarea

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || requestBusy.current) return
    requestBusy.current = true
    const version = ++requestVersion.current
    setIsProcessing(true); setError(''); setProcessingStatus('Reading your CV...')
    try {
      const text = await readCvFile(file)
      if (version !== requestVersion.current) return
      setCvText(text); setUploadedFileName(file.name); setWizardStep(2)
    } catch (err) { if (version === requestVersion.current) setError(err.message) }
    finally { if (version === requestVersion.current) { requestBusy.current = false; setIsProcessing(false); setProcessingStatus('') } }
  }

  // Handle Load Sample Resume
  const handleLoadSample = () => {
    setUploadedFileName('Sample_FullStack_Resume.docx')
    setCvText(SAMPLE_RESUME)
    setWizardStep(2)
  }

  // Handle Load Sample Job Description
  const handleLoadSampleJob = () => {
    setJobTitle(SAMPLE_JOB.jobTitle)
    setCompanyName(SAMPLE_JOB.companyName)
    setJobDescriptionText(SAMPLE_JOB.jobDescriptionText)
  }

  const runAnalysis = async (skipJob = false) => {
    if (requestBusy.current) return
    const role = DEFAULT_ROLE
    const roleTitle = skipJob ? (customRoleTitle.trim() || role.title) : (jobTitle.trim() || (customRoleTitle.trim() || role.title))
    if (cvText.trim().length < 30 || cvText.length > 40000) { setError('Please provide 30 to 40,000 characters of readable CV text.'); return }
    if (roleTitle.length < 2) { setError('Enter your target role first.'); return }
    if (jobDescriptionText.length > 20000) { setError('Keep the job description under 20,000 characters.'); return }
    if (!(await consumeUsage({server:true}))) return
    requestBusy.current = true
    const version = ++requestVersion.current
    setError(''); setIsProcessing(true); setProcessingStatus('AI is analyzing your CV and preparing personalized questions...')
    try {
      const {analysis} = await careerAPI.analyze({cvText,roleTitle,jobTitle:skipJob?'':jobTitle,companyName:skipJob?'':companyName,jobDescriptionText:skipJob?'':jobDescriptionText})
      if (version === requestVersion.current) { setResults(analysis); setOpenTips({}); setRatings({}) }
    } catch (err) { if (version === requestVersion.current) setError(err.message || 'Analysis failed. Please retry.') }
    finally { if (version === requestVersion.current) { requestBusy.current = false; setIsProcessing(false); setProcessingStatus('') } }
  }
  const handleAnalyze = () => runAnalysis(false)
  const handleSkipJobDetails = () => runAnalysis(true)

  // Manual Trigger from paste mode in Step 1 (go to step 2)
  const handleManualProceedToStep2 = () => {
    if (!cvText.trim()) {
      alert('Please upload a file or paste your CV text first.')
      return
    }
    setWizardStep(2)
  }


  const toggleTip = (id) => {
    setOpenTips((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const startInterview = () => {
    setInterviewMode(true)
    setInterviewStep(0)
    setUserAnswers({})
    setRatings({})
    setShowFinalReport(false)
    setCurrentAnswer('')
  }

  const submitAnswer = async () => {
    if (!results || requestBusy.current || currentAnswer.trim().length < 10) return
    if (currentAnswer.length > 10000) { setError('Keep your answer under 10,000 characters.'); return }
    if (!(await consumeUsage({server:true}))) return
    const q = results.questions[interviewStep]
    const answer = currentAnswer
    const version = ++requestVersion.current
    requestBusy.current = true; setRatingBusy(true); setError('')
    try {
      const {rating} = await careerAPI.evaluate({roleTitle:results.roleTitle,question:q.question,tip:q.tip,answer})
      if (version !== requestVersion.current) return
      setUserAnswers(prev => ({ ...prev, [q.id]: answer }))
      setRatings(prev => ({ ...prev, [q.id]: rating })); setCurrentAnswer('')
      if (interviewStep + 1 >= results.questions.length) setShowFinalReport(true)
      else setInterviewStep(prev => prev + 1)
    } catch (err) { if (version === requestVersion.current) setError(err.message || 'Could not evaluate your answer. Please retry.') }
    finally { if (version === requestVersion.current) { requestBusy.current = false; setRatingBusy(false) } }
  }

  const exitInterview = () => {
    requestVersion.current += 1; requestBusy.current = false; setRatingBusy(false); setError('')
    setInterviewMode(false)
    setShowFinalReport(false)
    setInterviewStep(0)
    setCurrentAnswer('')
  }

  useEffect(() => {
    if (!interviewMode) return
    const previous = document.activeElement
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = setTimeout(() => {
      const dialog = document.querySelector('.easy-career-page [role="dialog"]')
      ;(dialog?.querySelector('textarea, button') || dialog)?.focus()
    }, 0)
    const onKeyDown = event => {
      const dialog = document.querySelector('.easy-career-page [role="dialog"]')
      if (event.key === 'Escape') { exitInterview(); return }
      if (event.key !== 'Tab' || !dialog) return
      const controls = [...dialog.querySelectorAll('button:not(:disabled), textarea:not(:disabled), [tabindex="0"]')]
      if (!controls.length) { event.preventDefault(); dialog.focus(); return }
      const first = controls[0], last = controls[controls.length - 1]
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => { clearTimeout(timer); document.body.style.overflow = originalOverflow; document.removeEventListener('keydown', onKeyDown); previous?.focus() }
  }, [interviewMode, showFinalReport])

  // Reset everything
  const handleStartOver = () => {
    requestVersion.current += 1; requestBusy.current = false; setRatingBusy(false); setError('')
    setResults(null)
    setUploadedFileName('')
    setCvText('')
    setJobTitle('')
    setCompanyName('')
    setJobDescriptionText('')
    setWizardStep(1)
    setInterviewMode(false)
    setShowFinalReport(false)
  }

  return (
    <div className={`easy-career-page${!results ? ' career-setup' : ''}`}>
      {error && !interviewMode && <p role="alert" className="career-api-error">{error}</p>}

      {/* Background ambient lighting */}
      <div className="converter-glow-orb" />

      {/* Header */}
      <header className="converter-header">
        <div className="converter-badge">
          <span className="badge-sparkle">✦</span>
          <span>AI Career Assessment</span>
        </div>
        <h1 className="converter-title">AI Career & Skills</h1>
        <p className="converter-subtitle">
          Understand your strengths, discover skill gaps, and prepare for your next interview.
        </p>
      </header>

      {/* ========================================================
          WIZARD STEP INDICATOR
         ======================================================== */}
      {(
        <div className="wizard-steps-bar" aria-label="Career assessment progress">
          <div className={`wizard-step ${wizardStep >= 1 ? 'active' : ''} ${wizardStep > 1 || results ? 'completed' : ''}`}>
            <span className="wizard-step-num">{wizardStep > 1 ? '✓' : '1'}</span>
            <span className="wizard-step-label">{t("Upload CV")}</span>
          </div>
          <div className="wizard-step-connector" />
          <div className={`wizard-step ${wizardStep >= 2 ? 'active' : ''} ${results ? 'completed' : ''}`}>
            <span className="wizard-step-num">2</span>
            <span className="wizard-step-label">Job Details</span>
          </div>
          <div className="wizard-step-connector" />
          <div className={`wizard-step ${results ? 'active' : ''}`}>
            <span className="wizard-step-num">3</span>
            <span className="wizard-step-label">Analysis</span>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 1: UPLOAD CV
         ======================================================== */}
      {!results && wizardStep === 1 && (
        <div className="easy-card">
          <div className="career-card-intro"><span className="career-eyebrow">YOUR STARTING POINT</span><h2>Tell us about your experience</h2><p>Upload your resume or paste its text to build your career assessment.</p></div>
          {/* Target Role — custom input only */}
          <div className="easy-input-group">
            <div className="group-header-row">
              <label className="easy-label" htmlFor="career-target-role">Target role</label>
              <button
                type="button"
                className="easy-sample-btn"
                onClick={handleLoadSample}
                disabled={isProcessing}
              >
                ⚡ Sample CV
              </button>
            </div>

            <div className="custom-role-box">
              <div className="custom-role-input-wrap">
                <input
                  type="text"
                  className="custom-role-input"
                  maxLength={200}
                  id="career-target-role" placeholder="e.g. Product Designer"
                  value={customRoleTitle}
                  onChange={(e) => {
                    setCustomRoleTitle(e.target.value)
                    setJobTitle(e.target.value)
                  }}
                  disabled={isProcessing}
                />
                {customRoleTitle && (
                  <button
                    type="button"
                    className="clear-custom-role-btn"
                    onClick={() => {
                      setCustomRoleTitle('')
                      setJobTitle('')
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mode Switcher: Upload File vs Paste Text */}
          <div className="easy-input-group">
            <div className="input-mode-switcher">
              <button
                type="button"
                className={`mode-pill ${inputMode === 'upload' ? 'active' : ''}`}
                onClick={() => setInputMode('upload')}
                disabled={isProcessing}
              >
                📁 Upload CV File
              </button>
              <button
                type="button"
                className={`mode-pill ${inputMode === 'paste' ? 'active' : ''}`}
                onClick={() => setInputMode('paste')}
                disabled={isProcessing}
              >
                ✍️ Paste CV Text
              </button>
            </div>

            {/* Upload Dropzone */}
            {inputMode === 'upload' && (
              <div
                className={`easy-dropzone ${uploadedFileName ? 'has-file' : ''} ${isProcessing ? 'processing' : ''}`}
                onClick={() => {
                  if (!isProcessing && fileInputRef.current) {
                    fileInputRef.current.value = ''
                    fileInputRef.current.click()
                  }
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {isProcessing ? (
                  <div className="dropzone-loader">
                    <div className="career-spinner" />
                    <h3>{processingStatus || 'Reading Your CV...'}</h3>
                    <p>Extracting text from your resume</p>
                  </div>
                ) : (
                  <>
                    <span className="drop-icon">{uploadedFileName ? '📄' : '📁'}</span>
                    <div className="drop-text">
                      <h3>{uploadedFileName || 'Click to Select Your CV / Resume'}</h3>
                      <p>{uploadedFileName ? 'File loaded! Click Next to add job details.' : 'Supports PDF, Word (.docx), or Text files'}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-simple-browse"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                          fileInputRef.current.click()
                        }
                      }}
                    >
                      {uploadedFileName ? 'Change File' : 'Browse File'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Paste Text Area */}
            {inputMode === 'paste' && (
              <div className="easy-paste-wrap">
                <textarea
                  className="easy-textarea" aria-label="Your CV text" maxLength={40000}
                  rows={8}
                  placeholder="Paste your CV text here..."
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  disabled={isProcessing}
                />
                {cvText && !isProcessing && (
                  <button
                    type="button"
                    className="easy-clear-btn"
                    onClick={() => {
                      setCvText('')
                      setUploadedFileName('')
                    }}
                  >
                    Clear Text
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Next Button for paste mode */}
          {inputMode === 'paste' && (
            <button
              type="button"
              className="btn-easy-analyze"
              onClick={handleManualProceedToStep2}
              disabled={isProcessing || !cvText.trim()}
            >
              ➡️ Next: Add Job Details
            </button>
          )}

          {/* Helper note */}
          <div className="easy-help-note">
            💡 <span>Upload your CV first, then add the job details you're applying for.</span>
          </div>
        </div>
      )}

      {/* ========================================================
          STEP 2: JOB DETAILS
         ======================================================== */}
      {!results && wizardStep === 2 && (
        <div className="easy-card job-details-card">
          <div className="jd-card-header">
            <div className="jd-header-left">
              <button
                type="button"
                className="btn-back-step" disabled={isProcessing}
                onClick={() => setWizardStep(1)}
              >
                ← Back to CV
              </button>
              <h2 className="jd-title">📋 Job Details</h2>
              <p className="jd-subtitle">Paste the job posting details so we can generate highly targeted interview questions.</p>
            </div>
            <button
              type="button"
              className="easy-sample-btn"
              onClick={handleLoadSampleJob}
              disabled={isProcessing}
            >
              ⚡ Load Sample Job
            </button>
          </div>

          {/* CV loaded indicator */}
          <div className="cv-loaded-badge">
            <span className="cv-loaded-icon">✅</span>
            <span className="cv-loaded-text">
              CV loaded: <strong>{uploadedFileName || 'Pasted text'}</strong>
              <span className="cv-loaded-chars">({cvText.length} characters)</span>
            </span>
          </div>

          {/* Job Title & Company in a row */}
          <div className="jd-row-fields">
            <div className="jd-field">
              <label className="easy-label" htmlFor="career-job-title">Job title</label>
              <input
                type="text"
                className="jd-input"
                id="career-job-title" maxLength={200} placeholder="e.g. Senior Developer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                disabled={isProcessing}
              />
              <div className="jd-title-hint-row">
                <span className="jd-hint-label">Quick select:</span>
                {['Full Stack Developer', 'Flutter Developer', 'Cybersecurity Analyst', 'Product Manager', 'Data Engineer', 'UI/UX Designer'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="jd-mini-chip" disabled={isProcessing}
                    onClick={() => setJobTitle(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="jd-field">
              <label className="easy-label" htmlFor="career-company">Company name <span className="career-optional">Optional</span></label>
              <input
                type="text"
                className="jd-input"
                id="career-company" maxLength={200} placeholder="e.g. Acme"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Job Description Textarea */}
          <div className="jd-field">
            <label className="easy-label" htmlFor="career-job-description">Job description <span className="career-optional">Optional</span></label>
            <div className="jd-textarea-wrap">
              <textarea
                className="jd-textarea" id="career-job-description"
                maxLength={20000}
                rows={10}
                placeholder="Paste job description (responsibilities, skills, requirements)..."
                value={jobDescriptionText}
                onChange={(e) => setJobDescriptionText(e.target.value)}
                disabled={isProcessing}
              />
              {jobDescriptionText && (
                <div className="jd-char-indicator">
                  <span className={`jd-char-count ${jobDescriptionText.length > 200 ? 'good' : 'low'}`}>
                    {jobDescriptionText.length} chars
                  </span>
                  {jobDescriptionText.length > 200 && <span className="jd-quality-badge">✓ Good detail</span>}
                  {jobDescriptionText.length > 0 && jobDescriptionText.length <= 200 && <span className="jd-quality-badge warning">⚠ Add more detail for better results</span>}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="jd-action-row">
            <button
              type="button"
              className="btn-easy-analyze primary"
              onClick={handleAnalyze}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="btn-spinner" />
                  Analyzing...
                </>
              ) : (
                '🚀 Analyze CV + Job Match'
              )}
            </button>
            <button
              type="button"
              className="btn-skip-jd"
              onClick={handleSkipJobDetails}
              disabled={isProcessing}
            >
              Skip — Analyze without Job Details
            </button>
          </div>

          {/* Helper */}
          <div className="easy-help-note">
            💡 <span>Adding job details makes interview questions specific to the actual role you're applying for.</span>
          </div>
        </div>
      )}

      {/* ========================================================
          RESULTS VIEW
         ======================================================== */}
      {results && (
        <div className="easy-results-card">
          {/* Top Score Banner */}
          <div className="easy-score-banner">
            <div className="score-left">
              <span className="banner-role-tag">
                Estimated fit · Target: {results.roleTitle}
                {results.companyName && <span className="banner-company"> @ {results.companyName}</span>}
              </span>
              <div className="score-main">
                <span className="score-val">{results.score}%</span>
                <span className="score-text">Estimated Match</span>
              </div>
            </div>
            <button
              type="button"
              className="btn-start-over"
              onClick={handleStartOver}
            >
              🔄 Start Over
            </button>
          </div>

          {/* Job Details Summary (if provided) */}
          {results.hasJobDescription && (
            <div className="jd-summary-banner">
              <div className="jd-summary-icon">🎯</div>
              <div className="jd-summary-content">
                <h4 className="jd-summary-title">
                  Applying for: {results.jobTitle || results.roleTitle}
                  {results.companyName && <span className="jd-at-company"> at {results.companyName}</span>}
                </h4>
                <p className="jd-summary-text">
                  Interview questions below are tailored to this specific job posting.
                  {results.jdMissingSkills.length > 0 && (
                    <> Pay attention to <strong>{results.jdMissingSkills.join(', ')}</strong> — they're mentioned in the JD but missing from your CV.</>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* 1. Skills Comparison */}
          <div className="easy-section">
            <h3 className="section-heading">1. Skills Analysis</h3>
            <div className="skills-dual-row">
              {/* Verified Strengths */}
              <div className="skill-box strengths">
                <div className="box-title green">✓ Skills Found in Your CV ({results.presentSkills.length})</div>
                <div className="chips-wrap">
                  {!results.presentSkills.length && <p className="career-empty-note">Add specific skills and experience to your CV so they can be assessed.</p>}
                  {results.presentSkills.map((s, i) => (
                    <span key={i} className="chip green">{s}</span>
                  ))}
                </div>
              </div>

              {/* Missing Gaps */}
              <div className="skill-box gaps">
                <div className="box-title amber">⚠️ Missing Skills to Learn ({results.criticalGaps.length})</div>
                <div className="chips-wrap">
                  {!results.criticalGaps.length && <p className="career-empty-note">No specific skill gaps were identified in this assessment.</p>}
                  {results.criticalGaps.map((g, i) => (
                    <span key={i} className="chip amber">{g}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* JD-specific missing skills */}
            {results.hasJobDescription && results.jdMissingSkills.length > 0 && (
              <div className="skill-box jd-gaps">
                <div className="box-title red">🔴 Required by Job Description but Missing from CV ({results.jdMissingSkills.length})</div>
                <div className="chips-wrap">
                  {results.jdMissingSkills.map((s, i) => (
                    <span key={i} className="chip red">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 2. Questions Tailored to CV + Job */}
          <div className="easy-section">
            <h3 className="section-heading">
              2. Interview Questions
              <span className="q-count-badge">{results.questions.length} Questions</span>
            </h3>
            <div className="questions-simple-list">
              {results.questions.map((q) => {
                const isOpen = openTips[q.id]
                return (
                  <div key={q.id} className="simple-question-card">
                    <div className="question-header">
                      <span className="question-type-tag">{q.type}</span>
                      <button
                        type="button"
                        className="btn-toggle-tip"
                        onClick={() => toggleTip(q.id)}
                      >
                        {isOpen ? 'Hide Tip' : '💡 Answer Tip'}
                      </button>
                    </div>
                    <div className="question-body">{q.question}</div>
                    {isOpen && (
                      <div className="answer-tip-box">
                        <strong>💡 How to Answer:</strong> {q.tip}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Action Steps */}
          <div className="easy-section">
            <h3 className="section-heading">3. Your Next Steps</h3>
            <div className="action-steps-list">
              <div className="step-item">
                <span className="step-num">1</span>
                <span>{results.criticalGaps.length ? <>Focus your learning on <strong>{results.criticalGaps.join(', ')}</strong>.</> : 'Keep strengthening your skills with practical work and recent examples.'}</span>
              </div>
              <div className="step-item">
                <span className="step-num">2</span>
                <span>Prepare a work sample or case study that demonstrates your skills for this role.</span>
              </div>
              <div className="step-item">
                <span className="step-num">3</span>
                <span>Practice the interview questions above using the STAR method before applying.</span>
              </div>
              {results.hasJobDescription && (
                <div className="step-item highlight">
                  <span className="step-num">4</span>
                  <span>Study the job description carefully — focus on <strong>{results.jdMissingSkills.slice(0, 2).join(' and ') || 'the required skills'}</strong> before the interview.</span>
                </div>
              )}
            </div>
          </div>

          {/* 4. START MOCK INTERVIEW BUTTON */}
          <button type="button" className="btn-start-interview" onClick={startInterview}>
            🎤 Practice Mock Interview — Answer &amp; Get Rated
            {results.hasJobDescription && <span className="interview-badge-jd">Tailored to Job</span>}
          </button>
        </div>
      )}

      {/* ========================================================
          INTERVIEW PRACTICE MODE
         ======================================================== */}
      {interviewMode && results && !showFinalReport && (
        <div className="interview-overlay">
          <div className="interview-card" role="dialog" aria-modal="true" aria-label="Practice interview" tabIndex={-1}>
            {error && <p role="alert" className="career-api-error">{error}</p>}
            {/* Header */}
            <div className="iv-header">
              <div className="iv-progress-info">
                <div className="iv-meta-row">
                  <span className="iv-step-badge">Q {interviewStep + 1} / {results.questions.length}</span>
                  {results.companyName && <span className="iv-company-tag">📍 {results.companyName}</span>}
                </div>
                <div className="iv-progress-bar">
                  <div
                    className="iv-progress-fill"
                    style={{ width: `${((interviewStep) / results.questions.length) * 100}%` }}
                  />
                </div>
              </div>
              <button className="iv-exit-btn" onClick={exitInterview}>✕ Exit</button>
            </div>

            {/* Current Question */}
            <div className="iv-question-section">
              <span className="iv-type-tag">{results.questions[interviewStep].type}</span>
              <p className="iv-question-text">{results.questions[interviewStep].question}</p>
            </div>

            {/* Answer Input */}
            <div className="iv-answer-section">
              <label className="iv-answer-label" htmlFor="career-interview-answer">Your answer</label>
              <textarea
                className="iv-answer-textarea" id="career-interview-answer"
                disabled={ratingBusy}
                maxLength={10000}
                rows={6}
                placeholder="Type your answer here with examples..."
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                autoFocus
              />
              <div className="iv-char-count">{currentAnswer.split(/\s+/).filter(Boolean).length} words</div>
            </div>

            {/* Submit */}
            <button
              className="iv-submit-btn"
              onClick={submitAnswer}
              disabled={ratingBusy || currentAnswer.trim().length < 10}
            >
              {ratingBusy ? 'Evaluating answer...' : interviewStep + 1 >= results.questions.length ? '🏁 Finish & See Report' : '✅ Submit & Next Question'}
            </button>

            {/* Tip (collapsible) */}
            <button className="iv-hint-toggle" onClick={() => toggleTip(results.questions[interviewStep].id)}>
              {openTips[results.questions[interviewStep].id] ? '🙈 Hide Hint' : '💡 Show Answer Hint'}
            </button>
            {openTips[results.questions[interviewStep].id] && (
              <div className="iv-hint-box">
                {results.questions[interviewStep].tip}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          FINAL INTERVIEW REPORT
         ======================================================== */}
      {interviewMode && results && showFinalReport && (() => {
        const allRatings = Object.values(ratings)
        const avgScore = allRatings.length > 0
          ? Math.round(allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length)
          : 0
        const overallGrade = avgScore >= 85 ? 'A' : avgScore >= 70 ? 'B' : avgScore >= 50 ? 'C' : avgScore >= 30 ? 'D' : 'F'
        const gradeColor = { A: '#34d399', B: '#3ECFCF', C: '#fbbf24', D: '#f97316', F: '#f87171' }[overallGrade]

        return (
          <div className="interview-overlay">
            <div className="interview-card report-card" role="dialog" aria-modal="true" aria-label="Interview report" tabIndex={-1}>
              {/* Report Header */}
              <div className="report-top">
                <div className="report-score-circle" style={{ '--grade-color': gradeColor }}>
                  <span className="report-score-num">{avgScore}</span>
                  <span className="report-score-label">/ 100</span>
                </div>
                <div className="report-summary">
                  <h2 className="report-title">Interview Report</h2>
                  {results.companyName && (
                    <div className="report-company-info">
                      📋 {results.roleTitle} @ {results.companyName}
                    </div>
                  )}
                  <div className="report-grade" style={{ color: gradeColor }}>Grade: {overallGrade}</div>
                  <p className="report-subtitle">
                    {avgScore >= 85
                      ? 'Outstanding! You are interview-ready. Apply with confidence.'
                      : avgScore >= 70
                      ? 'Good performance. A bit more practice and you will ace it.'
                      : avgScore >= 50
                      ? 'Fair attempt. Review the tips and practice with real examples.'
                      : 'Needs work. Focus on structuring answers using the STAR method.'}
                  </p>
                </div>
              </div>

              {/* Per-question breakdown */}
              <div className="report-breakdown">
                <h3 className="report-section-title">📋 Question-by-Question Breakdown</h3>
                {results.questions.map((q, idx) => {
                  const r = ratings[q.id]
                  if (!r) return null
                  const qColor = { A: '#34d399', B: '#3ECFCF', C: '#fbbf24', D: '#f97316', F: '#f87171' }[r.grade]
                  return (
                    <div key={q.id} className="report-q-item">
                      <div className="rq-header">
                        <span className="rq-num">Q{idx + 1}</span>
                        <span className="rq-type">{q.type}</span>
                        <span className="rq-score" style={{ color: qColor }}>{r.score}/100 · {r.grade}</span>
                      </div>
                      <p className="rq-question">{q.question}</p>
                      <div className="rq-answer-preview">
                        <span className="rq-your-label">Your Answer:</span>
                        <p className="rq-answer-text">{userAnswers[q.id] || '(no answer)'}</p>
                      </div>
                      <div className="rq-feedback" style={{ borderLeftColor: qColor }}>
                        {r.feedback}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Actions */}
              <div className="report-actions">
                <button className="btn-retry-interview" onClick={startInterview}>🔄 Retry Interview</button>
                <button className="btn-back-results" onClick={exitInterview}>📊 Back to Results</button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
