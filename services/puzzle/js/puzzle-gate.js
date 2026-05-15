(() => {
  const LOCK_CLASS = "puzzle-gate-pending";

  function lockPage() {
    if (!document.documentElement.classList.contains(LOCK_CLASS)) {
      document.documentElement.classList.add(LOCK_CLASS);
    }
  }

  function unlockPage() {
    document.documentElement.classList.remove(LOCK_CLASS);
  }

  if (!document.getElementById("puzzle-gate-style")) {
    const style = document.createElement("style");
    style.id = "puzzle-gate-style";
    style.textContent = `html.${LOCK_CLASS} body { visibility: hidden; }`;
    document.head.appendChild(style);
  }

  function readLocalProgress() {
    if (window.PuzzleState?.getLocalProgress) {
      return window.PuzzleState.getLocalProgress();
    }
    return { unlockedStory: 1, unlockedChallenge: 1 };
  }

  function redirectTo(url) {
    window.location.replace(url);
  }

  function resolveChallengeStage(requested, unlockedChallenge) {
    const unlocked = Math.max(1, Number(unlockedChallenge) || 1);
    const allowed = Math.min(Math.max(1, requested), unlocked);
    return { allowed, denied: requested !== allowed };
  }

  function resolveStoryChapter(requested, unlockedStory) {
    const unlocked = Math.max(1, Number(unlockedStory) || 1);
    const allowed = Math.min(Math.max(1, requested), unlocked);
    return { allowed, denied: requested !== allowed };
  }

  function resolveArAccess(requested, unlockedChallenge) {
    const unlocked = Math.max(1, Number(unlockedChallenge) || 1);
    const allowedStage = Math.min(5, unlocked);
    const denied = requested !== 5 || unlocked < 5;
    return { allowedStage, denied };
  }

  async function ensureChallengeStage(requested, redirectBase = "./index.html") {
    const local = readLocalProgress();
    const localCheck = resolveChallengeStage(requested, local.unlockedChallenge);
    if (localCheck.denied) {
      redirectTo(`${redirectBase}?stage=${localCheck.allowed}`);
      return { ok: false };
    }

    if (window.PuzzleState?.isLoggedIn?.()) {
      const cloud = await window.PuzzleState.getProgress();
      const cloudCheck = resolveChallengeStage(requested, cloud.unlockedChallenge);
      if (cloudCheck.denied) {
        redirectTo(`${redirectBase}?stage=${cloudCheck.allowed}`);
        return { ok: false };
      }
      return { ok: true, progress: cloud };
    }

    return { ok: true, progress: local };
  }

  async function ensureStoryChapter(requested, redirectBase = "./index.html") {
    const local = readLocalProgress();
    const localCheck = resolveStoryChapter(requested, local.unlockedStory);
    if (localCheck.denied) {
      redirectTo(`${redirectBase}?chapter=${localCheck.allowed}`);
      return { ok: false };
    }

    if (window.PuzzleState?.isLoggedIn?.()) {
      const cloud = await window.PuzzleState.getProgress();
      const cloudCheck = resolveStoryChapter(requested, cloud.unlockedStory);
      if (cloudCheck.denied) {
        redirectTo(`${redirectBase}?chapter=${cloudCheck.allowed}`);
        return { ok: false };
      }
      return { ok: true, progress: cloud };
    }

    return { ok: true, progress: local };
  }

  async function ensureArScanner(requested, redirectBase = "./index.html") {
    const local = readLocalProgress();
    const localCheck = resolveArAccess(requested, local.unlockedChallenge);
    if (localCheck.denied) {
      redirectTo(`${redirectBase}?stage=${localCheck.allowedStage}`);
      return { ok: false };
    }

    if (window.PuzzleState?.isLoggedIn?.()) {
      const cloud = await window.PuzzleState.getProgress();
      const cloudCheck = resolveArAccess(requested, cloud.unlockedChallenge);
      if (cloudCheck.denied) {
        redirectTo(`${redirectBase}?stage=${cloudCheck.allowedStage}`);
        return { ok: false };
      }
      return { ok: true, progress: cloud };
    }

    return { ok: true, progress: local };
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function runBodyGate() {
    const mode = document.body?.dataset?.puzzleGate;
    if (!mode) {
      unlockPage();
      return true;
    }

    lockPage();
    const redirectBase = document.body.dataset.puzzleGateRedirect || "./index.html";
    const params = new URLSearchParams(window.location.search);

    if (mode === "challenge-stage") {
      const requested = Number(params.get("stage")) || 1;
      const access = await ensureChallengeStage(requested, redirectBase);
      if (!access.ok) return false;
      unlockPage();
      return true;
    }

    if (mode === "ar-scanner") {
      const requested = Number(params.get("stage")) || 1;
      const access = await ensureArScanner(requested, redirectBase);
      if (!access.ok) return false;
      unlockPage();
      return true;
    }

    unlockPage();
    return true;
  }

  const gatePromise = (async () => {
    if (document.body?.dataset?.puzzleGate) {
      lockPage();
    }
    if (!window.PuzzleState) {
      unlockPage();
      return true;
    }
    return runBodyGate();
  })();

  window.PuzzleGate = {
    ready: () => gatePromise,
    ensureChallengeStage,
    ensureStoryChapter,
    ensureArScanner,
    loadScript
  };
})();
