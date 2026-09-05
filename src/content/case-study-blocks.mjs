// Single source of truth for the migrated case-study block model.
//
// Two renderers consume this data: the React component in src/main.jsx and the static
// serializer in postbuild.js. They previously guarded it differently — postbuild coerced
// a missing `items` to an empty list and clamped invalid heading levels, while React
// called `.map()` on it directly and interpolated the level straight into a tag name.
//
// That asymmetry fails in the worst direction: a malformed block is quietly dropped from
// the static HTML, so the build and its tests pass, and then crashes the client render.
// Normalizing once, here, keeps the two in step.

export const HEADING_LEVELS = [2, 3, 4];
export const DEFAULT_HEADING_LEVEL = 3;

const text = (value) => (typeof value === 'string' ? value.trim() : '');

const items = (value) => (Array.isArray(value)
  ? value.map(text).filter(Boolean)
  : []);

export const normalizeBlock = (block) => {
  if (!block || typeof block !== 'object') return null;

  switch (block.type) {
    case 'heading': {
      const value = text(block.text);
      if (!value) return null;
      return {
        type: 'heading',
        level: HEADING_LEVELS.includes(block.level) ? block.level : DEFAULT_HEADING_LEVEL,
        text: value,
      };
    }

    case 'paragraph': {
      const value = text(block.text);
      return value ? { type: 'paragraph', text: value } : null;
    }

    case 'list': {
      const values = items(block.items);
      return values.length ? { type: 'list', items: values } : null;
    }

    case 'quote': {
      const value = text(block.text);
      if (!value) return null;
      const attribution = text(block.attribution);
      return attribution
        ? { type: 'quote', text: value, attribution }
        : { type: 'quote', text: value };
    }

    case 'callout': {
      const values = items(block.items);
      const title = text(block.title);
      if (!values.length && !title) return null;
      return { type: 'callout', title, items: values };
    }

    case 'image': {
      const src = text(block.src);
      if (!src) return null;
      return {
        type: 'image',
        src,
        alt: text(block.alt),
        caption: text(block.caption),
      };
    }

    // A run of related images shown side by side rather than stacked. Each entry is
    // normalized as an image, so a malformed one is dropped rather than breaking the row.
    case 'gallery': {
      const images = Array.isArray(block.images)
        ? block.images.map((image) => normalizeBlock({ ...image, type: 'image' })).filter(Boolean)
        : [];
      return images.length ? { type: 'gallery', images } : null;
    }

    default:
      return null;
  }
};

// Returns a list where every block is renderable: `items` is always an array, heading
// levels are always valid, and anything unrecognised or empty has been dropped.
export const normalizeBlocks = (body) => (Array.isArray(body)
  ? body.map(normalizeBlock).filter(Boolean)
  : []);
