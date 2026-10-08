import React from 'react';
import { AppIcon, Search, Palette, RefreshCcw, Clock, Check, ArrowUpRight, ArrowLeft, ArrowRight } from '../ui-icons.jsx';
import { Button, IconButton } from './controls.jsx';
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
  const scrollable = group.services.length > 3;
  const gridRef = React.useRef(null);
  const [edges, setEdges] = React.useState({ start: true, end: false });
  const updateEdges = () => {
    const grid = gridRef.current;
    if (!grid) return;
    const start = grid.scrollLeft <= 1;
    const end = grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 1;
    setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
  };
  React.useEffect(() => {
    if (!scrollable) return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [scrollable]);
  const browse = direction => {
    const grid = gridRef.current;
    const cards = grid.querySelectorAll('.service-rate-card');
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : grid.clientWidth;
    grid.scrollBy({ left: direction * step, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const browseKey = event => {
    if (event.target !== gridRef.current) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      browse(event.key === 'ArrowRight' ? 1 : -1);
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      gridRef.current.scrollTo({ left: event.key === 'Home' ? 0 : gridRef.current.scrollWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
  };
  return <section className="service-rate-group" aria-labelledby={headingId}>
    <header><Heading id={headingId}>{group.title}</Heading><p>{group.description}</p></header>
    {scrollable && <div className="service-rate-group__browse">
      <p id={`${headingId}-browse`}>{group.services.length} services. Scroll to explore all options.</p>
      <div className="service-rate-group__controls">
        <IconButton icon={ArrowLeft} label={`Previous ${group.title.toLowerCase()} service`} disabled={edges.start} onClick={() => browse(-1)} aria-controls={`${headingId}-cards`} />
        <IconButton icon={ArrowRight} label={`Next ${group.title.toLowerCase()} service`} disabled={edges.end} onClick={() => browse(1)} aria-controls={`${headingId}-cards`} />
      </div>
    </div>}
    <div ref={gridRef} id={`${headingId}-cards`} className={`service-rate-grid${scrollable ? ' service-rate-grid--scroll' : ''}`} role={scrollable ? 'region' : undefined} aria-label={scrollable ? `${group.title} services` : undefined} aria-describedby={scrollable ? `${headingId}-browse` : undefined} tabIndex={scrollable ? 0 : undefined} onScroll={scrollable ? updateEdges : undefined} onKeyDown={scrollable ? browseKey : undefined}>{group.services.map(service => <ServiceRateCard key={service.id} service={service} variant={group.id} categoryLabel={categoryLabels[group.id] || group.title} headingLevel={headingLevel + 1} onInquiry={onInquiry} />)}</div>
  </section>;
};
