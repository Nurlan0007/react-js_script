import { useState } from 'react';
import { ArrowRight, RotateCcw, X } from 'lucide-react';
import { CATEGORIES, DIFFICULTIES, STATUSES } from '../api/settings.js';
import { validateQuest } from '../api/validation.js';

function initialValues(quest) {
  return quest ? { ...quest } : { name: '', description: '', category: 'Exploration', difficulty: 'Easy', status: 'Planned', reward: '100', location: '', questGiver: '', duration: '30', minLevel: '1', objectives: '' };
}

function FormField({ name, label, error, children, hint }) {
  return <div className={`form-field ${error ? 'invalid' : ''}`}><label htmlFor={`quest-${name}`}>{label}</label>{children}{error ? <p id={`error-${name}`} className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}</div>;
}

export default function QuestForm({ quest, pending, error, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialValues(quest));
  const [errors, setErrors] = useState({});
  const [invalid, setInvalid] = useState(false);
  const editing = Boolean(quest);

  function field(name) {
    return { id: `quest-${name}`, name, value: values[name], required: true,
      onChange: (event) => { const value = event.target.value; setValues((previous) => ({ ...previous, [name]: value })); setErrors((previous) => ({ ...previous, [name]: undefined })); },
      'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `error-${name}` : undefined };
  }

  function submit(event) {
    event.preventDefault();
    if (pending) return;
    const nextErrors = validateQuest(values);
    setErrors(nextErrors);
    setInvalid(Object.keys(nextErrors).length > 0);
    if (!Object.keys(nextErrors).length) onSubmit(values);
  }

  return <div className="form-panel"><div className="form-heading"><div><span className="eyebrow">{editing ? 'REFINE THE PLAN' : 'WRITE YOUR NEXT CHAPTER'}</span><h2>{editing ? 'Edit quest' : 'A new adventure'}</h2></div><button className="button icon-button" onClick={onCancel} disabled={pending} aria-label="Close quest form"><X size={19}/></button></div><p className="form-intro">{editing ? 'Update the details and keep your adventure on track.' : 'Give your quest a purpose, a destination, and a little possibility.'}</p>
      <form onSubmit={submit} noValidate><fieldset disabled={pending}><legend className="sr-only">Quest information</legend>
        <FormField name="name" label="Quest name" error={errors.name}><input {...field('name')} maxLength={80} placeholder="e.g. Discover the hidden waterfall"/></FormField>
        <FormField name="description" label="Description" error={errors.description} hint="20–1,200 characters"><textarea {...field('description')} rows={3} maxLength={1200} placeholder="What is the story behind this quest?"/></FormField>
        <div className="form-row"><FormField name="category" label="Category" error={errors.category}><select {...field('category')}>{CATEGORIES.map((value) => <option key={value}>{value}</option>)}</select></FormField><FormField name="difficulty" label="Difficulty" error={errors.difficulty}><select {...field('difficulty')}>{DIFFICULTIES.map((value) => <option key={value}>{value}</option>)}</select></FormField></div>
        <div className="form-row"><FormField name="location" label="Location" error={errors.location}><input {...field('location')} maxLength={100} placeholder="Where does it take place?"/></FormField><FormField name="questGiver" label="Quest giver" error={errors.questGiver}><input {...field('questGiver')} maxLength={80} placeholder="Who needs your help?"/></FormField></div>
        <div className="form-row"><FormField name="reward" label="Reward (XP)" error={errors.reward}><input {...field('reward')} type="number" min="0" max="100000" step="1"/></FormField><FormField name="duration" label="Estimated minutes" error={errors.duration}><input {...field('duration')} type="number" min="5" max="1440" step="1"/></FormField></div>
        <div className="form-row"><FormField name="minLevel" label="Minimum level" error={errors.minLevel}><input {...field('minLevel')} type="number" min="1" max="100" step="1"/></FormField><FormField name="status" label="Status" error={errors.status}><select {...field('status')}>{STATUSES.map((value) => <option key={value}>{value}</option>)}</select></FormField></div>
        <FormField name="objectives" label="Objectives" error={errors.objectives} hint="Separate steps with semicolons (;)."><textarea {...field('objectives')} rows={2} maxLength={600} placeholder="Find the entrance; explore the trail; report back"/></FormField>
      </fieldset>{(error || invalid) && <p className="form-error" role="alert">{error || 'Please check the highlighted fields.'}</p>}<div className="form-actions"><button type="button" className="button text-button" disabled={pending} onClick={() => { setValues(initialValues(quest)); setErrors({}); setInvalid(false); }}><RotateCcw size={14}/>Reset</button><button className="button primary" type="submit" disabled={pending}>{pending ? <><span className="spinner"/>Saving quest…</> : <>{editing ? 'Save changes' : 'Create quest'}<ArrowRight size={16}/></>}</button></div></form>
    </div>;
}
