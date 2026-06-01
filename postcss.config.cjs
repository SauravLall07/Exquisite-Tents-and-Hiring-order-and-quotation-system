module.exports = {
  plugins: {
    // When using the Tailwind CDN for development we don't need the Tailwind PostCSS plugin.
    // Keep autoprefixer enabled for vendor prefixes if installed.
    autoprefixer: {},
  },
}
