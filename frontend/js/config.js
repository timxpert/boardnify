// frontend/js/config.js
// Centralized configuration for the Boardnify API.
// Fallback to localhost:3000 for local development.

let BASE_URL = '';
if (typeof window !== 'undefined') {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    BASE_URL = 'http://localhost:3000';
  } else {
    BASE_URL = ''; // Relative path on Vercel serves via same domain
  }
}

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
