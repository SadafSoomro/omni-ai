import './LoadingSpinner.css';

export default function LoadingSpinner({label = 'Loading', className = ''}) {
  return <span className={`loading-indicator ${className}`} role="status" aria-label={label}>
    <span className="loading-indicator-ring" aria-hidden="true" />
  </span>;
}
