(() => {
  const AUTH_KEY = "puzzle_auth";
  const GUEST_PROGRESS_KEY = "puzzle_guest_progress";
  const INVENTORY_KEY = "puzzle_inventory";
  const API_BASE = window.PUZZLE_API_BASE || "http://localhost:5501";
  const MAX_STORY = 6;
  const MAX_CHALLENGE = 5;
  const DEFAULT_PROGRESS = { unlockedStory: 1, unlockedChallenge: 1 };

  function getInventory() {
    try {
      const raw = JSON.parse(localStorage.getItem(INVENTORY_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (_error) {
      return [];
    }
  }

  function setInventory(items) {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(Array.isArray(items) ? items : []));
  }

  function addInventoryItem(item) {
    if (!item || !item.id) return getInventory();
    const items = getInventory();
    if (items.find((existing) => existing.id === item.id)) return items;
    const next = items.concat([{
      id: String(item.id),
      name: String(item.name || "未命名道具"),
      image: String(item.image || ""),
      description: String(item.description || ""),
      acquiredAt: Date.now()
    }]);
    setInventory(next);
    document.dispatchEvent(new CustomEvent("puzzle-inventory-changed", { detail: { items: next } }));
    return next;
  }

  function clearInventory() {
    setInventory([]);
    document.dispatchEvent(new CustomEvent("puzzle-inventory-changed", { detail: { items: [] } }));
  }

  function sanitizeProgress(raw) {
    return {
      unlockedStory: Math.min(MAX_STORY, Math.max(1, Number(raw?.unlockedStory) || 1)),
      unlockedChallenge: Math.min(MAX_CHALLENGE, Math.max(1, Number(raw?.unlockedChallenge) || 1))
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

  async function getProgress() {
    const auth = getAuth();
    const local = getGuestProgress();
    if (!auth?.token) return local;
    try {
      const cloud = sanitizeProgress(await getCloudProgress());
      // Never let a stale cloud response roll back progress we already advanced locally
      // (e.g. right after challenge submit, before the next page gate runs).
      const merged = sanitizeProgress({
        unlockedStory: Math.max(local.unlockedStory, cloud.unlockedStory),
        unlockedChallenge: Math.max(local.unlockedChallenge, cloud.unlockedChallenge)
      });
      setGuestProgress(merged);
      return merged;
    } catch (error) {
      if (String(error?.message || "").includes("401")) {
        clearAuth();
        document.dispatchEvent(new CustomEvent("puzzle-auth-changed"));
      }
      return getGuestProgress();
    }
  }

  async function updateProgress(next) {
    const current = getGuestProgress();
    const merged = sanitizeProgress({
      unlockedStory: Math.max(current.unlockedStory, Number(next.unlockedStory) || 1),
      unlockedChallenge: Math.max(current.unlockedChallenge, Number(next.unlockedChallenge) || 1)
    });
    setGuestProgress(merged);
    return merged;
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
    const expectedProgress = sanitizeProgress({
      unlockedStory: normalizedStage + 1,
      unlockedChallenge: normalizedStage + 1
    });

    if (!isLoggedIn()) {
      const current = getGuestProgress();
      const localMerged = {
        unlockedStory: Math.max(current.unlockedStory, merged.unlockedStory, expectedProgress.unlockedStory),
        unlockedChallenge: Math.max(current.unlockedChallenge, merged.unlockedChallenge, expectedProgress.unlockedChallenge)
      };
      setGuestProgress(localMerged);
      return { correct: true, ...localMerged };
    }

    const cloudMerged = sanitizeProgress({
      unlockedStory: Math.max(merged.unlockedStory, expectedProgress.unlockedStory),
      unlockedChallenge: Math.max(merged.unlockedChallenge, expectedProgress.unlockedChallenge)
    });
    setGuestProgress(cloudMerged);
    return { correct: true, ...cloudMerged };
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
      const cloud = sanitizeProgress(await getCloudProgress());
      setGuestProgress(cloud);
      return cloud;
    } catch (_error) {
      return getGuestProgress();
    }
  }

  function resetGuestSession() {
    setGuestProgress(DEFAULT_PROGRESS);
    clearInventory();
  }

  function signOut() {
    clearAuth();
    resetGuestSession();
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
    getLocalProgress: getGuestProgress,
    getInventory,
    addInventoryItem,
    clearInventory
  };
})();
