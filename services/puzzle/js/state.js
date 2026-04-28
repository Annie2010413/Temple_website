(() => {
  const AUTH_KEY = "puzzle_auth";
  const GUEST_PROGRESS_KEY = "puzzle_guest_progress";
  const API_BASE = window.PUZZLE_API_BASE || "http://localhost:5501";

  function sanitizeProgress(raw) {
    return {
      unlockedStory: Math.max(1, Number(raw?.unlockedStory) || 1),
      unlockedChallenge: Math.max(1, Number(raw?.unlockedChallenge) || 1)
    };
  }

  function getGuestProgress() {
    try {
      const raw = JSON.parse(localStorage.getItem(GUEST_PROGRESS_KEY) || "{}");
      return sanitizeProgress(raw);
    } catch (_error) {
      return { unlockedStory: 1, unlockedChallenge: 1 };
    }
  }

  function setGuestProgress(progress) {
    localStorage.setItem(GUEST_PROGRESS_KEY, JSON.stringify(sanitizeProgress(progress)));
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
    const auth = getAuth();
    if (!auth?.token) return getGuestProgress();
    try {
      return sanitizeProgress(await getCloudProgress());
    } catch (error) {
      if (String(error?.message || "").includes("401")) {
        clearAuth();
        document.dispatchEvent(new CustomEvent("puzzle-auth-changed"));
      }
      return getGuestProgress();
    }
  }

  async function updateProgress(next) {
    const auth = getAuth();
    if (auth?.token) {
      try {
        const saved = await putCloudProgress(sanitizeProgress(next));
        return sanitizeProgress(saved);
      } catch (error) {
        if (String(error?.message || "").includes("401")) {
          clearAuth();
          document.dispatchEvent(new CustomEvent("puzzle-auth-changed"));
        }
        return getGuestProgress();
      }
    } else {
      const current = getGuestProgress();
      const merged = {
        unlockedStory: Math.max(current.unlockedStory, Number(next.unlockedStory) || 1),
        unlockedChallenge: Math.max(current.unlockedChallenge, Number(next.unlockedChallenge) || 1)
      };
      setGuestProgress(merged);
      return merged;
    }
  }

  async function submitChallengeAnswer(stage, answer) {
    const normalizedStage = Number(stage) || 1;
    const res = await authedFetch("/api/challenge/submit", {
      method: "POST",
      body: JSON.stringify({ stage: normalizedStage, answer })
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearAuth();
        document.dispatchEvent(new CustomEvent("puzzle-auth-changed"));
      }
      throw new Error("Challenge validation failed");
    }

    const data = await res.json();
    if (!data.correct) return data;

    const merged = sanitizeProgress({
      unlockedStory: data.unlockedStory,
      unlockedChallenge: data.unlockedChallenge
    });

    if (!isLoggedIn()) {
      const current = getGuestProgress();
      const localMerged = {
        unlockedStory: Math.max(current.unlockedStory, merged.unlockedStory),
        unlockedChallenge: Math.max(current.unlockedChallenge, merged.unlockedChallenge)
      };
      setGuestProgress(localMerged);
      return { correct: true, ...localMerged };
    }

    return { correct: true, ...merged };
  }

  function isLoggedIn() {
    return Boolean(getAuth()?.token);
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
    try {
      return sanitizeProgress(await getCloudProgress());
    } catch (_error) {
      return { unlockedStory: 1, unlockedChallenge: 1 };
    }
  }

  function signOut() {
    clearAuth();
  }

  window.PuzzleState = {
    getAuth,
    isLoggedIn,
    getProgress,
    updateProgress,
    submitChallengeAnswer,
    signInWithGoogleIdToken,
    signOut,
    syncProgressAfterSignIn,
    getLocalProgress: getGuestProgress
  };
})();
