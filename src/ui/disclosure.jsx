import React from 'react';
import { AppIcon, ChevronDown } from '../ui-icons.jsx';
import './disclosure.css';

export const Disclosure = ({ heading, children, defaultExpanded = false, headingLevel = 2, id }) => {
  const generatedId = React.useId();
  const buttonId = id || generatedId;
  const [expanded, setExpanded] = React.useState(defaultExpanded);
  const Heading = `h${headingLevel}`;
  return <div className="disclosure" data-expanded={expanded}>
    <Heading className="disclosure__heading"><button id={buttonId} type="button" aria-expanded={expanded} aria-controls={`${buttonId}-panel`} onClick={() => setExpanded(value => !value)}>
      <span>{heading}</span><AppIcon icon={ChevronDown} />
    </button></Heading>
    <div id={`${buttonId}-panel`} className="disclosure__panel" role="region" aria-labelledby={buttonId} hidden={!expanded}>{children}</div>
  </div>;
};
