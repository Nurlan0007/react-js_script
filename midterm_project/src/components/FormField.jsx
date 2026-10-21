export default function FormField({ name, label, error, hint, children, optional = false }) {
  return <div className={`form-field ${error ? 'has-error' : ''}`}>
    <label htmlFor={name}>{label}{optional && <span className="optional"> optional</span>}</label>
    {children}
    {error ? <p className="field-error" id={`${name}-error`}>{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
  </div>;
}
