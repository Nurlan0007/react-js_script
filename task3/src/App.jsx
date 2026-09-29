import { useState } from 'react';
import { RotateCcw, Search, Plus, ArrowUpDown, ListRestart, Sparkles } from 'lucide-react';

const initialQuests = [
  {
    id: 101,
    title: 'Recover the Sun Crystal',
    category: 'Exploration',
    difficulty: 'Hard',
    reward: 850,
    status: 'Active',
  },
  {
    id: 102,
    title: 'Escort the Merchant',
    category: 'Support',
    difficulty: 'Medium',
    reward: 420,
    status: 'Planned',
  },
  {
    id: 103,
    title: 'Defeat the Frost Warden',
    category: 'Combat',
    difficulty: 'Epic',
    reward: 1200,
    status: 'Active',
  },
  {
    id: 104,
    title: 'Decode the Ancient Map',
    category: 'Puzzle',
    difficulty: 'Easy',
    reward: 300,
    status: 'Completed',
  },
];

const statusOptions = ['Planned', 'Active', 'Completed'];
const categories = ['Exploration', 'Combat', 'Support', 'Puzzle'];
const difficulties = ['Easy', 'Medium', 'Hard', 'Epic'];

function App() {
  console.log('App rendered');

  const [quests, setQuests] = useState(initialQuests);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [isReversed, setIsReversed] = useState(false);
  const [nextId, setNextId] = useState(105);

  const addQuest = (quest) => {
    setQuests((current) => [...current, { ...quest, id: nextId, status: 'Planned' }]);
    setNextId((value) => value + 1);
  };

  const removeQuest = (id) => {
    setQuests((current) => current.filter((quest) => quest.id !== id));
  };

  const changeStatus = (id, status) => {
    setQuests((current) =>
      current.map((quest) => (quest.id === id ? { ...quest, status } : quest)),
    );
  };

  const resetDashboard = () => {
    setQuests(initialQuests);
    setFilter('All');
    setSearch('');
    setIsReversed(false);
    setNextId(105);
  };

  const matchesFilter = (quest) =>
    (filter === 'All' || quest.status === filter) &&
    quest.title.toLowerCase().includes(search.toLowerCase());

  const visibleCount = quests.filter(matchesFilter).length;
  const displayedQuests = isReversed ? [...quests].reverse() : quests;

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow"><Sparkles size={16} /> React Rendering Lab</p>
          <h1>QuestBoard</h1>
          <p className="hero-copy">
            Manage adventurer quests while observing how React preserves and resets component state.
          </p>
        </div>
        <div className="hero-stat">
          <span>{quests.length}</span>
          <small>Total quests</small>
        </div>
      </section>

      <QuestForm onAddQuest={addQuest} />

      <section className="toolbar" aria-label="Quest controls">
        <div className="search-box">
          <Search size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search quests..."
            aria-label="Search quests"
          />
        </div>

        <div className="filter-group">
          {['All', ...statusOptions].map((status) => (
            <button
              key={status}
              className={filter === status ? 'filter-btn active' : 'filter-btn'}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>

        <button className="secondary-btn" onClick={() => setIsReversed((value) => !value)}>
          <ArrowUpDown size={17} /> {isReversed ? 'Normal order' : 'Reverse order'}
        </button>

        <button className="secondary-btn" onClick={resetDashboard}>
          <ListRestart size={17} /> Reset dashboard
        </button>
      </section>

      <section className="content-grid">
        <div className="list-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Quest list</p>
              <h2>{visibleCount} visible</h2>
            </div>
            <span className="muted">Open DevTools Console to inspect renders</span>
          </div>

          {visibleCount === 0 && (
            <div className="empty-state">
              <h3>No quests found</h3>
              <p>Try another filter, change the search, or add a new quest.</p>
            </div>
          )}

          <div className="quest-list">
            {displayedQuests.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                hidden={!matchesFilter(quest)}
                onRemove={removeQuest}
                onStatusChange={changeStatus}
              />
            ))}
          </div>
        </div>

        <aside className="info-panel">
          <p className="eyebrow">What to test</p>
          <h2>State identity demo</h2>
          <ol>
            <li>Increase the local progress of one quest.</li>
            <li>Filter it out, then show it again.</li>
            <li>Reverse the list and verify its progress stays with the same quest.</li>
            <li>Press “Reset local state” and watch only that quest return to 0%.</li>
          </ol>
          <p>
            Stable list key: <code>quest.id</code>. Intentional reset key: a changing local
            <code> resetVersion</code> value.
          </p>
        </aside>
      </section>
    </main>
  );
}

