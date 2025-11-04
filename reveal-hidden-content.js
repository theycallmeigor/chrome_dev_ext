// Script to reveal hidden/gated content while respecting viewport intent
// This is injected into the page when user clicks "Show Hidden Content"

(function () {
  'use strict';

  // --- CONFIG: tweak if your grid differs
  const BP = { tablet: 768, desktop: 1024 }; // <768 mobile, 768-1023 tablet, >=1024 desktop
  const GATES = ['.hidden-section', '[data-gated]', '[data-cc-gate]'];

  function vp() {
    const w = window.innerWidth || 1024;
    if (w < BP.tablet) return 'mobile';
    if (w < BP.desktop) return 'tablet';
    return 'desktop';
  }

  // Inspect element + ancestors for viewport intent
  function viewportIntent(el) {
    let cur = el;
    const intent = { no: new Set(), only: new Set() };
    while (cur && cur !== document.documentElement) {
      const cls = (cur.className || '').toString();
      if (cls) {
        const tokens = cls.split(/\s+/);

        // no-*
        if (tokens.includes('no-mobile'))  intent.no.add('mobile');
        if (tokens.includes('no-tablet'))  intent.no.add('tablet');
        if (tokens.includes('no-desktop')) intent.no.add('desktop');

        // only-*
        if (tokens.includes('only-mobile'))  intent.only.add('mobile');
        if (tokens.includes('only-tablet'))  intent.only.add('tablet');
        if (tokens.includes('only-desktop')) intent.only.add('desktop');

        // Bootstrap/Tailwind style hints (minimal set)
        if (tokens.includes('d-none') && (tokens.includes('d-md-block') || tokens.includes('d-lg-block') || tokens.includes('d-xl-block'))) {
          intent.no.add('mobile'); intent.no.add('tablet'); // show md+ (desktop), so hide mobile/tablet
        }
        if (tokens.includes('sm:hidden')) intent.no.add('mobile');
        if (tokens.includes('md:hidden')) intent.no.add('tablet'); // also applies to desktop, but treat conservatively
        if (tokens.includes('lg:hidden')) intent.no.add('desktop');
      }

      // data attribute override
      const ds = (cur.getAttribute('data-show-on') || '').toLowerCase().trim();
      if (ds === 'mobile' || ds === 'tablet' || ds === 'desktop') {
        intent.only.add(ds);
      } else if (ds === 'all') {
        // explicit all → clear only/no
        intent.only.clear(); intent.no.clear();
      }

      cur = cur.parentElement;
    }
    return intent;
  }

  function allowedForViewport(el, current) {
    const { no, only } = viewportIntent(el);
    if (only.size > 0) return only.has(current);  // explicit allow list
    if (no.has(current)) return false;            // explicit block
    // Default: allowed
    return true;
  }

  function revealIfAllowed(el, current) {
    if (!allowedForViewport(el, current)) {
      // Ensure we don't forcibly show it
      el.removeAttribute('data-revealed-by-userscript');
      // Remove any inline overrides we may have set before
      el.style.removeProperty('display');
      el.style.removeProperty('visibility');
      el.style.removeProperty('opacity');
      return false;
    }

    // Remove only the gating flags; let CSS control layout
    if (el.classList.contains('hidden-section')) el.classList.remove('hidden-section');
    if (el.hasAttribute('data-gated')) el.removeAttribute('data-gated');
    if (el.hasAttribute('data-cc-gate')) el.removeAttribute('data-cc-gate');
    el.removeAttribute('hidden'); // if used as gate

    // If still collapsed purely by inline gating, gently clear it (no !important)
    const cs = getComputedStyle(el);
    if (cs.display === 'none' && el.style.display === 'none') el.style.display = '';
    if (cs.visibility === 'hidden' && el.style.visibility === 'hidden') el.style.visibility = '';
    if (el.style.opacity === '0') el.style.opacity = '';

    el.setAttribute('data-revealed-by-userscript', '1');
    return true;
  }

  function sweep() {
    const current = vp();
    const nodes = new Set();
    GATES.forEach(sel => {
      try {
        document.querySelectorAll(sel).forEach(n => nodes.add(n));
      } catch (e) {
        console.warn('Invalid selector:', sel, e);
      }
    });
    let revealedCount = 0;
    nodes.forEach(n => {
      if (revealIfAllowed(n, current)) {
        revealedCount++;
      }
    });
    return revealedCount;
  }

  const mo = new MutationObserver(() => sweep());

  function init() {
    const revealedCount = sweep();
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    window.addEventListener('resize', () => sweep(), { passive: true });

    // Notify extension of completion
    console.log(`[CheckoutChamp] Revealed ${revealedCount} hidden sections`);
    return revealedCount;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    return init();
  }
})();
