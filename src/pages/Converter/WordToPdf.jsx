import ConverterNavigation from './ConverterNavigation';
import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef } from 'react'
import mammoth from 'mammoth'
import { jsPDF } from 'jspdf'
import './Converter.css'

export default function WordToPdf() {
  const consumeUsage = useUsage()
  const [file, setFile] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [convertedUrl, setConvertedUrl] = useState(null)
  const [convertedFileName, setConvertedFileName] = useState('')
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.name.match(/\.(docx|doc)$/i)) {
      setError('Please select a valid Word document (.docx or .doc).')
      return
    }

    setError(null)
    setFile(selected)
    setConvertedUrl(null)

    try {
      const arrayBuffer = await selected.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const rawText = result.value.trim()


      const words = rawText.split(/\s+/).filter(Boolean).length
      setStats({
        words,
        chars: rawText.length,
        size: (selected.size / 1024).toFixed(1) + ' KB',
      })
    } catch {

      setStats({
        words: 'N/A',
        chars: 'N/A',
        size: (selected.size / 1024).toFixed(1) + ' KB',
      })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) {
      handleFileChange({ target: { files: [dropped] } })
    }
  }

  const handleConvert = async () => {
    if (!file) return
    if (!(await consumeUsage())) return

    setIsConverting(true)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      const text = result.value.trim()

      if (!text) {
        throw new Error('No readable text found in document.')
      }

      const doc = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4',
      })

      const margin = 40
      const pageWidth = doc.internal.pageSize.getWidth()
      const maxLineWidth = pageWidth - margin * 2
      const lineHeight = 16
      let cursorY = margin

      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(11)
      doc.setTextColor(30, 30, 30)

      const paragraphs = text.split(/\n+/)

      for (const para of paragraphs) {
        const lines = doc.splitTextToSize(para, maxLineWidth)
        for (const line of lines) {
          if (cursorY + lineHeight > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage()
            cursorY = margin
          }
          doc.text(line, margin, cursorY)
          cursorY += lineHeight
        }
        cursorY += lineHeight * 0.5
      }

      const pdfBlob = doc.output('blob')
      const downloadUrl = URL.createObjectURL(pdfBlob)
      const outName = file.name.replace(/\.(docx|doc)$/i, '.pdf')

      setConvertedUrl(downloadUrl)
      setConvertedFileName(outName)

      // Automatically trigger download
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = outName
      a.click()
    } catch (err) {
      console.error('Word to PDF conversion failed:', err)
      setError('Conversion failed: ' + (err.message || 'Please check document format.'))
    } finally {
      setIsConverting(false)
    }
  }

  return (
    <div className={`converter-container${file ? ' has-selected-file' : ''}`}>
      {/* Background ambient lighting */}
      <div className="converter-glow-orb" />

      {/* Main Workspace */}
      <main className="converter-main-area">
        {/* Mode Switcher Nav */}
        <ConverterNavigation />

        {/* Header Section */}
        <header className="converter-header">
          <div className="converter-badge">
            <span className="badge-sparkle">✦</span>
            <span>Dynamic Document Processing</span>
          </div>
          <h1 className="converter-title">Word to PDF Converter</h1>
          <p className="converter-subtitle">
            Convert Word documents into crisp PDF files instantly.
          </p>
        </header>

        {/* Action / Upload Card */}
        <div className="converter-card">
          <div
            className={`converter-dropzone ${file ? 'has-file' : ''}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.doc"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <div className="dropzone-icon-circle">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 12 15 15" />
              </svg>
            </div>

            <div className="dropzone-info">
              <h3>{file ? file.name : 'Choose or Drag Document Here'}</h3>
              <p>{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports .docx & .doc files'}</p>
            </div>

            <button type="button" className="btn-browse-file">
              {file ? 'Change File' : 'Browse File'}
            </button>
          </div>

          {stats && (
            <div className="file-stats-bar">
              <div className="stat-pill">
                <span className="stat-label">Words</span>
                <span className="stat-val">{stats.words}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Characters</span>
                <span className="stat-val">{stats.chars}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Original Size</span>
                <span className="stat-val">{stats.size}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Output</span>
                <span className="stat-val">PDF Document</span>
              </div>
            </div>
          )}

          {error && <div className="converter-error-box">{error}</div>}

          {file && (
            <div className="converter-actions-row">
              <button
                type="button"
                className="btn-convert-primary"
                onClick={handleConvert}
                disabled={isConverting}
              >
                {isConverting ? (
                  <>
                    <div className="btn-spinner" />
                    <span>Processing Document...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Convert to PDF</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Converted Result Box */}
        {convertedUrl && (
          <div className="converter-result-card">
            <div className="result-icon-box">✓</div>
            <div className="result-info">
              <h3>Ready for Download!</h3>
              <p>{convertedFileName}</p>
            </div>
            <a href={convertedUrl} download={convertedFileName} className="btn-download-result">
              <span>⬇ Download PDF</span>
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
