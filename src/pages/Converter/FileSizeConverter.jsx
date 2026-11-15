import {compressArchive, compressImage} from '../../services/fileCompression';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConverterNavigation, {ConverterIcon} from './ConverterNavigation';
import {t} from '../../utils/text'
import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef } from 'react'
import './Converter.css'
import './FileSizeConverter.css'

export default function FileSizeConverter() {
  const consumeUsage = useUsage()

  // State
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [convertedBlob, setConvertedBlob] = useState(null)
  const [convertedSizeStr, setConvertedSizeStr] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [compressionMode, setCompressionMode] = useState('balanced')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  // Format bytes helper
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 KB'
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    if (mb < 1024) return `${mb.toFixed(2)} MB`
    const gb = mb / 1024
    return `${gb.toFixed(2)} GB`
  }

  // File Upload Handlers
  const handleFileSelect = (file) => {
    if (!file || isConverting) return
    setResult(null); setError('')
    setUploadedFile(file)
    setConvertedBlob(null)
    setConvertedSizeStr(null)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer?.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleConvertFile = async () => {
    if (!uploadedFile || isConverting || !(await consumeUsage())) return
    setIsConverting(true); setError(''); setConvertedBlob(null); setResult(null)
    try {
      const compressed = uploadedFile.type.startsWith('image/')
        ? await compressImage(uploadedFile, compressionMode)
        : await compressArchive(uploadedFile)
      setResult(compressed); setConvertedBlob(compressed.blob)
      setConvertedSizeStr(formatBytes(compressed.blob.size))
    } catch (err) {
      setError(err.message || 'This file could not be compressed. Your original file is unchanged.')
    } finally { setIsConverting(false) }
  }

  // Download Trigger
  const handleDownload = () => {
    if (!convertedBlob || !uploadedFile) return
    const url = URL.createObjectURL(convertedBlob)
    const a = document.createElement('a')
    a.href = url

    a.download = result?.reduced ? `compressed_${result.name}` : uploadedFile.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 6000)
  }

  return (
    <div className="converter-container simple-fsc-page">
      {/* Background ambient lighting */}
      <div className="converter-glow-orb" />

      <main className="converter-main-area">
      {/* Mode Switcher Nav */}
      <ConverterNavigation />

      {/* Header */}
      <header className="converter-header">
        <div className="converter-badge">
          <span className="badge-sparkle">✦</span>
          <span>Fast Document Compressor</span>
        </div>
        <h1 className="converter-title">{t("File Converter")}</h1>
        <p className="converter-subtitle">
          Compress ZIP archives, documents, and images with real size reduction.
        </p>
      </header>

      {/* Main File Converter Card */}
      <div className="simple-fsc-card">
        {/* File Dropzone */}
        <div
          className={`simple-dropzone ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            disabled={isConverting}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            style={{ display: 'none' }}
          />

          <div className="dropzone-icon">
            <ConverterIcon kind={uploadedFile ? 'document' : 'compress'} />
          </div>

          <div className="dropzone-text">
            <h3>{uploadedFile ? uploadedFile.name : 'Choose or Drag File Here'}</h3>
            <p>
              {uploadedFile
                ? `Original Size: ${formatBytes(uploadedFile.size)}`
                : 'Supports PDF, Word, images, and document files'}
            </p>
          </div>

          <button type="button" className="btn-browse-file" disabled={isConverting}>
            {uploadedFile ? 'Change File' : 'Browse File'}
          </button>
        </div>

        {/* Compression options and action */}
        {uploadedFile && (
          <div className="shrink-action-wrap">
            {uploadedFile.type.startsWith('image/') && <div className="compression-options" role="group" aria-label="Image compression level">
              <button type="button" disabled={isConverting} aria-pressed={compressionMode === 'balanced'} onClick={() => {setCompressionMode('balanced'); setConvertedBlob(null); setResult(null)}}>Balanced quality</button>
              <button type="button" disabled={isConverting} aria-pressed={compressionMode === 'maximum'} onClick={() => {setCompressionMode('maximum'); setConvertedBlob(null); setResult(null)}}>Maximum shrink</button>
            </div>}
            <p className="compression-hint">{uploadedFile.type.startsWith('image/') ? 'Images are optimized as WebP. Maximum shrink reduces image quality and dimensions.' : 'Maximum lossless compression. ZIP and Office files keep their format; other files may download as a ZIP.'}</p>
            <button
              type="button"
              className="btn-shrink-action-primary"
              onClick={handleConvertFile}
              disabled={isConverting}
            >
              {isConverting ? <LoadingSpinner label="Compressing file" /> : 'Compress file'}
            </button>
          </div>
        )}

        {error && <p className="converter-error-box" role="alert">{error}</p>}

        {/* Converted Result: Original Size -> Shrink Document -> Converted Size */}
        {convertedBlob && uploadedFile && (
          <div className="shrink-flow-card">
            <p className="compression-summary" role="status">{result?.reduced ? (100 * (1 - convertedBlob.size / uploadedFile.size)).toFixed(1) + '% smaller' : 'Already optimized'}</p>
            <p className="compression-hint">{result?.note}</p>
            <div className="shrink-flow-row">
              <div className="shrink-flow-col">
                <span className="shrink-flow-label">Original Size</span>
                <strong className="shrink-flow-val origin-val">
                  {formatBytes(uploadedFile.size)}
                </strong>
              </div>

              <div className="shrink-flow-badge-wrap">
                <span className="shrink-flow-arrow">➔</span>
                <span className="shrink-document-pill">{result?.reduced ? 'Compressed' : 'Original kept'}</span>
                <span className="shrink-flow-arrow">➔</span>
              </div>

              <div className="shrink-flow-col">
                <span className="shrink-flow-label">Converted Size</span>
                <strong className="shrink-flow-val converted-val">
                  {convertedSizeStr}
                </strong>
              </div>
            </div>

            <button type="button" className="btn-download-file" onClick={handleDownload}>
              <span>{result?.reduced ? 'Download compressed file' : 'Download original file'}</span>
            </button>
          </div>
        )}
      </div>
      </main>
    </div>
  )
}
