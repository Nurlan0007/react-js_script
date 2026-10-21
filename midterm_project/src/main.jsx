import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

// This is React's mount point, not imperative manipulation of rendered UI.
createRoot(document.getElementById('root')).render(<StrictMode><App/></StrictMode>);
