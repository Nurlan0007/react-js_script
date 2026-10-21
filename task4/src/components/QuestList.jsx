import { ArrowDownUp, ArrowRight, Compass, Gem, HandHeart, Puzzle, Search, Swords, X } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from './Feedback.jsx';

export const categoryIcons = { Exploration: Compass, Combat: Swords, Support: HandHeart, Puzzle };

export function StatusBadge({ status }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}><span/>{status}</span>;
}

export default function QuestList({ list, search, filter, sort, selectedId, selectionDisabled, onSearch, onFilter, onSort, onSelect, onReload, onCreate }) {
  return <section className="panel list-panel" aria-label="Quest board">
    <div className="panel-heading"><div><span className="eyebrow">THE ADVENTURE LOG</span><h2>Your quests <span className="count-badge">{list.status === 'success' ? list.total : '—'}</span></h2></div><label className="sort-control"><ArrowDownUp size={14}/><span className="sr-only">Sort quests</span><select value={sort} onChange={(event) => onSort(event.target.value)}><option value="recent">Recently updated</option><option value="name">Name: A–Z</option><option value="reward">Highest reward</option></select></label></div>
    <div className="search-box"><Search size={17}/><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Find your next quest…" aria-label="Search quests"/>{search && <button onClick={() => onSearch('')} aria-label="Clear search"><X size={15}/></button>}</div>
    <div className="filter-tabs" role="group" aria-label="Filter quests by status">{['All', 'Active', 'Planned', 'Completed'].map((status) => <button key={status} className={filter === status ? 'active' : ''} aria-pressed={filter === status} onClick={() => onFilter(status)}>{status}</button>)}</div>
    {list.status === 'loading' ? <LoadingState/> : list.status === 'error' ? <ErrorState title="Couldn’t load the board" message={list.error} onRetry={onReload}/> : list.data.length === 0 ? <EmptyState filtered={Boolean(search || filter !== 'All')} onClear={() => { onSearch(''); onFilter('All'); }} onCreate={onCreate}/> : <div className="quest-list">{list.data.map((quest) => {
      const Icon = categoryIcons[quest.category];
      return <button key={quest.id} className={`quest-card ${selectedId === quest.id ? 'selected' : ''}`} onClick={() => onSelect(quest.id)} disabled={selectionDisabled} aria-pressed={selectedId === quest.id} aria-label={`Select ${quest.name}`}>
        <span className={`category-icon category-${quest.category.toLowerCase()}`}><Icon size={21}/></span><span className="quest-card-body"><span className="quest-card-title">{quest.name}</span><span className="quest-card-meta">{quest.category}<span>·</span>{quest.difficulty}</span><span className="quest-card-bottom"><StatusBadge status={quest.status}/><span className="reward-small"><Gem size={12}/>{quest.reward.toLocaleString()} XP</span></span></span><ArrowRight size={17} className="card-arrow"/>
      </button>;
    })}</div>}
    <div className="list-footnote"><span className="tiny-dot"/>Your progress is saved in this browser.</div>
  </section>;
}
