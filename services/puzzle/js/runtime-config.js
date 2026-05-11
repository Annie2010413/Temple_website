// Runtime API config for puzzle frontend.
// Priority:
// 1) window.PUZZLE_API_BASE (set manually before this script)
// 2) localhost defaults for development
// 3) same-origin /api for deployment
(function () {
  if (window.PUZZLE_API_BASE) return;

  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  if (isLocal) {
    window.PUZZLE_API_BASE = "http://localhost:5501";
    return;
  }

  // If frontend/backend are on different domains,
  // replace this with your backend URL.
  // Example: window.PUZZLE_API_BASE = "https://api.your-domain.com";
  window.PUZZLE_API_BASE = `${window.location.origin}/api`;
})();
