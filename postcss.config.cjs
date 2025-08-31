module.exports = {
  plugins: {
    "postcss-import": {},
    "tailwindcss/nesting": {},
    tailwindcss: {},
    autoprefixer: {},
    "postcss-prefix-selector": {
      prefix: '.vibe-container',
      transform: (prefix, selector) => {
        // Skip root-level rules, keyframes, and our container itself
        if (selector.match(/^@|:root|\.vibe-container/)) {
          return selector;
        }
        // Handle universal selector for Tailwind base layer
        if (selector === '*' || selector === '*, ::before, ::after') {
          return `${prefix} ${selector}`;
        }
        // Handle pseudo-elements
        if (selector === '::before' || selector === '::after') {
          return `${prefix} *${selector}`;
        }
        // For extension safety, scope everything under our container
        return `${prefix} ${selector}`;
      }
    },
    // eslint-disable-next-line no-undef
    cssnano: typeof process !== 'undefined' && process.env.NODE_ENV === "production" ? {} : false,
  },
};
