import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef, useEffect } from 'react'
import { generatePresentation } from '../../services/presentation'
import './AiPresentation.css'

// ── 4 PREMIUM EXECUTIVE TEMPLATES ──
export const TEMPLATES = [
  {
    id: 'cyber',
    name: 'Obsidian Cyber',
    subtitle: 'Ultra-Tech Neon & Violet Matrix',
    tag: 'DEEP TECH & AI',
    bg: '#07090e',
    cardBg: '#0e1424',
    primary: '#8B5CF6', // Electric Purple
    secondary: '#06B6D4', // Laser Cyan
    accent: '#38BDF8',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    gradient: 'linear-gradient(135deg, #07090e 0%, #130f26 50%, #061929 100%)',
    glow: 'rgba(139, 92, 246, 0.35)',
    borderGlow: 'rgba(6, 182, 212, 0.4)',
  },
  {
    id: 'executive',
    name: 'Royal Executive',
    subtitle: 'Prestige Navy & 24K Polished Gold',
    tag: 'CAPITAL & ENTERPRISE',
    bg: '#08111e',
    cardBg: '#101d33',
    primary: '#F59E0B', // Metallic Gold
    secondary: '#38BDF8', // Sapphire Sky
    accent: '#FDE68A', // Champagne
    text: '#FFFFFF',
    textMuted: '#CBD5E1',
    gradient: 'linear-gradient(135deg, #08111e 0%, #0c1b33 50%, #17152b 100%)',
    glow: 'rgba(245, 158, 11, 0.35)',
    borderGlow: 'rgba(245, 158, 11, 0.45)',
  },
  {
    id: 'emerald',
    name: 'Emerald Swiss',
    subtitle: 'Nordic Forest & Minimal Mint',
    tag: 'STRATEGY & ESG',
    bg: '#041610',
    cardBg: '#09261c',
    primary: '#10B981', // Nordic Jade
    secondary: '#34D399', // Fresh Mint
    accent: '#A7F3D0',
    text: '#FFFFFF',
    textMuted: '#A7F3D0',
    gradient: 'linear-gradient(135deg, #041610 0%, #073123 50%, #031c15 100%)',
    glow: 'rgba(16, 185, 129, 0.35)',
    borderGlow: 'rgba(52, 211, 153, 0.4)',
  },
  {
    id: 'aurora',
    name: 'Cosmic Velvet',
    subtitle: 'Radiant Coral Rose & Sunset Amber',
    tag: 'VENTURE & CREATIVE',
    bg: '#13071c',
    cardBg: '#230e33',
    primary: '#F43F5E', // Coral Rose
    secondary: '#FB923C', // Amber
    accent: '#F472B6',
    text: '#FFFFFF',
    textMuted: '#E9D5FF',
    gradient: 'linear-gradient(135deg, #13071c 0%, #300c3a 50%, #280a1c 100%)',
    glow: 'rgba(244, 63, 94, 0.35)',
    borderGlow: 'rgba(251, 146, 60, 0.4)',
  },
]

const SLIDE_OPTIONS = [3, 5, 8, 10]

