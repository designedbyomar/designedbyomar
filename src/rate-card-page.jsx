import React from 'react';
import { LAYOUT } from './constants.js';
import { InquiryController } from './inquiry-controller.jsx';
import { RATE_CARD } from './content/rate-card.mjs';
import { ServiceRateGroup } from './ui/service-list.jsx';
import { Disclosure } from './ui/disclosure.jsx';
import { ContactCard } from './ui/contact-card.jsx';
import './rate-card-page.css';

const RateCardPage = ({ onEvent }) => {
  const [selectionRequest, setSelectionRequest] = React.useState(null);
  const contactRef = React.useRef(null);
  const selectService = service => setSelectionRequest({ service: service.name, requestId: crypto.randomUUID() });
  const emailHref = `mailto:${RATE_CARD.email}${selectionRequest ? `?subject=${encodeURIComponent(`Inquiry: ${selectionRequest.service}`)}` : ''}`;
  return <div className="rate-card-page-shell"><article className="rate-card-page" style={{ maxWidth: LAYOUT.MAX_WIDTH }}>
  <header className="rate-card-page__intro">
    <p className="rate-card-page__eyebrow">Working together</p>
    <h1>{RATE_CARD.title}</h1>
    <p className="rate-card-page__lede">{RATE_CARD.introduction}</p>
    <p className="rate-card-page__note">{RATE_CARD.pricingNote}</p>
  </header>
  {RATE_CARD.groups.map(group => <ServiceRateGroup key={group.id} group={group} onInquiry={selectService} />)}
  <section className="rate-card-page__terms" aria-labelledby="rate-terms-title">
    <Disclosure id="rate-terms-title" heading="How engagements work" defaultExpanded>
    <dl>{RATE_CARD.terms.map(term => <div key={term.title}><dt>{term.title}</dt><dd>{term.text}</dd></div>)}</dl>
    </Disclosure>
  </section>
  <section ref={contactRef} tabIndex={-1} id="rate-contact" className="rate-card-page__contact" aria-labelledby="rate-contact-title">
    <h2 id="rate-contact-title">{RATE_CARD.contactTitle}</h2>
    <p>{RATE_CARD.contactDescription}</p>
    <InquiryController selectionRequest={selectionRequest} contactRef={contactRef} />
    <p>Prefer email? Use the link or copy the address below.</p>
    <ContactCard label="Email" value={RATE_CARD.email} href={emailHref} copyValue={RATE_CARD.email} eventName="contact_click_email" copyEventName="copy_email_click" copyTarget="email" section="ratecard" onEvent={onEvent} />
  </section>
</article></div>;
};

export default RateCardPage;
