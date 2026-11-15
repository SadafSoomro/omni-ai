import {useLocation, useNavigate} from 'react-router-dom';

export function ConverterIcon({kind = 'document'}) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'compress' ? <><path d="M4 8V4h4m8 0h4v4M4 16v4h4m8 0h4v-4M8 8l3 3m5-3-3 3m-5 5 3-3m5 3-3-3" /></> : <><path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h5" />{kind === 'pdf' && <path d="M3 8h4" />}</>}
  </svg>;
}

export default function ConverterNavigation() {
  const {pathname} = useLocation();
  const navigate = useNavigate();
  return <nav className="converter-mode-switcher" aria-label="Document converters">
    {[['/word-to-pdf','Word to PDF','document'],['/pdf-to-word','PDF to Word','pdf'],['/file-size-converter','File Converter','compress']].map(([path,label,kind]) =>
      <button key={path} type="button" className={`mode-toggle-btn${pathname === path || (path === '/file-size-converter' && pathname === '/file-converter') ? ' active' : ''}`} aria-current={pathname === path ? 'page' : undefined} onClick={() => navigate(path)}><ConverterIcon kind={kind} /><span>{label}</span></button>
    )}
  </nav>;
}

