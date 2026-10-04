import { InquiryController } from './inquiry-controller.jsx';
import { RATE_CARD } from './content/rate-card.mjs';
import { ServiceRateGroup } from './ui/service-list.jsx';
import { ContactCard } from './ui/contact-card.jsx';
import './rate-card-page.css';

const RateCardPage = ({ onEvent }) => <article className="rate-card-page">
  <header className="rate-card-page__intro">
    <p className="rate-card-page__eyebrow">Working together</p>
    <h1>{RATE_CARD.title}</h1>
    <p className="rate-card-page__lede">{RATE_CARD.introduction}</p>
    <p className="rate-card-page__note">{RATE_CARD.pricingNote}</p>
  </header>
  {RATE_CARD.groups.map(group => <ServiceRateGroup key={group.id} group={group} />)}
  <section className="rate-card-page__terms" aria-labelledby="rate-terms-title">
    <h2 id="rate-terms-title">How engagements work</h2>
    <dl>{RATE_CARD.terms.map(term => <div key={term.title}><dt>{term.title}</dt><dd>{term.text}</dd></div>)}</dl>
  </section>
  <section className="rate-card-page__contact" aria-labelledby="rate-contact-title">
    <h2 id="rate-contact-title">{RATE_CARD.contactTitle}</h2>
    <p>{RATE_CARD.contactDescription}</p>
    <InquiryController />
    <p>Prefer email? Use the link or copy the address below.</p>
    <ContactCard label="Email" value={RATE_CARD.email} href={`mailto:${RATE_CARD.email}`} copyValue={RATE_CARD.email} eventName="contact_click_email" copyEventName="copy_email_click" copyTarget="email" section="ratecard" onEvent={onEvent} />
  </section>
</article>;

export default RateCardPage;
