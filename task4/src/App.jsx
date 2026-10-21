import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCheck, Compass, Flag, Hexagon, Plus, Radio, RotateCw, Sparkles } from 'lucide-react';
import { api, toSummary } from './api/fakeApi.js';
import { NETWORK_MODES } from './api/settings.js';
import QuestList from './components/QuestList.jsx';
import QuestDetails from './components/QuestDetails.jsx';
import QuestForm from './components/QuestForm.jsx';
import NetworkPanel from './components/NetworkPanel.jsx';
import { ErrorState, LoadingState, Notice } from './components/Feedback.jsx';

const emptyList = { status: 'loading', data: [], total: 0, counts: null, error: '' };
const emptyDetail = { id: null, status: 'idle', data: null, error: '' };

export default function App() {
  const [list, setList] = useState(emptyList);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('recent');
  const [reloadVersion, setReloadVersion] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(emptyDetail);
  const [detailAttempt, setDetailAttempt] = useState(0);
  const [versions, setVersions] = useState({});
  const [pending, setPending] = useState(null);
  const [editor, setEditor] = useState(null);
  const [editorError, setEditorError] = useState('');
  const [notice, setNotice] = useState(null);
  const [networkOpen, setNetworkOpen] = useState(false);
  const [networkMode, setNetworkMode] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('network');
    return NETWORK_MODES[requested] ? requested : 'standard';
  });
  const selectedVersion = versions[selectedId] || 0;
  const formBusy = pending?.kind === 'create' || pending?.kind === 'edit';

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setList((previous) => ({ ...previous, status: 'loading', error: '' }));
    const query = new URLSearchParams({ search, status: filter, sort }).toString();
    api.getItemsList(query, { mode: networkMode, signal: controller.signal }).then((response) => {
      if (!active) return;
      setList({ ...response, status: 'success', error: '' });
      setSelectedId((current) => current ?? response.data[0]?.id ?? null);
    }).catch((error) => {
      if (active && error.name !== 'AbortError') setList((previous) => ({ ...previous, status: 'error', error: error.message }));
    });
    return () => { active = false; controller.abort(); };
  }, [search, filter, sort, reloadVersion, networkMode]);

  useEffect(() => {
    if (selectedId === null) { setDetail(emptyDetail); return; }
    let active = true;
    const controller = new AbortController();
    const requestedId = selectedId;
    setDetail({ id: requestedId, status: 'loading', data: null, error: '' });
    api.getItem(requestedId, { mode: networkMode, signal: controller.signal }).then((quest) => {
      if (active) setDetail({ id: requestedId, status: 'success', data: quest, error: '' });
    }).catch((error) => {
      if (active && error.name !== 'AbortError') setDetail({ id: requestedId, status: 'error', data: null, error: error.message });
    });
    // Abort cancels the timer; active also protects against an API that ignores cancellation.
    return () => { active = false; controller.abort(); };
  }, [selectedId, selectedVersion, detailAttempt, networkMode]);

  useEffect(() => {
    if (!notice || notice.kind === 'error') return;
    const timer = setTimeout(() => setNotice(null), 5500);
    return () => clearTimeout(timer);
  }, [notice]);

  function refreshList() { setReloadVersion((previous) => previous + 1); }

  function applyUpdatedQuest(updated) {
    setList((previous) => ({ ...previous, data: previous.data.map((quest) => quest.id === updated.id ? toSummary(updated) : quest) }));
    // The updater reads the CURRENT detail state, never an old selectedId closure.
    setDetail((current) => current.id === updated.id ? { id: updated.id, status: 'success', data: updated, error: '' } : current);
    setVersions((previous) => ({ ...previous, [updated.id]: (previous[updated.id] || 0) + 1 }));
    refreshList();
  }

  function selectQuest(id) {
    if (formBusy) return;
    setSelectedId(id);
    setEditor(null);
    setEditorError('');
  }

  function openCreate() {
    if (pending) return;
    setEditor({ kind: 'create', quest: null });
    setEditorError('');
  }

  async function changeCompletion(quest) {
    if (pending) return;
    // Capture the target BEFORE awaiting. The user can select another quest meanwhile.
    const targetId = quest.id;
    const targetName = quest.name;
    const nextStatus = quest.status === 'Completed' ? 'Active' : 'Completed';
    setPending({ kind: 'status', id: targetId, name: targetName });
    try {
      const updated = await api.updateItem(targetId, { status: nextStatus }, { mode: networkMode });
      applyUpdatedQuest(updated);
      setNotice({ kind: 'success', message: `“${targetName}” ${nextStatus === 'Completed' ? 'completed. Nicely done!' : 'is active again.'}` });
    } catch (error) { setNotice({ kind: 'error', message: `Couldn’t update “${targetName}”. ${error.message}` }); }
    finally { setPending(null); }
  }

  async function saveForm(values) {
    if (pending || !editor) return;
    const targetId = editor.quest?.id;
    const kind = editor.kind;
    setPending({ kind, id: targetId, name: values.name });
    setEditorError('');
    try {
      const updated = kind === 'create' ? await api.createItem(values, { mode: networkMode }) : await api.updateItem(targetId, values, { mode: networkMode });
      applyUpdatedQuest(updated);
      setSelectedId(updated.id);
      setEditor(null);
      setNotice({ kind: 'success', message: kind === 'create' ? `“${updated.name}” added. Your next adventure awaits.` : `Changes to “${updated.name}” saved.` });
    } catch (error) { setEditorError(error.message); }
    finally { setPending(null); }
  }

  async function removeQuest(quest) {
    if (pending) return;
    const targetId = quest.id;
    const targetName = quest.name;
    setPending({ kind: 'delete', id: targetId, name: targetName });
    try {
      await api.deleteItem(targetId, { mode: networkMode });
      setList((previous) => ({ ...previous, data: previous.data.filter((item) => item.id !== targetId) }));
      setSelectedId((current) => current === targetId ? null : current);
      setDetail((current) => current.id === targetId ? emptyDetail : current);
      refreshList();
      setNotice({ kind: 'success', message: `“${targetName}” removed from your board.` });
    } catch (error) { setNotice({ kind: 'error', message: `Couldn’t remove “${targetName}”. ${error.message}` }); }
    finally { setPending(null); }
  }

  const counts = list.counts;
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Hexagon size={29}/><Compass size={15}/></span><span>questboard<span className="brand-period">.</span></span><span className="edition">THE ADVENTURE DESK</span></div><div className="header-actions"><button className={`connection-button ${networkOpen ? 'selected' : ''}`} aria-label="Network simulator" aria-expanded={networkOpen} aria-controls="network-panel" onClick={() => setNetworkOpen((previous) => !previous)}><Radio size={15}/><span>Network simulator</span></button><span className="avatar" aria-label="Adventurer">N</span></div></header>
    <main><section className="page-heading"><div><span className="eyebrow"><span className="tiny-dot"/> YOUR NEXT CHAPTER</span><h1>A little courage.<br/><span>A new adventure.</span></h1><p>Find your purpose, follow the trail, and keep moving forward.</p></div><div className="heading-side"><span className="chapter-label">CHAPTER 04 <span>↗</span></span><p>Every great story starts<br/>with a small first step.</p><button className="button primary" onClick={openCreate} disabled={Boolean(pending)}><Plus size={17}/>New quest</button></div></section>
      {networkOpen && <NetworkPanel mode={networkMode} onMode={setNetworkMode} disabled={Boolean(pending)} onFailList={() => { api.failNextRequest('list'); refreshList(); }} onFailChange={() => { api.failNextRequest('mutation'); setNotice({ kind: 'info', message: 'Your next change will fail once. Try creating, editing, completing, or removing a quest, then retry.' }); }}/>} 
      <section className="stats-row" aria-label="Board statistics">{[[Compass, 'On your board', counts?.total, 'All the possibilities'], [Flag, 'In progress', counts?.Active, 'Keep the momentum going'], [CheckCheck, 'Completed', counts?.Completed, 'Small wins, great stories']].map(([Icon, label, value, subtitle]) => <div className="stat-card" key={label}><span className="stat-icon"><Icon size={21}/></span><div><span>{label}</span><strong>{value ?? '—'}</strong></div><p>{subtitle}</p></div>)}</section>
      <div className="board-toolbar"><div className="board-title"><span className="board-indicator"/>Quest workspace<span className="workspace-label">PERSONAL BOARD</span></div><button className="button reload-button" onClick={refreshList} disabled={Boolean(pending) || list.status === 'loading'}><RotateCw size={14} className={list.status === 'loading' ? 'spinning' : ''}/>{list.status === 'loading' ? 'Loading…' : 'Reload board'}</button></div>
      <Notice notice={notice} onDismiss={() => setNotice(null)}/>
      {pending && <div className="pending-banner" role="status"><span className="spinner"/>Saving “{pending.name}”… {pending.kind === 'status' || pending.kind === 'delete' ? 'You can explore another quest while this finishes.' : 'Your form will stay here until the request finishes.'}</div>}
      <div className="workspace-grid"><QuestList list={list} search={search} filter={filter} sort={sort} selectedId={selectedId} selectionDisabled={formBusy} onSearch={setSearch} onFilter={setFilter} onSort={setSort} onSelect={selectQuest} onReload={refreshList} onCreate={openCreate}/><section className="panel details-panel" aria-label="Selected quest">
        {editor ? <QuestForm key={editor.kind === 'create' ? 'create' : `edit-${editor.quest.id}`} quest={editor.quest} pending={Boolean(pending)} error={editorError} onSubmit={saveForm} onCancel={() => { if (!pending) setEditor(null); }}/>
          : selectedId === null ? <div className="selection-placeholder"><Compass size={46} strokeWidth={1.3}/><span className="eyebrow">MAKE YOUR NEXT MOVE</span><h2>Every quest has a story.</h2><p>Select one from your board to discover the details, plan your route, and get started.</p><span className="placeholder-arrow">← Pick a quest to explore</span></div>
          : detail.id !== selectedId || detail.status === 'loading' || detail.status === 'idle' ? <LoadingState detail/>
          : detail.status === 'error' ? <ErrorState title="The details took a detour" message={detail.error} onRetry={() => setDetailAttempt((previous) => previous + 1)}/>
          : <QuestDetails key={selectedId} quest={detail.data} pending={pending} onComplete={changeCompletion} onEdit={(quest) => { if (!pending) { setEditor({ kind: 'edit', quest }); setEditorError(''); } }} onRemove={removeQuest}/>
        }</section></div>
      <section className="bottom-note"><Sparkles size={16}/><p>Progress isn’t always a straight line. Keep exploring.</p><span>ONE QUEST AT A TIME <ArrowUpRight size={13}/></span></section>
    </main><footer><span>QuestBoard · A personal space for your next adventure.</span><span>Task 04 — React Effects & API · Simulated data</span></footer>
  </div>;
}
