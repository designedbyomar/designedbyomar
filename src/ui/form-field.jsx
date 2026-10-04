export const FormField = ({ field, value, error, onChange, idPrefix, disabled = false }) => {
  const id = `${idPrefix}-${field.name}`;
  const describedBy = [field.help && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const props = { id, name: field.name, value, onChange: event => onChange(field.name, event.target.value), required: field.required, disabled, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy };
  return <div className={`inquiry-field ${field.type === 'textarea' ? 'inquiry-field--wide' : ''}`}>
    <label htmlFor={id}>{field.label} <span>{field.required ? '(required)' : '(optional)'}</span></label>
    {field.options ? <select {...props}><option value="">Choose an option</option>{field.options.map(option => <option key={option} value={option}>{option}</option>)}</select>
      : field.type === 'textarea' ? <textarea {...props} rows={5} maxLength={field.maxLength} />
      : <input {...props} type={field.type || 'text'} maxLength={field.maxLength} autoComplete={field.autoComplete} />}
    {field.help && <p id={`${id}-help`} className="inquiry-field__help">{field.help}</p>}
    {error && <p id={`${id}-error`} className="inquiry-field__error">{error}</p>}
  </div>;
};