async function buildPptx(data, template) {
  const { default: PptxGenJS } = await import('pptxgenjs')
  const pptx = new PptxGenJS()
  pptx.author = 'AI Presentation Architect'
  pptx.title = data.title
  pptx.subject = `Strategic Presentation on ${data.title}`

  pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 })
  pptx.layout = 'WIDE'

  const cBg = (template.bg || '#07090e').replace('#', '')
  const cCard = (template.cardBg || '#0e1424').replace('#', '')
  const cPrimary = (template.primary || '#8B5CF6').replace('#', '')
  const cSecondary = (template.secondary || '#06B6D4').replace('#', '')
  const cAccent = (template.accent || '#38BDF8').replace('#', '')
  const cText = (template.text || '#FFFFFF').replace('#', '')
  const cMuted = (template.textMuted || '#94A3B8').replace('#', '')

  data.slides.forEach((slide, index) => {
    const s = pptx.addSlide()
    s.background = { color: cBg }

    // Top Glowing Gradient Accent Bar
    s.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.33,
      h: 0.1,
      fill: { type: 'solid', color: cPrimary },
    })

    // Elegant Bottom Footer Bar
    s.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 7.15,
      w: 13.33,
      h: 0.35,
      fill: { type: 'solid', color: cCard },
    })
    s.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 7.13,
      w: 3.5,
      h: 0.03,
      fill: { type: 'solid', color: cSecondary },
    })

    // Footer Text
    s.addText(`${data.title} • ${template.name}`, {
      x: 0.8,
      y: 7.22,
      w: 8.0,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Segoe UI',
      color: cMuted,
    })
    s.addText(`Slide ${index + 1} of ${data.slides.length}`, {
      x: 11.2,
      y: 7.22,
      w: 1.3,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Segoe UI',
      color: cMuted,
      align: 'right',
    })

    // ── SLIDE SPECIFIC RENDERING ──
    switch (slide.type) {
      case 'title': {
        // Kicker Pill
        s.addShape(pptx.ShapeType.roundRect, {
          x: 4.66,
          y: 1.4,
          w: 4.0,
          h: 0.42,
          fill: { type: 'solid', color: cCard },
          line: { color: cPrimary, width: 1.5 },
          rectRadius: 0.2,
        })
        s.addText(slide.tag || 'EXECUTIVE BRIEFING', {
          x: 4.66,
          y: 1.4,
          w: 4.0,
          h: 0.42,
          fontSize: 10,
          fontFace: 'Segoe UI',
          bold: true,
          color: cSecondary,
          align: 'center',
          valign: 'middle',
        })

        // 1. Big Title
        s.addText(slide.title, {
          x: 1.0,
          y: 2.1,
          w: 11.33,
          h: 1.8,
          fontSize: 44,
          fontFace: 'Segoe UI',
          bold: true,
          color: cText,
          align: 'center',
          valign: 'middle',
        })

        // Accent Divider Line
        s.addShape(pptx.ShapeType.rect, {
          x: 5.4,
          y: 4.1,
          w: 2.5,
          h: 0.05,
          fill: { type: 'solid', color: cPrimary },
        })

        // 2. Detail / Subtitle
        s.addText(slide.detail, {
          x: 1.5,
          y: 4.35,
          w: 10.33,
          h: 1.0,
          fontSize: 16,
          fontFace: 'Segoe UI',
          color: cMuted,
          align: 'center',
          lineSpacing: 22,
        })

        // Meta Footer
        s.addText(`${slide.author || 'AI Presentation'} • ${slide.date || '2026'}`, {
          x: 2.0,
          y: 5.7,
          w: 9.33,
          h: 0.4,
          fontSize: 11,
          fontFace: 'Segoe UI',
          color: cMuted,
          align: 'center',
        })
        break
      }

      default: {
        // SHARED HEADER FOR ALL CONTENT SLIDES:
        // 1. Kicker Badge
        if (slide.tag) {
          s.addText(slide.tag, {
            x: 0.8,
            y: 0.4,
            w: 8.0,
            h: 0.3,
            fontSize: 10,
            fontFace: 'Segoe UI',
            bold: true,
            color: cSecondary,
          })
        }

        // 2. Main Title
        s.addText(slide.title, {
          x: 0.8,
          y: 0.68,
          w: 11.5,
          h: 0.7,
          fontSize: 28,
          fontFace: 'Segoe UI',
          bold: true,
          color: cText,
        })

        // 3. Detail Context Paragraph (pehla title phir detail!)
        if (slide.detail) {
          s.addText(slide.detail, {
            x: 0.8,
            y: 1.38,
            w: 11.5,
            h: 0.5,
            fontSize: 12,
            fontFace: 'Segoe UI',
            color: cMuted,
          })
        }

        // Accent Line below header
        s.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.95,
          w: 1.8,
          h: 0.04,
          fill: { type: 'solid', color: cPrimary },
        })

        // 4. SARI CHEEZAIN (Content Layouts)
        if (slide.type === 'agenda') {
          slide.items.forEach((item, i) => {
            const yPos = 2.2 + i * 0.9
            s.addShape(pptx.ShapeType.roundRect, {
              x: 0.8,
              y: yPos,
              w: 11.7,
              h: 0.7,
              fill: { type: 'solid', color: cCard },
              rectRadius: 0.1,
            })
            s.addText(`${i + 1}`, {
              x: 1.05,
              y: yPos + 0.12,
              w: 0.45,
              h: 0.45,
              fontSize: 13,
              fontFace: 'Segoe UI',
              bold: true,
              color: 'FFFFFF',
              align: 'center',
              valign: 'middle',
              fill: { type: 'solid', color: cPrimary },
              shape: pptx.ShapeType.ellipse,
            })
            s.addText(item, {
              x: 1.7,
              y: yPos,
              w: 10.5,
              h: 0.7,
              fontSize: 15,
              fontFace: 'Segoe UI',
              bold: true,
              color: cText,
              valign: 'middle',
            })
          })
        } else if (slide.type === 'content') {
          slide.bullets.forEach((b, i) => {
            const yPos = 2.2 + i * 1.15
            s.addShape(pptx.ShapeType.roundRect, {
              x: 0.8,
              y: yPos,
              w: 11.7,
              h: 0.95,
              fill: { type: 'solid', color: cCard },
              rectRadius: 0.12,
            })
            const leadText = typeof b === 'object' ? b.lead : 'Key Point:'
            const descText = typeof b === 'object' ? b.desc : b
            s.addText(`▸  ${leadText}  ${descText}`, {
              x: 1.2,
              y: yPos,
              w: 11.0,
              h: 0.95,
              fontSize: 14,
              fontFace: 'Segoe UI',
              color: cText,
              valign: 'middle',
            })
          })
        } else if (slide.type === 'two-column') {
          const colWidth = 5.65
          const leftX = 0.8
          const rightX = 6.85
          const colY = 2.2
          const colHeight = 4.6

          s.addShape(pptx.ShapeType.roundRect, {
            x: leftX,
            y: colY,
            w: colWidth,
            h: colHeight,
            fill: { type: 'solid', color: cCard },
            line: { color: cPrimary, width: 1.5 },
            rectRadius: 0.15,
          })
          s.addText(slide.leftTitle, {
            x: leftX + 0.4,
            y: colY + 0.3,
            w: colWidth - 0.8,
            h: 0.5,
            fontSize: 17,
            fontFace: 'Segoe UI',
            bold: true,
            color: cAccent,
          })
          slide.leftBullets.forEach((b, i) => {
            s.addText(`•  ${b}`, {
              x: leftX + 0.4,
              y: colY + 0.9 + i * 0.85,
              w: colWidth - 0.8,
              h: 0.75,
              fontSize: 13,
              fontFace: 'Segoe UI',
              color: cText,
            })
          })

          s.addShape(pptx.ShapeType.roundRect, {
            x: rightX,
            y: colY,
            w: colWidth,
            h: colHeight,
            fill: { type: 'solid', color: cCard },
            line: { color: cSecondary, width: 1.5 },
            rectRadius: 0.15,
          })
          s.addText(slide.rightTitle, {
            x: rightX + 0.4,
            y: colY + 0.3,
            w: colWidth - 0.8,
            h: 0.5,
            fontSize: 17,
            fontFace: 'Segoe UI',
            bold: true,
            color: cSecondary,
          })
          slide.rightBullets.forEach((b, i) => {
            s.addText(`•  ${b}`, {
              x: rightX + 0.4,
              y: colY + 0.9 + i * 0.85,
              w: colWidth - 0.8,
              h: 0.75,
              fontSize: 13,
              fontFace: 'Segoe UI',
              color: cText,
            })
          })
        } else if (slide.type === 'stats') {
          const statWidth = 2.7
          const gap = 0.3
          slide.stats.forEach((st, i) => {
            const xPos = 0.8 + i * (statWidth + gap)
            s.addShape(pptx.ShapeType.roundRect, {
              x: xPos,
              y: 2.3,
              w: statWidth,
              h: 4.2,
              fill: { type: 'solid', color: cCard },
              line: { color: i % 2 === 0 ? cPrimary : cSecondary, width: 1.5 },
              rectRadius: 0.18,
            })
            s.addText(st.value, {
              x: xPos,
              y: 2.8,
              w: statWidth,
              h: 1.3,
              fontSize: 36,
              fontFace: 'Segoe UI',
              bold: true,
              color: i % 2 === 0 ? cPrimary : cSecondary,
              align: 'center',
            })
            s.addText(st.label, {
              x: xPos + 0.15,
              y: 4.3,
              w: statWidth - 0.3,
              h: 1.2,
              fontSize: 14,
              fontFace: 'Segoe UI',
              color: cText,
              align: 'center',
            })
          })
          if (slide.footnote) {
            s.addText(slide.footnote, {
              x: 0.8,
              y: 6.65,
              w: 11.5,
              h: 0.3,
              fontSize: 9,
              fontFace: 'Segoe UI',
              color: cMuted,
              italic: true,
            })
          }
        } else if (slide.type === 'timeline') {
          const phaseWidth = 2.7
          const phaseGap = 0.3
          slide.phases.forEach((p, i) => {
            const xPos = 0.8 + i * (phaseWidth + phaseGap)
            s.addShape(pptx.ShapeType.roundRect, {
              x: xPos,
              y: 2.3,
              w: phaseWidth,
              h: 4.2,
              fill: { type: 'solid', color: cCard },
              rectRadius: 0.14,
            })
            s.addShape(pptx.ShapeType.ellipse, {
              x: xPos + phaseWidth / 2 - 0.25,
              y: 2.6,
              w: 0.5,
              h: 0.5,
              fill: { type: 'solid', color: cPrimary },
            })
            s.addText(`${i + 1}`, {
              x: xPos + phaseWidth / 2 - 0.25,
              y: 2.6,
              w: 0.5,
              h: 0.5,
              fontSize: 12,
              fontFace: 'Segoe UI',
              bold: true,
              color: 'FFFFFF',
              align: 'center',
              valign: 'middle',
            })
            s.addText(p.phase.toUpperCase(), {
              x: xPos,
              y: 3.3,
              w: phaseWidth,
              h: 0.4,
              fontSize: 12,
              fontFace: 'Segoe UI',
              bold: true,
              color: cAccent,
              align: 'center',
            })
            s.addText(p.title, {
              x: xPos + 0.15,
              y: 3.8,
              w: phaseWidth - 0.3,
              h: 1.0,
              fontSize: 14,
              fontFace: 'Segoe UI',
              bold: true,
              color: cText,
              align: 'center',
            })
            s.addText(p.duration, {
              x: xPos,
              y: 5.2,
              w: phaseWidth,
              h: 0.4,
              fontSize: 12,
              fontFace: 'Segoe UI',
              color: cMuted,
              align: 'center',
            })
          })
        } else if (slide.type === 'conclusion') {
          slide.bullets.forEach((b, i) => {
            const yPos = 2.2 + i * 1.15
            s.addShape(pptx.ShapeType.roundRect, {
              x: 0.8,
              y: yPos,
              w: 11.7,
              h: 0.95,
              fill: { type: 'solid', color: cCard },
              rectRadius: 0.12,
            })
            const leadText = typeof b === 'object' ? b.lead : 'Strategic Takeaway:'
            const descText = typeof b === 'object' ? b.desc : b
            s.addText(`✓  ${leadText}  ${descText}`, {
              x: 1.2,
              y: yPos,
              w: 11.0,
              h: 0.95,
              fontSize: 14,
              fontFace: 'Segoe UI',
              color: cText,
              valign: 'middle',
            })
          })
          if (slide.callToAction) {
            s.addShape(pptx.ShapeType.roundRect, {
              x: 2.0,
              y: 5.8,
              w: 9.33,
              h: 0.8,
              fill: { type: 'solid', color: cPrimary },
              rectRadius: 0.15,
            })
            s.addText(slide.callToAction, {
              x: 2.0,
              y: 5.8,
              w: 9.33,
              h: 0.8,
              fontSize: 17,
              fontFace: 'Segoe UI',
              bold: true,
              color: 'FFFFFF',
              align: 'center',
              valign: 'middle',
            })
          }
        } else if (slide.type === 'thankyou') {
          s.addText(slide.title, {
            x: 1.0,
            y: 2.5,
            w: 11.33,
            h: 1.5,
            fontSize: 48,
            fontFace: 'Segoe UI',
            bold: true,
            color: cText,
            align: 'center',
          })
          s.addText(slide.detail, {
            x: 2.0,
            y: 4.2,
            w: 9.33,
            h: 0.8,
            fontSize: 18,
            fontFace: 'Segoe UI',
            color: cMuted,
            align: 'center',
          })
          if (slide.contact) {
            s.addText(slide.contact, {
              x: 2.0,
              y: 5.2,
              w: 9.33,
              h: 0.6,
              fontSize: 14,
              fontFace: 'Segoe UI',
              bold: true,
              color: cAccent,
              align: 'center',
            })
          }
        }
        break
      }
    }
  })

  return pptx
}

