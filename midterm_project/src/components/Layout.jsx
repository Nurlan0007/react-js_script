import { BookOpen, Compass, Bookmark, Plus, ArrowUpRight, Info, Sparkles } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useSpaces } from '../context/SpacesContext.jsx';
import { Toast } from './Feedback.jsx';

export default function Layout() {
  const { savedIds } = useSpaces();
  return <div className="app-shell">
    <aside className="sidebar">
      <Link to="/" className="brand" aria-label="StudySpot home"><span className="brand-mark"><BookOpen size={23}/></span>studyspot<span className="brand-dot">.</span></Link>
      <p className="nav-label">YOUR LITTLE CORNER</p>
      <nav aria-label="Main navigation">
        <NavLink to="/" end><Compass size={19}/><span>Explore spaces</span></NavLink>
        <NavLink to="/saved"><Bookmark size={19}/><span>Saved spaces</span><span className="nav-count">{savedIds.length}</span></NavLink>
        <NavLink to="/add"><Plus size={19}/><span>Add a space</span></NavLink>
      </nav>
      <div className="sidebar-note"><Sparkles size={22}/><h3>Make room for<br/>your next big idea.</h3><p>A change of space can change your whole day.</p><Link to="/about">Meet StudySpot <ArrowUpRight size={15}/></Link></div>
      <div className="sidebar-bottom"><NavLink to="/about"><Info size={17}/> About this project</NavLink><span className="country-label"><span/> Made for curious minds in KZ</span></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="topbar-label">A little space to focus <span>✳</span></div><Link to="/add" className="button topbar-add"><Plus size={16}/> Add a space</Link></header>
      <main id="main-content" className="main-content"><Outlet/></main>
      <footer className="footer"><span>Find your space. Find your flow.</span><Link to="/about">Student project · Simulated places & ratings <ArrowUpRight size={12}/></Link></footer>
    </div>
    <Toast/>
  </div>;
}
