// Centralized API Configuration
// This file handles dynamic detection of the backend URL for different environments.

const BASE_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || 
                 (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 
                 'http://localhost:3000';

// Export for module systems (Vite, Next.js, etc.)
export { BASE_URL };

// Global fallback for vanilla JS environments
if (typeof window !== 'undefined') {
  window.BASE_URL = BASE_URL;
}