export default function AiPresentation() {
  const consumeUsage = useUsage()
  const [currentStep, setCurrentStep] = useState(1)
  const [promptTopic, setPromptTopic] = useState('')
  const [slideCount, setSlideCount] = useState(5)
  const [selectedTemplateId, setSelectedTemplateId] = useState('cyber')

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [editingSlide, setEditingSlide] = useState(false)
  const requestRef = useRef(null)
  const generatedFor = useRef('')
  useEffect(() => () => requestRef.current?.abort(), [])
  const [presentationData, setPresentationData] = useState(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  // Presentation Animation Mode
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const autoPlayTimer = useRef(null)

  const pptxRef = useRef(null)
  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplateId) || TEMPLATES[0]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!presentationData || currentStep !== 4 || /INPUT|TEXTAREA|SELECT|BUTTON/.test(e.target.tagName) || e.target.isContentEditable) return
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault()
        setActiveSlideIndex((prev) => Math.min(prev + 1, presentationData.slides.length - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setActiveSlideIndex((prev) => Math.max(prev - 1, 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [presentationData, currentStep])

  // Autoplay presentation animation
  useEffect(() => {
    if (!isAutoPlay || !presentationData || currentStep !== 4) {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current)
      return
    }
    autoPlayTimer.current = setInterval(() => {
      setActiveSlideIndex((prev) => {
        if (prev >= presentationData.slides.length - 1) {
          setIsAutoPlay(false)
          return prev
        }
        return prev + 1
      })
    }, 4000)
    return () => clearInterval(autoPlayTimer.current)
  }, [isAutoPlay, presentationData, currentStep])

  const handleGenerate = async () => {
    if (!promptTopic.trim() || isGenerating) return
    const key = JSON.stringify([promptTopic.trim(), slideCount])
    if (presentationData && generatedFor.current === key) {
      setCurrentStep(4)
      setActiveSlideIndex(0)
      setGenerationError('')
      return
    }
    if (!(await consumeUsage({server:true}))) return
    const controller = new AbortController()
    requestRef.current = controller
    setCurrentStep(4)
    setIsGenerating(true)
    setGenerationError('')
    setIsAutoPlay(false)
    setEditingSlide(false)
    try {
      const data = await generatePresentation({ topic: promptTopic.trim(), slideCount, signal: controller.signal })
      if (controller.signal.aborted) return
      setPresentationData(data)
      generatedFor.current = key
      setActiveSlideIndex(0)
    } catch (error) {
      if (!controller.signal.aborted) { setGenerationError(error.message || 'Presentation generation failed. Please try again.'); setCurrentStep(3) }
    } finally {
      if (!controller.signal.aborted) setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!presentationData || isDownloading) return
    setIsDownloading(true)
    setGenerationError('')
    try {
      const safeTopic = (presentationData.title || 'Presentation').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
      pptxRef.current = await buildPptx(presentationData, currentTemplate)
      await pptxRef.current.writeFile({ fileName: `${safeTopic}_${currentTemplate.id}.pptx` })
    } catch {
      setGenerationError('Download failed. Please try again.')
    } finally { setIsDownloading(false) }
  }

  const editCurrentSlide = (field, value) => {
    setPresentationData(previous => ({ ...previous, slides: previous.slides.map((slide, index) => index === activeSlideIndex ? { ...slide, [field]: value } : slide) }))
  }

  return (
    <div className={`aipres-container ${currentStep === 4 && !isGenerating ? 'has-deck' : 'builder-centered'}`}>
      {/* Background Ambience */}
      <div
        className="aipres-glow-orb"
        style={{
          background: `radial-gradient(circle, ${currentTemplate.primary}25 0%, transparent 70%)`,
        }}
      />
      <div
        className="aipres-glow-orb-2"
        style={{
          background: `radial-gradient(circle, ${currentTemplate.secondary}20 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <header className="aipres-header">
        <h1 className="aipres-title">AI Presentation Maker</h1>
        <p className="aipres-subtitle">
          {currentStep === 1 && 'Enter your topic or prompt to begin crafting your presentation'}
          {currentStep === 2 && 'Select the desired length for your presentation deck'}
          {currentStep === 3 && 'Choose a premium executive template theme'}
          {currentStep === 4 && (isGenerating ? 'Writing slides around your topic. This may take a moment.' : 'Your presentation is ready. Review, edit, and download your slides.')}
        </p>
      </header>

      {generationError && <div className="presentation-error" role="alert">{generationError}</div>}

      {/* Modern Stepper */}
      <div className="simple-stepper">
        <div className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
          <span className="step-num">1</span> Topic
        </div>
        <div className="step-line" />
        <div className={`step-item ${currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : ''}`}>
          <span className="step-num">2</span> Slides
        </div>
        <div className="step-line" />
        <div className={`step-item ${currentStep === 3 ? 'active' : currentStep > 3 ? 'done' : ''}`}>
          <span className="step-num">3</span> Template
        </div>
        <div className="step-line" />
        <div className={`step-item ${currentStep === 4 ? 'active' : ''}`}>
          <span className="step-num">4</span> Presentation
        </div>
      </div>

      {/* ──────────────────────────────────────────
          STEP 1: CLEAN PROMPT INPUT
         ────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="simple-card premium-shadow">
          <label className="simple-input-label">Presentation Topic or Prompt:</label>
          <div className="prompt-input-wrapper">
            <input
              type="text"
              className="simple-prompt-input"
              maxLength={1500}
              aria-label="Presentation topic"
              placeholder="e.g. AI in Healthcare or Business Pitch..."
              value={promptTopic}
              onChange={(e) => setPromptTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && promptTopic.trim() && setCurrentStep(2)}
              autoFocus
            />
          </div>

          <div className="prompt-suggestions">
            <span className="suggestions-label">Try popular topics:</span>
            <div className="suggestions-chips-row">
              {['AI in Healthcare', 'Pitch Deck 2026', 'Renewable Energy', 'Global Sales Strategy'].map((idea) => (
                <button
                  key={idea}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setPromptTopic(idea)}
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          <div className="simple-card-actions end">
            <button
              className="simple-btn-primary"
              disabled={!promptTopic.trim()}
              onClick={() => setCurrentStep(2)}
            >
              <span>Next: Select Slides</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          STEP 2: SLIDE COUNT
         ────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="simple-card premium-shadow">
          <label className="simple-input-label">Select Number of Slides:</label>
          <div className="simple-slide-options">
            {SLIDE_OPTIONS.map((count) => (
              <button
                key={count}
                className={`simple-slide-btn ${slideCount === count ? 'selected' : ''}`}
                onClick={() => setSlideCount(count)}
              >
                <span className="slide-btn-num">{count}</span>
                <span className="slide-btn-text">Slides</span>
                <span className="slide-btn-sub">
                  {count === 3 && 'Executive Pitch'}
                  {count === 5 && 'Standard Deck'}
                  {count === 8 && 'Detailed Strategy'}
                  {count === 10 && 'Comprehensive'}
                </span>
              </button>
            ))}
          </div>

          <div className="simple-card-actions space-between">
            <button className="simple-btn-back" onClick={() => setCurrentStep(1)}>
              ← Back
            </button>
            <button className="simple-btn-primary" onClick={() => setCurrentStep(3)}>
              <span>Next: Select Template</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          STEP 3: 4 LUXURY PREMIUM TEMPLATES
         ────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="simple-card wide premium-shadow">
          <div className="tmpl-card-header">
            <div>
              <label className="simple-input-label">Select Premium Template Design:</label>
              <p className="tmpl-header-sub">
                Curated executive color schemes, luxury typography, and high-impact slide layouts.
              </p>
            </div>
          </div>

          <div className="premium-templates-grid">
            {TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id
              return (
                <div
                  key={tmpl.id}
                  className={`premium-tmpl-card ${isSelected ? 'selected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  aria-label={`Select ${tmpl.name} template`}
                  onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedTemplateId(tmpl.id) } }}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  style={{
                    '--template-primary': tmpl.primary,
                    '--template-secondary': tmpl.secondary,
                    '--template-text': tmpl.text,
                    '--template-muted': tmpl.textMuted,
                    borderColor: isSelected ? tmpl.primary : undefined,
                    boxShadow: isSelected ? '0 4px 20px rgba(139, 92, 246, 0.1)' : 'none',
                  }}
                >
                  {/* Luxury Mockup Preview */}
                  <div className="premium-mockup-slide" style={{ background: tmpl.gradient }}>
                    {/* Top line */}
                    <div className="mockup-top-line" style={{ background: tmpl.primary }} />
                    <div className="mockup-header-row">
                      <span className="mockup-badge" style={{ color: tmpl.secondary, borderColor: tmpl.primary }}>
                        {tmpl.tag}
                      </span>
                      <div className="mockup-dots">
                        <span style={{ background: tmpl.primary }} />
                        <span style={{ background: tmpl.secondary }} />
                      </div>
                    </div>

                    <div className="mockup-title" style={{ color: tmpl.text }}>
                      {promptTopic ? (promptTopic.length > 22 ? promptTopic.slice(0, 22) + '...' : promptTopic) : 'Executive Presentation'}
                    </div>
                    <div className="mockup-detail" style={{ color: tmpl.textMuted }}>
                      A preview of your presentation design
                    </div>

                    <div className="mockup-cards-row">
                      <div className="mockup-card-pill" style={{ backgroundColor: tmpl.cardBg, borderColor: tmpl.primary }}>
                        <span style={{ color: tmpl.primary, fontWeight: 800 }}>{slideCount}</span>
                        <span style={{ color: tmpl.textMuted, fontSize: '0.6rem' }}>Slides</span>
                      </div>
                      <div className="mockup-card-pill" style={{ backgroundColor: tmpl.cardBg, borderColor: tmpl.secondary }}>
                        <span style={{ color: tmpl.secondary, fontWeight: 800 }}>PPTX</span>
                        <span style={{ color: tmpl.textMuted, fontSize: '0.6rem' }}>Export</span>
                      </div>
                    </div>
                  </div>

                  {/* Template Meta */}
                  <div className="premium-tmpl-meta">
                    <div className="meta-top-line">
                      <h4 className="meta-name">{tmpl.name}</h4>
                      <span className="meta-tag" style={{ color: tmpl.primary, borderColor: tmpl.primary }}>
                        {tmpl.tag}
                      </span>
                    </div>
                    <p className="meta-sub">{tmpl.subtitle}</p>

                    <div className="meta-swatches">
                      <span className="swatch" style={{ background: tmpl.bg }} title="Background" />
                      <span className="swatch" style={{ background: tmpl.cardBg }} title="Card Base" />
                      <span className="swatch" style={{ background: tmpl.primary }} title="Primary Accent" />
                      <span className="swatch" style={{ background: tmpl.secondary }} title="Secondary Accent" />
                      <span className="swatch" style={{ background: tmpl.accent }} title="Highlight Accent" />
                    </div>

                    <div
                      className={`tmpl-selection-indicator ${isSelected ? 'active' : ''}`}
                      style={{
                        backgroundColor: isSelected ? tmpl.primary : 'rgba(255, 255, 255, 0.05)',
                        color: isSelected ? '#ffffff' : '#94a3b8',
                      }}
                    >
                      {isSelected ? '✓ Selected Template' : 'Click to Select'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="simple-card-actions space-between">
            <button className="simple-btn-back" onClick={() => setCurrentStep(2)}>
              ← Back
            </button>
            <button className="simple-btn-primary generate" onClick={handleGenerate}>
              <span className="btn-sparkle">⚡</span>
              <span>{presentationData && generatedFor.current === JSON.stringify([promptTopic.trim(), slideCount]) ? 'Apply Template' : `Generate ${slideCount} Slides`}</span>
            </button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────
          STEP 4: GENERATION LOADING
         ────────────────────────────────────────── */}
      {currentStep === 4 && isGenerating && (
        <div className="simple-card center premium-shadow">
          <div className="premium-spinner-box">
            <div
              className="premium-spinner-ring"
              style={{
                borderTopColor: currentTemplate.primary,
                borderRightColor: currentTemplate.secondary,
              }}
            />
            <span className="premium-spinner-icon">⚡</span>
          </div>
          <h2 className="loading-title">Creating your presentation</h2>
          <p className="loading-sub">
            Generating tailored slides for "<strong>{promptTopic}</strong>" with <strong>{currentTemplate.name}</strong> theme
          </p>
          <button className="simple-btn-back" onClick={() => { requestRef.current?.abort(); setIsGenerating(false); setCurrentStep(3) }}>Cancel generation</button>
        </div>
      )}

      {/* ──────────────────────────────────────────
          STEP 4: DYNAMIC PRESENTATION VIEWER (WITH ANIMATIONS)
         ────────────────────────────────────────── */}
      {currentStep === 4 && !isGenerating && presentationData && (
        <div className="premium-presentation-deck">
          {/* Deck Top Bar */}
          <div className="deck-glass-bar">
            <div className="deck-info-group">
              <span className="deck-topic-name">{presentationData.title}</span>
              <span className="deck-tag-pill" style={{ borderColor: currentTemplate.primary, color: currentTemplate.secondary }}>
                {currentTemplate.name}
              </span>
              <span className="deck-tag-pill">{presentationData.slides.length} Slides</span>
            </div>

            <div className="deck-controls-group"><button className="simple-btn-back" aria-pressed={editingSlide} onClick={() => { setIsAutoPlay(false); setEditingSlide(previous => !previous) }}>{editingSlide ? 'Done editing' : 'Edit slide'}</button>
              <button
                className={`btn-deck-play ${isAutoPlay ? 'active' : ''}`}
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                title="Auto Play Presentation Slides with Animation"
              >
                <span>{isAutoPlay ? '⏸ Pause' : '▶ Auto Play'}</span>
              </button>
              <button className="btn-deck-download" disabled={isDownloading} onClick={handleDownload} title="Download PowerPoint .pptx file">
                <span>⬇ Download PPTX</span>
              </button>
            </div>
          </div>

          {editingSlide && <section className="presentation-slide-editor" aria-label="Edit current slide">
            <label>Slide title<input maxLength={180} value={presentationData.slides[activeSlideIndex].title} onChange={event => editCurrentSlide('title', event.target.value)} /></label>
            <label>Description<textarea maxLength={650} rows={3} value={presentationData.slides[activeSlideIndex].detail} onChange={event => editCurrentSlide('detail', event.target.value)} /></label>
            {presentationData.slides[activeSlideIndex].bullets?.map((bullet, index) => <div className="presentation-bullet-editor" key={index}>
              <label>Point {index + 1}<input maxLength={100} value={bullet.lead} onChange={event => editCurrentSlide('bullets', presentationData.slides[activeSlideIndex].bullets.map((item, bulletIndex) => bulletIndex === index ? { ...item, lead: event.target.value } : item))} /></label>
              <label>Explanation<textarea maxLength={350} rows={2} value={bullet.desc} onChange={event => editCurrentSlide('bullets', presentationData.slides[activeSlideIndex].bullets.map((item, bulletIndex) => bulletIndex === index ? { ...item, desc: event.target.value } : item))} /></label>
            </div>)}
            <p>Your changes are included in the PowerPoint download.</p>
          </section>}

          {/* 16:9 Slide Canvas */}
          <div className="widescreen-canvas-container">
            <div
              className={`widescreen-slide-canvas slide-animated`}
              key={activeSlideIndex}
              style={{
                '--template-primary': currentTemplate.primary,
                '--template-secondary': currentTemplate.secondary,
                '--template-text': currentTemplate.text,
                '--template-muted': currentTemplate.textMuted,
                backgroundColor: currentTemplate.bg,
                background: currentTemplate.gradient,
              }}
            >
              {/* Top Accent Gradient Line */}
              <div
                className="slide-top-gradient"
                style={{
                  background: `linear-gradient(90deg, ${currentTemplate.primary}, ${currentTemplate.secondary})`,
                }}
              />

              {/* SLIDE CONTENT AREA (PEHLE TITLE PHIR DETAIL PHIR SARI CHEEZAIN) */}
              <div className="slide-content-stage">
                {(() => {
                  const s = presentationData.slides[activeSlideIndex]
                  if (!s) return null

                  switch (s.type) {
                    case 'title':
                      return (
                        <div className="title-slide-wrapper animate-fade-in">
                          {s.tag && (
                            <span
                              className="title-kicker-badge"
                              style={{
                                borderColor: currentTemplate.primary,
                                color: currentTemplate.secondary,
                              }}
                            >
                              {s.tag}
                            </span>
                          )}
                          <h1 className="title-heading" style={{ color: currentTemplate.text }}>
                            {s.title}
                          </h1>
                          <div className="title-accent-bar" style={{ background: currentTemplate.primary }} />
                          <p className="title-detail-text" style={{ color: currentTemplate.textMuted }}>
                            {s.detail}
                          </p>
                          <div className="title-meta-footer" style={{ color: currentTemplate.textMuted }}>
                            <span>{s.author || 'AI Presentation'}</span>
                            <span>•</span>
                            <span>{s.date || ''}</span>
                          </div>
                        </div>
                      )

                    default:
                      return (
                        <div className="content-slide-wrapper animate-fade-in">
                          {/* 1. PEHLE TITLE (WITH KICKER TAG) */}
                          <div className="slide-header-section">
                            {s.tag && (
                              <span className="slide-kicker" style={{ color: currentTemplate.secondary }}>
                                {s.tag}
                              </span>
                            )}
                            <h2 className="slide-main-heading" style={{ color: currentTemplate.text }}>
                              {s.title}
                            </h2>

                            {/* 2. PHIR DETAIL (CONTEXT OVERVIEW PARAGRAPH) */}
                            {s.detail && (
                              <p className="slide-detail-paragraph" style={{ color: currentTemplate.textMuted }}>
                                {s.detail}
                              </p>
                            )}
                            <div className="slide-accent-divider" style={{ background: currentTemplate.primary }} />
                          </div>

                          {/* 3. PHIR SARI CHEEZAIN (STRUCTURED CONTENT) */}
                          <div className="slide-body-section">
                            {/* AGENDA */}
                            {s.type === 'agenda' && (
                              <div className="agenda-list-grid">
                                {s.items?.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="agenda-row-card animate-stagger"
                                    style={{
                                      backgroundColor: currentTemplate.cardBg,
                                      borderColor: `${currentTemplate.primary}35`,
                                      animationDelay: `${idx * 0.08}s`,
                                    }}
                                  >
                                    <span className="agenda-row-num" style={{ background: currentTemplate.primary }}>
                                      {idx + 1}
                                    </span>
                                    <span className="agenda-row-label" style={{ color: currentTemplate.text }}>
                                      {item}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* BULLETS / KEY POINTS */}
                            {s.type === 'content' && (
                              <div className="content-cards-column">
                                {s.bullets?.map((b, idx) => {
                                  const lead = typeof b === 'object' ? b.lead : 'Key Point:'
                                  const desc = typeof b === 'object' ? b.desc : b
                                  return (
                                    <div
                                      key={idx}
                                      className="content-bullet-card animate-stagger"
                                      style={{
                                        backgroundColor: currentTemplate.cardBg,
                                        borderColor: `${currentTemplate.primary}30`,
                                        animationDelay: `${idx * 0.08}s`,
                                      }}
                                    >
                                      <span className="bullet-glow-dot" style={{ background: currentTemplate.primary }} />
                                      <div className="bullet-card-content">
                                        <strong className="bullet-lead" style={{ color: currentTemplate.accent }}>
                                          {lead}
                                        </strong>
                                        <span className="bullet-desc" style={{ color: currentTemplate.text }}>
                                          {desc}
                                        </span>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )}

                            {/* TWO-COLUMN */}
                            {s.type === 'two-column' && (
                              <div className="two-col-grid">
                                <div
                                  className="col-panel animate-stagger"
                                  style={{
                                    backgroundColor: currentTemplate.cardBg,
                                    borderColor: currentTemplate.primary,
                                  }}
                                >
                                  <h3 className="col-panel-title" style={{ color: currentTemplate.accent }}>
                                    {s.leftTitle}
                                  </h3>
                                  <ul className="col-panel-list">
                                    {s.leftBullets?.map((pt, idx) => (
                                      <li key={idx} style={{ color: currentTemplate.text }}>
                                        <span className="col-marker" style={{ background: currentTemplate.primary }} />
                                        <span>{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div
                                  className="col-panel animate-stagger"
                                  style={{
                                    backgroundColor: currentTemplate.cardBg,
                                    borderColor: currentTemplate.secondary,
                                    animationDelay: '0.12s',
                                  }}
                                >
                                  <h3 className="col-panel-title" style={{ color: currentTemplate.secondary }}>
                                    {s.rightTitle}
                                  </h3>
                                  <ul className="col-panel-list">
                                    {s.rightBullets?.map((pt, idx) => (
                                      <li key={idx} style={{ color: currentTemplate.text }}>
                                        <span className="col-marker" style={{ background: currentTemplate.secondary }} />
                                        <span>{pt}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            )}

                            {/* STATS */}
                            {s.type === 'stats' && (
                              <div className="stats-cards-grid">
                                {s.stats?.map((stat, idx) => (
                                  <div
                                    key={idx}
                                    className="stat-card-box animate-stagger"
                                    style={{
                                      backgroundColor: currentTemplate.cardBg,
                                      borderColor: idx % 2 === 0 ? currentTemplate.primary : currentTemplate.secondary,
                                      animationDelay: `${idx * 0.08}s`,
                                    }}
                                  >
                                    <span
                                      className="stat-number"
                                      style={{ color: idx % 2 === 0 ? currentTemplate.primary : currentTemplate.secondary }}
                                    >
                                      {stat.value}
                                    </span>
                                    <span className="stat-caption" style={{ color: currentTemplate.text }}>
                                      {stat.label}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* TIMELINE */}
                            {s.type === 'timeline' && (
                              <div className="timeline-cards-grid">
                                {s.phases?.map((p, idx) => (
                                  <div
                                    key={idx}
                                    className="timeline-phase-box animate-stagger"
                                    style={{
                                      backgroundColor: currentTemplate.cardBg,
                                      borderColor: `${currentTemplate.primary}35`,
                                      animationDelay: `${idx * 0.08}s`,
                                    }}
                                  >
                                    <div className="phase-node-pill" style={{ background: currentTemplate.primary }}>
                                      {idx + 1}
                                    </div>
                                    <span className="phase-kicker" style={{ color: currentTemplate.accent }}>
                                      {p.phase}
                                    </span>
                                    <h4 className="phase-heading" style={{ color: currentTemplate.text }}>
                                      {p.title}
                                    </h4>
                                    <span className="phase-time" style={{ color: currentTemplate.textMuted }}>
                                      {p.duration}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* CONCLUSION */}
                            {s.type === 'conclusion' && (
                              <div className="conclusion-content-block">
                                <div className="conclusion-cards-list">
                                  {s.bullets?.map((b, idx) => {
                                    const lead = typeof b === 'object' ? b.lead : 'Takeaway:'
                                    const desc = typeof b === 'object' ? b.desc : b
                                    return (
                                      <div
                                        key={idx}
                                        className="conclusion-card animate-stagger"
                                        style={{
                                          backgroundColor: currentTemplate.cardBg,
                                          borderColor: `${currentTemplate.secondary}35`,
                                          animationDelay: `${idx * 0.08}s`,
                                        }}
                                      >
                                        <span className="concl-check-icon" style={{ color: currentTemplate.secondary }}>
                                          ✓
                                        </span>
                                        <div className="concl-card-text">
                                          <strong style={{ color: currentTemplate.secondary }}>{lead}</strong>
                                          <span style={{ color: currentTemplate.text }}> {desc}</span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                                {s.callToAction && (
                                  <div
                                    className="cta-banner-box animate-stagger"
                                    style={{
                                      background: `linear-gradient(135deg, ${currentTemplate.primary}, ${currentTemplate.secondary})`,
                                    }}
                                  >
                                    {s.callToAction}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* THANK YOU */}
                            {s.type === 'thankyou' && (
                              <div className="thankyou-block animate-fade-in">
                                <h1 className="thankyou-title" style={{ color: currentTemplate.text }}>
                                  {s.title}
                                </h1>
                                <p className="thankyou-desc" style={{ color: currentTemplate.textMuted }}>
                                  {s.detail}
                                </p>
                                {s.contact && (
                                  <div
                                    className="thankyou-badge-contact"
                                    style={{
                                      backgroundColor: currentTemplate.cardBg,
                                      borderColor: currentTemplate.primary,
                                      color: currentTemplate.accent,
                                    }}
                                  >
                                    {s.contact}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                  }
                })()}
              </div>

              {/* Bottom Footer Line */}
              <div className="slide-footer-bar" style={{ color: currentTemplate.textMuted }}>
                <span>{presentationData.title} • {currentTemplate.name}</span>
                <span>Slide {activeSlideIndex + 1} of {presentationData.slides.length}</span>
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              className="canvas-nav-arrow prev"
              onClick={() => setActiveSlideIndex((prev) => Math.max(prev - 1, 0))}
              disabled={activeSlideIndex === 0}
              title="Previous Slide"
            >
              ‹
            </button>
            <button
              className="canvas-nav-arrow next"
              onClick={() => setActiveSlideIndex((prev) => Math.min(prev + 1, presentationData.slides.length - 1))}
              disabled={activeSlideIndex === presentationData.slides.length - 1}
              title="Next Slide"
            >
              ›
            </button>
          </div>

          {/* Slide Thumbnails Bar */}
          <div className="deck-thumbnails-ribbon">
            {presentationData.slides.map((s, idx) => (
              <button
                key={idx}
                className={`deck-thumb-pill ${idx === activeSlideIndex ? 'active' : ''}`}
                onClick={() => setActiveSlideIndex(idx)}
                style={{
                  borderColor: idx === activeSlideIndex ? currentTemplate.primary : 'transparent',
                }}
              >
                <span className="thumb-num">{idx + 1}</span>
                <span className="thumb-txt">{s.title || `Slide ${idx + 1}`}</span>
              </button>
            ))}
          </div>

          {/* Action Row */}
          <div className="deck-footer-actions">
            <button className="simple-btn-back" onClick={() => setCurrentStep(1)}>
              🔄 Start Over
            </button>
            <button className="simple-btn-back" onClick={() => setCurrentStep(3)}>
              🎨 Change Template
            </button>
            <button className="simple-btn-primary" disabled={isDownloading} onClick={handleDownload}>
              <span>⬇ Download PowerPoint (.pptx)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
