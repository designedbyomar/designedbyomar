import './service-list.css';

// Content-only presentation: no routing, analytics, persistence, or requests.
export const ServiceRateRow = ({ service, headingLevel = 3 }) => {
  const Heading = `h${headingLevel}`;
  return <article className="service-rate-row">
    <div className="service-rate-row__identity">
      <Heading>{service.name}</Heading>
      <p className="service-rate-row__price">{service.price}</p>
      <p className="service-rate-row__timing">{service.timing}</p>
    </div>
    <div className="service-rate-row__details">
      <p className="service-rate-row__description">{service.description}</p>
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
    {group.services.map(service => <ServiceRateRow key={service.id} service={service} headingLevel={headingLevel + 1} />)}
  </section>;
};