function QuestForm({ onAddQuest }) {
  console.log('QuestForm rendered');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [difficulty, setDifficulty] = useState(difficulties[1]);
  const [reward, setReward] = useState(250);

  const handleSubmit = (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    onAddQuest({
      title: cleanTitle,
      category,
      difficulty,
      reward: Number(reward) || 0,
    });

    setTitle('');
    setCategory(categories[0]);
    setDifficulty(difficulties[1]);
    setReward(250);
  };

  return (
    <form className="quest-form" onSubmit={handleSubmit}>
      <div className="form-title">
        <Plus size={18} />
        <div>
          <strong>Add a quest</strong>
          <span>Create a new list item from parent-controlled state.</span>
        </div>
      </div>

      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Quest title"
        aria-label="Quest title"
      />

      <select value={category} onChange={(event) => setCategory(event.target.value)}>
        {categories.map((item) => <option key={item}>{item}</option>)}
      </select>

      <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
        {difficulties.map((item) => <option key={item}>{item}</option>)}
      </select>

      <input
        type="number"
        min="0"
        value={reward}
        onChange={(event) => setReward(event.target.value)}
        aria-label="Quest reward"
      />

      <button className="primary-btn" type="submit">Add quest</button>
    </form>
  );
}

function QuestCard({ quest, hidden, onRemove, onStatusChange }) {
  console.log(`QuestCard rendered: ${quest.id} - ${quest.title}`);

  const [resetVersion, setResetVersion] = useState(0);

  return (
    <article className={hidden ? 'quest-card filtered-out' : 'quest-card'}>
      <div className="card-topline">
        <span className={`difficulty ${quest.difficulty.toLowerCase()}`}>{quest.difficulty}</span>
        <span className="reward">{quest.reward} XP</span>
      </div>

      <div>
        <h3>{quest.title}</h3>
        <p className="category">{quest.category}</p>
      </div>

      <label className="status-control">
        <span>Status</span>
        <select
          value={quest.status}
          onChange={(event) => onStatusChange(quest.id, event.target.value)}
        >
          {statusOptions.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>

      <LocalQuestState key={resetVersion} questId={quest.id} />

      <div className="card-actions">
        <button className="ghost-btn" onClick={() => setResetVersion((value) => value + 1)}>
          <RotateCcw size={15} /> Reset local state
        </button>
        <button className="danger-btn" onClick={() => onRemove(quest.id)}>Remove</button>
      </div>
    </article>
  );
}

function LocalQuestState({ questId }) {
  console.log(`LocalQuestState rendered for quest ${questId}`);

  const [progress, setProgress] = useState(0);
  const [pinned, setPinned] = useState(false);

  const increaseProgress = () => {
    setProgress((value) => Math.min(100, value + 10));
  };

  return (
    <div className="local-state-box">
      <div className="progress-heading">
        <span>Local progress</span>
        <strong>{progress}%</strong>
      </div>
      <div className="progress-track" aria-label={`Progress ${progress}%`}>
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="local-actions">
        <button className="small-btn" onClick={increaseProgress}>+10% progress</button>
        <button
          className={pinned ? 'small-btn pinned' : 'small-btn'}
          onClick={() => setPinned((value) => !value)}
        >
          {pinned ? '★ Pinned' : '☆ Pin locally'}
        </button>
      </div>
    </div>
  );
}

export default App;
