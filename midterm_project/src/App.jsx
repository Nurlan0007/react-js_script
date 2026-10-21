import { HashRouter, Route, Routes } from 'react-router-dom';
import { SpacesProvider } from './context/SpacesContext.jsx';
import Layout from './components/Layout.jsx';
import ExplorePage from './pages/ExplorePage.jsx';
import DetailPage from './pages/DetailPage.jsx';
import AddSpacePage from './pages/AddSpacePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><SpacesProvider><Routes><Route element={<Layout/>}>
    <Route index element={<ExplorePage key="explore"/>}/>
    <Route path="saved" element={<ExplorePage key="saved" savedOnly/>}/>
    <Route path="spaces/:id" element={<DetailPage/>}/>
    <Route path="add" element={<AddSpacePage/>}/>
    <Route path="about" element={<AboutPage/>}/>
    <Route path="*" element={<NotFoundPage/>}/>
  </Route></Routes></SpacesProvider></HashRouter>;
}
