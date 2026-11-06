/* ============================================
   TYZEN01 — player-page.js
   Dedicated Demo Vault & Interactive Music Player
============================================ */

/* ---------- Supabase configuration ---------- */
const SUPABASE_URL = 'https://nwovdousfpavbekbqvbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b3Zkb3VzZnBhdmJla2JxdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMDU3MjMsImV4cCI6MjEwNDY4MTcyM30.Ss5uFkB94Cto6aV1HNebE7KTHuym4rCrWXRzjUpvY-Y';
const BUCKET_NAME = 'tyzen01';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

function storageUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(filename)}`;
}

/* Album Fallback Art & Colors */
const ALBUM_METADATA = {
  'Sinner': {
    defaultArt: 'sinner-cover.jpeg',
    color: '#ff2ecc',
    gradient: 'linear-gradient(135deg, rgba(255, 46, 204, 0.25), rgba(139, 92, 246, 0.15))',
    ytPlaylist: 'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s',
    tag: 'Latest Record'
  },
  'Cloud 9': {
    defaultArt: 'cloud9-cover.jpg',
    color: '#3ff0e0',
    gradient: 'linear-gradient(135deg, rgba(63, 240, 224, 0.25), rgba(139, 92, 246, 0.15))',
    ytPlaylist: 'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ',
    tag: 'Full Album'
  },
  'Lost in Abyss': {
    defaultArt: 'lost-in-abyss-cover.jpg',
    color: '#8b5cf6',
    gradient: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(255, 46, 204, 0.12))',
    ytPlaylist: 'https://www.youtube.com/playlist?list=PLaFBsqLva-qc',
    tag: 'Full Album'
  },
  'Singles': {
    defaultArt: 'cover.jpeg',
    color: '#d4f43b',
    gradient: 'linear-gradient(135deg, rgba(212, 244, 59, 0.2), rgba(63, 240, 224, 0.15))',
    ytPlaylist: 'https://www.youtube.com/playlist?list=PLIE0IpB4idiI',
    tag: 'Standalone Drops'
  }
};

/* Built-in Full Demo Catalog (Works offline/fallback & instant preview) */
const FALLBACK_TRACKS = [
  // Sinner
  { id: 's1', album: 'Sinner', track_number: 1, title: 'Stay Humble', demo_file: 'stay humble (cut).mp3', art_file: 'stay humble.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s' },
  { id: 's2', album: 'Sinner', track_number: 2, title: "That's the Name", demo_file: "that's the name (cut).mp3", art_file: "that's the name.jpeg", youtube_url: 'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s' },
  { id: 's3', album: 'Sinner', track_number: 3, title: 'Not the Space', demo_file: 'Not the space (cut).mp3', art_file: 'not the space.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s' },
  { id: 's4', album: 'Sinner', track_number: 4, title: 'Not the Space (Her Version)', demo_file: 'not the space (her version) (cut).mp3', art_file: 'not the space (her version).jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLR1DMr_gwB-s' },
  
  // Cloud 9
  { id: 'c1', album: 'Cloud 9', track_number: 1, title: 'After Midnight', demo_file: 'AFTER MIDNIGHT (cut).mp3', art_file: 'after midnight.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ' },
  { id: 'c2', album: 'Cloud 9', track_number: 2, title: "Livin' Good", demo_file: 'livin good (cut).mp3', art_file: "livin' good.jpeg", youtube_url: 'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ' },
  { id: 'c3', album: 'Cloud 9', track_number: 3, title: 'Stay in My Lane', demo_file: 'stay in my lane (cut).mp3', art_file: 'stay in my lane.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ' },
  { id: 'c4', album: 'Cloud 9', track_number: 4, title: 'Take Me to Cloud-9', demo_file: 'take me to cloud 9 (cut).mp3', art_file: 'take me to cloud-9.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLUPUNgimvEYQ' },
  
  // Lost in Abyss
  { id: 'l1', album: 'Lost in Abyss', track_number: 1, title: 'Enough', demo_file: 'Enough (cut).mp3', art_file: 'enough.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLaFBsqLva-qc' },
  { id: 'l2', album: 'Lost in Abyss', track_number: 2, title: 'Still I Shine', demo_file: 'Still i shine (cut).mp3', art_file: 'still i shine.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLaFBsqLva-qc' },
  { id: 'l3', album: 'Lost in Abyss', track_number: 3, title: 'Unrequited', demo_file: 'Unrequited (cut).mp3', art_file: 'unrequited.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLaFBsqLva-qc' },
  { id: 'l4', album: 'Lost in Abyss', track_number: 4, title: 'Unrequited (Reprise)', demo_file: 'Unrequited reprise (cut).mp3', art_file: 'unrequited reprise.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLaFBsqLva-qc' },
  
  // Singles
  { id: 'sing1', album: 'Singles', track_number: null, title: "Keep It Movin'", demo_file: "keep it movin (cut).mp3", art_file: "keep it movin'.jpeg", youtube_url: 'https://www.youtube.com/playlist?list=PLIE0IpB4idiI' },
  { id: 'sing2', album: 'Singles', track_number: null, title: "You're the Reason", demo_file: "you're the reason (cut).mp3", art_file: "you're the reason.jpeg", youtube_url: 'https://www.youtube.com/playlist?list=PLIE0IpB4idiI' },
  { id: 'sing3', album: 'Singles', track_number: null, title: 'Interlude', demo_file: 'take me to cloud-9 (interlude) (cut).mp3', art_file: 'take me to cloud-9 (interlude).jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLIE0IpB4idiI' },
  { id: 'sing4', album: 'Singles', track_number: null, title: 'We Rise', demo_file: 'we rise (cut).mp3', art_file: 'we rise.jpeg', youtube_url: 'https://www.youtube.com/playlist?list=PLIE0IpB4idiI' }
];

/* ---------- App State ---------- */
let allTracks = [];
let filteredTracks = [];
let currentTrackIndex = 0;
let currentTrack = null;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let currentFilter = 'all';
let currentSearchQuery = '';

/* ---------- DOM Elements ---------- */
const audio = new Audio();
audio.preload = 'metadata';

const ambientGlow = document.getElementById('ambientGlow');
const enlargedArt = document.getElementById('enlargedArt');
const albumArtFrame = document.getElementById('albumArtFrame');
const vinylDisc = document.getElementById('vinylDisc');
const vinylLabel = document.getElementById('vinylLabel');
const nowPlayingAlbumTag = document.getElementById('nowPlayingAlbumTag');
const nowPlayingTitle = document.getElementById('nowPlayingTitle');
const nowPlayingAlbum = document.getElementById('nowPlayingAlbum');
const trackStatusBadge = document.getElementById('trackStatusBadge');
const trackNumberBadge = document.getElementById('trackNumberBadge');
const deckFullVerLink = document.getElementById('deckFullVerLink');

const progressTrack = document.getElementById('progressTrack');
const progressFill = document.getElementById('progressFill');
const progressHandle = document.getElementById('progressHandle');
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const durationTimeDisplay = document.getElementById('durationTimeDisplay');

const btnPlayPause = document.getElementById('btnPlayPause');
const deckIconPlay = document.getElementById('deckIconPlay');
const deckIconPause = document.getElementById('deckIconPause');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const btnShuffle = document.getElementById('btnShuffle');
const btnRepeat = document.getElementById('btnRepeat');

const btnMute = document.getElementById('btnMute');
const iconVolHigh = document.getElementById('iconVolHigh');
const iconVolMuted = document.getElementById('iconVolMuted');
const volSlider = document.getElementById('volSlider');

const libraryList = document.getElementById('libraryList');
const filterChips = document.querySelectorAll('.filter-chip');
const trackSearchInput = document.getElementById('trackSearchInput');
const searchClearBtn = document.getElementById('searchClearBtn');

const countAll = document.getElementById('countAll');
const countSinner = document.getElementById('countSinner');
const countCloud9 = document.getElementById('countCloud9');
const countLost = document.getElementById('countLost');
const countSingles = document.getElementById('countSingles');

/* Track Ended Overlay Elements */
const trackEndedOverlay = document.getElementById('trackEndedOverlay');
const trackEndedTitle = document.getElementById('trackEndedTitle');
const trackEndedYtBtn = document.getElementById('trackEndedYtBtn');
const trackEndedNextBtn = document.getElementById('trackEndedNextBtn');
const nav = document.getElementById('nav');

/* Visualizer Elements */
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
let audioCtx = null;
let analyser = null;
let source = null;
let dataArray = null;
let isVisualizerInit = false;

/* ---------- Visualizer Setup ---------- */
function initAudioContext() {
  if (isVisualizerInit) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;
    
    // Cross-origin audio setup
    audio.crossOrigin = 'anonymous';
    try {
      source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (e) {
      console.warn('MediaElementSource CORS restriction; using simulated visualizer mode');
    }
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    isVisualizerInit = true;
  } catch (e) {
    console.warn('Web Audio API not supported or user gesture required:', e);
  }
}

function drawVisualizer() {
  requestAnimationFrame(drawVisualizer);
  
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);
  
  const barCount = 36;
  const barWidth = (width / barCount) - 3;
  const accentColor = (currentTrack && ALBUM_METADATA[currentTrack.album]?.color) || '#ff2ecc';

  let values = [];
  if (isPlaying && isVisualizerInit && analyser && dataArray) {
    analyser.getByteFrequencyData(dataArray);
    const step = Math.floor(dataArray.length / barCount);
    for (let i = 0; i < barCount; i++) {
      values.push(dataArray[i * step] || 0);
    }
  } else {
    // Idle gentle wave animation
    const time = Date.now() * 0.003;
    for (let i = 0; i < barCount; i++) {
      const v = isPlaying
        ? (Math.sin(time + i * 0.3) * 0.5 + 0.5) * 180 + 30
        : (Math.sin(time + i * 0.2) * 0.5 + 0.5) * 18 + 4;
      values.push(v);
    }
  }

  for (let i = 0; i < barCount; i++) {
    const val = values[i] / 255;
    const barHeight = Math.max(4, val * (height - 10));
    const x = i * (barWidth + 3);
    const y = height - barHeight;

    // Gradient bar
    const grad = ctx.createLinearGradient(0, height, 0, y);
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.3)');
    grad.addColorStop(0.5, accentColor);
    grad.addColorStop(1, '#3ff0e0');

    ctx.fillStyle = grad;
    ctx.shadowBlur = isPlaying ? 10 : 0;
    ctx.shadowColor = accentColor;
    
    // Rounded top bar
    ctx.beginPath();
    ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
    ctx.fill();
  }
}
requestAnimationFrame(drawVisualizer);

/* ---------- Resolve Track Image ---------- */
function getTrackArtwork(track) {
  if (!track) return 'cover.jpeg';
  if (track.art_file) {
    const sUrl = storageUrl(track.art_file);
    if (sUrl) return sUrl;
  }
  const meta = ALBUM_METADATA[track.album];
  return meta?.defaultArt || 'cover.jpeg';
}

/* ---------- Resolve Track YouTube Link ---------- */
function getYouTubeLink(track) {
  if (!track) return 'https://www.youtube.com/@Tyzenn01';
  if (track.youtube_url) return track.youtube_url;
  const meta = ALBUM_METADATA[track.album];
  if (meta?.ytPlaylist) return meta.ytPlaylist;
  return `https://www.youtube.com/results?search_query=TYZEN01+${encodeURIComponent(track.title)}`;
}

