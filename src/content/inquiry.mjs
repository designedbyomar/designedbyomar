/* global URL */
import { RATE_CARD } from './rate-card.mjs';

export const INQUIRY_FIELDS = [
  { name: 'name', label: 'Name', required: true, maxLength: 120, autoComplete: 'name' },
  { name: 'email', label: 'Email', type: 'email', required: true, maxLength: 254, autoComplete: 'email' },
  { name: 'goals', label: 'Goals', type: 'textarea', required: true, maxLength: 4000, help: 'What needs work, and what would a useful outcome look like?' },
  { name: 'timing', label: 'Timing', required: true, options: ['ASAP', 'Within a month', '1–3 months', 'Later', 'Not sure yet'] },
  { name: 'budget', label: 'Budget in USD', required: true, options: ['Under $2,500', '$2,500–$5,000', '$5,000–$10,000', '$10,000–$20,000', '$20,000+', 'Not sure yet'] },
  { name: 'budgetBasis', label: 'Budget basis', required: true, options: ['Project total', 'Monthly', 'Not sure yet'] },
  { name: 'company', label: 'Company', maxLength: 120, autoComplete: 'organization' },
  { name: 'website', label: 'Website', type: 'url', maxLength: 2048, autoComplete: 'url', help: 'Include https:// if you have a website.' },
  { name: 'service', label: 'Service interest', options: ['Help me choose', ...RATE_CARD.groups.flatMap(group => group.services.map(service => service.name))] },
];
export const emptyInquiry = () => Object.fromEntries(INQUIRY_FIELDS.map(field => [field.name, '']));
export const INQUIRY_SUCCESS = 'Your inquiry has been sent. Thanks for sharing the details.';

export const validateInquiry = input => {
  const values = emptyInquiry();
  const errors = {};
  for (const field of INQUIRY_FIELDS) {
    const raw = input?.[field.name];
    if (typeof raw !== 'string') {
      if (field.required || raw != null) errors[field.name] = `Enter ${field.label.toLowerCase()}.`;
      continue;
    }
    const value = raw.trim();
    values[field.name] = value;
    if (!value && field.required) errors[field.name] = `Enter ${field.label.toLowerCase()}.`;
    else if (value && field.options && !field.options.includes(value)) errors[field.name] = `Choose a listed ${field.label.toLowerCase()}.`;
    else if (value.length > (field.maxLength || 120)) errors[field.name] = `${field.label} is too long.`;
    else if (field.type !== 'textarea' && Array.from(value).some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) errors[field.name] = `Enter a valid ${field.label.toLowerCase()}.`;
    else if (field.name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.email = 'Enter a valid email address.';
    else if (field.name === 'website' && value) {
      try { const url = new URL(value); if (!['https:', 'http:'].includes(url.protocol) || !url.hostname.includes('.') || url.username || url.password) throw new Error('url'); }
      catch { errors.website = 'Enter a website URL beginning with https:// or http://.'; }
    }
  }
  return { values, errors, valid: Object.keys(errors).length === 0 };
};
