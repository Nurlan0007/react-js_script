import { ArrowLeft, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFoundPage({ item = false }) {
  return <section className="empty-state"><span className="state-icon"><MapPin size={30}/></span><span className="eyebrow">A SMALL DETOUR</span><h1>{item ? 'This space isn’t here' : 'A page yet to be discovered'}</h1><p>{item ? 'The link may be incorrect, or this space was created in a different browser.' : 'This address doesn’t lead to a StudySpot page. Let’s get you back to your search.'}</p><Link to="/" className="button primary"><ArrowLeft size={16}/>Back to explore</Link></section>;
}