/* ---------- Post-Track Completion Blur Overlay ---------- */
function showTrackEndedOverlay() {
  if (!currentTrack) return;
  setPlaybackState(false);
  albumArtFrame.classList.add('is-ended');
  if (trackEndedTitle) trackEndedTitle.textContent = currentTrack.title;
  if (trackEndedYtBtn) trackEndedYtBtn.href = getYouTubeLink(currentTrack);
  trackStatusBadge.textContent = 'DEMO FINISHED';
  trackStatusBadge.classList.remove('is-live');
}

function hideTrackEndedOverlay() {
  if (albumArtFrame) albumArtFrame.classList.remove('is-ended');
}

if (trackEndedNextBtn) {
  trackEndedNextBtn.addEventListener('click', () => {
    hideTrackEndedOverlay();
    nextTrack();
  });
}

/* ---------- Update UI with Selected Track ---------- */
function updateTrackUI(track) {
  if (!track) return;
  hideTrackEndedOverlay();
  const meta = ALBUM_METADATA[track.album] || ALBUM_METADATA['Sinner'];
  const artwork = getTrackArtwork(track);
  const ytUrl = getYouTubeLink(track);

  // Update Left Stage Cover Art & Tags
  gsap.to(enlargedArt, {
    opacity: 0.2,
    scale: 0.95,
    duration: 0.2,
    onComplete: () => {
      enlargedArt.src = artwork;
      enlargedArt.onerror = () => { enlargedArt.src = meta.defaultArt; };
      gsap.to(enlargedArt, { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' });
    }
  });

  vinylLabel.style.backgroundImage = `url('${artwork}')`;
  nowPlayingAlbumTag.textContent = track.album;
  nowPlayingAlbumTag.style.background = meta.color;
  nowPlayingAlbumTag.style.color = '#060309';

  nowPlayingTitle.textContent = track.title;
  nowPlayingAlbum.innerHTML = `From the release <strong>${track.album}</strong> &middot; ${meta.tag}`;
  
  const trackNumStr = track.track_number ? `TRACK ${String(track.track_number).padStart(2, '0')}` : 'SINGLE CUT';
  trackNumberBadge.textContent = trackNumStr;

  // Update Ambient Glow
  ambientGlow.style.background = `radial-gradient(ellipse 70% 60% at 20% 30%, ${meta.color}22 0%, transparent 70%)`;

  // Update Deck Full Version Link
  deckFullVerLink.href = ytUrl;
  deckFullVerLink.title = `Listen to full version of ${track.title} on YouTube`;

  // Highlight active row in library list
  document.querySelectorAll('.library-row').forEach(row => {
    if (row.dataset.trackId === String(track.id)) {
      row.classList.add('is-active');
      if (isPlaying) row.classList.add('is-playing');
    } else {
      row.classList.remove('is-active', 'is-playing');
    }
  });

  document.title = `${track.title} — TYZEN01 Works`;
}

/* ---------- Audio Controls ---------- */
function playTrack(track, autoplay = true) {
  if (!track) return;
  hideTrackEndedOverlay();
  initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  currentTrack = track;
  currentTrackIndex = allTracks.findIndex(t => String(t.id) === String(track.id));
  
  const audioUrl = storageUrl(track.demo_file);
  audio.src = audioUrl;
  audio.currentTime = 0;
  
  updateTrackUI(track);

  if (autoplay) {
    audio.play().then(() => {
      setPlaybackState(true);
    }).catch(err => {
      console.warn('Autoplay prevented or network error:', err);
      setPlaybackState(false);
    });
  } else {
    setPlaybackState(false);
  }
}

function setPlaybackState(playing) {
  isPlaying = playing;
  if (playing) {
    hideTrackEndedOverlay();
    deckIconPlay.style.display = 'none';
    deckIconPause.style.display = 'block';
    btnPlayPause.classList.add('is-active');
    btnPlayPause.setAttribute('aria-label', 'Pause');
    trackStatusBadge.textContent = 'PLAYING DEMO';
    trackStatusBadge.classList.add('is-live');
    albumArtFrame.classList.add('is-playing');
    vinylDisc.classList.add('is-spinning');
    
    // Highlight list row
    const activeRow = document.querySelector(`.library-row[data-track-id="${currentTrack?.id}"]`);
    if (activeRow) activeRow.classList.add('is-playing');
  } else {
    deckIconPlay.style.display = 'block';
    deckIconPause.style.display = 'none';
    btnPlayPause.classList.remove('is-active');
    btnPlayPause.setAttribute('aria-label', 'Play');
    trackStatusBadge.textContent = 'PAUSED';
    trackStatusBadge.classList.remove('is-live');
    albumArtFrame.classList.remove('is-playing');
    vinylDisc.classList.remove('is-spinning');

    document.querySelectorAll('.library-row').forEach(row => row.classList.remove('is-playing'));
  }
}

function togglePlay() {
  hideTrackEndedOverlay();
  initAudioContext();
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  if (!audio.src && allTracks.length > 0) {
    playTrack(allTracks[0], true);
    return;
  }

  if (audio.paused) {
    audio.play().then(() => setPlaybackState(true)).catch(console.error);
  } else {
    audio.pause();
    setPlaybackState(false);
  }
}

function nextTrack() {
  hideTrackEndedOverlay();
  if (!allTracks.length) return;
  const list = filteredTracks.length > 0 ? filteredTracks : allTracks;
  let nextIdx;
  
  if (isShuffle) {
    nextIdx = Math.floor(Math.random() * list.length);
  } else {
    const currentListIdx = list.findIndex(t => String(t.id) === String(currentTrack?.id));
    nextIdx = (currentListIdx + 1) % list.length;
  }
  
  playTrack(list[nextIdx], true);
}

function prevTrack() {
  hideTrackEndedOverlay();
  if (!allTracks.length) return;
  if (audio.currentTime > 3) {
    audio.currentTime = 0;
    return;
  }
  const list = filteredTracks.length > 0 ? filteredTracks : allTracks;
  let prevIdx;
  
  if (isShuffle) {
    prevIdx = Math.floor(Math.random() * list.length);
  } else {
    const currentListIdx = list.findIndex(t => String(t.id) === String(currentTrack?.id));
    prevIdx = (currentListIdx - 1 + list.length) % list.length;
  }
  
  playTrack(list[prevIdx], true);
}

function formatTime(secs) {
  if (isNaN(secs) || secs === Infinity) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/* Audio Events */
audio.addEventListener('timeupdate', () => {
  const cur = audio.currentTime;
  const dur = audio.duration || 30;
  const pct = (cur / dur) * 100;
  
  progressFill.style.width = `${pct}%`;
  progressHandle.style.left = `${pct}%`;
  currentTimeDisplay.textContent = formatTime(cur);
  if (audio.duration) {
    durationTimeDisplay.textContent = formatTime(audio.duration);
  }
});

audio.addEventListener('ended', () => {
  if (isRepeat) {
    audio.currentTime = 0;
    audio.play();
  } else {
    showTrackEndedOverlay();
  }
});

audio.addEventListener('error', (e) => {
  console.warn('Audio playback error; may be missing from storage bucket:', e);
  trackStatusBadge.textContent = 'DEMO PREVIEW';
});

/* Seekbar Interaction */
function seekToPosition(e) {
  hideTrackEndedOverlay();
  const rect = progressTrack.getBoundingClientRect();
  const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const pct = clickX / rect.width;
  const dur = audio.duration || 30;
  audio.currentTime = pct * dur;
  progressFill.style.width = `${pct * 100}%`;
  progressHandle.style.left = `${pct * 100}%`;
}

progressTrack.addEventListener('click', seekToPosition);

let isDraggingSeek = false;
progressTrack.addEventListener('mousedown', (e) => {
  isDraggingSeek = true;
  seekToPosition(e);
});
window.addEventListener('mousemove', (e) => {
  if (isDraggingSeek) seekToPosition(e);
});
window.addEventListener('mouseup', () => {
  isDraggingSeek = false;
});

/* Volume Control */
volSlider.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  audio.volume = val;
  audio.muted = (val === 0);
  updateVolumeUI(val);
});

btnMute.addEventListener('click', () => {
  audio.muted = !audio.muted;
  updateVolumeUI(audio.muted ? 0 : audio.volume);
});

function updateVolumeUI(val) {
  if (audio.muted || val === 0) {
    iconVolHigh.style.display = 'none';
    iconVolMuted.style.display = 'block';
  } else {
    iconVolHigh.style.display = 'block';
    iconVolMuted.style.display = 'none';
  }
}

/* Control Buttons */
btnPlayPause.addEventListener('click', togglePlay);
btnPrev.addEventListener('click', prevTrack);
btnNext.addEventListener('click', nextTrack);

btnShuffle.addEventListener('click', () => {
  isShuffle = !isShuffle;
  btnShuffle.classList.toggle('is-active', isShuffle);
  btnShuffle.title = isShuffle ? 'Shuffle ON' : 'Shuffle OFF';
});

btnRepeat.addEventListener('click', () => {
  isRepeat = !isRepeat;
  btnRepeat.classList.toggle('is-active', isRepeat);
  btnRepeat.title = isRepeat ? 'Repeat ON' : 'Repeat OFF';
});

/* ---------- Keyboard Shortcuts ---------- */
window.addEventListener('keydown', (e) => {
  // Ignore if user is typing in search input
  if (document.activeElement === trackSearchInput) return;

  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.code === 'ArrowRight') {
    e.preventDefault();
    nextTrack();
  } else if (e.code === 'ArrowLeft') {
    e.preventDefault();
    prevTrack();
  } else if (e.code === 'KeyM') {
    e.preventDefault();
    btnMute.click();
  }
});

