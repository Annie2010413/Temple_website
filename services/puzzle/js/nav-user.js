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

  async function ensureGoogleReady() {
    if (googleReadyPromise) return googleReadyPromise;

    googleReadyPromise = (async () => {
      if (!window.PUZZLE_GOOGLE_CLIENT_ID) {
        await loadScript("../../js/auth-config.js");
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

  function createUserMenu() {
    const auth = window.PuzzleState?.getAuth?.();
    const isLoggedIn = Boolean(auth?.token);
    const user = auth?.user || {};
    const displayName = user.name || user.email || "訪客";
    const avatarUrl = user.avatar || "";
    const initial = getInitial(user.name, user.email);

    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.marginLeft = "14px";
    wrapper.style.display = "inline-flex";
    wrapper.style.alignItems = "center";
    wrapper.style.zIndex = "60";

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.style.display = "inline-flex";
    trigger.style.alignItems = "center";
    trigger.style.gap = "8px";
    trigger.style.padding = "6px 10px";
    trigger.style.border = "1px solid rgba(139,114,112,0.35)";
    trigger.style.borderRadius = "8px";
    trigger.style.background = "#fff";
    trigger.style.cursor = "pointer";
    trigger.style.fontSize = "0.85rem";
    trigger.style.color = "#5c403a";
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
    label.textContent = isLoggedIn ? displayName : "登入";
    label.style.maxWidth = "100px";
    label.style.overflow = "hidden";
    label.style.textOverflow = "ellipsis";
    label.style.whiteSpace = "nowrap";

    const arrow = document.createElement("span");
    arrow.textContent = "▾";
    arrow.style.fontSize = "0.8rem";
    arrow.style.color = "#755750";

    trigger.appendChild(avatar);
    trigger.appendChild(label);
    trigger.appendChild(arrow);

    const menu = document.createElement("div");
    menu.style.position = "absolute";
    menu.style.top = "110%";
    menu.style.right = "0";
    menu.style.minWidth = "170px";
    menu.style.padding = "8px";
    menu.style.border = "1px solid rgba(139,114,112,0.35)";
    menu.style.borderRadius = "10px";
    menu.style.background = "#fff";
    menu.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
    menu.style.display = "none";

    const profileLink = document.createElement("a");
    profileLink.href = "../profile/index.html";
    profileLink.textContent = "我的進度";
    profileLink.style.display = "block";
    profileLink.style.padding = "8px 10px";
    profileLink.style.borderRadius = "6px";
    profileLink.style.textDecoration = "none";
    profileLink.style.color = "#5c403a";
    profileLink.onmouseenter = () => { profileLink.style.background = "#f8f3eb"; };
    profileLink.onmouseleave = () => { profileLink.style.background = "transparent"; };
    menu.appendChild(profileLink);

    if (isLoggedIn) {
      const logoutBtn = document.createElement("button");
      logoutBtn.type = "button";
      logoutBtn.textContent = "登出";
      logoutBtn.style.width = "100%";
      logoutBtn.style.textAlign = "left";
      logoutBtn.style.padding = "8px 10px";
      logoutBtn.style.border = "none";
      logoutBtn.style.borderRadius = "6px";
      logoutBtn.style.background = "transparent";
      logoutBtn.style.color = "#8b2e2e";
      logoutBtn.style.cursor = "pointer";
      logoutBtn.onmouseenter = () => { logoutBtn.style.background = "#fdf2f2"; };
      logoutBtn.onmouseleave = () => { logoutBtn.style.background = "transparent"; };
      logoutBtn.onclick = () => {
        window.PuzzleState.signOut();
        window.location.reload();
      };
      menu.appendChild(logoutBtn);
    } else {
      const loginBtn = document.createElement("button");
      loginBtn.type = "button";
      loginBtn.textContent = "Google 登入";
      loginBtn.style.width = "100%";
      loginBtn.style.textAlign = "left";
      loginBtn.style.padding = "8px 10px";
      loginBtn.style.border = "none";
      loginBtn.style.borderRadius = "6px";
      loginBtn.style.background = "transparent";
      loginBtn.style.color = "#5c403a";
      loginBtn.style.cursor = "pointer";
      loginBtn.onmouseenter = () => { loginBtn.style.background = "#f8f3eb"; };
      loginBtn.onmouseleave = () => { loginBtn.style.background = "transparent"; };
      const googleBtnWrap = document.createElement("div");
      googleBtnWrap.style.display = "none";
      googleBtnWrap.style.padding = "8px 10px 2px";

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
              width: 150
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

    trigger.onclick = () => {
      menu.style.display = menu.style.display === "none" ? "block" : "none";
    };

    document.addEventListener("click", (event) => {
      if (!wrapper.contains(event.target)) {
        menu.style.display = "none";
      }
    });

    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);
    return wrapper;
  }

  function mountUserMenu() {
    if (!window.PuzzleState) return;
    const slot = document.getElementById("user-nav-slot");
    if (!slot) return;
    slot.innerHTML = "";
    slot.appendChild(createUserMenu());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountUserMenu);
  } else {
    mountUserMenu();
  }

  document.addEventListener("puzzle-auth-changed", mountUserMenu);
})();
