import { createContext, useContext, useEffect, useState } from 'react';
import { spacesApi } from '../api/spacesApi.js';

const SpacesContext = createContext(null);

export function SpacesProvider({ children }) {
  const [spaces, setSpaces] = useState([]);
  const [savedIds, setSavedIds] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [savingIds, setSavingIds] = useState([]);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    setError('');
    spacesApi.getAll({ signal: controller.signal }).then((data) => {
      if (controller.signal.aborted) return;
      setSpaces(data.spaces);
      setSavedIds(data.savedIds);
      setStatus('success');
    }).catch((cause) => {
      if (controller.signal.aborted) return;
      setError(cause.message);
      setStatus('error');
    });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4500);
    return () => clearTimeout(timer);
  }, [notice]);

  async function addSpace(values, signal) {
    const space = await spacesApi.create(values, { signal });
    if (signal?.aborted) return null;
    setSpaces((previous) => [space, ...previous]);
    setNotice({ message: 'Your space has been added. A fresh place to focus!', kind: 'success' });
    return space;
  }

  async function toggleSaved(id) {
    if (savingIds.includes(id)) return;
    const willSave = !savedIds.includes(id);
    setSavingIds((previous) => [...previous, id]);
    try {
      const updated = await spacesApi.setSaved(id, willSave);
      setSavedIds(updated);
      setNotice({ message: willSave ? 'Added to your saved spaces.' : 'Removed from your saved spaces.', kind: 'success' });
    } catch (cause) {
      setNotice({ message: cause.message, kind: 'error' });
    } finally {
      setSavingIds((previous) => previous.filter((value) => value !== id));
    }
  }

  return <SpacesContext.Provider value={{ spaces, savedIds, status, error, savingIds, notice,
    dismissNotice: () => setNotice(null), retry: () => setAttempt((previous) => previous + 1), addSpace, toggleSaved }}>
    {children}
  </SpacesContext.Provider>;
}

export function useSpaces() {
  const context = useContext(SpacesContext);
  if (!context) throw new Error('useSpaces must be used inside SpacesProvider.');
  return context;
}
