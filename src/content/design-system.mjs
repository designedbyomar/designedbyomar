// Order, labels and anchors are shared by the page, its navigation and static summary.
const section = (id, title, summary, renderer = id) => ({ id, title, summary, renderer });

export const DESIGN_SYSTEM_GROUPS = [
  { id: 'overview', title: 'Overview', icon: 'book', sections: [
    section('overview', 'Overview', "The system powers Omar Tavarez's portfolio, case-study storytelling, interaction patterns, motion language, and public design-engineering workflow."),
    section('what-it-powers', 'What it powers', 'Shared foundations and components support the portfolio, its services, and this reference.'),
  ] },
  { id: 'foundations', title: 'Foundations', icon: 'palette', shortcut: 'Color, type, spacing, layout, and surface rules.', sections: [
    section('foundations', 'Foundations overview', 'The portfolio and this reference share one token source. Start with semantic roles, then inspect the examples and exact values.'),
    section('color', 'Color and themes', 'Palette colors establish the identity. Semantic foreground and surface roles adapt to the current theme; use them for readable interface content.'),
    section('service-gradients', 'Service gradients', 'Full-strength category backgrounds pair with category-specific title colors and translucent badges. The inquiry form uses a related three-color edge.'),
    section('typography', 'Typography', 'Geist handles editorial hierarchy. Geist Mono identifies useful labels, metadata, and source references.'),
    section('spacing', 'Spacing', 'Compact spacing connects controls and content. Larger layout bands separate sections.'),
    section('layout-breakpoints', 'Layout and breakpoints', 'Layouts change when their content needs room. These are existing component boundaries, not interchangeable device labels.'),
    section('radius-elevation', 'Radius and elevation', 'Radius identifies controls, panels, and media. Theme-aware shadows separate surfaces without heavy framing.'),
    section('foundation-specimens', 'Opacity and layering', 'Opacity controls emphasis; layering keeps menus, sticky navigation, and overlays in a predictable order.'),
    section('blur', 'Blur', 'Blur supports translucent headers and overlays. Keep a readable surface underneath when blur is unavailable.'),
    section('icons', 'Icons', 'Lucide icons use a consistent stroke. Pair unfamiliar symbols with text and reserve gradient strokes for signature signals.'),
  ] },
  { id: 'components', title: 'Components', icon: 'box', shortcut: 'Reusable controls, badges, fields, cards, and navigation.', sections: [
    section('components', 'Components overview', 'These examples use the same presentation components as the portfolio. Local fixtures demonstrate behavior without sending requests.'),
    section('buttons', 'Buttons and links', 'Buttons perform actions; links navigate. Use one primary action per local decision and keep focus and disabled states clear.'),
    section('copy-actions', 'Copy actions', 'Copy controls confirm success only after the clipboard write succeeds. Their labels and dimensions remain stable.'),
    section('badges-tags', 'Badges and tags', 'Tags describe work; category badges identify services. Neither is a button or a substitute for a heading.'),
    section('form-fields', 'Form fields', 'Permanent labels, visible hints, and associated errors keep fields understandable before and after typing.'),
    section('select-dropdowns', 'Select dropdowns', 'Use the shared select-only dropdown for a known set of choices. The current value and active option are separate states.'),
    section('cards-accordions', 'Disclosures', 'Use a disclosure when its heading predicts the content. Keep essential prices, scope, and actions visible outside collapsed details.'),
    section('contact-cards', 'Contact cards', 'A full-card destination and an independent copy control offer two clear actions without nesting interactive elements.'),
    section('case-study-covers', 'Case-study cards', 'A cover, metadata, summary, and tags help readers choose a case study. The entire card is one destination.'),
    section('navigation-drawers', 'Navigation and mobile menu', 'Production navigation connects Work, Design System, About, Ask, and Contact. The reference sidebar serves this page only.'),
    section('footer-system', 'Footer', 'The shared footer combines site destinations, profile links, and a restrained signature animation.'),
  ] },
  { id: 'patterns', title: 'Patterns', icon: 'search', shortcut: 'How shared pieces become complete portfolio experiences.', sections: [
    section('patterns', 'Patterns overview', 'Patterns assemble components around a reader’s task. Page-specific storytelling remains authored content.'),
    section('hero-system', 'Hero composition', 'Explain the work before asking the reader to explore. The homepage composition remains page-specific.'),
    section('case-study-blocks', 'Case-study content', 'Shared body blocks preserve authored headings, paragraphs, lists, quotes, callouts, images, and galleries.'),
    section('about-media', 'About photos and lightbox', 'Photo stacks support the story, flatten on narrow screens, and open into a keyboard-accessible lightbox.'),
    section('service-lists', 'Service cards and groups', 'Category, price, timing, fit, inclusions, scope, and action form a consistent reading order.'),
    section('inquiry-form', 'Inquiry form', 'Labelled fields, clear verification status, and a visible email fallback help people complete an inquiry.'),
    section('ask', 'Ask', 'Ask connects questions to reviewed answers and published work. Drafts are labelled; missing information and temporary failures have different recovery paths.'),
    section('github-activity', 'GitHub activity', 'The contribution calendar distinguishes loading, available data, and an unavailable source without inventing activity.'),
    section('cookie-banner', 'Cookie banner', 'Consent offers clear accept and decline actions. This example records a local choice without changing your analytics consent.'),
    section('privacy-consent', 'Privacy and consent', 'Keep privacy explanations close to the decision and link to the policy. Production persistence belongs to the page controller.'),
  ] },
  { id: 'motion', title: 'Motion', icon: 'zap', shortcut: 'Timing, signature effects, and stable alternatives.', sections: [
    section('motion', 'Motion overview', 'Motion supports orientation, feedback, and personality. Reading and completing a task must never depend on animation.'),
    section('motion-tokens', 'Motion tokens', 'Shared durations and easing curves make related interactions feel consistent.'),
    section('logo-loader', 'Logo and loader', 'The navigation logo responds to hover. The homepage loader is a separate, page-specific opening sequence.'),
    section('alien-arrival', 'Alien arrival', 'The alien arrival is a small signature moment. Replay it here without restarting the page.'),
    section('pixel-orbit', 'Pixel orbit', 'The ambient square-particle field stays pointer-safe and respects the current theme and motion preference.'),
    section('hover-reveal', 'Hover and reveal', 'Hover confirms interactivity; focus must communicate the same affordance. Reveals must not hide essential content.'),
    section('reduced-motion', 'Reduced motion', 'Keep final states readable, stop ambient movement, and use immediate navigation when reduced motion is requested.'),
  ] },
  { id: 'content', title: 'Content', icon: 'type', sections: [
    section('content', 'Voice and tone', 'Write in specific, direct language. Describe decisions and evidence without inflated claims or generic portfolio copy.'),
    section('case-study-anatomy', 'Case-study anatomy', 'Help the reader evaluate the problem, Omar’s role, the decisions, and the result.'),
    section('metadata-labels', 'Labels and metadata', 'Use labels to add orientation, not decoration. Identify the client, role, period, or source when it helps the reader.'),
    section('microcopy', 'Microcopy', 'Name the action and explain the next step. Recovery messages should preserve what the person has already entered.'),
  ] },
  { id: 'accessibility', title: 'Accessibility', icon: 'shield', shortcut: 'Keyboard access, contrast, touch, and clear feedback.', sections: [
    section('accessibility', 'Accessibility overview', 'Accessible behavior is part of each component. Verify keyboard access, readable contrast, clear labels, and reduced motion in both themes.'),
    section('focus-keyboard', 'Focus and keyboard', 'Keep focus visible and predictable when navigating, opening content, and recovering from errors.'),
    section('contrast-touch', 'Contrast and touch', 'Measure contrast in context. Text, focus indicators, and controls need to remain usable across themes and input methods.'),
    section('forms-announcements', 'Forms and announcements', 'Associate errors with fields and announce results without moving focus unnecessarily.'),
  ] },
  { id: 'resources', title: 'Resources', icon: 'book', sections: [
    section('resources', 'Source files', 'Inspect the shared implementation and the guidelines that keep the reference aligned with production.'),
    section('token-reference', 'Token reference', 'Exact authored values come from the shared stylesheet and follow the current theme. Copy a token name to reuse its role.'),
    section('audit-notes', 'Component coverage', 'This inventory distinguishes shared production components, page-specific compositions, and documentation utilities.'),
  ] },
];

export const DESIGN_SYSTEM_SECTIONS = DESIGN_SYSTEM_GROUPS.flatMap(group => group.sections.map(item => ({ ...item, group: group.id })));
export const DESIGN_SYSTEM_BY_ID = Object.fromEntries(DESIGN_SYSTEM_SECTIONS.map(item => [item.id, item]));

// Build-only summaries live here so the homepage never imports the documentation registry.
export const DESIGN_SYSTEM_PAGE_COPY = {
  intro: DESIGN_SYSTEM_GROUPS[0].sections[0].summary,
  sections: Object.fromEntries(DESIGN_SYSTEM_GROUPS.slice(1).map(group => [group.id, {
    title: group.sections[0].title,
    description: group.sections[0].summary,
  }])),
};