/* ---------- Render Track Library ---------- */
function renderLibrary() {
  // Apply album filter
  let list = allTracks;
  if (currentFilter !== 'all') {
    list = list.filter(t => t.album.toLowerCase() === currentFilter.toLowerCase());
  }

  // Apply search filter
  if (currentSearchQuery.trim() !== '') {
    const q = currentSearchQuery.toLowerCase().trim();
    list = list.filter(t => t.title.toLowerCase().includes(q) || t.album.toLowerCase().includes(q));
  }

  filteredTracks = list;

  if (list.length === 0) {
    libraryList.innerHTML = `
      <div class="library-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg>
        <h4>No demo tracks found</h4>
        <p>Try adjusting your search query or select another album filter.</p>
      </div>
    `;
    return;
  }

  libraryList.innerHTML = list.map((track, idx) => {
    const isCur = currentTrack && String(currentTrack.id) === String(track.id);
    const artUrl = getTrackArtwork(track);
    const ytUrl = getYouTubeLink(track);
    const meta = ALBUM_METADATA[track.album] || ALBUM_METADATA['Sinner'];
    const trackNum = track.track_number ? String(track.track_number).padStart(2, '0') : String(idx + 1).padStart(2, '0');

    return `
      <div class="library-row ${isCur ? 'is-active' : ''} ${isCur && isPlaying ? 'is-playing' : ''}" data-track-id="${track.id}">
        
        <!-- Track Number / Play Trigger -->
        <div class="row-num">
          <span class="num-text">${trackNum}</span>
          <span class="num-play-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          </span>
          <span class="num-eq-icon">
            <span></span><span></span><span></span>
          </span>
        </div>

        <!-- Album Cover Thumbnail -->
        <div class="row-art">
          <img src="${artUrl}" alt="${track.title} artwork" loading="lazy" onerror="this.src='${meta.defaultArt}'">
        </div>

        <!-- Title & Album -->
        <div class="row-info">
          <h3 class="row-title">${track.title}</h3>
          <div class="row-meta">
            <span class="row-album-badge" style="border-color: ${meta.color}40; color: ${meta.color};">${track.album}</span>
            <span class="row-duration">30s Studio Cut</span>
          </div>
        </div>

        <!-- FULL VERSION YOUTUBE BUTTON -->
        <div class="row-action">
          <a href="${ytUrl}" target="_blank" rel="noopener" class="full-ver-btn" title="Stream full track on YouTube" data-prevent-play="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            <span class="full-ver-text">Play Full Ver</span>
            <span class="full-ver-arrow">&nearr;</span>
          </a>
        </div>

      </div>
    `;
  }).join('');

  // Row click listeners
  document.querySelectorAll('.library-row').forEach(row => {
    row.addEventListener('click', (e) => {
      // If clicking YouTube redirect button, don't trigger demo playback
      if (e.target.closest('[data-prevent-play="true"]')) {
        return;
      }
      
      const trackId = row.dataset.trackId;
      const track = allTracks.find(t => String(t.id) === trackId);
      if (!track) return;

      if (currentTrack && String(currentTrack.id) === trackId) {
        togglePlay();
      } else {
        playTrack(track, true);
      }
    });
  });
}

