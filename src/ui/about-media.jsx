import { Button } from './controls.jsx';
import React from 'react';
import { AppIcon, X } from '../ui-icons.jsx';
import './about-media.css';
const FOCUSABLE_SELECTORS = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const CLUSTER_PARALLAX = [0.06, -0.05, 0.04];
export const AboutLightbox = ({ photo, onClose }) => {
  const dialogRef = React.useRef(null);
  React.useEffect(() => {
    const trigger = document.activeElement;
    const el = dialogRef.current;
    (el?.querySelector(FOCUSABLE_SELECTORS))?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab' || !el) return;
      const nodes = Array.from(el.querySelectorAll(FOCUSABLE_SELECTORS));
      if (!nodes.length) return;
      if (e.shiftKey && document.activeElement === nodes[0]) {
        e.preventDefault(); nodes[nodes.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === nodes[nodes.length - 1]) {
        e.preventDefault(); nodes[0].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      if (trigger && typeof trigger.focus === 'function') trigger.focus();
    };
  }, [onClose]);

  return (
    <div
      className="about-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
      ref={dialogRef}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Button variant="photo" type="button" className="about-lightbox__close" aria-label="Close" onClick={onClose}>
        <AppIcon icon={X} size={16} />
      </Button>
      <figure className="about-lightbox__figure">
        <img src={photo.src} alt={photo.alt} />
        <figcaption className="about-lightbox__caption">{photo.alt}</figcaption>
      </figure>
    </div>
  );
};

export const AboutTile = ({ photo: p, onOpen, parallax = 0, eager = false, className = '' }) => {
  if (!p) return null;
  return (
    <figure className={`about-tile ${className}`.trim()} data-parallax={parallax || undefined}>
      <Button variant="photo" type="button" className="about-tile__btn" onClick={() => onOpen(p)} aria-label={`View larger: ${p.alt}`}>
        <span className="about-frame">
          <img
            className="about-frame__img"
            src={p.src}
            alt={p.alt}
            width={p.width}
            height={p.height}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
        </span>
      </Button>
    </figure>
  );
};

export const AboutStack = ({ images, onOpen, eager = false, className = '', tilePrefix = 'about-stack__tile', photos }) => (
  <div className={`about-stack about-stack--${images.length} ${className}`.trim()}>
    {images.map((key, i) => (
      <AboutTile
        key={key}
        photo={photos[key]}
        onOpen={onOpen}
        eager={eager}
        parallax={CLUSTER_PARALLAX[i % CLUSTER_PARALLAX.length]}
        className={`${tilePrefix} ${tilePrefix}--${key}`}
      />
    ))}
  </div>
);
