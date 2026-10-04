import './service-list.css';

// Content-only presentation: no routing, analytics, persistence, or requests.
export const ServiceRateCard = ({ service, headingLevel = 3, variant = 'projects' }) => {
  const Heading = `h${headingLevel}`;
  return <article className={`service-rate-card service-rate-card--${variant}`}>
    <div className="service-rate-card__identity">
      <Heading>{service.name}</Heading>
      <div className="service-rate-card__divider" aria-hidden="true" />
      <div className="service-rate-card__price-panel"><p className="service-rate-card__price">{service.price}</p>
      <p className="service-rate-card__timing">{service.timing}</p></div>
    </div>
    <div className="service-rate-card__details">
      <p className="service-rate-card__description">{service.description}</p>
      <dl>
        <div><dt>Best for</dt><dd>{service.bestFor}</dd></div>
        <div><dt>Includes</dt><dd>{service.includes}</dd></div>
        <div><dt>Scope & limits</dt><dd>{service.limits}</dd></div>
      </dl>
    </div>
  </article>;
};

export const ServiceRateGroup = ({ group, idPrefix = '', headingLevel = 2 }) => {
  const Heading = `h${headingLevel}`;
  const headingId = `${idPrefix}${group.id}-title`;
  return <section className="service-rate-group" aria-labelledby={headingId}>
    <header><Heading id={headingId}>{group.title}</Heading><p>{group.description}</p></header>
    <div className="service-rate-grid">{group.services.map(service => <ServiceRateCard key={service.id} service={service} variant={group.id} headingLevel={headingLevel + 1} />)}</div>
  </section>;
};
