import React from 'react';
import { emptyInquiry, validateInquiry } from './content/inquiry.mjs';
import { InquiryForm } from './ui/inquiry-form.jsx';

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
let turnstilePromise;
const loadTurnstile = () => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!turnstilePromise) turnstilePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('verification'));
    script.onerror = () => reject(new Error('verification'));
    document.head.appendChild(script);
  }).catch(error => { turnstilePromise = undefined; throw error; });
  return turnstilePromise;
};

export const InquiryController = () => {
  const [available, setAvailable] = React.useState(false);
  const [values, setValues] = React.useState(emptyInquiry);
  const [errors, setErrors] = React.useState({});
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');
  const [token, setToken] = React.useState('');
  const [verificationError, setVerificationError] = React.useState('');
  const [trapValue, setTrapValue] = React.useState('');
  const verificationRef = React.useRef(null);
  const summaryRef = React.useRef(null);
  const widgetRef = React.useRef(null);
  const submissionRef = React.useRef(null);
  const inflightRef = React.useRef(null);

  React.useEffect(() => {
    if (!SITE_KEY) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);
    fetch('/api/contact', { signal: controller.signal }).then(async result => {
      const data = await result.json();
      if (!controller.signal.aborted) setAvailable(result.ok && data.available === true);
    }).catch(() => {}).finally(() => window.clearTimeout(timeout));
    return () => { controller.abort(); window.clearTimeout(timeout); };
  }, []);

  React.useEffect(() => {
    if (!available) return;
    let cancelled = false;
    loadTurnstile().then(turnstile => {
      if (cancelled || !verificationRef.current) return;
      widgetRef.current = turnstile.render(verificationRef.current, {
        sitekey: SITE_KEY, action: 'ratecard_inquiry', theme: 'auto',
        callback: value => { setToken(value); setVerificationError(''); },
        'expired-callback': () => { setToken(''); turnstile.reset(widgetRef.current); },
        'error-callback': () => { setToken(''); setVerificationError('Verification is unavailable. You can email Omar directly below.'); },
      });
    }).catch(() => { if (!cancelled) setVerificationError('Verification is unavailable. You can email Omar directly below.'); });
    return () => { cancelled = true; if (widgetRef.current != null) window.turnstile?.remove(widgetRef.current); widgetRef.current = null; };
  }, [available]);

  React.useEffect(() => { if (status === 'error') summaryRef.current?.focus(); }, [status, errors]);
  React.useEffect(() => () => inflightRef.current?.abort(), []);

  const change = (name, value) => {
    if (inflightRef.current) return;
    setValues(previous => ({ ...previous, [name]: value }));
    setErrors(previous => { const next = { ...previous }; delete next[name]; return next; });
    setStatus('idle'); setMessage(''); submissionRef.current = null;
  };
  const submit = async event => {
    event.preventDefault();
    if (inflightRef.current || status === 'sent') return;
    const checked = validateInquiry(values);
    setErrors(checked.errors);
    if (!checked.valid) { setMessage('Please check the highlighted fields.'); setStatus('error'); return; }
    if (!token) { setMessage('Please complete verification before sending.'); setStatus('error'); return; }
    submissionRef.current ||= crypto.randomUUID();
    const controller = new AbortController();
    inflightRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    setStatus('sending'); setMessage('');
    try {
      const result = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ ...checked.values, submissionId: submissionRef.current, token, websiteTrap: trapValue }),
      });
      const data = await result.json();
      if (!result.ok || data.sent !== true) {
        setErrors(data.errors && typeof data.errors === 'object' ? Object.fromEntries(Object.entries(data.errors).filter(([name, text]) => name in values && typeof text === 'string')) : {});
        throw new Error(typeof data.error === 'string' ? data.error : 'We couldn’t confirm that your inquiry was sent. Try again or email Omar directly.');
      }
      setStatus('sent');
    } catch (error) {
      setMessage(error.name === 'Error' ? error.message : 'We couldn’t confirm that your inquiry was sent. Try again or email Omar directly.');
      setStatus('error');
    } finally {
      window.clearTimeout(timeout); inflightRef.current = null; setToken('');
      if (widgetRef.current != null) window.turnstile?.reset(widgetRef.current);
    }
  };
  if (!available) return <p className="rate-card-page__form-fallback">Please use the email link below to share your goals, timing, and budget.</p>;
  return <InquiryForm values={values} errors={errors} status={status} message={message} onChange={change} onSubmit={submit}
    ready={Boolean(token)} summaryRef={summaryRef} trapValue={trapValue} onTrapChange={setTrapValue}
    verification={<><div ref={verificationRef} />{verificationError && <p role="alert">{verificationError}</p>}</>} />;
};