/* ---------- Update Filter Counts ---------- */
function updateCounts() {
  countAll.textContent = allTracks.length;
  countSinner.textContent = allTracks.filter(t => t.album === 'Sinner').length;
  countCloud9.textContent = allTracks.filter(t => t.album === 'Cloud 9').length;
  countLost.textContent = allTracks.filter(t => t.album === 'Lost in Abyss').length;
  countSingles.textContent = allTracks.filter(t => t.album === 'Singles').length;
}

/* ---------- Filter Chips Handler ---------- */
filterChips.forEach(chip => {
  chip.addEventListener('click', () => {
    filterChips.forEach(c => c.classList.remove('is-active'));
    chip.classList.add('is-active');
    currentFilter = chip.dataset.filter;
    renderLibrary();
  });
});

/* ---------- Search Handler ---------- */
trackSearchInput.addEventListener('input', (e) => {
  currentSearchQuery = e.target.value;
  searchClearBtn.style.display = currentSearchQuery.length > 0 ? 'block' : 'none';
  renderLibrary();
});

searchClearBtn.addEventListener('click', () => {
  trackSearchInput.value = '';
  currentSearchQuery = '';
  searchClearBtn.style.display = 'none';
  renderLibrary();
});

/* ---------- Load Track Data ---------- */
async function loadDemoCatalog() {
  let loadedData = null;

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('demo_tracks')
        .select('*')
        .order('album', { ascending: true })
        .order('track_number', { ascending: true, nullsFirst: false });

      if (!error && data && data.length > 0) {
        loadedData = data;
      }
    } catch (e) {
      console.warn('Supabase query failed, falling back to local dataset:', e);
    }
  }

  // Use fetched data or reliable fallback catalog
  allTracks = loadedData || FALLBACK_TRACKS;
  filteredTracks = allTracks;

  updateCounts();
  renderLibrary();

  // Set default starting track (Stay Humble or first track)
  if (allTracks.length > 0) {
    playTrack(allTracks[0], false);
  }
}

