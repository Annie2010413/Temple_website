(() => {
  const AUTH_KEY = "puzzle_auth";
  const PROGRESS_KEY = "puzzle_game_progress";
  const API_BASE = window.PUZZLE_API_BASE || "http://localhost:5501";

  function getLocalProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}");
      return {
        unlockedStory: Math.max(1, Number(raw.unlockedStory) || 1),
        unlockedChallenge: Math.max(1, Number(raw.unlockedChallenge) || 1)
      };
    } catch (_error) {
      return { unlockedStory: 1, unlockedChallenge: 1 };
    }
  }

  function setLocalProgress(progress) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      unlockedStory: Math.max(1, Number(progress.unlockedStory) || 1),
      unlockedChallenge: Math.max(1, Number(progress.unlockedChallenge) || 1)
    }));
  }

  function getAuth() {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    } catch (_error) {
      return null;
    }
  }

  function setAuth(auth) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  }

  function clearAuth() {
    localStorage.removeItem(AUTH_KEY);
  }

  async function authedFetch(path, options = {}) {
    const auth = getAuth();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
    return fetch(`${API_BASE}${path}`, { ...options, headers });
  }

  async function getCloudProgress() {
    const res = await authedFetch("/api/progress");
    if (!res.ok) throw new Error("Failed to load cloud progress");
    return res.json();
  }

  async function putCloudProgress(progress) {
    const res = await authedFetch("/api/progress", {
      method: "PUT",
      body: JSON.stringify(progress)
    });
    if (!res.ok) throw new Error("Failed to save cloud progress");
    return res.json();
  }

  async function getProgress() {
    const local = getLocalProgress();
    const auth = getAuth();
    if (!auth?.token) return local;
    try {
      const cloud = await getCloudProgress();
      const merged = {
        unlockedStory: Math.max(local.unlockedStory, Number(cloud.unlockedStory) || 1),
        unlockedChallenge: Math.max(local.unlockedChallenge, Number(cloud.unlockedChallenge) || 1)
      };
      setLocalProgress(merged);
      return merged;
    } catch (_error) {
      return local;
    }
  }

  async function updateProgress(next) {
    const current = await getProgress();
    const merged = {
      unlockedStory: Math.max(current.unlockedStory, Number(next.unlockedStory) || 1),
      unlockedChallenge: Math.max(current.unlockedChallenge, Number(next.unlockedChallenge) || 1)
    };
    setLocalProgress(merged);

    const auth = getAuth();
    if (auth?.token) {
      try {
        await putCloudProgress(merged);
      } catch (_error) {
        // Keep local progress when cloud sync fails.
      }
    }
    return merged;
  }

  async function signInWithGoogleIdToken(idToken) {
    const res = await fetch(`${API_BASE}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!res.ok) throw new Error("Google sign-in failed");
    const data = await res.json();
    setAuth({ token: data.token, user: data.user });
    await syncProgressAfterSignIn();
    return data.user;
  }

  async function syncProgressAfterSignIn() {
    const local = getLocalProgress();
    try {
      const cloud = await getCloudProgress();
      const merged = {
        unlockedStory: Math.max(local.unlockedStory, Number(cloud.unlockedStory) || 1),
        unlockedChallenge: Math.max(local.unlockedChallenge, Number(cloud.unlockedChallenge) || 1)
      };
      setLocalProgress(merged);
      await putCloudProgress(merged);
      return merged;
    } catch (_error) {
      return local;
    }
  }

  function signOut() {
    clearAuth();
  }

  window.PuzzleState = {
    getAuth,
    isLoggedIn: () => Boolean(getAuth()?.token),
    getProgress,
    updateProgress,
    signInWithGoogleIdToken,
    signOut,
    syncProgressAfterSignIn,
    getLocalProgress
  };
})();
