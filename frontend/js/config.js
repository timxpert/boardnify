// frontend/js/config.js
// Centralized configuration for the Boardnify API.
// Fallback to localhost:3000 for local development.

const BASE_URL = 'https://boardnify-backend.onrender.com';

// Attach BASE_URL to window if in a browser context for global access
if (typeof window !== 'undefined') {
  window.BASE_URL = BASE_URL;
}

// Export for module systems (Vite / Node / etc)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BASE_URL };
} else if (typeof exports !== 'undefined') {
  exports.BASE_URL = BASE_URL;
}
