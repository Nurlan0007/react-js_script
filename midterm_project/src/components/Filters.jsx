import { BookOpen, Building2, Coffee, GraduationCap, LayoutGrid, Search, SlidersHorizontal, X } from 'lucide-react';
import { CITIES, NOISE_LEVELS } from '../data/options.js';

const categories = [['', 'All spaces', LayoutGrid], ['Library', 'Libraries', BookOpen], ['Café', 'Cafés', Coffee], ['Coworking', 'Coworking', Building2], ['Campus', 'Campus', GraduationCap]];

export default function Filters({ filters, onChange, onReset, expanded, onToggleExpanded, hasFilters }) {
  return <section className="filters" aria-label="Find study spaces">
    <div className="search-row"><div className="search-input"><Search size={19}/><input aria-label="Search spaces" placeholder="Search for a space, neighborhood, or a little inspiration…" value={filters.q} onChange={(event) => onChange('q', event.target.value)}/>{filters.q && <button className="icon-button" aria-label="Clear search" onClick={() => onChange('q', '')}><X size={16}/></button>}</div>
      <select className="city-select" aria-label="Filter by city" value={filters.city} onChange={(event) => onChange('city', event.target.value)}><option value="">All cities</option>{CITIES.map((city) => <option key={city}>{city}</option>)}</select>
      <button className={`button filter-toggle ${expanded ? 'selected' : ''}`} aria-expanded={expanded} aria-controls="extra-filters" onClick={onToggleExpanded}><SlidersHorizontal size={17}/>Filters{(filters.noise || filters.free || filters.wifi || filters.outlets) && <span className="filter-dot"/>}</button>
    </div>
    {expanded && <div id="extra-filters" className="extra-filters"><label>Atmosphere<select value={filters.noise} onChange={(event) => onChange('noise', event.target.value)}><option value="">Any atmosphere</option>{NOISE_LEVELS.map((noise) => <option key={noise}>{noise}</option>)}</select></label><label className="checkbox-label"><input type="checkbox" checked={filters.free} onChange={(event) => onChange('free', event.target.checked)}/>Free entry</label><label className="checkbox-label"><input type="checkbox" checked={filters.wifi} onChange={(event) => onChange('wifi', event.target.checked)}/>Wi-Fi</label><label className="checkbox-label"><input type="checkbox" checked={filters.outlets} onChange={(event) => onChange('outlets', event.target.checked)}/>Power outlets</label></div>}
    <div className="category-row"><div className="category-tabs" role="group" aria-label="Space type">{categories.map(([value, label, Icon]) => <button key={value} aria-pressed={filters.type === value} className={filters.type === value ? 'active' : ''} onClick={() => onChange('type', value)}><Icon size={16}/>{label}</button>)}</div>{hasFilters && <button className="clear-filters" onClick={onReset}>Clear all <X size={13}/></button>}</div>
  </section>;
}
