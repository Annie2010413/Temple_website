(() => {
  let googleReadyPromise = null;

  function getInitial(name, email) {
    const source = (name || email || "U").trim();
    return source.charAt(0).toUpperCase();
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.dataset.loaded === "true") {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset.loaded = "true";
        resolve();
      };
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  function resolvePuzzleJsUrl(fileName) {
    const navScript = document.querySelector('script[src*="nav-user.js"]');
    if (navScript?.src) {
      return new URL(fileName, navScript.src).href;
    }
    return new URL(`../../js/${fileName}`, window.location.href).href;
  }

  async function ensureGoogleReady() {
    if (googleReadyPromise) return googleReadyPromise;

    googleReadyPromise = (async () => {
      if (!window.PUZZLE_GOOGLE_CLIENT_ID) {
        try {
          await loadScript(resolvePuzzleJsUrl("auth-config.js"));
        } catch (_error) {
          // auth-config.js is optional when runtime-config.js sets the client id.
        }
      }
      if (!window.google?.accounts?.id) {
        await loadScript("https://accounts.google.com/gsi/client");
      }
      if (!window.PUZZLE_GOOGLE_CLIENT_ID) {
        throw new Error("Missing Google Client ID");
      }
    })();

    return googleReadyPromise;
  }

  function clampMenuToViewport(menu) {
    menu.style.transform = "";
    const rect = menu.getBoundingClientRect();
    const pad = 12;
    let shift = 0;
    if (rect.right > window.innerWidth - pad) {
      shift = window.innerWidth - pad - rect.right;
    }
    const nextLeft = rect.left + shift;
    if (nextLeft < pad) {
      shift += pad - nextLeft;
    }
    if (shift !== 0) {
      menu.style.transform = `translateX(${shift}px)`;
    }
  }

  function googleButtonWidth(wrapEl, isMobile) {
    if (isMobile) {
      const slot = document.getElementById("user-nav-slot-mobile");
      const width = slot?.clientWidth || wrapEl?.clientWidth || window.innerWidth;
      return Math.max(200, Math.min(280, width - 24));
    }
    const menuWidth = wrapEl?.closest(".puzzle-nav__user-menu")?.clientWidth || 170;
    return Math.max(150, Math.min(280, menuWidth - 16));
  }

  function createUserMenu({ isMobile = false } = {}) {
    const auth = window.PuzzleState?.getAuth?.();
    const isLoggedIn = Boolean(auth?.token);
    const user = auth?.user || {};
    const displayName = user.name || user.email || "訪客";
    const avatarUrl = user.avatar || "";
    const initial = getInitial(user.name, user.email);

    const wrapper = document.createElement("div");
    wrapper.className = "puzzle-nav__user";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "puzzle-nav__user-trigger";
    trigger.title = isLoggedIn ? displayName : "登入 / 進度";

    const avatar = document.createElement("span");
    avatar.style.width = "26px";
    avatar.style.height = "26px";
    avatar.style.borderRadius = "9999px";
    avatar.style.display = "inline-flex";
    avatar.style.alignItems = "center";
    avatar.style.justifyContent = "center";
    avatar.style.background = "#6c171a";
    avatar.style.color = "#fff";
    avatar.style.fontSize = "0.8rem";
    avatar.style.fontWeight = "700";
    avatar.style.overflow = "hidden";
    avatar.style.flexShrink = "0";

    if (avatarUrl) {
      const img = document.createElement("img");
      img.src = avatarUrl;
      img.alt = "user avatar";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      avatar.appendChild(img);
    } else {
      avatar.textContent = initial;
    }

    const label = document.createElement("span");
    label.className = "puzzle-nav__user-label";
    label.textContent = isLoggedIn ? displayName : "登入";

    const arrow = document.createElement("span");
    arrow.textContent = "▾";
    arrow.style.fontSize = "0.8rem";
    arrow.style.color = "#755750";
    arrow.style.flexShrink = "0";

    trigger.appendChild(avatar);
    trigger.appendChild(label);
    trigger.appendChild(arrow);

    const menu = document.createElement("div");
    menu.className = "puzzle-nav__user-menu";

    if (isLoggedIn) {
      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.className = "puzzle-nav__user-menu-item puzzle-nav__user-menu-item--danger";
      logoutBtn.textContent = "登出";
      logoutBtn.onclick = () => {
        window.PuzzleState.signOut();
        window.location.reload();
      };
      menu.appendChild(logoutBtn);
    } else {
      const loginBtn = document.createElement("button");
      loginBtn.type = "button";
      loginBtn.className = "puzzle-nav__user-menu-item";
      loginBtn.textContent = "Google 登入";
      const googleBtnWrap = document.createElement("div");
      googleBtnWrap.className = "puzzle-nav__user-google";

      let googleRendered = false;
      loginBtn.onclick = async () => {
        if (googleBtnWrap.style.display === "block") {
          googleBtnWrap.style.display = "none";
          loginBtn.textContent = "Google 登入";
          return;
        }

        loginBtn.textContent = "載入中...";
        try {
          await ensureGoogleReady();
          if (!googleRendered) {
            window.google.accounts.id.initialize({
              client_id: window.PUZZLE_GOOGLE_CLIENT_ID,
              callback: async (response) => {
                await window.PuzzleState.signInWithGoogleIdToken(response.credential);
                document.dispatchEvent(new CustomEvent("puzzle-auth-changed"));
              }
            });
            window.google.accounts.id.renderButton(googleBtnWrap, {
              theme: "outline",
              size: "medium",
              text: "signin_with",
              shape: "rectangular",
              width: googleButtonWidth(googleBtnWrap, isMobile)
            });
            googleRendered = true;
          }
          googleBtnWrap.style.display = "block";
          loginBtn.textContent = "收合 Google 登入";
        } catch (_error) {
          loginBtn.textContent = "Google 登入失敗";
          setTimeout(() => {
            loginBtn.textContent = "Google 登入";
          }, 1400);
        }
      };
      menu.appendChild(loginBtn);
      menu.appendChild(googleBtnWrap);
    }

    const toggleMenu = () => {
      const opening = menu.style.display === "none" || menu.style.display === "";
      menu.style.display = opening ? "block" : "none";
      if (opening && !isMobile) {
        requestAnimationFrame(() => clampMenuToViewport(menu));
      }
    };

    trigger.onclick = toggleMenu;

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        menu.style.display = "none";
        menu.style.transform = "";
      }
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    return wrapper;
  }

  function mountUserMenu() {
    if (!window.PuzzleState) return;
    const slots = [
      { id: "user-nav-slot", isMobile: false },
      { id: "user-nav-slot-mobile", isMobile: true }
    ];
    slots.forEach(({ id, isMobile }) => {
      const slot = document.getElementById(id);
      if (!slot) return;
      slot.innerHTML = "";
      slot.appendChild(createUserMenu({ isMobile }));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUserMenu);
  } else {
    mountUserMenu();
  }

  document.addEventListener("puzzle-auth-changed", mountUserMenu);
})();
