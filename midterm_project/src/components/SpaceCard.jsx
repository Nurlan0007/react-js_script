import { ArrowUpRight, Bookmark, MapPin, Plug, Star, Volume1, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../data/options.js';
import VenueIllustration from './VenueIllustration.jsx';

export function SaveButton({ space, saved, saving, onToggle, expanded = false }) {
  return <button className={`${expanded ? 'button secondary' : 'save-button'} ${saved ? 'is-saved' : ''}`}
    aria-label={`${saved ? 'Unsave' : 'Save'} ${space.name}`} aria-pressed={saved} disabled={saving} onClick={() => onToggle(space.id)}>
    {saving ? <span className="spinner"/> : <Bookmark size={18} fill={saved ? 'currentColor' : 'none'}/>}
    {expanded && (saving ? 'Saving…' : saved ? 'Space saved' : 'Save this space')}
  </button>;
}

export default function SpaceCard({ space, saved, saving, onToggle }) {
  return <article className="space-card">
    <div className="card-art"><Link to={`/spaces/${space.id}`} tabIndex={-1} aria-hidden="true"><VenueIllustration type={space.type}/></Link>
      <span className="type-badge">{space.type}</span><SaveButton space={space} saved={saved} saving={saving} onToggle={onToggle}/>
    </div>
    <div className="card-content">
      <div className="card-location"><MapPin size={13}/>{space.city}<span className="rating"><Star size={13} fill="currentColor"/>{space.rating ? space.rating.toFixed(1) : 'New'}{space.reviewCount > 0 && <small>({space.reviewCount})</small>}</span></div>
      <h3><Link to={`/spaces/${space.id}`}>{space.name.split(' · ')[0]}</Link></h3>
      <p className="card-address">{space.address}</p>
      <div className="amenity-row"><span><Volume1 size={13}/>{space.noise}</span>{space.wifi && <span><Wifi size={13}/>Wi-Fi</span>}{space.outlets && <span><Plug size={13}/>Outlets</span>}</div>
      <div className="card-footer"><span className="price">{formatPrice(space.price)}<small>{space.price > 0 ? ' / hour' : ' entry'}</small></span><Link to={`/spaces/${space.id}`} aria-label={`View ${space.name}`}>View space <ArrowUpRight size={15}/></Link></div>
    </div>
  </article>;
}
