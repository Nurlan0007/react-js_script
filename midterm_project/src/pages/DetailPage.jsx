import { ArrowLeft, Clock3, MapPin, Plug, Star, Users, Volume1, Wifi, Check, Minus } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useSpaces } from '../context/SpacesContext.jsx';
import { formatPrice } from '../data/options.js';
import VenueIllustration from '../components/VenueIllustration.jsx';
import { SaveButton } from '../components/SpaceCard.jsx';
import { ErrorState, LoadingState } from '../components/Feedback.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default function DetailPage() {
  const { id } = useParams();
  const { spaces, savedIds, savingIds, status, error, retry, toggleSaved } = useSpaces();
  const space = spaces.find((item) => item.id === id);
  if (status === 'loading') return <LoadingState/>;
  if (status === 'error') return <ErrorState message={error} onRetry={retry}/>;
  if (!space) return <NotFoundPage item/>;
  return <><Link to="/" className="back-link"><ArrowLeft size={16}/>Back to explore</Link><div className="detail-heading"><div><span className="eyebrow">{space.type} · {space.city}</span><h1>{space.name.split(' · ')[0]}</h1><p><MapPin size={16}/>{space.address}, {space.city}</p></div><SaveButton space={space} saved={savedIds.includes(id)} saving={savingIds.includes(id)} onToggle={toggleSaved} expanded/></div>
    <div className="detail-hero"><VenueIllustration type={space.type}/><div className="detail-sticker"><Star size={17} fill="currentColor"/>{space.rating ? `${space.rating.toFixed(1)} · ${space.reviewCount} sample reviews` : 'New to your collection'}</div></div>
    <div className="detail-layout"><div><section className="detail-section"><span className="eyebrow">SETTLE IN</span><h2>A little about this space</h2><p className="description">{space.description}</p></section><section className="detail-section"><h2>The things that matter</h2><div className="facility-grid">{[[Wifi, 'Wi-Fi', space.wifi], [Plug, 'Power outlets', space.outlets], [Volume1, `${space.noise} atmosphere`, true], [Users, `${space.seats} seats`, true]].map(([Icon, label, available]) => <div className={`facility ${!available ? 'unavailable' : ''}`} key={label}><Icon size={22}/><span>{label}<small>{available ? 'Available' : 'Not available'}</small></span>{available ? <Check size={15}/> : <Minus size={15}/>}</div>)}</div></section><div className="data-note">{space.source === 'sample' ? 'This is a fictional sample space for a student project. The address, hours, prices, and reviews are simulated, not verified business information.' : 'You added this space to your personal collection. Details are stored locally and have not been independently verified.'}</div></div><aside className="visit-card"><span className="eyebrow">PLAN YOUR STUDY SESSION</span><div className="visit-price">{formatPrice(space.price)}<span>{space.price ? 'per hour' : 'entry'}</span></div><div className="visit-detail"><Clock3 size={19}/><div><strong>{space.openingTime} – {space.closingTime}</strong><span>Daily opening hours</span></div></div><div className="visit-detail"><MapPin size={19}/><div><strong>{space.city}</strong><span>{space.address}</span></div></div><div className="visit-detail"><Users size={19}/><div><strong>{space.seats} seats</strong><span>Total capacity, not live availability</span></div></div><SaveButton space={space} saved={savedIds.includes(id)} saving={savingIds.includes(id)} onToggle={toggleSaved} expanded/><p>A little planning. A lot more focus.</p></aside></div>
  </>;
}
