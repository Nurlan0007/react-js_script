import { AlertCircle, CheckCircle2, Info, SearchX, X } from 'lucide-react';

export function Notice({ notice, onDismiss }) {
  if (!notice) return null;
  const Icon = notice.kind === 'error' ? AlertCircle : notice.kind === 'info' ? Info : CheckCircle2;
  return <div className={`notice notice-${notice.kind}`} role={notice.kind === 'error' ? 'alert' : 'status'}><Icon size={19}/><span>{notice.message}</span><button onClick={onDismiss} aria-label="Dismiss notification"><X size={17}/></button></div>;
}

export function ErrorState({ message, onRetry, title = 'A small interruption' }) {
  return <div className="state-panel" role="alert"><span className="state-icon error"><AlertCircle size={26}/></span><h3>{title}</h3><p>{message}</p><button className="button secondary" onClick={onRetry}>Try again</button></div>;
}

export function EmptyState({ filtered, onClear, onCreate }) {
  return <div className="state-panel"><span className="state-icon"><SearchX size={27}/></span><h3>{filtered ? 'No quests match your search' : 'A new adventure starts here'}</h3><p>{filtered ? 'Try a different phrase or show all statuses.' : 'Your board is empty. Create a quest to get started.'}</p><button className="button secondary" onClick={filtered ? onClear : onCreate}>{filtered ? 'Clear search & filters' : 'Create your first quest'}</button></div>;
}

export function LoadingState({ detail = false }) {
  return <div className={detail ? 'detail-loading' : 'list-loading'} role="status" aria-label={detail ? 'Loading quest details' : 'Loading quests'}><p><span className="spinner"/>{detail ? 'Gathering the full story…' : 'Checking the quest board…'}</p><div aria-hidden="true">{Array.from({ length: detail ? 4 : 5 }, (_, index) => <div className="skeleton" key={index}/>)}</div></div>;
}
