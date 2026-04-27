import React from 'react';

export const AlienPixel = ({ size = '1.4em', title = 'Alien', style, ...rest }) => (
    <svg
        viewBox="0 0 11 8"
        width={size}
        height="auto"
        role="img"
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
        style={{
            display: 'inline-block',
            verticalAlign: '-0.15em',
            color: 'var(--color-develop-blue)',
            ...style,
        }}
        {...rest}
    >
        <title>{title}</title>
        <rect x="3" y="0" width="1" height="1" fill="currentColor" />
        <rect x="7" y="0" width="1" height="1" fill="currentColor" />
        <rect x="4" y="1" width="1" height="1" fill="currentColor" />
        <rect x="6" y="1" width="1" height="1" fill="currentColor" />
        <rect x="2" y="2" width="7" height="1" fill="currentColor" />
        <rect x="1" y="3" width="2" height="1" fill="currentColor" />
        <rect x="4" y="3" width="3" height="1" fill="currentColor" />
        <rect x="8" y="3" width="2" height="1" fill="currentColor" />
        <rect x="0" y="4" width="11" height="1" fill="currentColor" />
        <rect x="0" y="5" width="1" height="1" fill="currentColor" />
        <rect x="2" y="5" width="7" height="1" fill="currentColor" />
        <rect x="10" y="5" width="1" height="1" fill="currentColor" />
        <rect x="0" y="6" width="1" height="1" fill="currentColor" />
        <rect x="2" y="6" width="1" height="1" fill="currentColor" />
        <rect x="8" y="6" width="1" height="1" fill="currentColor" />
        <rect x="10" y="6" width="1" height="1" fill="currentColor" />
        <rect x="3" y="7" width="2" height="1" fill="currentColor" />
        <rect x="6" y="7" width="2" height="1" fill="currentColor" />
    </svg>
);

export const UFO = ({ size = '1.8em', style }) => (
    <svg
        viewBox="0 0 11 5"
        width={size}
        height="auto"
        aria-hidden="true"
        shapeRendering="crispEdges"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', ...style }}
    >
        <g fill="var(--color-ship-red)">
            <rect x="3" y="0" width="5" height="1" />
            <rect x="2" y="1" width="7" height="1" />
            <rect x="0" y="2" width="11" height="1" />
            <rect x="1" y="3" width="9" height="1" />
        </g>
        <g fill="var(--color-preview-pink)">
            <rect x="2" y="4" width="1" height="1" />
            <rect x="4" y="4" width="1" height="1" />
            <rect x="6" y="4" width="1" height="1" />
            <rect x="8" y="4" width="1" height="1" />
        </g>
    </svg>
);

export const footerAlienStyles = `
  .footer-alien-arrival {
    --faa-ufo-w: 1.8em;
    position: relative;
    display: inline-block;
    width: 1.4em;
    height: 1em;
    vertical-align: -0.15em;
    overflow: visible;
    flex: 0 0 auto;
    line-height: 0;
  }
  .footer-alien-arrival .faa-ufo {
    position: absolute;
    left: 50%;
    top: -1.25em;
    width: var(--faa-ufo-w);
    transform: translate(-50%, 0) translateX(-260%);
    opacity: 0;
    pointer-events: none;
    will-change: transform, opacity;
  }
  .footer-alien-arrival .faa-beam {
    position: absolute;
    left: 50%;
    top: -0.35em;
    width: 1.1em;
    height: 1.25em;
    transform: translateX(-50%) scaleY(0);
    transform-origin: top center;
    opacity: 0;
    background: linear-gradient(180deg, color-mix(in oklab, var(--color-preview-pink) 70%, transparent), color-mix(in oklab, var(--color-preview-pink) 8%, transparent));
    clip-path: polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%);
    mix-blend-mode: screen;
    pointer-events: none;
    will-change: transform, opacity;
  }
  .footer-alien-arrival .faa-alien {
    position: absolute;
    left: 50%;
    bottom: -0.05em;
    transform: translate(-50%, 0);
    line-height: 0;
    opacity: 0;
    will-change: transform, opacity;
  }
  .footer-alien-arrival[data-playing="true"] .faa-alien { opacity: 1; }
  @media (prefers-reduced-motion: no-preference) {
    .footer-alien-arrival[data-playing="true"] .faa-ufo {
      animation: faa-ufo-arrive 1.0s cubic-bezier(.2,.7,.2,1) forwards, faa-ufo-leave 0.9s cubic-bezier(.6,.0,.7,.3) 2.0s forwards;
    }
    .footer-alien-arrival[data-playing="true"] .faa-beam { animation: faa-beam-pulse 1.1s ease-in-out 0.9s forwards; }
    .footer-alien-arrival[data-playing="true"] .faa-alien { animation: faa-alien-land 0.5s cubic-bezier(.2,.9,.3,1.4) 1.4s both; }
  }
  @keyframes faa-ufo-arrive { from { transform: translate(-50%, 0) translateX(-260%); opacity: 0; } to { transform: translate(-50%, 0) translateX(0); opacity: 1; } }
  @keyframes faa-ufo-leave { from { transform: translate(-50%, 0) translateX(0); opacity: 1; } to { transform: translate(-50%, 0) translateX(280%); opacity: 0; } }
  @keyframes faa-beam-pulse { 0% { transform: translateX(-50%) scaleY(0); opacity: 0; } 25% { transform: translateX(-50%) scaleY(1); opacity: 0.85; } 75% { transform: translateX(-50%) scaleY(1); opacity: 0.55; } 100% { transform: translateX(-50%) scaleY(0); opacity: 0; } }
  @keyframes faa-alien-land { 0% { opacity: 0; transform: translate(-50%, -0.6em) scale(0.55); } 60% { opacity: 1; transform: translate(-50%, 0.05em) scale(1.05); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
`;

export const FooterArrival = ({ played, ufoSize = '1.8em', alienSize = '1.4em', style }) => (
    <span className="footer-alien-arrival" data-playing={played ? 'true' : 'false'} style={style}>
        <span className="faa-ufo" aria-hidden="true">
            <UFO size={ufoSize} />
        </span>
        <span className="faa-beam" aria-hidden="true" />
        <span className="faa-alien">
            <AlienPixel size={alienSize} style={{ verticalAlign: 'top' }} />
        </span>
    </span>
);