/* ---------- Mobile Menu & Navigation ---------- */
const navBurger = document.getElementById('navBurger');
const navMobile = document.getElementById('navMobile');
if (navBurger && navMobile) {
  navBurger.addEventListener('click', () => {
    navBurger.classList.toggle('open');
    navMobile.classList.toggle('open');
  });
}

const cursorGlow = document.getElementById('cursorGlow');
if (window.matchMedia('(pointer: fine)').matches && cursorGlow) {
  window.addEventListener('mousemove', (e) => {
    gsap.to(cursorGlow, { x: e.clientX, y: e.clientY, duration: 0.6, ease: 'power2.out' });
  });
}

/* 3D Tilt on Enlarged Artwork */
if (window.matchMedia('(pointer: fine)').matches && albumArtFrame) {
  albumArtFrame.addEventListener('mousemove', (e) => {
    const rect = albumArtFrame.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    gsap.to(albumArtFrame, {
      rotateX: y * -12,
      rotateY: x * 12,
      transformPerspective: 800,
      duration: 0.15,
      ease: 'power1.out',
      overwrite: 'auto'
    });
  });
  albumArtFrame.addEventListener('mouseleave', () => {
    gsap.to(albumArtFrame, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.35,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  });
}

/* Navbar Scroll Blur */
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadDemoCatalog);
