import LoadingSpinner from './components/LoadingSpinner';
const AdminLayout = lazy(() => import('./pages/Admin/AdminLayout'))
const SubscriptionDetails = lazy(() => import('./pages/Account/SubscriptionDetails'))
const Feedback = lazy(() => import('./pages/Account/Feedback'))
const Settings = lazy(() => import('./pages/Account/Settings'))
import React, { lazy, Suspense, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { UsageProvider, useToolRestriction } from './context/UsageContext'

// Layout components
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'

// Pages
import Home from './pages/Home/Home'
const EditProfile = lazy(() => import('./pages/EditProfile/EditProfile'))
const AiChat = lazy(() => import('./pages/AiChat/AiChat'))
const AiFile = lazy(() => import('./pages/AiFile/AiFile'))
const AiVoice = lazy(() => import('./pages/AiVoice/AiVoice'))
const WordToPdf = lazy(() => import('./pages/Converter/WordToPdf'))
const PdfToWord = lazy(() => import('./pages/Converter/PdfToWord'))
const FileSizeConverter = lazy(() => import('./pages/Converter/FileSizeConverter'))
const AiPresentation = lazy(() => import('./pages/AiPresentation/AiPresentation'))
const CamScanner = lazy(() => import('./pages/CamScanner/CamScanner'))
const AiTranslator = lazy(() => import('./pages/AiTranslator/AiTranslator'))
const AiCareer = lazy(() => import('./pages/AiCareer/AiCareer'))
const CvMaker = lazy(() => import('./pages/CvMaker/CvMaker'))
const Subscription = lazy(() => import('./pages/Subscription/Subscription'))
const Login = lazy(() => import('./pages/Auth/Login/Login'))
const Register = lazy(() => import('./pages/Auth/Register/Register'))
const VerifyEmail = lazy(() => import('./pages/Auth/VerifyEmail/VerifyEmail'))
const ForgotPassword = lazy(() => import('./pages/Auth/ForgotPassword/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/Auth/ResetPassword/ResetPassword'))

import './App.css'
import './ui-polish.css'
import './light-refinements.css'

function PageLoading() {
  return <div className="page-loading" role="status" aria-live="polite"><LoadingSpinner label="Opening your workspace" /></div>
}

// Layout with Navbar + Sidebar (used for main app pages)
function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {restriction,retry,openGate}=useToolRestriction()

  return (
    <div className="app-layout">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Suspense fallback={<PageLoading />}>{restriction?.checking?<PageLoading />:restriction?.blocked?<main className="tool-access-locked"><div><h1>{restriction.code==='LOGIN_REQUIRED'?'Log in to keep creating':restriction.code==='SUBSCRIPTION_REQUIRED'?'Your next step: a subscription':'Access could not be verified'}</h1><p>{restriction.code==='LOGIN_REQUIRED'?"You've reached the guest usage limit. Please log in to access more.":restriction.code==='SUBSCRIPTION_REQUIRED'?"You've reached your usage limit. Subscribe to access more.":restriction.message || 'Please check your connection and try again.'}</p><button onClick={['LOGIN_REQUIRED','SUBSCRIPTION_REQUIRED'].includes(restriction.code)?openGate:retry}>{restriction.code==='LOGIN_REQUIRED'?'Log in to continue':restriction.code==='SUBSCRIPTION_REQUIRED'?'Subscribe to continue':'Try again'}</button></div></main>:children}</Suspense>
    </div>
  )
}

function AuthLayout({ children }) {
  return (
    <div className="auth-standalone">
      <div className="auth-backdrop-workspace" aria-hidden="true" inert>
        <Navbar />
        <Sidebar isOpen={false} />
        <Home />
      </div>
      <Suspense fallback={<PageLoading />}>{children}</Suspense>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <UsageProvider>
        <Suspense fallback={<PageLoading />}>
        <Routes>
          {/* Main app routes (with navbar + sidebar) */}
          <Route
            path="/"
            element={
              <AppLayout>
                <Home />
              </AppLayout>
            }
          />
          <Route
            path="/ai-chat"
            element={
              <AppLayout>
                <AiChat />
              </AppLayout>
            }
          />
          <Route
            path="/ai-file"
            element={
              <AppLayout>
                <AiFile />
              </AppLayout>
            }
          />
          <Route
            path="/ai-voice"
            element={
              <AppLayout>
                <AiVoice />
              </AppLayout>
            }
          />
          <Route
            path="/word-to-pdf"
            element={
              <AppLayout>
                <WordToPdf />
              </AppLayout>
            }
          />
          <Route
            path="/pdf-to-word"
            element={
              <AppLayout>
                <PdfToWord />
              </AppLayout>
            }
          />
          <Route
            path="/file-size-converter"
            element={
              <AppLayout>
                <FileSizeConverter />
              </AppLayout>
            }
          />
          <Route
            path="/file-converter"
            element={
              <AppLayout>
                <FileSizeConverter />
              </AppLayout>
            }
          />
          <Route
            path="/ai-presentation"
            element={
              <AppLayout>
                <AiPresentation />
              </AppLayout>
            }
          />
          <Route
            path="/cam-scanner"
            element={
              <AppLayout>
                <CamScanner />
              </AppLayout>
            }
          />
          <Route
            path="/ai-translator"
            element={
              <AppLayout>
                <AiTranslator />
              </AppLayout>
            }
          />
          <Route
            path="/ai-career"
            element={
              <AppLayout>
                <AiCareer />
              </AppLayout>
            }
          />
          <Route
            path="/cv-maker"
            element={
              <AppLayout>
                <CvMaker />
              </AppLayout>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <AppLayout>
                <EditProfile />
              </AppLayout>
            }
          />
          <Route
            path="/subscription"
            element={
              <AppLayout>
                <Subscription />
              </AppLayout>
            }
          />

          <Route path="/subscription-details" element={<AppLayout><SubscriptionDetails /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="/admin/login" element={<Navigate to="/login" replace state={{from:'/admin'}} />} />
          <Route path="/admin" element={<AdminLayout />} />
          <Route path="/feedback" element={<AppLayout><Feedback /></AppLayout>} />
          {/* Fallback redirects for legacy analytics & reports */}
          <Route path="/analytics" element={<Navigate to="/ai-chat" replace />} />
          <Route path="/reports" element={<Navigate to="/ai-file" replace />} />

          {/* Auth routes (with navbar) */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <Login />
              </AuthLayout>
            }
          />
          <Route
            path="/register"
            element={
              <AuthLayout>
                <Register />
              </AuthLayout>
            }
          />
          <Route
            path="/verify-email"
            element={
              <AuthLayout>
                <VerifyEmail />
              </AuthLayout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <AuthLayout>
                <ForgotPassword />
              </AuthLayout>
            }
          />
          <Route
            path="/reset-password"
            element={
              <AuthLayout>
                <ResetPassword />
              </AuthLayout>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </UsageProvider>
      </BrowserRouter>
    </AuthProvider>
  )
}
