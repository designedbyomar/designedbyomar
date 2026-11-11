// Read authored custom properties directly from the two theme blocks in the CSS.
// No second catalogue of literal values is maintained by the documentation.
export const readTokenDefinitions = (source, theme = 'light') => {
  const declarations = block => Object.fromEntries([...block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));
  const root = source.match(/:root\s*\{([^}]+)\}/)?.[1] || '';
  const dark = source.match(/\[data-theme="dark"\]\s*\{([^}]+)\}/)?.[1] || '';
  return { ...declarations(root), ...(theme === 'dark' ? declarations(dark) : {}) };
};

export const TOKEN_FAMILIES = [
  ['Color and surfaces', /^--(color-|fg-|bg-|gradient-|rate-)/],
  ['Typography', /^--(font-|line-height-|tracking-)/],
  ['Spacing and layout', /^--(space-|layout-|content-|size-|control-|select-|ask-|scroll-)/],
  ['Radius and elevation', /^--(radius-|shadow-|border-)/],
  ['Opacity and blur', /^--(opacity-|blur-)/],
  ['Motion', /^--(duration-|easing-)/],
  ['Layering', /^--z-/],
];
