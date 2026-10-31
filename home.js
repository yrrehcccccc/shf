(() => {
  'use strict';
  const poster = document.querySelector('#homePoster');
  if (!poster) return;
  const settings = document.querySelector('#settingsPanel');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const reveal = [...poster.querySelectorAll('[data-reveal]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold:.08, rootMargin:'0px 0px -10% 0px' });
    reveal.forEach(layer => observer.observe(layer));
    document.body.classList.add('shf-motion-ready');
  }

  let bottomTimer = 0;
  let navigationTimer = 0;
  let leaving = false;
  let userScroll = false;
  let lastScroll = scrollY;
  let frame = 0;
  function atBottom() {
    return scrollY > 0 && document.documentElement.scrollHeight - innerHeight - scrollY <= 3;
  }
  function canEnter() {
    return !leaving && !document.hidden && !settings?.classList.contains('open');
  }
  function cancelEntry() {
    clearTimeout(bottomTimer);
    bottomTimer = 0;
  }
  function enterChapter() {
    if (!canEnter()) return;
    leaving = true;
    cancelEntry();
    document.body.classList.add('shf-leaving');
    navigationTimer = setTimeout(() => {
      try { sessionStorage.setItem('shf-chapter-entry',String(Date.now())); } catch {}
      location.assign('01.html');
    }, reducedMotion.matches ? 0 : 520);
  }
  function queueEntry() {
    if (!userScroll || !atBottom() || !canEnter()) { cancelEntry(); return; }
    // Further scroll gestures at the bottom cannot postpone the original dwell.
    if (bottomTimer) return;
    bottomTimer = setTimeout(() => {
      bottomTimer = 0;
      if (atBottom()) enterChapter();
    },500);
  }
  function checkScroll() {
    frame = 0;
    if (scrollY < lastScroll || !atBottom()) cancelEntry();
    else queueEntry();
    lastScroll = scrollY;
  }
  addEventListener('scroll',() => {
    if (!frame) frame = requestAnimationFrame(checkScroll);
  },{ passive:true });
  addEventListener('wheel',event => {
    if (!poster.contains(event.target)) return;
    userScroll = true;
    if (event.deltaY > 0) queueEntry();
    else if (event.deltaY < 0) cancelEntry();
  },{ passive:true });
  poster.addEventListener('touchstart',() => { userScroll = true; },{ passive:true });
  addEventListener('pointerdown',() => { userScroll = true; },{ passive:true });
  addEventListener('keydown',event => {
    if (['ArrowDown','ArrowUp','PageDown','PageUp','End','Home',' '].includes(event.key)) userScroll = true;
    if (['ArrowUp','PageUp','Home'].includes(event.key)) cancelEntry();
    else if (['ArrowDown','PageDown','End',' '].includes(event.key)) queueEntry();
  });
  poster.addEventListener('click',event => {
    const link = event.target.closest('[data-enter-chapter]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    enterChapter();
  });
  document.addEventListener('visibilitychange',() => {
    cancelEntry();
    if (!document.hidden) queueEntry();
  });
  if (settings) new MutationObserver(() => {
    if (settings.classList.contains('open')) cancelEntry();
  }).observe(settings,{ attributes:true,attributeFilter:['class'] });
  addEventListener('pagehide',() => { cancelEntry();clearTimeout(navigationTimer); });
  addEventListener('pageshow',() => {
    cancelEntry();clearTimeout(navigationTimer);
    leaving = false;userScroll = false;lastScroll = scrollY;
    document.body.classList.remove('shf-leaving');
  });
})();
