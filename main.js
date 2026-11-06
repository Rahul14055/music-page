/* ============================================
   tyzen01 — main.js
============================================ */

gsap.registerPlugin(ScrollTrigger);

/* ---------- Cursor glow ---------- */
const cursorGlow = document.getElementById('cursorGlow');
if (window.matchMedia('(pointer: fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    gsap.to(cursorGlow, { x: e.clientX, y: e.clientY, duration: 0.6, ease: 'power2.out' });
  });
}

/* ---------- Scroll progress bar ---------- */
const scrollProgress = document.getElementById('scrollProgress');
gsap.to(scrollProgress, {
  width: '100%',
  ease: 'none',
  scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 }
});

/* ---------- Nav shrink + mobile menu ---------- */
const nav = document.getElementById('nav');
ScrollTrigger.create({
  start: 'top -60',
  end: 99999,
  toggleClass: { targets: nav, className: 'scrolled' }
});

const navBurger = document.getElementById('navBurger');
const navMobile = document.getElementById('navMobile');

function toggleMobileNav(forceState) {
  if (!navMobile || !navBurger) return;
  const isOpen = forceState !== undefined ? forceState : !navMobile.classList.contains('open');
  navBurger.classList.toggle('open', isOpen);
  navMobile.classList.toggle('open', isOpen);
  navBurger.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('menu-open', isOpen);
}

if (navBurger && navMobile) {
  navBurger.addEventListener('click', () => toggleMobileNav());
  navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleMobileNav(false)));
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMobile.classList.contains('open')) {
      toggleMobileNav(false);
    }
  });
}

