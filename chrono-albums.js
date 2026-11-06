/**
 * tyzen01 — Chrono Discography Timeline Engine
 * 
 * Interactive WebGL Celestial Arc & 3D Album Card Continuum.
 * Color-matched to tyzen01: Neon Cyan (#3ff0e0), Hot Magenta (#ff2ecc), Electric Violet (#8b5cf6).
 * Perfectly aligned 4-album arc with balanced card sizing and clean typography.
 */

(function () {
  'use strict';

  // =========================================================================
  // 1. ALBUM RELEASES DATASET (NO NUMERIC YEARS)
  // =========================================================================
  const SPOTIFY_ARTIST_URL = 'https://open.spotify.com/artist/7rjJADLNKk5RKndDXQrWpA?si=xJf3Ml9JRKKuRA9f1UHmeQ';

  const ALBUMS = [
    {
      title: 'LOST IN ABYSS',
      railLabel: 'LOST IN ABYSS',
      key: 'Debut Album',
      tag: 'Full Album',
      lines: ['Deep, dark atmospheres', 'Emotional resonance', 'Orchestral synth weight'],
      cover: 'lost-in-abyss-cover.jpg',
      albumName: 'Lost in Abyss',
      spotifyUrl: SPOTIFY_ARTIST_URL,
      ytUrl: 'https://www.youtube.com/playlist?list=PLaFBsqLva-qc'
    },
    {
      title: 'CLOUD 9',
      railLabel: 'CLOUD 9',
      key: 'Second Album',
      tag: 'Full Album',
      lines: ['Weightless & airborne', 'Euphoric textures', 'Drifting synths'],
      cover: 'cloud9-cover.jpg',
      albumName: 'Cloud 9',
      spotifyUrl: SPOTIFY_ARTIST_URL,
      ytUrl: 'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ'
    },
    {
      title: 'SINNER',
      railLabel: 'SINNER',
      key: 'Latest Release',
      tag: 'New Album',
      lines: ['Raw & confessional', 'Peak intensity', 'Unfiltered vision'],
      cover: 'sinner-cover.jpeg',
      albumName: 'Sinner',
      spotifyUrl: SPOTIFY_ARTIST_URL,
      ytUrl: 'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s'
    },
    {
      title: 'SINGLES',
      railLabel: 'SINGLES',
      key: 'The Loose Ends',
      tag: 'Collection',
      lines: ['Standalone drops', 'Genre collisions', 'Experimental sound design'],
      cover: 'cover.jpeg',
      albumName: 'Singles',
      spotifyUrl: SPOTIFY_ARTIST_URL,
      ytUrl: 'https://www.youtube.com/playlist?list=PLIE0IpB4idiI'
    }
  ];

  // =========================================================================
  // 2. MATH & EASING HELPERS
  // =========================================================================
  function clamp(x, a = 0, b = 1) { return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function span(x, a, b) { return clamp((x - a) / (b - a)); }
  function smoothstep(e0, e1, x) {
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  }
  function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
  function easeOutExpo(x) { return x === 1 ? 1 : 1 - Math.pow(2, -10 * x); }
  function damp(cur, target, speed, dt) {
    return lerp(cur, target, 1 - Math.exp(-speed * dt));
  }

  // =========================================================================
  // 3. MINIMAL WEBGL2 UTILITIES
  // =========================================================================
  function createGL(canvas, opts = {}) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false,
      ...opts,
    });
    if (!gl) return null;
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    return gl;
  }

  function compile(gl, type, src, label) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error(`${label}: ${gl.getShaderInfoLog(s)}`);
      return null;
    }
    return s;
  }

  function program(gl, vert, frag, label = 'program') {
    const p = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, vert, `${label} vert`);
    const fs = compile(gl, gl.FRAGMENT_SHADER, frag, `${label} frag`);
    if (!vs || !fs) return null;
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPos');
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      console.error(`${label} link: ${gl.getProgramInfoLog(p)}`);
      return null;
    }
    const uniforms = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      uniforms[info.name] = gl.getUniformLocation(p, info.name);
      if (info.size > 1 && info.name.endsWith('[0]')) {
        const base = info.name.slice(0, -3);
        uniforms[base] = uniforms[info.name];
        for (let k = 1; k < info.size; k++) {
          uniforms[`${base}[${k}]`] = gl.getUniformLocation(p, `${base}[${k}]`);
        }
      }
    }
    return { p, u: uniforms };
  }

  function unitQuad(gl) {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return vao;
  }

  function texture(gl, { wrap = 'clamp', filter = 'linear' } = {}) {
    const t = gl.createTexture();
    const W = wrap === 'repeat' ? gl.REPEAT : gl.CLAMP_TO_EDGE;
    const F = filter === 'nearest' ? gl.NEAREST : gl.LINEAR;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, W);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, W);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, F);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, F);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    return t;
  }

  function upload(gl, tex, source, flipY = false) {
    const w = source.videoWidth ?? source.naturalWidth ?? source.width;
    const h = source.videoHeight ?? source.naturalHeight ?? source.height;
    if (!w || !h) return false;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    return true;
  }

  function bind(gl, tex, unit = 0) {
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    return unit;
  }

  function loadImage(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => {
        const c = document.createElement('canvas');
        c.width = 1; c.height = 1;
        resolve(c);
      };
      img.src = src;
    });
  }

  // =========================================================================
  // 4. CYBERPUNK WEBGL SHADERS
  // =========================================================================
  const V3 = `#version 300 es
  precision highp float;
  layout(location=0) in vec2 aPos;
  out vec2 vUV;
  void main(){
    vUV = vec2(aPos.x, 1.0 - aPos.y);
    gl_Position = vec4(aPos * 2.0 - 1.0, 0.0, 1.0);
  }`;

  // Room: Void base (#060309) with ambient pool and concentric floor rings
  const F3_ROOM = `#version 300 es
  precision highp float;
  in vec2 vUV;
  uniform sampler2D uGrain;
  uniform vec2  uRes;
  uniform float uTime;
  uniform float uAspect;
  uniform float uWake;
  uniform float uRings;
  uniform vec2  uFloor;
  uniform vec2  uPivot;
  uniform float uHeat;
  uniform vec2  uActive;
  out vec4 frag;

  const vec3 CYAN    = vec3(0.25, 0.94, 0.88);
  const vec3 MAGENTA = vec3(1.00, 0.18, 0.80);
  const vec3 VIOLET  = vec3(0.55, 0.36, 0.96);

  vec2 floorSpace(vec2 p, vec2 c){
    vec2 d = (p - c) * vec2(uAspect, 1.0);
    d.y /= 0.30;
    return d;
  }

  void main(){
    vec2 p = vUV;
    vec3 col = vec3(0.016, 0.009, 0.024);

    // Ambient glow under celestial clock
    vec2 dp = (p - uPivot) * vec2(uAspect, 1.0);
    col += CYAN * 0.038 * exp(-dot(dp, dp) * 1.1) * uWake;
    col += VIOLET * 0.028 * exp(-dot(dp, dp) * 0.6) * uWake;

    float horizon = 0.545;
    {
      float onFloor = smoothstep(horizon - 0.05, horizon + 0.06, p.y);
      float depth = clamp((p.y - horizon) / (1.0 - horizon), 0.0, 1.0);

      vec2 fp = floorSpace(p, uFloor);
      float r = length(fp);
      float a = atan(fp.y, fp.x);

      float e = 0.0;
      for(int i = 0; i < 5; i++){
        float fi = float(i);
        float R = 0.16 + fi * 0.135;
        float spin = uTime * (0.05 + fi * 0.023) * (mod(fi, 2.0) < 0.5 ? 1.0 : -1.4);
        float band = smoothstep(0.012, 0.0, abs(r - R));
        float sweep = 0.55 + 0.45 * sin(a * (1.0 + fi) + spin * 6.0);
        e += band * sweep * (1.0 - fi * 0.14);
      }

      vec2 da = floorSpace(p, uActive);
      float reflActive = exp(-dot(da, da) * 22.0) * (0.45 + 0.55 * uHeat);

      vec3 floorCol = VIOLET * e * 0.42 * uRings + CYAN * e * 0.22 * uRings;
      floorCol += MAGENTA * reflActive * 0.40 * uWake;
      floorCol *= (1.0 - depth * 0.40);

      col += floorCol * onFloor;
      col *= mix(1.0, 0.35, depth * onFloor);
    }

    float g = texture(uGrain, p * (uRes / 512.0) * 0.5 + vec2(uTime * 0.002, 0.0)).r;
    col += (g - 0.5) * 0.024;
    vec2 v = (p - 0.5) * vec2(uAspect, 1.0);
    col *= 1.0 - smoothstep(0.44, 1.16, length(v)) * 0.9;

    frag = vec4(col, 1.0);
  }`;

  // Clock: Electric cyan rims, sharp hand, and magenta laser beam
  const F3_CLOCK = `#version 300 es
  precision highp float;
  in vec2 vUV;
  uniform vec2  uRes;
  uniform float uTime;
  uniform float uAspect;
  uniform vec2  uPivot;
  uniform vec2  uDialC;
  uniform float uDial;
  uniform float uReveal;
  uniform float uHand;
  uniform float uHand2;
  uniform vec2  uTarget;
  uniform float uBeam;
  uniform float uHeat;
  out vec4 frag;

  const vec3 CYAN    = vec3(0.25, 0.94, 0.88);
  const vec3 MAGENTA = vec3(1.00, 0.18, 0.80);
  const vec3 VIOLET  = vec3(0.55, 0.36, 0.96);

  float handShape(vec2 d, float ang, float len, float w0, float w1){
    vec2 hv = vec2(cos(ang), sin(ang));
    float along = dot(d, hv);
    float across = abs(d.x * hv.y - d.y * hv.x);
    if(along < 0.0 || along > len) return 0.0;
    float wid = mix(w0, w1, along / len);
    return smoothstep(wid, wid * 0.25, across);
  }

  void main(){
    vec2 p = vUV;
    vec2 d = (p - uPivot) * vec2(uAspect, 1.0);
    float r = length(d);
    float a = atan(d.y, d.x);
    vec3 col = vec3(0.0);
    float draw = smoothstep(0.0, 1.0, uReveal);

    vec2 dd = (p - uDialC) * vec2(uAspect, 1.0);
    float dr = length(dd);
    float da2 = atan(dd.y, dd.x);
    float onScreen = smoothstep(0.05, 0.45, da2) * smoothstep(3.10, 2.70, da2);

    float rim = smoothstep(0.0035, 0.0, abs(dr - uDial));
    col += CYAN * rim * 0.70 * onScreen * draw;
    float rim2 = smoothstep(0.0026, 0.0, abs(dr - uDial * 0.945));
    col += VIOLET * rim2 * 0.40 * onScreen * draw;
    float rim3 = smoothstep(0.0030, 0.0, abs(dr - uDial * 1.07));
    col += CYAN * rim3 * 0.18 * onScreen * draw;

    {
      float n = da2 * 190.0 / 3.14159;
      float f = abs(fract(n) - 0.5);
      float major = step(0.5, abs(fract(n / 5.0) - 0.5) * 2.0 - 0.4);
      float tick = smoothstep(0.42, 0.48, f);
      float len = mix(0.011, 0.022, major);
      float inBand = smoothstep(len, 0.0, abs(dr - uDial * 0.972));
      col += mix(CYAN, vec3(1.0), major) * tick * inBand * (0.50 + 0.50 * major) * onScreen * draw;
    }

    // Laser beam thrown at active node
    float da = a - uHand;
    da = atan(sin(da), cos(da));
    float reach = smoothstep(1.30, 0.05, r);
    float wedge = exp(-da * da * 70.0);
    col += MAGENTA * wedge * reach * 0.65 * uBeam * (0.86 + 0.14 * sin(uTime * 2.2));
    col += mix(MAGENTA, CYAN, 0.40) * exp(-da * da * 850.0) * reach * 0.90 * uBeam;

    // Node impact flare
    vec2 td = (p - uTarget) * vec2(uAspect, 1.0);
    col += MAGENTA * exp(-dot(td, td) * 160.0) * 1.35 * uBeam;
    col += CYAN * exp(-dot(td, td) * 950.0) * 1.45 * uBeam;

    // Clock Hand
    float h1 = handShape(d, uHand, 0.34, 0.0050, 0.0010);
    col += vec3(0.92, 0.98, 1.0) * h1 * 1.15 * draw;

    float h2 = handShape(d, uHand2, 0.30, 0.0056, 0.0008);
    col += mix(VIOLET, CYAN, 0.5) * h2 * 0.95 * draw;
    {
      vec2 hv2 = vec2(cos(uHand2), sin(uHand2));
      vec2 orn = hv2 * 0.135;
      vec2 ov = d - orn;
      float od = length(ov);
      float oa = atan(ov.y, ov.x);
      float orad = 0.0110 * (0.72 + 0.28 * cos(4.0 * (oa - uHand2)));
      float rose = smoothstep(orad, orad * 0.70, od) * smoothstep(0.0036, 0.0052, od);
      col += CYAN * rose * 1.05 * draw;
      float h2c = handShape(d, uHand2, 0.30, 0.0016, 0.0004);
      float outer = smoothstep(0.15, 0.19, dot(d, hv2));
      col += vec3(1.0) * h2c * outer * 0.9 * draw;
    }

    {
      float ball = smoothstep(0.0165, 0.0135, r);
      vec2 hi = d - vec2(-0.005, -0.005);
      float sheen = exp(-dot(hi, hi) * 9000.0);
      col += (VIOLET * 0.85 + vec3(1.0) * sheen) * ball * draw;
      col += CYAN * exp(-r * r * 900.0) * 0.55 * draw;
    }

    frag = vec4(col, 1.0);
  }`;

  // Track: Double cyan rail, running magenta energy pulse, glowing nodes
  const F3_TRACK = `#version 300 es
  precision highp float;
  in vec2 vUV;
  uniform vec2  uRes;
  uniform float uTime;
  uniform float uAspect;
  uniform vec3  uArc;
  uniform vec2  uSpan;
  uniform float uReveal;
  uniform float uActiveU;
  uniform float uHeat;
  uniform int   uNodeCount;
  uniform vec2  uNodes[8];
  uniform float uNodeIn[8];
  out vec4 frag;

  const vec3 CYAN    = vec3(0.25, 0.94, 0.88);
  const vec3 MAGENTA = vec3(1.00, 0.18, 0.80);
  const vec3 VIOLET  = vec3(0.55, 0.36, 0.96);

  void main(){
    vec2 p = vUV;
    vec2 d = (p - uArc.xy) * vec2(uAspect, 1.0);
    float r = length(d);
    float a = atan(d.y, d.x);
    vec3 col = vec3(0.0);

    float u = clamp((a - uSpan.x) / (uSpan.y - uSpan.x), 0.0, 1.0);
    float within = step(min(uSpan.x, uSpan.y) - 0.02, a) * step(a, max(uSpan.x, uSpan.y) + 0.02);
    float drawn = smoothstep(uReveal + 0.02, uReveal - 0.06, u);

    float line = smoothstep(0.0016, 0.0, abs(r - (uArc.z - 0.0035)));
    float line2 = smoothstep(0.0014, 0.0, abs(r - (uArc.z + 0.0035)));
    float glow = exp(-pow((r - uArc.z) / 0.011, 2.0));
    col += (CYAN * line * 0.95 + VIOLET * line2 * 0.65 + mix(CYAN, VIOLET, 0.5) * glow * 0.30) * within * drawn;

    {
      float tn = a * 260.0 / 3.14159;
      float tf = smoothstep(0.40, 0.47, abs(fract(tn) - 0.5));
      float band2 = smoothstep(0.0, 0.004, r - (uArc.z + 0.006)) * smoothstep(0.017, 0.009, r - (uArc.z + 0.006));
      col += CYAN * tf * band2 * 0.35 * within * drawn;
    }

    float head = uActiveU / max(1.0, float(uNodeCount - 1));
    float chase = fract(u * 2.4 - uTime * 0.28);
    float pulse = pow(max(0.0, 1.0 - abs(u - head) * 6.0), 2.0);
    col += MAGENTA * (line + line2 * 0.6) * (0.65 * pulse + 0.25 * pow(chase, 8.0)) * within * drawn * (0.6 + 0.4 * uHeat);
    col += MAGENTA * line * smoothstep(head + 0.04, head - 0.10, u) * 0.35 * within * drawn;

    for(int i = 0; i < 8; i++){
      if(i >= uNodeCount) break;
      vec2 nd = (p - uNodes[i]) * vec2(uAspect, 1.0);
      float ndr = length(nd);
      float near = 1.0 - clamp(abs(float(i) - uActiveU), 0.0, 1.0);
      float k = uNodeIn[i];
      col += vec3(0.95, 0.98, 1.0) * smoothstep(0.0055, 0.0015, ndr) * k;
      col += mix(CYAN, MAGENTA, near) * exp(-ndr * ndr * 2600.0) * (0.6 + 1.0 * near) * k;
      col += MAGENTA * exp(-ndr * ndr * 420.0) * 0.55 * near * k * uHeat;
    }

    frag = vec4(col, 1.0);
  }`;

  const F3_POST = `#version 300 es
  precision highp float;
  in vec2 vUV;
  uniform sampler2D uGrain;
  uniform vec2 uRes;
  uniform float uTime;
  uniform float uAmount;
  uniform float uAspect;
  out vec4 frag;
  void main(){
    vec2 j = vec2(fract(sin(uTime * 12.9898) * 43758.5453), fract(sin(uTime * 78.233) * 12345.6789));
    float g = texture(uGrain, vUV * (uRes / 512.0) + j).r - 0.5;
    vec2 v = (vUV - 0.5) * vec2(uAspect, 1.0);
    frag = vec4(vec3(g * uAmount), smoothstep(0.48, 1.2, length(v)) * 0.45);
  }`;

  // =========================================================================
  // 5. ICONIC CASCADING TIMELINE GEOMETRY (CALIBRATED FOR 4 ALBUMS)
  // =========================================================================
  // Measured along the reference celestial arc, safely framed so no card
  // or tag ever runs out of the viewport.
  const REF = {
    nodes: [
      [0.245, 0.175],  // Lost in Abyss (well below top navbar)
      [0.420, 0.252],  // Cloud 9
      [0.605, 0.312],  // Sinner
      [0.790, 0.345],  // Singles (safely inside right frame)
    ],
    // [fx, fy, fw] - center of card's photo, and width fraction
    cards: [
      [0.240, 0.305, 0.088],  // Card 0: Debut
      [0.415, 0.375, 0.096],  // Card 1: Cloud 9
      [0.600, 0.430, 0.105],  // Card 2: Sinner
      [0.785, 0.470, 0.116],  // Card 3: Singles
    ],
    pivot: [0.6991, 0.0483],
    dial: [0.0, -0.20, 0.47],
    floor: [0.4900, 0.9550],
  };

  function solve3(A, b) {
    const N = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    const r = [0, 0, 0];
    for (let k = 0; k < A.length; k++) {
      for (let i = 0; i < 3; i++) {
        r[i] += A[k][i] * b[k];
        for (let j = 0; j < 3; j++) N[i][j] += A[k][i] * A[k][j];
      }
    }
    for (let i = 0; i < 3; i++) {
      let p = i;
      for (let k = i + 1; k < 3; k++) if (Math.abs(N[k][i]) > Math.abs(N[p][i])) p = k;
      [N[i], N[p]] = [N[p], N[i]];
      [r[i], r[p]] = [r[p], r[i]];
      const d = N[i][i] || 1e-9;
      for (let k = i + 1; k < 3; k++) {
        const f = N[k][i] / d;
        for (let j = i; j < 3; j++) N[k][j] -= f * N[i][j];
        r[k] -= f * r[i];
      }
    }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) {
      let s = r[i];
      for (let j = i + 1; j < 3; j++) s -= N[i][j] * x[j];
      x[i] = s / (N[i][i] || 1e-9);
    }
    return x;
  }

  function fitCircle(pts) {
    const A = pts.map((p) => [p[0], p[1], 1]);
    const b = pts.map((p) => -(p[0] * p[0] + p[1] * p[1]));
    const [D, E, F] = solve3(A, b);
    const cx = -D / 2;
    const cy = -E / 2;
    return { cx, cy, r: Math.sqrt(Math.max(cx * cx + cy * cy - F, 1)) };
  }

  function fitScene(w, h, count = ALBUMS.length) {
    const refAspect = 16 / 9;
    const aspect = w / h;
    const portrait = aspect < 0.95;

    let scale;
    let ox = 0;
    let oy = 0;
    if (aspect >= refAspect) {
      scale = h / 720;
      ox = (w - 1280 * scale) * 0.5;
    } else {
      scale = w / 1280;
      oy = (h - 720 * scale) * 0.5;
    }

    const P = ([fx, fy]) => [ox + fx * 1280 * scale, oy + fy * 720 * scale];

    let nodes, cards, pivot, floor;

    if (portrait) {
      const railX = w * 0.16;
      const top = h * 0.22;
      const step = h * (0.46 / Math.max(1, count - 1));
      nodes = REF.nodes.map((_, i) => [railX, top + i * step]);
      const cw = Math.min(w * 0.65, 290);
      cards = REF.cards.map((_, i) => ({ x: w * 0.60, y: h * 0.50, w: cw, i }));
      pivot = [w * 0.52, h * 0.08];
      floor = [w * 0.5, h * 0.965];
    } else {
      nodes = REF.nodes.map(P);
      cards = REF.cards.map(([fx, fy, fw], i) => {
        const [x, y] = P([fx, fy]);
        return {
          x,
          y,
          w: fw * 1280 * scale * 1.62,
          i,
        };
      });
      pivot = P(REF.pivot);
      floor = P(REF.floor);
    }

    const arc = fitCircle(nodes);
    const angles = nodes.map((n) => Math.atan2(n[1] - arc.cy, n[0] - arc.cx));
    const handAngles = nodes.map((n) => Math.atan2(n[1] - pivot[1], n[0] - pivot[0]));

    const dial = portrait
      ? { cx: pivot[0], cy: pivot[1] - h * 0.30, r: h * 0.40 }
      : {
        cx: pivot[0] + REF.dial[0] * 720 * scale,
        cy: pivot[1] + REF.dial[1] * 720 * scale,
        r: REF.dial[2] * 720 * scale,
      };

    return {
      w, h, scale, portrait, count,
      nodes, cards, pivot, dial, floor, arc, angles, handAngles,
    };
  }

  function timeAt(layout, px, py) {
    const pts = layout.portrait
      ? layout.nodes.map((n) => [n[0], n[1]])
      : layout.cards.map((c) => [c.x, c.y]);
    let best = 0;
    let bestD = Infinity;

    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((px - ax) * dx + (py - ay) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      const qx = ax + dx * t;
      const qy = ay + dy * t;
      const d = (px - qx) ** 2 + (py - qy) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i + t;
      }
    }
    return { u: best, dist: Math.sqrt(bestD) };
  }

  function angleAt(list, u) {
    const i = Math.max(0, Math.min(list.length - 2, Math.floor(u)));
    const t = Math.max(0, Math.min(1, u - i));
    let a = list[i];
    let b = list[i + 1];
    let d = b - a;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a + d * t;
  }

  // =========================================================================
  // 6. ENTRANCE STAGING
  // =========================================================================
  const T3 = {
    warm: 0.1,
    rail: 0.2,
    railDur: 0.6,
    clock: 0.35,
    clockDur: 0.6,
    cards: 0.45,
    cardStagger: 0.1,
    cardDur: 0.5,
    rings: 0.8,
    energy: 1.0,
    live: 1.3,
  };

  function sample3(t, n = ALBUMS.length) {
    const wake = smoothstep(0, 1, span(t, T3.warm, T3.warm + 1.2));
    const rail = easeOutCubic(span(t, T3.rail, T3.rail + T3.railDur));
    const clock = easeOutExpo(span(t, T3.clock, T3.clock + T3.clockDur));

    const cards = [];
    const nodes = [];
    for (let i = 0; i < n; i++) {
      const t0 = T3.cards + i * T3.cardStagger;
      cards.push(easeOutCubic(span(t, t0, t0 + T3.cardDur)));
      nodes.push(easeOutCubic(span(t, t0 - 0.15, t0 + 0.3)));
    }

    const rings = smoothstep(0, 1, span(t, T3.rings, T3.rings + 1.2));
    const energy = smoothstep(0, 1, span(t, T3.energy, T3.energy + 1.0));

    return {
      wake,
      rail,
      clock,
      cards,
      nodes,
      rings,
      energy,
      introU: lerp(0, n - 1, easeOutExpo(span(t, T3.clock + 0.2, T3.clock + 1.8))),
      handAuthority: 1 - smoothstep(0, 1, span(t, T3.live - 0.4, T3.live + 0.3)),
      grain: lerp(0.065, 0.032, smoothstep(0, 1, span(t, 0.3, T3.rings))),
      live: t >= T3.live,
      progress: clamp(t / T3.live),
    };
  }

  // =========================================================================
  // 7. CHRONO CORE ENGINE
  // =========================================================================
  class Chrono {
    constructor(canvas, gl) {
      this.canvas = canvas;
      this.gl = gl;
      this.progs = {
        room: program(gl, V3, F3_ROOM, 'room'),
        track: program(gl, V3, F3_TRACK, 'track'),
        clock: program(gl, V3, F3_CLOCK, 'clock'),
        post: program(gl, V3, F3_POST, 'post'),
      };
      this.quad = unitQuad(gl);
      this.tex = { grain: texture(gl, { wrap: 'repeat' }) };

      this.layout = null;
      this.res = [1, 1];
      this.u = 2; // Default focused on 'SINNER' (latest release index)
      this.targetU = 2;
      this.heat = 0;
      this.pointer = { x: 0, y: 0, tx: 0, ty: 0, inside: false };
      this.active = 2;
    }

    async load() {
      const grain = await loadImage('grain.png');
      upload(this.gl, this.tex.grain, grain);
    }

    resize(w, h, dpr) {
      const W = Math.round(w * dpr);
      const H = Math.round(h * dpr);
      if (this.canvas.width !== W || this.canvas.height !== H) {
        this.canvas.width = W;
        this.canvas.height = H;
      }
      this.res = [W, H];
      this.cssW = w;
      this.cssH = h;
      this.dpr = dpr;
      this.layout = fitScene(w, h, ALBUMS.length);
      this.gl.viewport(0, 0, W, H);
      return this.layout;
    }

    _n(x, y) {
      return [x / this.cssW, y / this.cssH];
    }

    render(t, dt) {
      const gl = this.gl;
      const L = this.layout;
      if (!L) return null;
      const [W, H] = this.res;
      const aspect = W / H;
      const s = sample3(t, ALBUMS.length);

      const wanted = lerp(this.targetU, s.introU, s.handAuthority);
      this.u = clamp(damp(this.u, wanted, 4.2, dt), 0, ALBUMS.length - 1);
      this.active = Math.max(0, Math.min(ALBUMS.length - 1, Math.round(this.u)));
      this.heat = damp(this.heat, s.energy, 3.0, dt);

      const p = this.pointer;
      p.x = damp(p.x, p.inside ? p.tx : 0, 2.6, dt);
      p.y = damp(p.y, p.inside ? p.ty : 0, 2.6, dt);
      const par = s.live ? 1 : 0;
      const camX = -p.x * 0.010 * par;
      const camY = -p.y * 0.006 * par;

      const hand = angleAt(L.handAngles, this.u);
      const last = ALBUMS.length - 1;
      const i0 = Math.max(0, Math.min(last, Math.floor(this.u) || 0));
      const i1 = Math.min(last, i0 + 1);
      const activePos = this._n(
        lerp(L.cards[i0].x, L.cards[i1].x, clamp(this.u - i0, 0, 1)),
        L.cards[this.active].y,
      );
      const fu = clamp(this.u - i0, 0, 1);
      const nodeScr = this._n(
        lerp(L.nodes[i0][0], L.nodes[i1][0], fu),
        lerp(L.nodes[i0][1], L.nodes[i1][1], fu),
      );

      gl.disable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.clearColor(0.024, 0.012, 0.035, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindVertexArray(this.quad);

      const pivotN = this._n(L.pivot[0], L.pivot[1]);
      const floorN = this._n(L.floor[0], L.floor[1]);

      // 1. Room
      {
        const pr = this.progs.room;
        if (pr) {
          gl.useProgram(pr.p);
          gl.uniform1i(pr.u.uGrain, bind(gl, this.tex.grain, 0));
          gl.uniform2f(pr.u.uRes, W, H);
          gl.uniform1f(pr.u.uTime, t);
          gl.uniform1f(pr.u.uAspect, aspect);
          gl.uniform1f(pr.u.uWake, s.wake);
          gl.uniform1f(pr.u.uRings, s.rings);
          gl.uniform2f(pr.u.uFloor, floorN[0] + camX, floorN[1] + camY);
          gl.uniform2f(pr.u.uPivot, pivotN[0] + camX, pivotN[1] + camY);
          gl.uniform1f(pr.u.uHeat, this.heat);
          gl.uniform2f(pr.u.uActive, activePos[0], activePos[1]);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }

      // 2. Track (additive)
      gl.blendFunc(gl.ONE, gl.ONE);
      {
        const pr = this.progs.track;
        if (pr) {
          gl.useProgram(pr.p);
          gl.uniform2f(pr.u.uRes, W, H);
          gl.uniform1f(pr.u.uTime, t);
          gl.uniform1f(pr.u.uAspect, aspect);
          const cN = this._n(L.arc.cx, L.arc.cy);
          gl.uniform3f(pr.u.uArc, cN[0] + camX * 0.6, cN[1] + camY * 0.6, L.arc.r / this.cssH);
          gl.uniform2f(pr.u.uSpan, L.angles[0], L.angles[L.angles.length - 1]);
          gl.uniform1f(pr.u.uReveal, s.rail);
          gl.uniform1f(pr.u.uActiveU, this.u);
          gl.uniform1f(pr.u.uHeat, this.heat);
          gl.uniform1i(pr.u.uNodeCount, L.nodes.length);
          for (let i = 0; i < L.nodes.length; i++) {
            const n = this._n(L.nodes[i][0], L.nodes[i][1]);
            gl.uniform2f(pr.u[`uNodes[${i}]`], n[0] + camX * 0.6, n[1] + camY * 0.6);
            gl.uniform1f(pr.u[`uNodeIn[${i}]`], s.nodes[i]);
          }
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }

      // 3. Celestial Clock (additive)
      gl.blendFunc(gl.ONE, gl.ONE);
      {
        const pr = this.progs.clock;
        if (pr) {
          gl.useProgram(pr.p);
          gl.uniform2f(pr.u.uRes, W, H);
          gl.uniform1f(pr.u.uTime, t);
          gl.uniform1f(pr.u.uAspect, aspect);
          gl.uniform2f(pr.u.uPivot, pivotN[0] + camX, pivotN[1] + camY);
          const dc = this._n(L.dial.cx, L.dial.cy);
          gl.uniform2f(pr.u.uDialC, dc[0] + camX, dc[1] + camY);
          gl.uniform1f(pr.u.uDial, L.dial.r / this.cssH);
          gl.uniform1f(pr.u.uReveal, s.clock);
          gl.uniform1f(pr.u.uHand, hand);
          gl.uniform1f(pr.u.uHand2, hand + 1.29);
          gl.uniform2f(pr.u.uTarget, nodeScr[0], nodeScr[1]);
          gl.uniform1f(pr.u.uBeam, s.energy);
          gl.uniform1f(pr.u.uHeat, this.heat);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }

      // 4. Post-processing (grain & vignette)
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      {
        const pr = this.progs.post;
        if (pr) {
          gl.useProgram(pr.p);
          gl.uniform1i(pr.u.uGrain, bind(gl, this.tex.grain, 0));
          gl.uniform2f(pr.u.uRes, W, H);
          gl.uniform1f(pr.u.uTime, t);
          gl.uniform1f(pr.u.uAmount, s.grain);
          gl.uniform1f(pr.u.uAspect, aspect);
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
      gl.bindVertexArray(null);

      return s;
    }
  }

  // =========================================================================
  // 8. BOOT & DOM CONTROLLER
  // =========================================================================
  async function initChronoDiscography() {
    const section = document.getElementById('chrono') || document.getElementById('albums');
    const canvas = document.getElementById('chronoStage');
    const deck = document.getElementById('chronoDeck');
    if (!section || !canvas || !deck) return null;

    deck.innerHTML = '';

    const gl = createGL(canvas);
    if (!gl) {
      console.warn('WebGL2 not available for chrono stage.');
      return null;
    }

    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarseMQ = matchMedia('(pointer: coarse)');

    const chrono = new Chrono(canvas, gl);
    await chrono.load();

    function setTarget(u) {
      chrono.targetU = Math.max(0, Math.min(ALBUMS.length - 1, u));
    }

    function handlePlayAlbum(album) {
      const url = album.spotifyUrl || album.ytUrl || SPOTIFY_ARTIST_URL;
      window.open(url, '_blank', 'noopener');
    }

    // Render Cards in DOM
    const cards = ALBUMS.map((alb, i) => {
      const el = document.createElement('div');
      el.className = 'yr';
      el.dataset.i = String(i);
      el.setAttribute('role', 'region');
      el.setAttribute('aria-label', `${alb.title} — ${alb.key}`);

      el.innerHTML = `
        <div class="yr__frame">
          <div class="yr__art-wrap">
            <img class="yr__img" src="${alb.cover}" alt="${alb.title} cover art" loading="lazy">
            <span class="yr__badge">${alb.tag}</span>
            <div class="yr__play-btn" title="Stream ${alb.title} on Spotify">
              <div class="yr__play-icon yr__play-icon--spotify">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                </svg>
              </div>
            </div>
          </div>
          <div class="yr__body">
            <div class="yr__header">
              <span class="yr__title">${alb.title}</span>
            </div>
            <span class="yr__key">${alb.key}</span>
            <div class="yr__lines">
              ${alb.lines.map((l) => `<i>${l}</i>`).join('')}
            </div>
            <div class="yr__action">
              <span class="yr__action-text">Stream on Spotify</span>
              <svg class="yr__go" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M3 13L13 3M5 3h8v8"/>
              </svg>
            </div>
          </div>
        </div>
      `;

      const playBtn = el.querySelector('.yr__play-btn');
      if (playBtn) {
        playBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          handlePlayAlbum(alb);
        });
      }
      const actionRow = el.querySelector('.yr__action');
      if (actionRow) {
        actionRow.addEventListener('click', (e) => {
          e.stopPropagation();
          handlePlayAlbum(alb);
        });
      }

      deck.appendChild(el);
      return el;
    });

    // Album Name Tags floating along the rail
    const labels = ALBUMS.map((alb, i) => {
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'yr-tag';
      el.textContent = alb.railLabel;
      el.tabIndex = -1;
      el.setAttribute('aria-label', `Select ${alb.title}`);
      el.addEventListener('click', () => setTarget(i));
      el.addEventListener('pointerenter', () => { if (!coarseMQ.matches) setTarget(i); });
      deck.appendChild(el);
      return el;
    });

    const state = { started: 0, running: false, visible: false, raf: 0, last: 0 };

    function place() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const L = chrono.resize(window.innerWidth, window.innerHeight, dpr);
      const portrait = L.portrait;

      for (let i = 0; i < cards.length; i++) {
        const c = L.cards[i];
        const el = cards[i];
        el.style.width = `${c.w}px`;
        el.style.left = `${c.x}px`;
        el.style.top = `${c.y}px`;

        // Card leans with the tangent of the arc, exactly as before
        const tilt = portrait ? 0 : (L.angles[i] - L.angles[L.angles.length - 1]) * 14;
        el.style.setProperty('--tilt', `${tilt.toFixed(2)}deg`);
        el.style.setProperty('--depth', String(i));

        const n = L.nodes[i];
        labels[i].style.left = `${n[0]}px`;
        labels[i].style.top = `${n[1]}px`;
        labels[i].style.fontSize = `${Math.max(14, Math.min(20, c.w * 0.088))}px`;
      }
      section.classList.toggle('is-portrait', portrait);
    }

    place();

    let resizeId;
    window.addEventListener('resize', () => {
      clearTimeout(resizeId);
      resizeId = setTimeout(place, 120);
    });

    // Pointer projection along the timeline curve
    section.addEventListener('pointermove', (e) => {
      if (coarseMQ.matches) return;
      const r = canvas.getBoundingClientRect();
      const px = e.clientX - r.left;
      const py = e.clientY - r.top;
      chrono.pointer.tx = (px / r.width) * 2 - 1;
      chrono.pointer.ty = (py / r.height) * 2 - 1;
      chrono.pointer.inside = true;
      const { u, dist } = timeAt(chrono.layout, px, py);
      if (dist < r.height * 0.65) setTarget(u);
    }, { passive: true });

    section.addEventListener('pointerleave', () => {
      chrono.pointer.inside = false;
    });

    cards.forEach((el, i) => {
      el.addEventListener('pointerenter', () => { if (!coarseMQ.matches) setTarget(i); });
      el.addEventListener('click', () => {
        if (chrono.active === i) {
          handlePlayAlbum(ALBUMS[i]);
        } else {
          setTarget(i);
        }
      });
    });

    let lastActive = -1;
    const frame = (now) => {
      if (!state.running) return;
      const dt = Math.min(0.05, (now - state.last) / 1000 || 0.016);
      state.last = now;
      const t = reduced ? T3.live + 2 : (now - state.started) / 1000;

      const s = sample3(t, ALBUMS.length);

      try {
        chrono.render(t, dt);
      } catch (err) {
        console.error('Chrono render error:', err);
      }

      if (s) {
        if (s.live || t > 1.0) section.classList.add('is-live');
        for (let i = 0; i < cards.length; i++) {
          const near = 1 - Math.min(1, Math.abs(i - chrono.u));
          cards[i].style.setProperty('--in', s.cards[i].toFixed(3));
          cards[i].style.setProperty('--near', near.toFixed(3));
          labels[i].style.setProperty('--in', s.nodes[i].toFixed(3));
          labels[i].style.setProperty('--near', near.toFixed(3));
        }
        if (chrono.active !== lastActive) {
          lastActive = chrono.active;
          cards.forEach((el, i) => {
            const isActive = i === chrono.active;
            el.classList.toggle('is-active', isActive);
            el.style.zIndex = isActive ? '20' : String(5 + i);
          });
          labels.forEach((el, i) => el.classList.toggle('is-active', i === chrono.active));
          section.dataset.album = String(ALBUMS[chrono.active].title);
        }
      }
      state.raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (state.running) return;
      state.running = true;
      state.last = performance.now();
      if (!state.started) state.started = performance.now() - 300;
      section.classList.add('is-live');
      state.raf = requestAnimationFrame(frame);
    };

    const stop = () => {
      state.running = false;
      cancelAnimationFrame(state.raf);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        state.visible = e.isIntersecting;
        if (e.isIntersecting) start();
        else stop();
      }
    }, { threshold: 0.15 });

    observer.observe(section);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') stop();
      else if (state.visible) start();
    });

    window.__chronoDiscography = chrono;
    return chrono;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChronoDiscography);
  } else {
    initChronoDiscography();
  }
})();
