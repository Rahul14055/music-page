/* ============================================
   TYZEN01 — player.js
   Fetches demo tracks from Supabase and powers
   the inline track lists + fixed mini-player.
============================================ */

/* ---------- Supabase config ---------- */
const SUPABASE_URL = 'https://nwovdousfpavbekbqvbs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53b3Zkb3VzZnBhdmJla2JxdmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMDU3MjMsImV4cCI6MjEwNDY4MTcyM30.Ss5uFkB94Cto6aV1HNebE7KTHuym4rCrWXRzjUpvY-Y';
const BUCKET_NAME = 'tyzen01';

const supabaseClient = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

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

/* Builds a public storage URL for a filename in the bucket */
function storageUrl(filename) {
  if (!filename) return null;
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${encodeURIComponent(filename)}`;
}

/* ---------- Audio engine (single shared <audio> element) ---------- */
const audio = new Audio();
audio.preload = 'none';

let currentTrackId = null;
let currentRowEl = null;

const player = document.getElementById('player');
const playerArt = document.getElementById('playerArt');
const playerTitle = document.getElementById('playerTitle');
const playerAlbum = document.getElementById('playerAlbum');
const playerToggle = document.getElementById('playerToggle');
const playerProgress = document.getElementById('playerProgress');
const playerClose = document.getElementById('playerClose');
const iconPlay = document.getElementById('playerIconPlay');
const iconPause = document.getElementById('playerIconPause');

function showPlayer() { player.classList.add('is-visible'); }
function hidePlayer() { player.classList.remove('is-visible'); }

function setPlayingUI(isPlaying) {
  iconPlay.style.display = isPlaying ? 'none' : 'block';
  iconPause.style.display = isPlaying ? 'block' : 'none';
  playerToggle.setAttribute('aria-label', isPlaying ? 'Pause' : 'Play');
}

function clearActiveRow() {
  if (currentRowEl) currentRowEl.classList.remove('is-playing');
  currentRowEl = null;
}

function playTrack(track, rowEl) {
  const url = storageUrl(track.demo_file);
  if (!url) return;

  // Toggle: clicking the currently-playing row pauses/resumes
  if (currentTrackId === track.id) {
    if (audio.paused) {
      audio.play();
      setPlayingUI(true);
      rowEl.classList.add('is-playing');
    } else {
      audio.pause();
      setPlayingUI(false);
    }
    return;
  }

  clearActiveRow();
  currentTrackId = track.id;
  currentRowEl = rowEl;
  rowEl.classList.add('is-playing');

  audio.src = url;
  audio.currentTime = 0;
  audio.play().catch((err) => {
    console.error('Playback failed:', err);
    playerAlbum.textContent = 'Could not play this demo — check the file exists in the bucket';
  });

  playerTitle.textContent = track.title;
  playerAlbum.textContent = track.album;
  const defaultArtMap = {
    'Sinner': 'sinner-cover.jpeg',
    'Cloud 9': 'cloud9-cover.jpg',
    'Lost in Abyss': 'lost-in-abyss-cover.jpg',
    'Singles': 'cover.jpeg'
  };
  const artUrl = track.art_file ? storageUrl(track.art_file) : (defaultArtMap[track.album] || 'cover.jpeg');
  playerArt.style.backgroundImage = `url('${artUrl}')`;
  setPlayingUI(true);
  showPlayer();
}

playerToggle.addEventListener('click', () => {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
    setPlayingUI(true);
    if (currentRowEl) currentRowEl.classList.add('is-playing');
  } else {
    audio.pause();
    setPlayingUI(false);
  }
});

playerClose.addEventListener('click', () => {
  audio.pause();
  audio.src = '';
  currentTrackId = null;
  clearActiveRow();
  hidePlayer();
});

audio.addEventListener('timeupdate', () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  playerProgress.style.width = `${pct}%`;
});

audio.addEventListener('ended', () => {
  setPlayingUI(false);
  playerProgress.style.width = '0%';
  clearActiveRow();
});

/* ---------- Track row rendering ---------- */
function trackRowHTML(track, index, showNumber) {
  const num = showNumber ? String(track.track_number ?? index + 1).padStart(2, '0') : null;
  return `
    <li>
      <button class="track-row" type="button" data-track-id="${track.id}">
        ${num ? `<span class="track-row__num">${num}</span>` : ''}
        <span class="track-row__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 7.5v9l7-4.5-7-4.5z" fill="currentColor"/></svg>
        </span>
        <span class="track-row__title">${track.title}</span>
        <span class="track-row__eq"><span></span><span></span><span></span></span>
      </button>
    </li>
  `;
}

function renderTracklist(container, tracks, showNumber) {
  if (!tracks.length) {
    container.innerHTML = `<li class="track-row--loading">No demo tracks found for this album yet.</li>`;
    return;
  }
  container.innerHTML = tracks.map((t, i) => trackRowHTML(t, i, showNumber)).join('');

  container.querySelectorAll('.track-row').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.trackId;
      const track = tracks.find((t) => String(t.id) === id);
      if (track) playTrack(track, btn.closest('li').querySelector('.track-row'));
    });
  });
}

/* ---------- Fetch + populate all tracklists on the page ---------- */
async function loadAllTracks() {
  let tracks = [];

  try {
    if (supabaseClient) {
      const { data, error } = await supabaseClient
        .from('demo_tracks')
        .select('*')
        .order('album', { ascending: true })
        .order('track_number', { ascending: true, nullsFirst: false });

      if (!error && data && data.length > 0) {
        tracks = data;
      } else if (error) {
        console.warn('Supabase fetch notice, using built-in catalog:', error.message || error);
      }
    }
  } catch (err) {
    console.warn('Network issue fetching Supabase, using built-in catalog:', err);
  }

  // Fallback to embedded catalog if Supabase didn't supply tracks
  if (!tracks || tracks.length === 0) {
    tracks = FALLBACK_TRACKS;
  }

  const byAlbum = {};
  tracks.forEach((track) => {
    if (!byAlbum[track.album]) byAlbum[track.album] = [];
    byAlbum[track.album].push(track);
  });

  document.querySelectorAll('[data-tracklist]').forEach((el) => {
    const albumName = el.dataset.tracklist;
    const albumTracks = byAlbum[albumName] || [];
    const showNumber = albumName !== 'Singles';
    renderTracklist(el, albumTracks, showNumber);
  });

  window.__byAlbumTracks = byAlbum;
}

window.playAlbumByName = function(albumName) {
  if (window.__byAlbumTracks && window.__byAlbumTracks[albumName] && window.__byAlbumTracks[albumName].length > 0) {
    playTrack(window.__byAlbumTracks[albumName][0], null);
  } else {
    window.location.href = 'player.html';
  }
};

document.addEventListener('DOMContentLoaded', loadAllTracks);
