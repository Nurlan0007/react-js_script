import { AlertCircle, ArrowRight, Bookmark, SearchX, X, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSpaces } from '../context/SpacesContext.jsx';

export function LoadingState() {
  return <div role="status" aria-label="Loading study spaces">
    <p className="loading-label"><span className="spinner" /> Finding a little space for you…</p>
    <div className="space-grid skeleton-grid" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index}><div /><span /><span /></div>)}
    </div>
  </div>;
}

export function ErrorState({ message, onRetry }) {
  return <div className="empty-state" role="alert">
    <span className="state-icon error-icon"><AlertCircle size={28} /></span>
    <h2>We couldn’t load your spaces</h2><p>{message}</p>
    <button className="button primary" onClick={onRetry}>Try again <ArrowRight size={16} /></button>
  </div>;
}

export function EmptyState({ saved = false, filtered = false, onReset }) {
  return <div className="empty-state">
    <span className="state-icon">{saved && !filtered ? <Bookmark size={28} /> : <SearchX size={28} />}</span>
    <h2>{saved && !filtered ? 'Your next favorite is out there' : 'No spaces found'}</h2>
    <p>{saved && !filtered ? 'Save a space that feels right. It will be waiting for you here.' : 'Try another search or loosen your filters to find more places to focus.'}</p>
    {saved && !filtered ? <Link to="/" className="button primary">Explore spaces <ArrowRight size={16}/></Link>
      : <button className="button primary" onClick={onReset}>Clear search & filters</button>}
  </div>;
}

export function Toast() {
  const { notice, dismissNotice } = useSpaces();
  return <div className="toast-region" aria-live="polite" aria-atomic="true">
    {notice && <div className={`toast ${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}>
      {notice.kind === 'error' ? <AlertCircle size={20}/> : <CheckCircle2 size={20}/>}<span>{notice.message}</span>
      <button className="icon-button" onClick={dismissNotice} aria-label="Dismiss notification"><X size={17}/></button>
    </div>}
  </div>;
}
