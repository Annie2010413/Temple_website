/* ================================================
   main.js — 宮廟網站主邏輯 v2
   ================================================ */

/* ── 手機選單 ── */
const menuToggle = document.getElementById('menu-toggle');
const mobileMenu = document.getElementById('mobile-menu');

menuToggle?.addEventListener('click', () => {
  mobileMenu.classList.toggle('open');
});
// 點連結後關閉選單
mobileMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});
// 點外部關閉
document.addEventListener('click', (e) => {
  if (!menuToggle?.contains(e.target) && !mobileMenu?.contains(e.target)) {
    mobileMenu?.classList.remove('open');
  }
});

/* ── 渲染最新消息 ── */
function renderNews() {
  const container = document.getElementById('news-list');
  if (!container || typeof NEWS === 'undefined') return;

  container.innerHTML = NEWS.map(item => {
    const parts  = item.date.split('/');
    const day    = parts[2] || '';
    const month  = (parts[0] || '') + '/' + (parts[1] || '');

    return `
      <article class="news-card reveal">
        <div class="news-date-badge">
          <div class="nb-day">${day}</div>
          <div class="nb-month">${month}</div>
        </div>
        <div class="news-body">
          <span class="news-cat-tag">${item.category}</span>
          <<div class="news-title-text">
           <a href="${item.link}" target="_blank">
                 ${item.title}
          </a>
          </div>
          <div class="news-excerpt">${item.content.replace(/\n/g, ' ')}</div>
        </div>
      </article>
    `;
  }).join('');

  observeReveal();
}

/* ── 渲染跑馬燈 ── */
function renderMarquee() {
  const inner = document.getElementById('marquee-inner');
  if (!inner || typeof NEWS === 'undefined') return;

  // 重複兩次讓跑馬燈無縫循環
  const items = NEWS.slice(0, 8).map(n => `<span>${n.title}</span>`).join('');
  inner.innerHTML = items + items;
}

/* ── 捲動顯示動畫 ── */
function observeReveal() {
  const els = document.querySelectorAll('.reveal:not(.visible)');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => io.observe(el));
}

/* ── 頁面載入 ── */
document.addEventListener('DOMContentLoaded', () => {
  renderNews();
  renderMarquee();
  observeReveal();
});
