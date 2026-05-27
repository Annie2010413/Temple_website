(() => {
  const IMAGE_EXT = /\.(png|jpe?g)$/i;

  function toWebp(assetPath) {
    const raw = String(assetPath || "").trim();
    if (!raw) return "";
    if (raw.endsWith(".webp")) return raw;
    return raw.replace(IMAGE_EXT, ".webp");
  }

  /**
   * @param {string} assetPath e.g. ./assets/picture/foo.png
   * @param {"full"|"thumb"} [variant]
   */
  function resolve(assetPath, variant = "full") {
    const webp = toWebp(assetPath);
    if (!webp || variant !== "thumb") return webp;
    if (webp.includes("/assets/picture/")) {
      return webp.replace("/assets/picture/", "/assets/picture/thumbs/");
    }
    if (webp.includes("/picture/")) {
      return webp.replace("/picture/", "/picture/thumbs/");
    }
    return webp;
  }

  function applyImg(img, assetPath, options = {}) {
    if (!img || !assetPath) return;
    const variant = options.variant || "full";
    img.src = resolve(assetPath, variant);
    if (options.loading) img.loading = options.loading;
    if (options.fetchPriority) img.fetchPriority = options.fetchPriority;
    if (options.decoding) img.decoding = options.decoding;
  }

  window.PuzzleImageUrl = {
    toWebp,
    resolve,
    applyImg
  };
})();
