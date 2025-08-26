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
        // For extension safety, scope everything under our container
        return `${prefix} ${selector}`;
      }
    },
    cssnano: process.env.NODE_ENV === "production" ? {} : false,
  },
};
