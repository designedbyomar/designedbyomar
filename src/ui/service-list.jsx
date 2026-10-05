import { AppIcon, Search, Palette, RefreshCcw, Clock, Check, ArrowUpRight } from '../ui-icons.jsx';
import { Button } from './controls.jsx';
import './service-list.css';

const categoryIcons = { audits: Search, projects: Palette, ongoing: RefreshCcw };
const categoryLabels = { audits: 'Audits', projects: 'Projects', ongoing: 'Ongoing support' };

// Presentation only: production adapters own inquiry selection and focus.
export const ServiceRateCard = ({ service, headingLevel = 3, variant = 'projects', categoryLabel = categoryLabels[variant], onInquiry }) => {
  const Heading = `h${headingLevel}`;
  const starting = service.price.startsWith('From ');
  const monthly = service.price.endsWith('/month');
  const amount = service.price.replace(/^From /, '').replace(/\/month$/, '');
  return <article className={`service-rate-card service-rate-card--${variant}`}>
    <header className="service-rate-card__header">
      <p className="service-rate-card__category"><AppIcon icon={categoryIcons[variant] || Palette} />{categoryLabel}</p>
      <Heading>{service.name}</Heading>
    </header>
    <div className="service-rate-card__body">
      <div className="service-rate-card__price-panel">
        <p className="service-rate-card__price">{starting && <span className="service-rate-card__price-label">From </span>}{amount}{monthly && <span className="service-rate-card__price-label">/month</span>}</p>
        <p className="service-rate-card__timing"><AppIcon icon={Clock} />{service.timing}</p>
      </div>
      <p className="service-rate-card__description">{service.description}</p>
      <dl>
        <div><dt>Best for</dt><dd>{service.bestFor}</dd></div>
        <div><dt>What’s included</dt><dd><ul className="service-rate-card__includes">{service.includes.map(item => <li key={item}><AppIcon icon={Check} /><span>{item}</span></li>)}</ul></dd></div>
        <div><dt>Scope &amp; limits</dt><dd>{service.limits}</dd></div>
      </dl>
      {onInquiry && <Button variant="secondary" icon={ArrowUpRight} className="service-rate-card__action" onClick={() => onInquiry(service)}>Discuss {service.name}</Button>}
    </div>
  </article>;
};

export const ServiceRateGroup = ({ group, idPrefix = '', headingLevel = 2, onInquiry }) => {
  const Heading = `h${headingLevel}`;
  const headingId = `${idPrefix}${group.id}-title`;
  return <section className="service-rate-group" aria-labelledby={headingId}>
    <header><Heading id={headingId}>{group.title}</Heading><p>{group.description}</p></header>
    <div className="service-rate-grid">{group.services.map(service => <ServiceRateCard key={service.id} service={service} variant={group.id} categoryLabel={group.title} headingLevel={headingLevel + 1} onInquiry={onInquiry} />)}</div>
  </section>;
};
