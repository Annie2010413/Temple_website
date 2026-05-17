// Runtime config for puzzle frontend (committed — safe to deploy).
// Priority for API: window.PUZZLE_API_BASE > LOCAL_FLAG below
// Priority for Google Client ID: window.PUZZLE_GOOGLE_CLIENT_ID > auth-config.js > GOOGLE_CLIENT_ID below
(function () {
  // Toggle: true = local backend, false = Render production API
  const LOCAL_FLAG = false;

  const REMOTE_API_BASE = "https://temple-website-wmxr.onrender.com";
  const LOCAL_API_BASE = "http://localhost:5501";

  // Web Client ID (public; not a secret). Must match Render GOOGLE_CLIENT_ID.
  const GOOGLE_CLIENT_ID = "849811597506-ek7nmqbrf3bqks1m0pu4ms2o9ugdtm55.apps.googleusercontent.com";

  if (!window.PUZZLE_API_BASE) {
    window.PUZZLE_API_BASE = LOCAL_FLAG ? LOCAL_API_BASE : REMOTE_API_BASE;
  }

  if (!window.PUZZLE_GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID) {
    window.PUZZLE_GOOGLE_CLIENT_ID = GOOGLE_CLIENT_ID;
  }
})();
