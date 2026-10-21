import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownUp, ArrowUpRight, Bookmark, MapPin, Sparkles } from 'lucide-react';
import { useSpaces } from '../context/SpacesContext.jsx';
import { querySpaces } from '../api/spaceUtils.js';
import { PAGE_SIZE, SORT_OPTIONS } from '../data/options.js';
import Filters from '../components/Filters.jsx';
import Pagination from '../components/Pagination.jsx';
import SpaceCard from '../components/SpaceCard.jsx';
import VenueIllustration from '../components/VenueIllustration.jsx';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback.jsx';

export default function ExplorePage({ savedOnly = false }) {
  const { spaces, savedIds, status, error, retry, savingIds, toggleSaved } = useSpaces();
  const [params, setParams] = useSearchParams();
  const [expanded, setExpanded] = useState(false);
  const filters = {
    q: params.get('q') || '', city: params.get('city') || '', type: params.get('type') || '',
    noise: params.get('noise') || '', free: params.get('free') === 'true', wifi: params.get('wifi') === 'true',
    outlets: params.get('outlets') === 'true', sort: params.get('sort') || 'recommended', page: params.get('page') || 1, savedOnly,
  };
  const hasFilters = Boolean(filters.q || filters.city || filters.type || filters.noise || filters.free || filters.wifi || filters.outlets);
  const result = querySpaces(spaces, filters, savedIds);
  const cityCount = new Set(spaces.map((space) => space.city)).size;
  function changeFilter(key, value) {
    const next = new URLSearchParams(params);
    if (value === '' || value === false) next.delete(key); else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: key === 'q' });
  }
  return <>
    {savedOnly ? <section className="page-intro"><span className="eyebrow"><Bookmark size={15}/> YOUR PERSONAL SHORTLIST</span><h1>Good spaces, <em>kept close.</em></h1><p>All your favorite places, ready for your next study session.</p></section>
      : <section className="hero"><div className="hero-copy"><span className="eyebrow"><span className="tiny-spark">✳</span> GOOD SPACES. BETTER SESSIONS.</span><h1>Find your next<br/><em>focus spot.</em></h1><p>From quiet libraries to cozy cafés.<br/>Discover a space that brings out your best.</p><div className="hero-meta"><span><MapPin size={14}/>{status === 'success' ? cityCount : '6'} cities across Kazakhstan</span><span className="hero-meta-dot"/><span>One less distraction.</span></div></div><div className="hero-visual"><div className="hero-sticker"><Sparkles size={13}/> Your best ideas start here</div><VenueIllustration hero/><span className="art-caption">A fresh perspective is just a space away <ArrowUpRight size={14}/></span></div></section>}
    {!savedOnly && status === 'success' && <div className="collection-summary"><span><strong>{spaces.length}</strong> spaces to make your own</span><span className="summary-note"><span className="green-dot"/>A small change of scenery. A big difference.</span></div>}
    <Filters filters={filters} onChange={changeFilter} onReset={() => setParams({})} expanded={expanded} onToggleExpanded={() => setExpanded((previous) => !previous)} hasFilters={hasFilters}/>
    {status === 'loading' ? <LoadingState/> : status === 'error' ? <ErrorState message={error} onRetry={retry}/> : <>
      <div className="results-heading"><div><h2>{savedOnly ? 'Your saved spaces' : hasFilters ? 'Your discoveries' : 'A space for every kind of focus'}<span className="result-badge">{result.total}</span></h2><p aria-live="polite">{result.total ? `Showing ${(result.page - 1) * PAGE_SIZE + 1}–${Math.min(result.page * PAGE_SIZE, result.total)} of ${result.total} spaces` : 'No matching spaces'}{filters.city ? ` in ${filters.city}` : ' · Find what feels right'}</p></div><label className="sort-control"><ArrowDownUp size={14}/><span className="sr-only">Sort spaces</span><select value={filters.sort} onChange={(event) => changeFilter('sort', event.target.value)}>{SORT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
      {result.total === 0 ? <EmptyState saved={savedOnly} filtered={hasFilters} onReset={() => setParams({})}/> : <><div className="space-grid">{result.items.map((space) => <SpaceCard key={space.id} space={space} saved={savedIds.includes(space.id)} saving={savingIds.includes(space.id)} onToggle={toggleSaved}/>)}</div><Pagination page={result.page} totalPages={result.totalPages} onChange={(page) => changeFilter('page', page)}/></>}
    </>}
  </>;
}
