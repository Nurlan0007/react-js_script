import { ArrowLeft, Heart, MapPin, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useSpaces } from '../context/SpacesContext.jsx';
import SpaceForm from '../components/SpaceForm.jsx';
import VenueIllustration from '../components/VenueIllustration.jsx';
import { ErrorState, LoadingState } from '../components/Feedback.jsx';

export default function AddSpacePage() {
  const { addSpace, status, error, retry } = useSpaces();
  const navigate = useNavigate();
  async function submit(values, signal) {
    const space = await addSpace(values, signal);
    if (space && !signal.aborted) navigate(`/spaces/${space.id}`);
  }
  return <><Link to="/" className="back-link"><ArrowLeft size={16}/>Back to explore</Link><section className="page-intro"><span className="eyebrow"><Sparkles size={15}/> GOOD FINDS ARE WORTH KEEPING</span><h1>Add a little <em>inspiration.</em></h1><p>Found a place that helps you focus? Make it part of your collection.</p></section>
    {status === 'loading' ? <LoadingState/> : status === 'error' ? <ErrorState message={error} onRetry={retry}/> : <div className="add-layout"><SpaceForm onSubmit={submit}/><aside className="form-aside"><VenueIllustration type="Café"/><div><h2>Every great session<br/>starts somewhere.</h2><p>A few thoughtful details make a space easier to find and a lot easier to love.</p><h3><MapPin size={17}/>Be specific</h3><p>Use a recognizable name and a full street address.</p><h3><Heart size={17}/>Share the atmosphere</h3><p>Is it perfect for quiet reading or better for a group project?</p><div className="aside-note">This is your personal collection. New spaces and favorites stay in this browser.</div></div></aside></div>}
  </>;
}
