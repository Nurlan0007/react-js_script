import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Clock3, Compass, Flag, Gem, MapPin, Pencil, RotateCcw, Shield, Trash2, UserRound } from 'lucide-react';
import { categoryIcons, StatusBadge } from './QuestList.jsx';

export default function QuestDetails({ quest, pending, onComplete, onEdit, onRemove }) {
  const [confirming, setConfirming] = useState(false);
  const Icon = categoryIcons[quest.category];
  const completed = quest.status === 'Completed';
  const ownPending = pending?.id === quest.id;
  const hours = Math.floor(quest.duration / 60);
  const minutes = quest.duration % 60;
  const duration = `${hours ? `${hours}h ` : ''}${minutes ? `${minutes}m` : ''}`.trim();
  const objectives = quest.objectives.split(';').map((objective) => objective.trim()).filter(Boolean);
  return <article className="quest-details" aria-label={`Details for ${quest.name}`}>
    <div className={`detail-banner category-${quest.category.toLowerCase()}`}><div className="banner-orbit orbit-one"/><div className="banner-orbit orbit-two"/><span className="detail-emblem"><Icon size={50} strokeWidth={1.35}/></span><span className="banner-caption"><Compass size={13}/> A LITTLE COURAGE GOES A LONG WAY</span><span className="quest-number">QUEST #{String(quest.id).padStart(3, '0')}</span></div>
    <div className="detail-body"><div className="detail-category"><span>{quest.category} quest</span><StatusBadge status={quest.status}/></div><h2>{quest.name}</h2><p className="detail-description">{quest.description}</p>
      <div className="detail-facts">{[[MapPin, 'Location', quest.location], [UserRound, 'Quest giver', quest.questGiver], [Shield, 'Difficulty', quest.difficulty], [Clock3, 'Estimated time', duration], [Gem, 'Reward', `${quest.reward.toLocaleString()} XP`], [Flag, 'Minimum level', `Level ${quest.minLevel}`]].map(([FactIcon, label, value]) => <div className="detail-fact" key={label}><FactIcon size={18}/><div><span>{label}</span><strong>{value}</strong></div></div>)}</div>
      <section className="objectives"><h3>Your objectives</h3><ol>{objectives.map((objective, index) => <li key={`${quest.id}-${index}`}><span>{completed ? <Check size={12}/> : index + 1}</span>{objective.replace(/\.$/, '')}</li>)}</ol></section>
      <div className="detail-actions"><button className={`button ${completed ? 'secondary' : 'primary'}`} onClick={() => onComplete(quest)} disabled={Boolean(pending)}>{ownPending && pending.kind === 'status' ? <><span className="spinner"/>Saving progress…</> : completed ? <><RotateCcw size={16}/>Reopen quest</> : <><CheckCircle2 size={17}/>Mark as completed</>}</button><button className="button secondary" onClick={() => onEdit(quest)} disabled={Boolean(pending)}><Pencil size={15}/>Edit</button><button className="button icon-button delete-button" aria-label={`Remove ${quest.name}`} onClick={() => setConfirming(true)} disabled={Boolean(pending)}><Trash2 size={17}/></button></div>
      {confirming && <div className="delete-confirmation" role="group" aria-label="Confirm quest removal"><strong>Remove this quest?</strong><p>“{quest.name}” will be removed from your saved board.</p><div><button className="button danger" onClick={() => onRemove(quest)} disabled={Boolean(pending)}>{ownPending && pending.kind === 'delete' ? 'Removing…' : 'Yes, remove quest'}</button><button className="button secondary" onClick={() => setConfirming(false)} disabled={Boolean(pending)}>Keep quest</button></div></div>}
      <p className="updated-at">Last updated <time dateTime={quest.updatedAt}>{new Date(quest.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</time><ArrowRight size={12}/><span>One step closer.</span></p>
    </div>
  </article>;
}
