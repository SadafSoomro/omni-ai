import ConverterNavigation from './ConverterNavigation';
import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef } from 'react'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import * as pdfjsLib from 'pdfjs-dist'
import './Converter.css'

// Set worker source for pdfjs-dist via CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href

export default function PdfToWord() {
  const consumeUsage = useUsage()
  const [file, setFile] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [pageCount, setPageCount] = useState(0)
  const [convertedUrl, setConvertedUrl] = useState(null)
  const [convertedFileName, setConvertedFileName] = useState('')
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (!selected.name.match(/\.pdf$/i)) {
      setError('Please select a valid PDF file (.pdf).')
      return
    }

    setError(null)
    setFile(selected)
    setConvertedUrl(null)

    try {
      const arrayBuffer = await selected.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      setPageCount(pdf.numPages)


      setStats({
        pages: pdf.numPages,
        size: (selected.size / 1024).toFixed(1) + ' KB',
      })
    } catch {

      setStats({
        pages: 'Multiple',
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
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise

      const docxParagraphs = []

      // Title header
      docxParagraphs.push(
        new Paragraph({
          text: file.name.replace(/\.pdf$/i, ''),
          heading: HeadingLevel.TITLE,
          spacing: { after: 300 },
        })
      )

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()

        if (pdf.numPages > 1) {
          docxParagraphs.push(
            new Paragraph({
              text: `--- Page ${pageNum} ---`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          )
        }

        let currentLineY = null
        let currentLineText = ''

        for (const item of textContent.items) {
          if (!item.str) continue

          const itemY = item.transform ? Math.round(item.transform[5]) : null

          if (currentLineY === null || Math.abs(itemY - currentLineY) < 4) {
            currentLineText += (currentLineText ? ' ' : '') + item.str
            currentLineY = itemY
          } else {
            if (currentLineText.trim()) {
              docxParagraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: currentLineText.trim(),
                      size: 22,
                    }),
                  ],
                  spacing: { after: 120 },
                })
              )
            }
            currentLineText = item.str
            currentLineY = itemY
          }
        }

        if (currentLineText.trim()) {
          docxParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: currentLineText.trim(),
                  size: 22,
                }),
              ],
              spacing: { after: 120 },
            })
          )
        }
      }

      if (docxParagraphs.length === 0) {
        docxParagraphs.push(
          new Paragraph({
            text: 'No text content could be extracted from this PDF.',
          })
        )
      }

      const docxDoc = new Document({
        sections: [
          {
            properties: {},
            children: docxParagraphs,
          },
        ],
      })

      const blob = await Packer.toBlob(docxDoc)
      const downloadUrl = URL.createObjectURL(blob)
      const outName = file.name.replace(/\.pdf$/i, '.docx')

      setConvertedUrl(downloadUrl)
      setConvertedFileName(outName)

      // Trigger download
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = outName
      a.click()
    } catch (err) {
      console.error('PDF to Word conversion error:', err)
      setError('Conversion failed: ' + (err.message || 'Please check PDF integrity.'))
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
            <span>Document Conversion Engine</span>
          </div>
          <h1 className="converter-title">PDF to Word Converter</h1>
          <p className="converter-subtitle">
            Convert Adobe PDF documents into editable Microsoft Word (.docx) files.
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
              accept=".pdf"
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
              <h3>{file ? file.name : 'Choose or Drag PDF Here'}</h3>
              <p>{file ? `${(file.size / 1024).toFixed(1)} KB` : 'Supports standard .pdf documents'}</p>
            </div>

            <button type="button" className="btn-browse-file">
              {file ? 'Change File' : 'Browse File'}
            </button>
          </div>

          {stats && (
            <div className="file-stats-bar">
              <div className="stat-pill">
                <span className="stat-label">Pages Detected</span>
                <span className="stat-val">{stats.pages || pageCount}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Original Size</span>
                <span className="stat-val">{stats.size}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Format</span>
                <span className="stat-val">Adobe PDF</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">Target</span>
                <span className="stat-val">Microsoft Word (.docx)</span>
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
                    <span>Extracting Text & Formatting...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Convert to Word (.docx)</span>
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
              <h3>Word Document Generated!</h3>
              <p>{convertedFileName}</p>
            </div>
            <a href={convertedUrl} download={convertedFileName} className="btn-download-result">
              <span>⬇ Download Word (.docx)</span>
            </a>
          </div>
        )}
      </main>
    </div>
  )
}
