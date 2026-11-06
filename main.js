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
navBurger.addEventListener('click', () => {
  navBurger.classList.toggle('open');
  navMobile.classList.toggle('open');
});
navMobile.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navBurger.classList.remove('open');
  navMobile.classList.remove('open');
}));

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

  function setSize() {
    const heroEl = document.querySelector('.hero') || canvas.parentElement;
    const w = heroEl ? heroEl.clientWidth : window.innerWidth;
    const h = heroEl ? heroEl.clientHeight : window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  setSize();

  // Group holding the orb layers
  const group = new THREE.Group();
  scene.add(group);

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

  // Particle field
  const particleCount = window.innerWidth < 700 ? 260 : 600;
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

  // Mouse parallax target
  let targetRotX = 0, targetRotY = 0;
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // Entrance animation
  group.scale.setScalar(0.001);
  gsap.to(group.scale, { x: 1, y: 1, z: 1, duration: 2.2, ease: 'elastic.out(0.6, 0.5)', delay: 0.3 });
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

    targetRotX += (mouseY * 0.3 - targetRotX) * 0.04;
    targetRotY += (mouseX * 0.3 - targetRotY) * 0.04;

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

    group.rotation.x = targetRotX + Math.sin(t * 0.15) * 0.05;
    group.rotation.y = Math.sin(t * 0.08) * 0.08 + smoothScrollFactor * 0.4;
    group.rotation.z = targetRotY * 0.5;

    // Anchor camera and group: ALWAYS centered behind "tyzen01" at top (y=0, z=8)
    camera.position.z = 8 + smoothScrollFactor * 3.2;
    group.position.y = smoothScrollFactor * 0.25;

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
window.addEventListener('DOMContentLoaded', () => {
  const tl = gsap.timeline({ delay: 0.2 });
  tl.to('.hero__eyebrow', { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
    .to('.hero__title-line', { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, '-=0.3')
    .to('.hero__title-accent', { opacity: 1, y: 0, duration: 1, ease: 'power4.out' }, '-=0.8')
    .to('.hero__tagline', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    .to('.hero__actions', { opacity: 1, duration: 0.8, ease: 'power2.out' }, '-=0.5')
    .to('.hero__scroll-cue', { opacity: 1, duration: 0.6 }, '-=0.3');
});

/* ============================================
   Generic scroll reveals
============================================ */
gsap.utils.toArray('.about__text, .about__gallery').forEach((el) => {
  gsap.fromTo(el, { opacity: 0, y: 60 }, {
    opacity: 1, y: 0, duration: 1,
    ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 80%' }
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
        const y = target.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }
  });
});
