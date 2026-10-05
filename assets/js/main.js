/* ==========================================================================
   Motionbox Studios — interactions
   --------------------------------------------------------------------------
   Content lives in projects.js. This file builds the homepage grid, index
   and marquee from it, and renders project.html?p=<slug> case studies.
   ========================================================================== */
(() => {
  const CONFIG = {
    whatsappText: "Hi Motionbox, I'd like to talk about a project.",
    vimeoColor: 'e65c00',
  };

  const PROJECTS = window.PROJECTS || [];
  const PAGE = document.body.dataset.page;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const pad = (n) => String(n).padStart(2, '0');
  const caseUrl = (p) => `project.html?p=${encodeURIComponent(p.slug)}`;
  const esc = (s = '') => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  gsap.registerPlugin(ScrollTrigger, SplitText);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!REDUCED) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollTo = (target) => (lenis ? lenis.scrollTo(target, { duration: 1.6 }) : target.scrollIntoView());
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = a.getAttribute('href') === '#top' ? document.body : $(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    scrollTo(a.getAttribute('href') === '#top' ? 0 : target);
  });

  /* ---------- Page transitions ---------- */
  const curtain = document.createElement('div');
  curtain.className = 'curtain';
  curtain.innerHTML = '<span class="curtain__mark"></span>';
  document.body.appendChild(curtain);
  const coverIn = PAGE === 'project' || (PAGE === 'home' && store.get('mb-visited'));
  // y: 0 clears the CSS translateY(100%) so only yPercent drives the curtain
  gsap.set(curtain, { y: 0, yPercent: coverIn ? 0 : 100 });
  const revealPage = () => gsap.to(curtain, { yPercent: -100, duration: 1, ease: 'expo.inOut', delay: 0.1 });

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const href = a.getAttribute('href');
    if (!/^(index|project)\.html/.test(href)) return;
    const url = new URL(href, location.href);
    if (url.pathname === location.pathname && url.search === location.search && url.hash) return; // same page anchor
    e.preventDefault();
    if (REDUCED) { location.href = href; return; }
    lenis && lenis.stop();
    gsap.fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: 'expo.inOut', onComplete: () => { location.href = href; } });
  });
  // restore after back/forward cache
  window.addEventListener('pageshow', (e) => { if (e.persisted) { gsap.set(curtain, { yPercent: -100 }); lenis && lenis.start(); } });

  /* ---------- WhatsApp prefill ---------- */
  $$('.js-whatsapp').forEach((a) => { a.href = `https://wa.me/2349049471569?text=${encodeURIComponent(CONFIG.whatsappText)}`; });

  /* ---------- Clock ---------- */
  const timeEl = $('.js-time');
  if (timeEl) {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit' });
    const tick = () => { timeEl.textContent = fmt.format(new Date()); };
    tick();
    setInterval(tick, 10000);
  }

  /* ---------- Cursor ---------- */
  if (FINE) {
    const cur = $('.cursor'), label = $('.cursor__label');
    gsap.set(cur, { x: innerWidth / 2, y: innerHeight / 2 });
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    window.addEventListener('mousemove', (e) => { cx(e.clientX); cy(e.clientY); });
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button');
      if (t) { label.textContent = t.dataset.cursor; cur.classList.add('is-label'); }
      else cur.classList.remove('is-label');
      cur.classList.toggle('is-link', !t && !!link);
    });
    document.addEventListener('mouseleave', () => cur.classList.add('is-hidden'));
    document.addEventListener('mouseenter', () => cur.classList.remove('is-hidden'));
  }

  /* ---------- Magnetic buttons ---------- */
  if (FINE) {
    $$('.js-magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.5, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', () => gsap.to(el, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1, .4)' }));
    });
  }

  /* ---------- Vimeo helpers ---------- */
  const VIMEO = 'https://player.vimeo.com';
  const vimeoFrames = new Set();
  const vimeoSend = (frame, method, value) => {
    if (frame.contentWindow) frame.contentWindow.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), VIMEO);
  };
  window.addEventListener('message', (e) => {
    if (e.origin !== VIMEO) return;
    let d = e.data;
    if (typeof d === 'string') { try { d = JSON.parse(d); } catch (err) { return; } }
    vimeoFrames.forEach((frame) => {
      if (frame.contentWindow !== e.source) return;
      if (d.event === 'ready') vimeoSend(frame, 'addEventListener', 'play');
      if (d.event === 'play' && frame.__onplay) frame.__onplay();
    });
  });
  const vimeoThumb = (id) => `assets/img/work/vimeo-${id}.jpg`;
  const vimeoPage = (id) => `https://vimeo.com/${id}`;
  const vimeoEmbed = (id, extra = '') => `${VIMEO}/video/${id}?title=0&byline=0&portrait=0&dnt=1&color=${CONFIG.vimeoColor}${extra}`;

  // silent looping preview over a thumbnail; only fades in once it really plays
  function hoverPreview(holder, project, trigger) {
    const first = project.videos[0];
    let el = null, playing = false;
    const show = () => holder.classList.add('is-playing');
    const start = () => {
      playing = true;
      if (project.preview || first.file) {
        if (!el) {
          el = document.createElement('video');
          Object.assign(el, { muted: true, loop: true, playsInline: true, preload: 'auto', src: project.preview || first.file });
          el.className = 'media-cover';
          el.addEventListener('playing', show);
          holder.appendChild(el);
        }
        el.play().catch(() => {});
      } else if (first.vimeo) {
        if (!el) {
          el = document.createElement('iframe');
          el.className = 'vimeo-bg';
          el.style.setProperty('--vr', first.ratio);
          el.allow = 'autoplay; fullscreen; picture-in-picture';
          el.tabIndex = -1;
          el.setAttribute('aria-hidden', 'true');
          el.__onplay = () => { if (playing) show(); };
          el.src = vimeoEmbed(first.vimeo, '&background=1&autoplay=1&muted=1&loop=1&controls=0&api=1');
          vimeoFrames.add(el);
          holder.appendChild(el);
        } else vimeoSend(el, 'play');
      }
    };
    const stop = () => {
      playing = false;
      holder.classList.remove('is-playing');
      if (!el) return;
      if (el.tagName === 'VIDEO') el.pause(); else vimeoSend(el, 'pause');
    };
    if (FINE) {
      trigger.addEventListener('mouseenter', start);
      trigger.addEventListener('mouseleave', stop);
    } else if (project.preview) {
      // phones: only lightweight local previews autoplay in view
      new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop()), { threshold: 0.5 }).observe(holder);
    }
  }

  /* ---------- Modal player ---------- */
  const modal = $('.js-modal');
  function openModal(src) {
    if (!modal) return;
    const v = $('.modal__video', modal);
    v.src = src;
    modal.showModal();
    v.play().catch(() => {});
    lenis && lenis.stop();
  }
  if (modal) {
    $('.js-modal-close', modal).addEventListener('click', () => modal.close());
    modal.addEventListener('close', () => { $('.modal__video', modal).pause(); lenis && lenis.start(); });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  }

  /* ---------- Wordmarks ---------- */
  function splitLetters(el) {
    const txt = el.textContent.trim();
    el.textContent = '';
    const inner = document.createElement('span');
    inner.className = 'wm-inner';
    inner.setAttribute('aria-hidden', 'true');
    [...txt].forEach((ch) => {
      const s = document.createElement('span');
      s.className = 'wm-l';
      s.textContent = ch;
      inner.appendChild(s);
    });
    el.appendChild(inner);
    return [...inner.children];
  }
  function fit(el) {
    const inner = $('.wm-inner', el);
    el.style.fontSize = '100px';
    const cs = getComputedStyle(el);
    const avail = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    el.style.fontSize = `${(100 * avail) / inner.offsetWidth}px`;
  }
  // squash & stretch letters around the cursor
  function stretchy(el, letters) {
    if (REDUCED) return;
    if (!FINE) {
      gsap.to(letters, { scaleY: 1.3, duration: 0.9, ease: 'sine.inOut', stagger: { each: 0.12, repeat: -1, yoyo: true } });
      return;
    }
    el.addEventListener('mousemove', (e) => {
      const left = el.getBoundingClientRect().left;
      letters.forEach((l) => {
        const center = left + l.offsetLeft + l.offsetWidth / 2;
        const d = (e.clientX - center) / (l.offsetWidth * 1.4);
        const f = Math.exp(-d * d);
        gsap.to(l, { scaleY: 1 + f * 0.6, skewX: -d * f * 9, duration: 0.6, ease: 'power3.out', overwrite: true });
      });
    });
    el.addEventListener('mouseleave', () => {
      gsap.to(letters, { scaleY: 1, skewX: 0, duration: 1.4, ease: 'elastic.out(1, .3)', overwrite: true, stagger: 0.02 });
    });
  }
  const marks = $$('.js-wordmark').map((el) => ({ el, letters: splitLetters(el), footer: el.classList.contains('wordmark--footer') }));

  /* ---------- Reveal helpers ---------- */
  function splitReveal(el, { trigger = true, type = 'lines' } = {}) {
    const split = SplitText.create(el, { type, mask: 'lines', linesClass: 'split-line' });
    const targets = type.includes('chars') ? split.chars : split.lines;
    return gsap.from(targets, {
      yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: type.includes('chars') ? 0.025 : 0.08,
      paused: !trigger,
      scrollTrigger: trigger ? { trigger: el, start: 'top 88%', once: true } : undefined,
    });
  }

  function commonScroll() {
    $$('.js-split').forEach((el) => splitReveal(el));
    $$('.js-fade').forEach((el) => {
      if (el.closest('.hero')) return;
      gsap.from(el, { y: 24, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
    });
    const foot = marks.find((m) => m.footer);
    if (foot) {
      gsap.from(foot.letters, {
        yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: 0.05,
        scrollTrigger: { trigger: foot.el, start: 'top 95%', once: true },
        onComplete: () => stretchy(foot.el, foot.letters),
      });
    }
  }

  // floating image that follows the cursor over a list
  function hoverCard(list, items, getSrc) {
    const card = $('.make__preview');
    if (!card) return;
    if (!FINE) { card.remove(); return; }
    const img = $('img', card);
    gsap.set(card, { xPercent: -50, yPercent: -50, scale: 0, autoAlpha: 1 });
    const px = gsap.quickTo(card, 'x', { duration: 0.7, ease: 'power3' });
    const py = gsap.quickTo(card, 'y', { duration: 0.7, ease: 'power3' });
    const rz = gsap.quickTo(card, 'rotation', { duration: 0.9, ease: 'power3' });
    let lastX = 0;
    list.addEventListener('mouseenter', (e) => {
      gsap.set(card, { x: e.clientX, y: e.clientY });
      lastX = e.clientX;
      gsap.to(card, { scale: 1, duration: 0.6, ease: 'expo.out', overwrite: 'auto' });
    });
    list.addEventListener('mouseleave', () => gsap.to(card, { scale: 0, duration: 0.5, ease: 'expo.in', overwrite: 'auto' }));
    list.addEventListener('mousemove', (e) => {
      px(e.clientX); py(e.clientY);
      rz(gsap.utils.clamp(-12, 12, (e.clientX - lastX) * 0.6));
      lastX = e.clientX;
    });
    items.forEach((item) => item.addEventListener('mouseenter', () => {
      img.src = getSrc(item);
      gsap.fromTo(card, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'back.out(3)', overwrite: 'auto' });
    }));
  }

  /* ======================================================================
     HOME
     ====================================================================== */
  function buildHome() {
    // selected work grid
    const grid = $('.js-work');
    PROJECTS.filter((p) => p.featured).sort((a, b) => a.featured - b.featured).slice(0, 6).forEach((p, i) => {
      const a = document.createElement('a');
      a.className = 'tile';
      a.href = caseUrl(p);
      a.dataset.cursor = 'View case';
      a.style.setProperty('--ar', p.tile || '4 / 5');
      a.innerHTML = `
        <div class="tile__media"><div class="tile__inner"><img class="media-cover" src="${p.thumb}" alt="${esc(p.title)}" loading="lazy"></div></div>
        <div class="tile__info">
          <span class="tile__num">${pad(i + 1)}</span>
          <h3 class="tile__title">${esc(p.title)}${p.subtitle ? ` <span>— ${esc(p.subtitle)}</span>` : ''}</h3>
          <span class="tile__cat">${esc(p.type)}</span>
        </div>`;
      grid.appendChild(a);
      hoverPreview($('.tile__inner', a), p, a);
    });

    // full index
    const list = $('.js-index');
    PROJECTS.forEach((p, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <a class="make__item" href="${caseUrl(p)}" data-cursor="View case" data-img="${p.thumb}">
          <span class="make__num">${pad(i + 1)}</span>
          <span class="make__title">${esc(p.title)}</span>
          <span class="make__type">${esc(p.subtitle ? `${p.subtitle} · ` : '')}${esc(p.type)}</span>
          <span class="make__year">${p.year}</span>
        </a>`;
      list.appendChild(li);
    });
    hoverCard(list, $$('.make__item', list), (item) => item.dataset.img);

    // feed marquee
    const track = $('.js-marquee');
    const feed = PROJECTS.filter((p) => p.play);
    [...feed, ...feed].forEach((p, i) => {
      const el = document.createElement('a');
      el.className = 'play__item';
      el.href = caseUrl(p);
      // playThumb is always a vertical frame; otherwise go by the lead video's shape
      const ratio = p.playThumb ? 9 / 16 : p.videos[0].ratio;
      el.style.setProperty('--ar', ratio < 0.7 ? '9 / 16' : '4 / 5');
      if (i >= feed.length) { el.setAttribute('aria-hidden', 'true'); el.tabIndex = -1; }
      el.innerHTML = `<div class="play__media"><img class="media-cover" src="${p.playThumb || p.thumb}" alt="${esc(p.title)}" loading="lazy"></div>
        <div class="play__cap"><span>${esc(p.title)}</span><span>${esc(p.year)}</span></div>`;
      track.appendChild(el);
    });
    return { track, feedCount: feed.length };
  }

  function homeScroll() {
    // reel: frame expands, words fly apart
    if (!REDUCED) {
      const small = innerWidth <= 720 ? 'inset(30% 14% 30% 14% round 10px)' : 'inset(24% 30% 24% 30% round 10px)';
      gsap.timeline({ scrollTrigger: { trigger: '.reel', start: 'top top', end: '+=160%', pin: true, scrub: 1 } })
        .fromTo('.reel__frame', { clipPath: small }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none' }, 0)
        .to('.reel__word--l', { xPercent: -140, ease: 'none' }, 0)
        .to('.reel__word--r', { xPercent: 140, ease: 'none' }, 0)
        .fromTo('.reel__ui', { opacity: 0, y: 20 }, { opacity: 1, y: 0, ease: 'none', duration: 0.3 }, 0.7);
    }

    // work tiles: curtain reveal + parallax
    $$('.tile').forEach((tile, i) => {
      const st = { trigger: tile, start: 'top 85%', once: true };
      gsap.fromTo($('.tile__media', tile), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut', scrollTrigger: st });
      gsap.fromTo($('.tile__inner', tile), { scale: 1.35 }, { scale: 1, duration: 1.8, ease: 'expo.out', scrollTrigger: st });
      gsap.from($('.tile__info', tile), { opacity: 0, y: 10, duration: 1, delay: 0.5, ease: 'power3.out', scrollTrigger: st });
      if (!REDUCED && innerWidth > 720) {
        gsap.to(tile, { yPercent: i % 2 ? -14 : -4, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } });
      }
    });

    // services
    $$('.service').forEach((s, i) => {
      const st = { trigger: '.services__list', start: 'top 85%', once: true };
      gsap.fromTo($('.service__line', s), { scaleX: 0 }, { scaleX: 1, duration: 1.4, ease: 'expo.inOut', delay: i * 0.12, scrollTrigger: st });
      gsap.from([$('.service__num', s), $('.service__title', s), ...$$('li', s)], {
        y: 20, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.05, delay: 0.3 + i * 0.12, scrollTrigger: st,
      });
    });

    // index rows
    $$('.make__item').forEach((row) => {
      gsap.from($('.make__title', row), { yPercent: 60, opacity: 0, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: row, start: 'top 95%', once: true } });
    });

    // hero letters sink into the mask as you scroll away
    if (!REDUCED) {
      const hero = marks.find((m) => !m.footer);
      gsap.to(hero.letters, { yPercent: (i) => 40 + i * 9, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
      gsap.to('.hero__top', { yPercent: -40, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    }
  }

  // marquee driven by scroll velocity
  function marquee(track, count) {
    if (!track || !count) return;
    let x = 0, dir = -1, skew = 0, period = 0, hover = false;
    const measure = () => { period = track.children[count].offsetLeft - track.children[0].offsetLeft; };
    measure();
    window.addEventListener('resize', measure);
    track.parentElement.addEventListener('mouseenter', () => { hover = true; });
    track.parentElement.addEventListener('mouseleave', () => { hover = false; });
    gsap.ticker.add((time, deltaMs) => {
      const v = lenis ? lenis.velocity : 0;
      if (lenis && lenis.direction) dir = lenis.direction > 0 ? -1 : 1;
      const base = REDUCED ? 0 : hover ? 12 : 45;
      x += dir * (base + Math.min(Math.abs(v) * 40, 1600)) * (deltaMs / 1000);
      if (period) { x %= period; if (x > 0) x -= period; }
      skew += (gsap.utils.clamp(-10, 10, -v * 0.5) - skew) * 0.1;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${skew}deg)`;
    });
  }

  function homeIntro() {
    const hero = marks.find((m) => !m.footer);
    const title = splitReveal($('.js-hero-title'), { trigger: false });
    gsap.timeline({ onComplete: () => stretchy(hero.el, hero.letters) })
      .from(hero.letters, { yPercent: 110, duration: 1.5, ease: 'expo.out', stagger: 0.06 }, 0)
      .add(title.play(), 0.2)
      .from('.nav', { opacity: 0, y: -10, duration: 1, ease: 'power3.out' }, 0.4)
      .from('.hero__meta, .hero__labels', { opacity: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.5);
  }

  function startHome() {
    const { track, feedCount } = buildHome();
    const reel = $('.js-reel');
    reel.addEventListener('click', () => openModal(reel.dataset.src));
    const reelVideo = $('.reel__video', reel);
    new IntersectionObserver(([e]) => (e.isIntersecting ? reelVideo.play().catch(() => {}) : reelVideo.pause())).observe(reel);

    marks.forEach((m) => fit(m.el));
    commonScroll();
    homeScroll();
    marquee(track, feedCount);

    const loader = $('.loader');
    const done = () => {
      document.body.classList.remove('is-loading');
      lenis && lenis.start();
      ScrollTrigger.refresh();
      store.set('mb-visited', '1');
    };

    // returning visitors (or reduced motion) skip the counter
    if (REDUCED || store.get('mb-visited')) {
      loader.remove();
      done();
      if (!REDUCED) { revealPage(); homeIntro(); }
      return;
    }
    lenis && lenis.stop();
    const count = $('.js-count');
    const o = { v: 0 };
    gsap.timeline()
      .to(o, { v: 100, duration: 1.6, ease: 'power2.inOut', onUpdate: () => { count.textContent = String(Math.round(o.v)).padStart(3, '0'); } }, 0)
      .from('.loader__mark', { y: 24, opacity: 0, duration: 0.9, ease: 'expo.out' }, 0)
      .fromTo('.loader__fill', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.6, ease: 'power2.inOut' }, 0)
      // the filled box hops, then drops away as the loader lifts
      .to('.loader__mark', { y: -18, duration: 0.3, ease: 'power2.out' }, 1.65)
      .to('.loader__mark', { y: 0, duration: 0.45, ease: 'bounce.out' }, 1.95)
      .to('.loader__mark', { scale: 0.85, opacity: 0, duration: 0.4, ease: 'expo.in' }, 2.25)
      .to(loader, { yPercent: -100, duration: 1, ease: 'expo.inOut' }, 2.4)
      .add(() => { done(); homeIntro(); }, 2.75)
      .add(() => loader.remove());
  }

  /* ======================================================================
     CASE STUDY
     ====================================================================== */
  const fmtRatio = (r) => {
    if (r > 2.1) return '2.35:1 widescreen';
    if (Math.abs(r - 16 / 9) < 0.05) return '16:9';
    if (Math.abs(r - 1) < 0.02) return '1:1 square';
    if (Math.abs(r - 0.8) < 0.02) return '4:5';
    if (Math.abs(r - 9 / 16) < 0.03) return '9:16 vertical';
    return r.toFixed(2);
  };

  // click-to-play player: poster first, real player on demand
  function player(v, poster, title) {
    const wrap = document.createElement('div');
    wrap.className = 'player';
    wrap.style.setProperty('--vr', v.ratio);
    if (v.ratio < 1) wrap.classList.add('is-tall');
    wrap.innerHTML = `
      <button class="player__poster" data-cursor="Play" aria-label="Play ${esc(title)}${v.label ? ` — ${esc(v.label)}` : ''}">
        <img class="media-cover" src="${poster}" alt="">
        <span class="player__btn"><span class="reel__tri"></span>Play${v.runtime ? ` · ${v.runtime}` : ''}</span>
      </button>`;
    $('.player__poster', wrap).addEventListener('click', () => {
      let el;
      if (v.vimeo) {
        el = document.createElement('iframe');
        el.src = vimeoEmbed(v.vimeo, '&autoplay=1');
        el.allow = 'autoplay; fullscreen; picture-in-picture';
        el.allowFullscreen = true;
        el.title = `${title}${v.label ? ` — ${v.label}` : ''}`;
      } else {
        el = document.createElement('video');
        Object.assign(el, { src: v.file, controls: true, playsInline: true, autoplay: true, poster });
      }
      el.className = 'player__media';
      wrap.appendChild(el);
      wrap.classList.add('is-active');
      if (el.tagName === 'VIDEO') el.play().catch(() => {});
    });
    return wrap;
  }

  function startProject() {
    const slug = new URLSearchParams(location.search).get('p');
    const idx = PROJECTS.findIndex((p) => p.slug === slug);
    if (idx < 0) { location.replace('index.html#index'); return; }
    const p = PROJECTS[idx];
    const next = PROJECTS[(idx + 1) % PROJECTS.length];

    document.title = `${p.title}${p.subtitle ? ` — ${p.subtitle}` : ''} · Motionbox Studios`;
    $('.js-count-label').textContent = `(Case study) ${pad(idx + 1)} / ${pad(PROJECTS.length)}`;
    const titleEl = $('.js-case-title');
    titleEl.textContent = p.title;
    if (p.subtitle) {
      const sub = document.createElement('span');
      sub.className = 'case__subtitle';
      sub.textContent = p.subtitle;
      titleEl.after(sub);
    }

    const runtimes = p.videos.map((v) => v.runtime).filter(Boolean);
    const meta = [
      ['Client', p.client],
      ['Year', p.year],
      ['Type', p.type],
      [p.videos.length > 1 ? 'Films' : 'Runtime', p.videos.length > 1 ? `${p.videos.length} pieces` : runtimes[0] || '—'],
    ];
    $('.js-case-meta').innerHTML = meta.map(([k, v]) => `<div class="case__meta-item"><span class="label">${k}</span><span>${esc(v)}</span></div>`).join('');

    const first = p.videos[0];
    $('.js-player').appendChild(player(first, first.poster || (first.vimeo ? vimeoThumb(first.vimeo) : p.thumb), p.title));

    $('.js-case-summary').textContent = p.summary;
    $('.js-case-disciplines').innerHTML = p.disciplines.map((d) => `<li>${esc(d)}</li>`).join('');
    $('.js-case-deliverables').innerHTML = p.videos.map((v) => `<li>${esc(v.label || 'Film')} <span class="label">— ${v.runtime || ''} · ${fmtRatio(v.ratio)}</span></li>`).join('');
    const links = p.videos.filter((v) => v.vimeo).map((v) => `<li><a class="u-link" href="${vimeoPage(v.vimeo)}" target="_blank" rel="noopener">${esc(v.label || 'Film')} on Vimeo ↗</a></li>`);
    links.push(`<li><a class="u-link" href="mailto:motionbox.ng@gmail.com?subject=${encodeURIComponent(`Project like ${p.title}`)}">Start something similar ↗</a></li>`);
    $('.js-case-links').innerHTML = links.join('');

    const rest = p.videos.slice(1);
    if (rest.length) {
      const gallery = $('.js-gallery');
      gallery.classList.toggle('is-tall', rest.every((v) => v.ratio < 1));
      rest.forEach((v) => {
        const fig = document.createElement('figure');
        fig.className = 'case__fig';
        fig.appendChild(player(v, v.poster || (v.vimeo ? vimeoThumb(v.vimeo) : p.thumb), p.title));
        const cap = document.createElement('figcaption');
        cap.innerHTML = `<span>${esc(v.label || '')}</span><span class="label">${v.runtime || ''} · ${fmtRatio(v.ratio)}</span>`;
        fig.appendChild(cap);
        gallery.appendChild(fig);
      });
    } else $('.js-more').remove();

    const nextLink = $('.js-next');
    nextLink.href = caseUrl(next);
    $('.js-next-img').src = next.thumb;
    $('.js-next-title').textContent = next.title;
    $('.js-next-type').textContent = next.type;
    $('.js-next-count').textContent = `${pad(((idx + 1) % PROJECTS.length) + 1)} / ${pad(PROJECTS.length)}`;

    marks.forEach((m) => fit(m.el));
    commonScroll();

    // intro
    const titleSplit = splitReveal(titleEl, { trigger: false, type: 'lines,chars' });
    revealPage();
    gsap.timeline({ delay: 0.45 })
      .add(titleSplit.play(), 0)
      .from('.case__subtitle, .case__top', { opacity: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.1 }, 0.3)
      .from('.case__meta-item', { opacity: 0, y: 20, duration: 1, ease: 'power3.out', stagger: 0.08 }, 0.4)
      .fromTo('.case__player .player', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.inOut' }, 0.4)
      .from('.case__player .media-cover', { scale: 1.3, duration: 1.8, ease: 'expo.out' }, 0.6);

    $$('.case__fig').forEach((fig) => {
      gsap.fromTo($('.player', fig), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', scrollTrigger: { trigger: fig, start: 'top 88%', once: true } });
    });
    if (!REDUCED) {
      gsap.fromTo('.js-next-img', { yPercent: -12, scale: 1.15 }, { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.next', start: 'top bottom', end: 'bottom top', scrub: true } });
    }
    splitReveal($('.js-next-title'));
  }

  /* ---------- Boot ---------- */
  window.addEventListener('resize', () => marks.forEach((m) => fit(m.el)));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    if (PAGE === 'project') startProject();
    else startHome();
  });
})();
