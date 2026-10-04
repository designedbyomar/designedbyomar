import { INQUIRY_FIELDS, INQUIRY_SUCCESS } from '../content/inquiry.mjs';
import { FormField } from './form-field.jsx';
import { Button, LinkButton } from './controls.jsx';
import './inquiry-form.css';

export const InquiryForm = ({ values, errors = {}, status = 'idle', message = '', onChange, onSubmit, verification, ready = false, summaryRef, idPrefix = 'inquiry', onTrapChange, trapValue = '' }) => {
  const busy = status === 'sending';
  const hasErrors = Object.keys(errors).length > 0;
  return <form className="inquiry-form" noValidate onSubmit={onSubmit} aria-busy={busy}>
    <div className="inquiry-form__summary" ref={summaryRef} tabIndex={-1} role="alert" hidden={!hasErrors && status !== 'error'}>
      <p>{message || 'Please check the highlighted fields.'}</p>
      {hasErrors && <ul>{INQUIRY_FIELDS.filter(field => errors[field.name]).map(field => <li key={field.name}><LinkButton variant="text" href={`#${idPrefix}-${field.name}`}>{errors[field.name]}</LinkButton></li>)}</ul>}
    </div>
    <div className="inquiry-form__fields">{INQUIRY_FIELDS.map(field => <FormField key={field.name} field={field} value={values[field.name]} error={errors[field.name]} onChange={onChange} idPrefix={idPrefix} disabled={busy} />)}</div>
    <div className="inquiry-form__trap" aria-hidden="true"><label htmlFor={`${idPrefix}-trap`}>Leave this field empty</label><input id={`${idPrefix}-trap`} name="websiteTrap" value={trapValue} onChange={event => onTrapChange?.(event.target.value)} tabIndex={-1} autoComplete="off" /></div>
    {verification}
    <p className="inquiry-form__privacy">Your details are used to respond to this inquiry. <LinkButton variant="text" href="/privacy">Privacy policy</LinkButton></p>
    <Button type="submit" disabled={busy || !ready || status === 'sent'}>{busy ? 'Sending…' : status === 'sent' ? 'Inquiry sent' : 'Send inquiry'}</Button>
    <p role="status" aria-live="polite">{status === 'sent' ? INQUIRY_SUCCESS : busy ? 'Sending your inquiry…' : !ready ? 'Complete verification to send your inquiry.' : ''}</p>
  </form>;
};
