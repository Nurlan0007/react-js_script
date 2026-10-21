import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { CITIES, TYPES, NOISE_LEVELS } from '../data/options.js';
import { validateSpace } from '../api/spaceUtils.js';
import FormField from './FormField.jsx';

const initialValues = {
  name: '', city: '', type: 'Library', address: '', description: '', noise: 'Quiet',
  price: '0', seats: '20', wifi: true, outlets: true, openingTime: '09:00', closingTime: '21:00',
};

export default function SpaceForm({ onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const controllerRef = useRef(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  function change(event) {
    const { name, value, type, checked } = event.target;
    setValues((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setSubmitError('');
  }

  function inputProps(name) {
    return { id: name, name, value: values[name], onChange: change,
      'aria-invalid': Boolean(errors[name]), 'aria-describedby': errors[name] ? `${name}-error` : undefined };
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;
    const nextErrors = validateSpace(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) { setSubmitError('Please check the highlighted fields before adding your space.'); return; }
    const controller = new AbortController();
    controllerRef.current = controller;
    setSubmitting(true);
    setSubmitError('');
    try { await onSubmit(values, controller.signal); }
    catch (cause) { if (!controller.signal.aborted) setSubmitError(cause.message); }
    finally { if (!controller.signal.aborted) setSubmitting(false); }
  }

  function reset() { setValues({ ...initialValues }); setErrors({}); setSubmitError(''); }

  return <form className="space-form" onSubmit={submit} noValidate>
    <fieldset disabled={submitting}><legend><span>01</span> The essentials</legend>
      <FormField name="name" label="Space name" error={errors.name}><input {...inputProps('name')} placeholder="e.g. The Quiet Corner" maxLength={80} required/></FormField>
      <div className="form-row"><FormField name="city" label="City" error={errors.city}><select {...inputProps('city')} required><option value="">Select a city</option>{CITIES.map((city) => <option key={city}>{city}</option>)}</select></FormField><FormField name="type" label="Space type" error={errors.type}><select {...inputProps('type')}>{TYPES.map((type) => <option key={type}>{type}</option>)}</select></FormField></div>
      <FormField name="address" label="Street address" error={errors.address}><input {...inputProps('address')} placeholder="e.g. 42, Abai Avenue" maxLength={160} required/></FormField>
      <FormField name="description" label="What makes this space special?" error={errors.description} hint={`${values.description.length}/1,000 characters · At least 30 characters`}><textarea {...inputProps('description')} rows={4} placeholder="Tell us about the atmosphere, the seating, and what makes it a good place to focus." maxLength={1000} required/></FormField>
    </fieldset>
    <fieldset disabled={submitting}><legend><span>02</span> Make yourself comfortable</legend>
      <div className="form-row"><FormField name="noise" label="Atmosphere" error={errors.noise}><select {...inputProps('noise')}>{NOISE_LEVELS.map((noise) => <option key={noise}>{noise}</option>)}</select></FormField><FormField name="seats" label="Number of seats" error={errors.seats}><input {...inputProps('seats')} type="number" min="1" max="1000" step="1" required/></FormField></div>
      <div className="form-row"><FormField name="price" label="Price per hour (₸)" error={errors.price} hint="Enter 0 if entry is free."><input {...inputProps('price')} type="number" min="0" max="50000" required/></FormField><div className="form-field"><span className="field-label">Amenities</span><div className="form-checkboxes"><label className="checkbox-label"><input name="wifi" type="checkbox" checked={values.wifi} onChange={change}/>Wi-Fi</label><label className="checkbox-label"><input name="outlets" type="checkbox" checked={values.outlets} onChange={change}/>Power outlets</label></div></div></div>
      <div className="form-row"><FormField name="openingTime" label="Opens at" error={errors.openingTime}><input {...inputProps('openingTime')} type="time" required/></FormField><FormField name="closingTime" label="Closes at" error={errors.closingTime} hint="Same-day hours only."><input {...inputProps('closingTime')} type="time" required/></FormField></div>
    </fieldset>
    {submitError && <div className="form-error" role="alert">{submitError}</div>}
    <div className="form-actions"><button type="button" className="button text-button" onClick={reset} disabled={submitting}><RotateCcw size={15}/>Reset form</button><button type="submit" className="button primary" disabled={submitting}>{submitting ? <><span className="spinner"/>Adding your space…</> : <>Add this space <ArrowRight size={17}/></>}</button></div>
    <p className="local-note">Your additions are saved in this browser on this device.</p>
  </form>;
}