/* ============================================
   HERO — Three.js 3D wireframe orb
============================================ */
(function initHero3D() {
  const canvas = document.getElementById('heroCanvas');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8);

  // Group holding the orb layers — MUST be initialized before setSize()
  const group = new THREE.Group();
  scene.add(group);

  function setSize() {
    const heroEl = document.querySelector('.hero') || canvas.parentElement;
    const w = heroEl ? heroEl.clientWidth : window.innerWidth;
    const h = heroEl ? heroEl.clientHeight : window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    const isMobile = w < 640;
    const s = isMobile ? 0.65 : 1.0;
    group.scale.set(s, s, s);
    group.position.y = isMobile ? 0.22 : 0;
  }
  setSize();

  // Core icosahedron wireframe
  const coreGeo = new THREE.IcosahedronGeometry(2.1, 2);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xff2ecc,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  // Outer larger icosahedron, cyan, counter-rotating
  const outerGeo = new THREE.IcosahedronGeometry(2.85, 1);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0x3ff0e0,
    wireframe: true,
    transparent: true,
    opacity: 0.28
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  group.add(outer);

  // Inner small acid-colored core
  const innerGeo = new THREE.IcosahedronGeometry(1.15, 1);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xd4f43b,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  const inner = new THREE.Mesh(innerGeo, innerMat);
  group.add(inner);

  // Particle field (optimized count for smooth mobile 60-120fps)
  const particleCount = window.innerWidth < 700 ? 180 : 600;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const radius = 4 + Math.random() * 7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = radius * Math.cos(phi);
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMat = new THREE.PointsMaterial({
    color: 0x8b5cf6,
    size: 0.028,
    transparent: true,
    opacity: 0.6
  });
  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ============================================
  // Interactive Controls: Mouse, Gyroscope Tilt & Touch
  // ============================================
  let targetInputX = 0, targetInputY = 0;
  let currentTiltX = 0, currentTiltY = 0;
  let hasGyro = false;
  let hintDismissed = false;

  function dismissTiltHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    const hint = document.getElementById('heroTiltHint');
    if (hint) {
      hint.style.opacity = '0';
      hint.style.pointerEvents = 'none';
      setTimeout(() => { if (hint.parentElement) hint.remove(); }, 500);
    }
  }

  // 1. Desktop mouse parallax
  window.addEventListener('mousemove', (e) => {
    targetInputX = (e.clientX / window.innerWidth - 0.5) * 2;
    targetInputY = (e.clientY / window.innerHeight - 0.5) * 2;
    dismissTiltHint();
  });

  // 2. Mobile Device Orientation (Gyroscope / Tilt)
  function handleOrientation(e) {
    if (e.gamma === null && e.beta === null) return;
    hasGyro = true;

    // gamma: left-to-right tilt in [-90, 90]
    const gamma = Math.max(-40, Math.min(40, e.gamma || 0));
    // beta: front-to-back tilt in [-180, 180] (natural portrait holding angle ~45 deg)
    const beta = e.beta !== null ? e.beta : 45;
    const betaDelta = Math.max(-35, Math.min(35, beta - 45));

    targetInputX = gamma / 28;  // -1 to 1 (scaled for intuitive response)
    targetInputY = betaDelta / 24;

    dismissTiltHint();
  }

  // Register device orientation with iOS permission support
  if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      const requestGyro = () => {
        DeviceOrientationEvent.requestPermission()
          .then((res) => {
            if (res === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation, { passive: true });
            }
          })
          .catch(() => {});
        window.removeEventListener('touchstart', requestGyro);
      };
      window.addEventListener('touchstart', requestGyro, { passive: true, once: true });
    } else {
      window.addEventListener('deviceorientation', handleOrientation, { passive: true });
    }
  }

  // 3. Touch Drag interaction on hero (fallback / tactile touch tilt)
  const heroSection = document.querySelector('.hero');
  if (heroSection) {
    let touchStartX = 0, touchStartY = 0;
    let isTouchActive = false;

    heroSection.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        isTouchActive = true;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        dismissTiltHint();
      }
    }, { passive: true });

    heroSection.addEventListener('touchmove', (e) => {
      if (isTouchActive && e.touches.length === 1) {
        const dx = (e.touches[0].clientX - touchStartX) / (window.innerWidth * 0.45);
        const dy = (e.touches[0].clientY - touchStartY) / (window.innerHeight * 0.45);
        if (!hasGyro) {
          targetInputX = Math.max(-1.2, Math.min(1.2, dx));
          targetInputY = Math.max(-1.2, Math.min(1.2, dy));
        }
      }
    }, { passive: true });

    const endTouch = () => {
      isTouchActive = false;
      if (!hasGyro) {
        gsap.to({ valX: targetInputX, valY: targetInputY }, {
          valX: 0,
          valY: 0,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: function() {
            targetInputX = this.targets()[0].valX;
            targetInputY = this.targets()[0].valY;
          }
        });
      }
    };
    heroSection.addEventListener('touchend', endTouch, { passive: true });
    heroSection.addEventListener('touchcancel', endTouch, { passive: true });
  }

  // Entrance animation
  const isMobileInit = window.innerWidth < 640;
  const baseScale = isMobileInit ? 0.65 : 1.0;
  group.scale.setScalar(0.001);
  gsap.to(group.scale, { x: baseScale, y: baseScale, z: baseScale, duration: 2.2, ease: 'elastic.out(0.6, 0.5)', delay: 0.3 });
  gsap.fromTo(particles.material, { opacity: 0 }, { opacity: 0.6, duration: 2.5, delay: 0.6 });

  // Direct, rock-solid scroll tracking from native window.scrollY (zero desync when scrolling back up)
  let smoothScrollFactor = 0;

  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    if (!reduceMotion) {
      core.rotation.y = t * 0.18;
      core.rotation.x = t * 0.09;
      outer.rotation.y = -t * 0.1;
      outer.rotation.x = t * 0.06;
      inner.rotation.y = t * 0.3;
      inner.rotation.x = -t * 0.22;
      particles.rotation.y = t * 0.02;
    }

    // Smooth tilt interpolation
    currentTiltX += (targetInputX - currentTiltX) * 0.055;
    currentTiltY += (targetInputY - currentTiltY) * 0.055;

    // Responsive native scroll factor — guaranteed 0 when at top of page
    const scrollY = Math.max(0, window.pageYOffset || window.scrollY || 0);
    const heroEl = document.querySelector('.hero');
    const heroH = heroEl ? heroEl.clientHeight : (window.innerHeight || 800);
    const targetScroll = Math.min(1, Math.max(0, scrollY / heroH));

    if (scrollY === 0) {
      smoothScrollFactor = 0;
    } else {
      smoothScrollFactor += (targetScroll - smoothScrollFactor) * 0.15;
    }

    // 3D group rotations reacting to tilt & ambient spin
    group.rotation.x = currentTiltY * 0.45 + Math.sin(t * 0.15) * 0.05;
    group.rotation.y = t * 0.04 + currentTiltX * 0.65 + smoothScrollFactor * 0.4;
    group.rotation.z = -currentTiltX * 0.25;

    // Perspective parallax offset of group and particles
    const isMobile = window.innerWidth < 640;
    const baseY = isMobile ? 0.22 : 0;
    group.position.x = currentTiltX * 0.4;
    group.position.y = baseY - currentTiltY * 0.28 + smoothScrollFactor * 0.25;
    camera.position.z = 8 + smoothScrollFactor * 3.2;

    particles.position.x = -currentTiltX * 0.25;
    particles.position.y = currentTiltY * 0.2;

    // Holographic 3D perspective shift on hero content
    const heroContent = document.querySelector('.hero__content');
    if (heroContent && !reduceMotion) {
      const shiftX = -currentTiltX * 10;
      const shiftY = -currentTiltY * 8;
      const rotDegX = -currentTiltY * 4.2;
      const rotDegY = currentTiltX * 4.2;
      heroContent.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0) rotateX(${rotDegX}deg) rotateY(${rotDegY}deg)`;
    }

    // Fade canvas cleanly as hero leaves so it never bleeds or causes ghosting
    canvas.style.opacity = String(Math.max(0, 1 - smoothScrollFactor * 1.5));

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', setSize);
})();

/* ============================================
   Hero text reveal (load sequence)
============================================ */
function revealHero() {
  const tl = gsap.timeline({ delay: 0.1 });
  tl.to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
    .to('.hero__title-line', { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, '-=0.3')
    .to('.hero__title-accent', { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, '-=0.8')
    .to('.hero__tagline', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    .to('.hero__actions', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5');
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', revealHero);
} else {
  revealHero();
}

/* ============================================
   Generic scroll reveals
============================================ */
gsap.utils.toArray('.about__text, .about__gallery').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

/* Artist dual-photo parallax */
if (document.querySelector('.about__gallery')) {
  gsap.to('.about__photo-card--primary', {
    y: -40,
    ease: 'none',
    scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true }
  });
  gsap.to('.about__photo-card--secondary', {
    y: -70,
    ease: 'none',
    scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true }
  });
}

/* Artist creative pillars stagger */
if (document.querySelector('.about__pillars')) {
  gsap.fromTo('.about__pillar', { opacity: 0, y: 25 }, {
    opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '.about__pillars', start: 'top 85%' }
  });
}

/* Section heads */
gsap.utils.toArray('.section-head').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 40 }, {
    opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%' }
  });
});

/* Connect heading */
gsap.fromTo('.connect__content', { opacity: 0, y: 40 }, {
  opacity: 1, y: 0, duration: 1, ease: 'power3.out',
  scrollTrigger: { trigger: '.connect', start: 'top 70%' }
});

/* Connect cover parallax */
gsap.to('.connect__cover', {
  scale: 1,
  y: -40,
  ease: 'none',
  scrollTrigger: { trigger: '.connect', start: 'top bottom', end: 'bottom top', scrub: true }
});

/* ============================================
   Stat counters
============================================ */
document.querySelectorAll('.stat__num').forEach((el) => {
  const target = parseInt(el.dataset.count, 10);
  ScrollTrigger.create({
    trigger: el,
    start: 'top 90%',
    once: true,
    onEnter: () => {
      gsap.fromTo(el, { innerText: 0 }, {
        innerText: target,
        duration: 1.4,
        ease: 'power2.out',
        snap: { innerText: 1 },
        onUpdate: function () { el.textContent = Math.round(this.targets()[0].innerText); }
      });
    }
  });
});

/* ============================================
   Album card 3D tilt (desktop only)
============================================ */
if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      gsap.to(card, {
        rotateX: y * -4,
        rotateY: x * 4,
        transformPerspective: 900,
        duration: 0.4,
        ease: 'power2.out'
      });
    });
    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
    });
  });
}

/* ============================================
   Marquee pause on hover
============================================ */
const marqueeTrack = document.querySelector('.marquee__track');
const marquee = document.querySelector('.marquee');
if (marquee && marqueeTrack) {
  marquee.addEventListener('mouseenter', () => marqueeTrack.style.animationPlayState = 'paused');
  marquee.addEventListener('mouseleave', () => marqueeTrack.style.animationPlayState = 'running');
}

/* ============================================
   Smooth anchor scroll offset (nav height)
============================================ */
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const id = link.getAttribute('href');
    if (id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const navH = nav ? nav.offsetHeight : 70;
        const offset = (id === '#top') ? 0 : (navH - 6);
        const y = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      }
    }
  });
});
