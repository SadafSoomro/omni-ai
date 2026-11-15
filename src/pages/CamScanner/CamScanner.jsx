import {createOcrWorker} from '../../services/ocr'
import {EMPTY_CROP, prepareScanFile, renderScan, detectDocumentCrop, a4Crop} from '../../services/documentScanner';
import LoadingSpinner from '../../components/LoadingSpinner';
import {t} from '../../utils/text'
import { useUsage } from '../../context/UsageContext'
import React, { useState, useRef, useEffect } from 'react'
import './CamScanner.css'
import './ScannerRefinements.css'

export default function CamScanner() {
  const consumeUsage = useUsage()
  const [pages, setPages] = useState([])
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [activeFilter, setActiveFilter] = useState('auto') // 'original', 'auto', 'bw', 'gray'
  const [previewPageIdx, setPreviewPageIdx] = useState(null)
  const [uploadBusy, setUploadBusy] = useState(false)
  const [cameraStarting, setCameraStarting] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [editPreview, setEditPreview] = useState(null)
  const [editBusy, setEditBusy] = useState(false)
  const [ocrBusy, setOcrBusy] = useState(false)
  const [ocrProgress, setOcrProgress] = useState('')
  const [ocrLanguage, setOcrLanguage] = useState('eng')
  const [ocrText, setOcrText] = useState('')
  const cameraVersion = useRef(0), workerRef = useRef(null), ocrVersion = useRef(0), uploadLock = useRef(false), mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => {mounted.current=false;cameraVersion.current++;ocrVersion.current++;workerRef.current?.terminate().catch(()=>{});} }, [])
  useEffect(() => {ocrVersion.current++;setOcrText('');setOcrBusy(false);workerRef.current?.terminate().catch(()=>{});workerRef.current=null}, [pages])

  // Edit Studio Modal state (Only opens after clicking Edit)
  const [editingPage, setEditingPage] = useState(null)
  const [editingTab, setEditingTab] = useState('crop') // 'crop' | 'filter' | 'rotate'
  const [editingCrop, setEditingCrop] = useState({ top: 0, bottom: 0, left: 0, right: 0 })
  const [editingRotation, setEditingRotation] = useState(0)
  const [editingFilter, setEditingFilter] = useState('auto')

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [])

  const startCamera = async () => {
    if (cameraStarting || isCameraActive) return
    setCameraError('');setCameraStarting(true);setCameraReady(false)
    const version=++cameraVersion.current
    try {
      if(!navigator.mediaDevices?.getUserMedia)throw new Error('Camera needs HTTPS or localhost. You can upload document pictures instead.')
      let stream
      try {stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false})}
      catch(error){if(error.name!=='OverconstrainedError')throw error;stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false})}
      if(version!==cameraVersion.current || !mounted.current){stream.getTracks().forEach(track=>track.stop());return}
      streamRef.current=stream;setIsCameraActive(true)
      stream.getVideoTracks()[0]?.addEventListener('ended',()=>{if(mounted.current){setCameraReady(false);setIsCameraActive(false)}},{once:true})
    } catch(error) {
      if(mounted.current && version===cameraVersion.current)setCameraError(error.name==='NotAllowedError'?'Camera permission was denied. Allow camera access in your browser or upload document pictures.':error.name==='NotFoundError'?'No camera found. Upload document pictures instead.':error.name==='NotReadableError'?'The camera is busy in another app. Close that app and try again.':error.message || 'Camera could not start. Upload document pictures instead.')
    } finally {if(mounted.current)setCameraStarting(false)}
  }

  useEffect(() => {
    if(isCameraActive && videoRef.current && streamRef.current){videoRef.current.srcObject=streamRef.current;videoRef.current.play().catch(()=>setCameraError('Tap the camera preview to start playback.'))}
  }, [isCameraActive])

  const stopCamera = () => {
    cameraVersion.current++;streamRef.current?.getTracks().forEach(track=>track.stop());streamRef.current=null
    setCameraReady(false);setIsCameraActive(false)
  }

  const capturePhoto = async () => {
    if(uploadLock.current || !cameraReady || !videoRef.current?.videoWidth)return
    if(pages.length>=30){setCameraError('A scan can contain up to 30 pages.');return}
    uploadLock.current=true;setUploadBusy(true);setCameraError('')
    try {
      const video=videoRef.current,canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight
      canvas.getContext('2d').drawImage(video,0,0)
      const originalUrl=canvas.toDataURL('image/jpeg',.95),rendered=await renderScan(originalUrl,{filter:activeFilter})
      if(mounted.current)setPages(prev=>[...prev,{id:crypto.randomUUID(),name:'Camera capture',originalUrl,...rendered,sourceWidth:canvas.width,sourceHeight:canvas.height,crop:{...EMPTY_CROP},filter:activeFilter,rotation:0}])
    }catch(error){if(mounted.current)setCameraError(error.message)}
    finally{uploadLock.current=false;if(mounted.current)setUploadBusy(false)}
  }

  const handleFileUpload = async e => {
    const files=Array.from(e.target.files || []);e.target.value=''
    if(!files.length || uploadLock.current)return
    if(pages.length+files.length>30){setCameraError('A scan can contain up to 30 pages. Select fewer pictures.');return}
    uploadLock.current=true;setUploadBusy(true);setCameraError('')
    const added=[],errors=[]
    try {
      for(const file of files){
        try {const originalUrl=await prepareScanFile(file),rendered=await renderScan(originalUrl,{filter:activeFilter});added.push({id:crypto.randomUUID(),name:file.name,originalUrl,...rendered,sourceWidth:rendered.width,sourceHeight:rendered.height,crop:{...EMPTY_CROP},filter:activeFilter,rotation:0})}
        catch(error){errors.push(error.message)}
        if(!mounted.current)return
      }
      setPages(prev=>[...prev,...added]);if(errors.length)setCameraError(errors.join(' '))
    }finally{uploadLock.current=false;if(mounted.current)setUploadBusy(false)}
  }

  const openEditModal = page => {
    setEditingPage(page);setEditingTab('crop');setEditingCrop(page.crop || {...EMPTY_CROP});setEditingRotation(page.rotation || 0);setEditingFilter(page.filter || 'auto');setEditPreview(page)
  }

  useEffect(() => {
    if(!editingPage)return
    let cancelled=false
    renderScan(editingPage.originalUrl,{crop:editingCrop,rotation:editingRotation,filter:editingFilter}).then(result=>{if(!cancelled)setEditPreview(result)}).catch(error=>{if(!cancelled)setCameraError(error.message)})
    return()=>{cancelled=true}
  }, [editingPage,editingCrop,editingRotation,editingFilter])

  const handleSaveEdit = async () => {
    if(!editingPage || editBusy)return
    setEditBusy(true)
    try {
      const rendered=await renderScan(editingPage.originalUrl,{crop:editingCrop,rotation:editingRotation,filter:editingFilter})
      if(!mounted.current)return
      setPages(prev=>prev.map(page=>page.id===editingPage.id?{...page,...rendered,crop:{...editingCrop},rotation:editingRotation,filter:editingFilter}:page));setEditingPage(null)
    }catch(error){if(mounted.current)setCameraError(error.message)}
    finally{if(mounted.current)setEditBusy(false)}
  }

  const autoDetectCrop = async () => {
    try {setEditingCrop(await detectDocumentCrop(editingPage.originalUrl));setCameraError('')}
    catch(error){setCameraError(error.message)}
  }

  // Delete Page
  const deletePage = (pageId) => {
    setPages((prev) => prev.filter((p) => p.id !== pageId))
  }

  // Move Page Order
  const movePage = (index, direction) => {
    const newIdx = index + direction
    if (newIdx < 0 || newIdx >= pages.length) return
    const updated = [...pages]
    const temp = updated[index]
    updated[index] = updated[newIdx]
    updated[newIdx] = temp
    setPages(updated)
  }

  // Convert to PDF and Download
  const convertToPdf = async () => {
    if (!pages.length || isConverting || uploadBusy) return
    if (!(await consumeUsage())) return
    setIsConverting(true)

    try {
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth() // 210mm
      const pageHeight = pdf.internal.pageSize.getHeight() // 297mm

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage()
        const page = pages[i]

        // Maintain aspect ratio inside A4 margins (10mm margin)
        const margin = 8
        const maxW = pageWidth - margin * 2
        const maxH = pageHeight - margin * 2

        const imgRatio = page.width / page.height
        const pageRatio = maxW / maxH

        let renderW = maxW
        let renderH = maxH

        if (imgRatio > pageRatio) {
          renderW = maxW
          renderH = maxW / imgRatio
        } else {
          renderH = maxH
          renderW = maxH * imgRatio
        }

        const posX = margin + (maxW - renderW) / 2
        const posY = margin + (maxH - renderH) / 2

        pdf.addImage(page.currentUrl, 'JPEG', posX, posY, renderW, renderH, undefined, 'FAST')
      }

      const timestamp = new Date().toISOString().slice(0, 10)
      const fileName = `Scanned_Document_${timestamp}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error('PDF conversion error:', err)
      setCameraError('Failed to generate PDF. Please try again.')
    } finally {
      setIsConverting(false)
    }
  }

  const cancelOcr = () => {ocrVersion.current++;workerRef.current?.terminate().catch(()=>{});workerRef.current=null;setOcrBusy(false);setOcrProgress('')}
  const extractText = async () => {
    if(!pages.length || ocrBusy || !(await consumeUsage()))return
    const version=++ocrVersion.current;setOcrBusy(true);setOcrText('');setCameraError('');setOcrProgress('Loading text recognition…')
    let worker
    try {

      worker=await createOcrWorker(ocrLanguage,message=>{if(mounted.current && version===ocrVersion.current)setOcrProgress(message.status==='recognizing text'?'Recognizing text '+Math.round((message.progress || 0)*100)+'%':'Preparing text recognition…')})
      if(version!==ocrVersion.current || !mounted.current)return
      workerRef.current=worker
      const text=[]
      for(let index=0;index<pages.length;index++){
        setOcrProgress('Reading page '+(index+1)+' of '+pages.length)
        const result=await worker.recognize(pages[index].currentUrl)
        if(version!==ocrVersion.current || !mounted.current)return
        text.push(result.data.text.trim())
      }
      setOcrText(text.join('\n\n'));if(!text.some(value=>value.trim()))setCameraError('No readable text found. Try a sharper photo or change the page filter to Original.')
    }catch(error){if(mounted.current && version===ocrVersion.current)setCameraError('Text recognition failed. Check your connection for the first language download and try again.')}
    finally{await worker?.terminate().catch(()=>{});if(workerRef.current===worker)workerRef.current=null;if(mounted.current && version===ocrVersion.current){setOcrBusy(false);setOcrProgress('')}}
  }
  const downloadText = () => {
    const url=URL.createObjectURL(new Blob([ocrText],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='Scanned_Document.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
  }

  const dialogOpen=isCameraActive || !!editingPage || previewPageIdx!==null
  useEffect(() => {
    if(!dialogOpen)return
    const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden'
    const selector='.camera-box,.camscan-edit-modal-box,.preview-modal-box'
    const timer=setTimeout(()=>document.querySelector(selector)?.querySelector('button')?.focus(),0)
    const onKey=event=>{
      if(event.key==='Escape'){if(isCameraActive)stopCamera();if(!editBusy)setEditingPage(null);setPreviewPageIdx(null)}
      if(event.key==='Tab'){
        const controls=[...(document.querySelector(selector)?.querySelectorAll('button:not(:disabled),input,select,textarea') || [])].filter(node=>node.getClientRects().length)
        const first=controls[0],last=controls.at(-1)
        if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus()}
      }
    }
    document.addEventListener('keydown',onKey);return()=>{clearTimeout(timer);document.body.style.overflow=overflow;document.removeEventListener('keydown',onKey);previous?.focus()}
  }, [dialogOpen,isCameraActive,editBusy])

  return (
    <div className="camscan-container">
      {/* Main Workspace — no history sidebar */}
      <main className={`camscan-main-area${pages.length === 0 ? ' camscan-main-empty' : ''}`}>
        {/* Background Ambience */}
        <div className="camscan-glow" />

        {/* Header */}
        <header className="camscan-header">
          <h1 className="camscan-title">Smart Cam Scanner</h1><p className="scanner-subtitle">Scan document photos, trim the edges, enhance text, and download a multi-page PDF.</p>
        </header>

        {/* Camera Capture Section (If Camera is open) */}
        {isCameraActive && (
          <div className="camera-modal-backdrop">
            <div className="camera-box" role="dialog" aria-modal="true" aria-label="Document camera">
              <div className="camera-top-bar">
                <span className="camera-label">🔴 Document Camera Live</span>
                <button className="btn-camera-close" onClick={stopCamera}>
                  ✕ Close Camera
                </button>
              </div>

              <div className="video-viewport">
                <video ref={videoRef} playsInline autoPlay muted className="camera-video" onLoadedData={() => setCameraReady(true)} onCanPlay={() => setCameraReady(true)} onClick={event => event.currentTarget.play().catch(() => {})} />
                {/* Document Scanning Grid Outline */}
                <div className="scanner-target-frame">
                  <div className="corner-tl" />
                  <div className="corner-tr" />
                  <div className="corner-bl" />
                  <div className="corner-br" />
                  <div className="scan-laser-line" />
                </div>
              </div>

              <div className="camera-controls">
                {cameraError && <p className="camera-error-banner" role="alert">{cameraError}</p>}
                {!cameraReady && <LoadingSpinner label="Waiting for camera video" />}
                <div className="camera-filter-pills">
                  <button
                    className={`filter-btn ${activeFilter === 'auto' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('auto')}
                  >
                    ⚡ Magic Color
                  </button>
                  <button
                    className={`filter-btn ${activeFilter === 'bw' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('bw')}
                  >
                    📄 B&W Doc
                  </button>
                  <button
                    className={`filter-btn ${activeFilter === 'gray' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('gray')}
                  >
                    🌫 Grayscale
                  </button>
                  <button
                    className={`filter-btn ${activeFilter === 'original' ? 'active' : ''}`}
                    onClick={() => setActiveFilter('original')}
                  >
                    Original
                  </button>
                </div>

                <button className="btn-shutter" disabled={!cameraReady || uploadBusy} onClick={capturePhoto} title="Capture Document Page">
                  <div className="shutter-inner" />
                </button>
                <span className="shutter-caption">Tap to capture page ({pages.length} saved)</span>
              </div>
            </div>
          </div>
        )}

        {/* Top Action Card */}
        <div className="camscan-action-card">
          {cameraError && <div className="camera-error-banner" role="alert">{cameraError}</div>}

          <div className="action-buttons-row">
            <button className="btn-open-camera" disabled={cameraStarting || uploadBusy || isConverting} onClick={startCamera}>
              <svg className="btn-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              {cameraStarting ? <LoadingSpinner label="Starting camera" /> : <span>Open Camera to Scan</span>}
            </button>

            <button className="btn-upload-photos" disabled={uploadBusy || isConverting} onClick={() => fileInputRef.current?.click()}>
              <svg className="btn-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {uploadBusy ? <LoadingSpinner label="Scanning document pictures" /> : <span>Upload Document Pictures</span>}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              disabled={uploadBusy || isConverting}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Document Gallery / Pages Section */}
        {pages.length > 0 ? (
          <div className="camscan-pages-section">
            <div className="pages-header-row">
              <div className="pages-count-badge">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span>Total Scanned Pages:</span>
                <strong>{pages.length}</strong>
              </div>

              <div className="pages-actions-group">
                <button className="btn-clear-all" onClick={() => setPages([])}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Clear All</span>
                </button>
                <button
                  className="btn-convert-pdf"
                  onClick={convertToPdf}
                  disabled={isConverting || uploadBusy}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <polyline points="9 15 12 18 15 15" />
                  </svg>
                  {isConverting ? <LoadingSpinner label="Creating PDF" /> : <span>Download PDF</span>}
                </button>
              </div>
            </div>

            {/* Grid of Scanned Pages */}
            <div className="scanned-grid">
              {pages.map((page, index) => (
                <div key={page.id} className="page-card">
                  <div className="page-card-header">
                    <span className="page-number-pill">{t("Page")}{index + 1}</span>
                    <div className="page-order-btns">
                      <button
                        className="btn-order"
                        disabled={index === 0}
                        onClick={() => movePage(index, -1)}
                        title="Move page left"
                      >
                        ‹
                      </button>
                      <button
                        className="btn-order"
                        disabled={index === pages.length - 1}
                        onClick={() => movePage(index, 1)}
                        title="Move page right"
                      >
                        ›
                      </button>
                    </div>
                    <button className="btn-delete-page" onClick={() => deletePage(page.id)} title="Delete page">
                      ✕
                    </button>
                  </div>

                  {/* Page Thumbnail */}
                  <div className="page-thumb-container" role="button" tabIndex={0} aria-label={`Preview scanned page ${index + 1}`} onKeyDown={event => {if(event.key === 'Enter' || event.key === ' '){event.preventDefault();setPreviewPageIdx(index)}}} onClick={() => setPreviewPageIdx(index)}>
                    <img src={page.currentUrl} alt={`Scanned Page ${index + 1}`} className="page-thumbnail-img" />
                    <span className="thumb-zoom-icon">🔍 View Full</span>
                  </div>

                  {/* On the card: ONLY the Edit option */}
                  <div className="page-card-controls">
                    <button
                      type="button"
                      className="btn-open-editor"
                      onClick={() => openEditModal(page)}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      <span>Edit Document</span>
                    </button>
                    <a className="page-image-download" href={page.currentUrl} download={`Scanned_Page_${index + 1}.jpg`}>Download JPG</a>
                  </div>
                </div>
              ))}
            </div>

            <section className="scanner-ocr-panel">
              <div className="scanner-ocr-heading"><div><h2>Read text from your scans</h2><p>Extract editable text from all pages. Review recognition results before using them.</p></div><select aria-label="Text recognition language" value={ocrLanguage} disabled={ocrBusy} onChange={event => setOcrLanguage(event.target.value)}><option value="eng">English</option><option value="eng+urd">English + Urdu</option></select></div>
              <div className="scanner-ocr-actions"><button className="btn-upload-photos" disabled={ocrBusy || uploadBusy} onClick={extractText}>{ocrBusy ? <LoadingSpinner label={ocrProgress} /> : 'Extract text (OCR)'}</button>{ocrBusy && <><span role="status">{ocrProgress}</span><button className="btn-clear-all" onClick={cancelOcr}>Cancel</button></>}{ocrText && <button className="btn-upload-photos" onClick={downloadText}>Download text</button>}</div>
              {ocrText && <textarea className="scanner-ocr-text" aria-label="Recognized document text" dir="auto" value={ocrText} onChange={event => setOcrText(event.target.value)} rows={8} />}
            </section>
            {/* Bottom PDF Conversion Bar */}
            <div className="bottom-conversion-bar">
              <div className="bar-info">
                <span>Ready to generate PDF document with <strong>{pages.length}</strong> scanned pages.</span>
              </div>
              <button className="btn-convert-pdf big" onClick={convertToPdf} disabled={isConverting || uploadBusy}>
                <svg className="btn-svg-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="12" y1="18" x2="12" y2="12" />
                  <polyline points="9 15 12 18 15 15" />
                </svg>
                {isConverting ? <LoadingSpinner label="Creating PDF" /> : <span>Export & Download PDF</span>}
              </button>
            </div>
          </div>
        ) : (
          <div className="empty-scan-state" onKeyDown={event => {if(event.key === 'Enter' || event.key === ' '){event.preventDefault();fileInputRef.current?.click()}}} onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}>
            <div className="empty-icon-wrap">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <h3 className="empty-title">No Scanned Documents</h3>
            <p className="empty-desc">Capture with camera or tap to upload pictures</p>
          </div>
        )}
      </main>

      {/* Full Page Zoom Modal */}
      {previewPageIdx !== null && pages[previewPageIdx] && (
        <div className="preview-modal-backdrop" onClick={() => setPreviewPageIdx(null)}>
          <div className="preview-modal-box" role="dialog" aria-modal="true" aria-label="Scanned page preview" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <span>{t("Page")}{previewPageIdx + 1} Preview</span>
              <button className="btn-modal-close" onClick={() => setPreviewPageIdx(null)}>
                ✕
              </button>
            </div>
            <div className="preview-modal-img-wrap">
              <img
                src={pages[previewPageIdx].currentUrl}
                alt="Page Full View"
                className="preview-modal-img"
              />
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Edit Studio Modal (Only opens after clicking Edit) */}
      {editingPage && (
        <div className="camscan-edit-modal-backdrop" onClick={() => {if(!editBusy)setEditingPage(null)}}>
          <div className="camscan-edit-modal-box" role="dialog" aria-modal="true" aria-label="Edit scanned page" onClick={(e) => e.stopPropagation()}>
            <div className="camscan-edit-header">
              <div className="edit-header-title">
                <span>✏️</span>
                <span>Edit Document Page</span>
              </div>
              <button
                type="button"
                className="btn-edit-close"
                disabled={editBusy}
                onClick={() => setEditingPage(null)}
              >
                ✕
              </button>
            </div>

            {/* Edit Sub-tabs: Crop is first and primary! */}
            <div className="edit-tool-tabs">
              <button
                type="button"
                className={`edit-tool-tab ${editingTab === 'crop' ? 'active' : ''}`}
                onClick={() => setEditingTab('crop')}
              >
                <span>✂️ Crop &amp; Trim</span>
              </button>
              <button
                type="button"
                className={`edit-tool-tab ${editingTab === 'filter' ? 'active' : ''}`}
                onClick={() => setEditingTab('filter')}
              >
                <span>🎨 Magic Filters</span>
              </button>
              <button
                type="button"
                className={`edit-tool-tab ${editingTab === 'rotate' ? 'active' : ''}`}
                onClick={() => setEditingTab('rotate')}
              >
                <span>🔄 Rotate</span>
              </button>
            </div>

            <div className="edit-preview-viewport"><img src={editPreview?.currentUrl || editingPage.currentUrl} alt="Live cropped and filtered document preview" className="scanner-live-preview" /></div>
            {cameraError && <p role="alert" className="camera-error-banner">{cameraError}</p>}
            {/* Tool Controls Panel */}
            <div className="edit-controls-panel">
              {editingTab === 'crop' && (
                <div className="crop-controls-wrapper">
                  <div className="crop-preset-pills">
                    <button
                      type="button"
                      className="btn-crop-preset"
                      onClick={autoDetectCrop}
                    >
                      Detect paper edges
                    </button>
                    <button
                      type="button"
                      className="btn-crop-preset"
                      onClick={() => setEditingCrop(a4Crop(editingPage.sourceWidth, editingPage.sourceHeight))}
                    >
                      📄 A4 Ratio Trim
                    </button>
                    <button
                      type="button"
                      className="btn-crop-preset reset"
                      onClick={() => setEditingCrop({ top: 0, bottom: 0, left: 0, right: 0 })}
                    >
                      🔄 Reset Full Image
                    </button>
                  </div>

                  {/* 4 Margin Sliders */}
                  <div className="crop-sliders-grid">
                    <div className="crop-slider-item">
                      <div className="slider-label">
                        <span>Top Margin</span>
                        <span>{Math.round(editingCrop.top)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        aria-label="top crop margin" value={editingCrop.top}
                        onChange={(e) =>
                          setEditingCrop((c) => ({ ...c, top: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="crop-slider-item">
                      <div className="slider-label">
                        <span>Bottom Margin</span>
                        <span>{Math.round(editingCrop.bottom)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        aria-label="bottom crop margin" value={editingCrop.bottom}
                        onChange={(e) =>
                          setEditingCrop((c) => ({ ...c, bottom: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="crop-slider-item">
                      <div className="slider-label">
                        <span>Left Margin</span>
                        <span>{Math.round(editingCrop.left)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        aria-label="left crop margin" value={editingCrop.left}
                        onChange={(e) =>
                          setEditingCrop((c) => ({ ...c, left: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="crop-slider-item">
                      <div className="slider-label">
                        <span>Right Margin</span>
                        <span>{Math.round(editingCrop.right)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="45"
                        aria-label="right crop margin" value={editingCrop.right}
                        onChange={(e) =>
                          setEditingCrop((c) => ({ ...c, right: Number(e.target.value) }))
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {editingTab === 'filter' && (
                <div className="filter-controls-wrapper">
                  <span className="control-section-title">Select Color Enhancement:</span>
                  <div className="edit-filter-grid">
                    <button
                      type="button"
                      className={`btn-edit-filter ${editingFilter === 'auto' ? 'active' : ''}`}
                      onClick={() => setEditingFilter('auto')}
                    >
                      <span>⚡ Magic Color</span>
                      <small>CamScanner high-contrast</small>
                    </button>
                    <button
                      type="button"
                      className={`btn-edit-filter ${editingFilter === 'bw' ? 'active' : ''}`}
                      onClick={() => setEditingFilter('bw')}
                    >
                      <span>📄 Black &amp; White</span>
                      <small>Sharp document threshold</small>
                    </button>
                    <button
                      type="button"
                      className={`btn-edit-filter ${editingFilter === 'gray' ? 'active' : ''}`}
                      onClick={() => setEditingFilter('gray')}
                    >
                      <span>🌫 Grayscale</span>
                      <small>Clean gray gradient</small>
                    </button>
                    <button
                      type="button"
                      className={`btn-edit-filter ${editingFilter === 'original' ? 'active' : ''}`}
                      onClick={() => setEditingFilter('original')}
                    >
                      <span>Original</span>
                      <small>No color alteration</small>
                    </button>
                  </div>
                </div>
              )}

              {editingTab === 'rotate' && (
                <div className="rotate-controls-wrapper">
                  <span className="control-section-title">Rotate Document:</span>
                  <div className="rotate-btns-row">
                    <button
                      type="button"
                      className="btn-edit-rotate"
                      onClick={() => setEditingRotation((r) => (r + 90) % 360)}
                    >
                      <span>🔄 Rotate 90° Clockwise</span>
                      <small>Current: {editingRotation}°</small>
                    </button>
                    <button
                      type="button"
                      className="btn-edit-rotate"
                      onClick={() => setEditingRotation((r) => (r + 180) % 360)}
                    >
                      <span>🔄 Flip 180°</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="edit-modal-footer">
              <button
                type="button"
                className="btn-edit-cancel"
                disabled={editBusy}
                onClick={() => setEditingPage(null)}
              >{t("Cancel")}</button>
              <button
                type="button"
                className="btn-edit-save"
                disabled={editBusy} onClick={handleSaveEdit}
              >
                {editBusy ? <LoadingSpinner label="Applying scan edits" /> : 'Save & Apply Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
