import { toolFetch } from '../../services/toolAccess'
import {t} from '../../utils/text'
import React, { useEffect, useRef, useState } from 'react'
import { useUsage } from '../../context/UsageContext'
import './AiVoice.css'

const LANGUAGES = [['en-US', 'English (US)'], ['en-GB', 'English (UK)'], ['ur-PK', 'Urdu'], ['ar-SA', 'Arabic'], ['fr-FR', 'French'], ['de-DE', 'German'], ['es-ES', 'Spanish'], ['zh-CN', 'Chinese']]
const ACCEPT = '.mp3,.wav,.m4a,.ogg,.webm,.flac,.aac,.txt,.srt,.vtt,.md,.csv'
const AUDIO = /\.(mp3|wav|m4a|ogg|webm|flac|aac)$/i
import {API_BASE_URL as API} from '../../services/config'

export function subtitleToText(raw) {
  return raw.replace(/\r/g, '').split('\n').filter(line => {
    const text = line.trim()
    return text && !/^WEBVTT|^NOTE(?:\s|$)|^STYLE$|^REGION$/i.test(text) && !/^\d+$/.test(text) && !text.includes('-->')
  }).map(line => line.replace(/<[^>]*>/g, '').trim()).join(' ').trim()
}

export default function AiVoice() {
  const consumeUsage = useUsage()
  const [mode, setMode] = useState('mic')
  const [lang, setLang] = useState('en-US')
  const [transcript, setTranscript] = useState('')
  const [interim, setInterim] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [file, setFile] = useState(null)
  const [audioUrl, setAudioUrl] = useState('')
  const [seconds, setSeconds] = useState(0)
  const [toast, setToast] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const recognitionRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const toastRef = useRef(null)
  const busy = ['starting', 'listening', 'reading'].includes(status)
  const supported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)

  useEffect(() => () => { recognitionRef.current?.abort(); abortRef.current?.abort(); clearTimeout(toastRef.current) }, [])
  useEffect(() => {
    if (!audioUrl) return
    return () => URL.revokeObjectURL(audioUrl)
  }, [audioUrl])
  useEffect(() => {
    if (status !== 'listening') return
    const timer = setInterval(() => setSeconds(value => value + 1), 1000)
    return () => clearInterval(timer)
  }, [status])
  const notify = (message) => { clearTimeout(toastRef.current); setToast(message); toastRef.current = setTimeout(() => setToast(''), 2500) }

  const startMic = async () => {
    if (status === 'listening') { recognitionRef.current?.stop(); return }
    if (!supported || busy || !(await consumeUsage())) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang
    setError(''); setTranscript(''); setInterim(''); setSeconds(0); setStatus('starting')
    recognition.onstart = () => setStatus('listening')
    recognition.onresult = event => {
      let final = '', draft = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript + ' '
        else draft += event.results[i][0].transcript
      }
      if (final) setTranscript(previous => previous + final)
      setInterim(draft)
    }
    recognition.onerror = event => {
      const messages = { 'not-allowed': 'Microphone access was denied. Allow it in your browser settings.', 'audio-capture': 'No microphone found. Connect a microphone and try again.', network: 'Speech recognition could not connect. Check your internet connection.', 'no-speech': 'No speech detected. Please try again.' }
      setError(messages[event.error] || 'Recording stopped. Please try again.')
      setStatus('idle')
    }
    recognition.onend = () => { setInterim(''); setStatus('done') }
    try { recognition.start() } catch { setError('Unable to start the microphone. Please try again.'); setStatus('idle') }
  }

  const importFile = async selected => {
    if (!selected || busy) return
    const audio = AUDIO.test(selected.name)
    if (!audio && !/\.(txt|srt|vtt|md|csv)$/i.test(selected.name)) { setError('Choose a supported audio, text or subtitle file.'); return }
    if (!selected.size || selected.size > (audio ? 4 : 10) * 1024 * 1024) { setError(audio ? 'Choose a non-empty audio file of 4 MB or smaller.' : 'Choose a non-empty file of 10 MB or smaller.'); return }
    if (!(await consumeUsage({server:audio}))) return
    setFile(selected); setError(''); setTranscript(''); setInterim(''); setStatus('reading')
    setAudioUrl(audio ? URL.createObjectURL(selected) : '')
    const controller = new AbortController()
    abortRef.current = controller
    try {
      if (audio) {
        const data = new FormData()
        data.append('audio', selected)
        const response = await toolFetch(`${API}/voice/transcribe`, { method: 'POST', body: data, signal: controller.signal })
        const result = await response.json().catch(() => ({}))
        if (!response.ok || !result.success) throw new Error(result.message || 'Audio transcription failed. Please try again.')
        setTranscript(result.transcript || '')
      } else {
        const text = await selected.text()
        if (controller.signal.aborted) return
        setTranscript(/\.(srt|vtt)$/i.test(selected.name) ? subtitleToText(text) : text.trim())
      }
      setStatus('done')
    } catch (err) { if (err.name !== 'AbortError') { setError(err.message || 'Unable to read this file.'); setStatus('error') } }
  }
  const clear = () => {
    recognitionRef.current?.abort(); abortRef.current?.abort()
    setTranscript(''); setInterim(''); setFile(null); setAudioUrl(''); setError(''); setSeconds(0); setStatus('idle')
    if (inputRef.current) inputRef.current.value = ''
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(transcript.trim()); notify('Copied to clipboard') }
    catch { setError('Copy failed. Select the text and copy it manually.') }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([transcript], { type: 'text/plain;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = 'omni-transcript.txt'; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0
  return <main className="aivoice-root">
    {toast && <div className="voice-toast-pill" role="status">{toast}</div>}
    <div className="voice-topbar">
      <div className="voice-topbar-header-row"><div className="voice-title-wrap"><span className="voice-topbar-icon" aria-hidden="true">&#9835;</span><span className="voice-topbar-title">Voice to Text</span></div><div className="voice-lang-wrap"><select aria-label="Speech language" className="voice-lang-select" value={lang} disabled={busy} onChange={event => setLang(event.target.value)}>{LANGUAGES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}</select></div></div>
      <div className="voice-mode-tabs">{[['mic', 'Microphone'], ['file', 'Import File']].map(([id, label]) => <button key={id} disabled={busy} aria-pressed={mode === id} className={`mode-tab ${mode === id ? 'active' : ''}`} onClick={() => { setMode(id); setError('') }}>{label}</button>)}</div>
    </div>
    <div className="voice-body"><div className="voice-main">
      {mode === 'mic' ? <><div className="mic-area"><div className={`mic-rings ${status === 'listening' ? 'active' : ''}`}><div className="mic-ring ring-1"/><div className="mic-ring ring-2"/><div className="mic-ring ring-3"/></div><button className={`mic-btn ${status === 'listening' ? 'recording' : ''}`} disabled={!supported || status === 'starting'} aria-label={status === 'listening' ? 'Stop recording' : 'Start recording'} onClick={startMic}>{status === 'listening' ? <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3M8 22h8"/></svg>}</button></div><div className={`voice-status-label status-${status}`} role="status">{status === 'listening' ? `Listening / ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} / Tap to stop` : status === 'starting' ? 'Starting microphone...' : status === 'done' ? 'Recording finished' : 'Tap the microphone and start speaking'}</div>{!supported && <p className="voice-unsupported">Live transcription requires a browser with speech recognition, such as Chrome or Edge.</p>}</> : <><input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={event => importFile(event.target.files?.[0])}/><button type="button" disabled={busy} className={`file-dropzone ${dragOver ? 'drag-over' : ''}`} onClick={() => inputRef.current?.click()} onDragOver={event => { event.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={event => { event.preventDefault(); setDragOver(false); importFile(event.dataTransfer.files?.[0]) }}><span className="dropzone-icon" aria-hidden="true">&#8593;</span><span className="dropzone-title">{file ? file.name : 'Drop a file or click to browse'}</span><span className="dropzone-sub">Audio up to 4 MB / Text and subtitles up to 10 MB</span><span className="dropzone-formats">MP3, WAV, M4A, OGG, WEBM, FLAC, AAC, TXT, SRT, VTT, MD, CSV</span></button>{audioUrl && <div className="audio-player-card"><audio controls src={audioUrl} className="audio-player-el"/><p className="audio-note">{status === 'reading' ? 'Transcribing your audio...' : 'Audio preview'}</p></div>}</>}
      {error && <div className="voice-unsupported" role="alert">{error}</div>}
      {status === 'reading' && <div className="file-reading-indicator" role="status"><div className="file-spinner"/><span>{audioUrl ? 'Transcribing audio...' : 'Reading file...'}</span></div>}
      <div className={`transcript-box ${transcript || interim ? 'has-text' : ''}`}><textarea className="transcript-textarea" aria-label="Transcript" placeholder="Your transcript will appear here. You can edit it after recording." value={transcript} readOnly={busy} onChange={event => setTranscript(event.target.value)} rows={6} dir="auto"/>{interim && <p className="interim-text" dir="auto">{interim}</p>}</div>
      <div className="voice-result-meta"><span>{words} words</span><span>{transcript.length} characters</span><span>{file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Live microphone'}</span></div>
      <div className="transcript-actions"><button className="action-btn copy-btn" disabled={!transcript.trim() || busy} onClick={copy}>Copy text</button><button className="action-btn save-edit-btn" disabled={!transcript.trim() || busy} onClick={download}>Download TXT</button><button className="action-btn clear-btn" disabled={busy || (!transcript && !file && !error)} onClick={clear}>{t("Clear")}</button></div>
    </div></div>
  </main>
}
