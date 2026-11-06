# Rahul R. (tyzen01) — Cinematic Music Artist Portfolio

Official standalone portfolio of **Rahul R.**, independent music creator, lyricist, and producer behind **tyzen01**. Blending human intuition and original songwriting with AI-powered production to create stories that connect.
- **WebGL Hero Orb**: Real-time 3D particle and geometric wireframe interactive visualizer powered by Three.js.
- **Chrono Discography Timeline**: 4-album celestial arc & 3D card continuum (Debut *Lost in Abyss*, *Cloud 9*, *Sinner*, and *Singles*) with direct Spotify streaming links.
- **Dual Artist Editorial Showcase**: Multi-photo layered spotlight featuring `profile.jpeg` (Sonic Architect) and `profile2.jpeg` (Creative Direction) with dual-speed GSAP parallax and cyber accents.
- **Verified Artist Spotify Integration**: Direct Spotify badges, header quick-actions, and singles streaming links (`https://open.spotify.com/artist/7rjJADLNKk5RKndDXQrWpA`).
- **Zero External Backend Dependencies**: Pure, ultra-fast static performance with zero Supabase or player script overhead.

---

## 🚀 How to Run Independently

This directory is **100% self-contained** and can be run or deployed completely independently from any parent folder.

### Option 1: Python (Recommended)
From inside this directory:
```bash
python serve.py
```
Or specify a custom port / auto-open browser:
```bash
python serve.py 5173 --open
```

### Option 2: Windows Quick Launch
Double-click `run.bat` in File Explorer.

### Option 3: Node / npm
```bash
npm start
# or
npm run dev
# or
npx serve -l 5173 .
```

### Option 4: Python built-in server
```bash
python -m http.server 5173
```

Then open in your browser:
- **Main Portfolio**: [http://localhost:5173](http://localhost:5173)
- **Discography Section**: [http://localhost:5173/#albums](http://localhost:5173/#albums)
- **About Spotlight**: [http://localhost:5173/#about](http://localhost:5173/#about)

---

## 📁 File Structure

```
rahul/
├── index.html            # Main portfolio page (Hero, About with dual photos, Chrono Albums, Contact)
├── style.css             # Cyberpunk synthwave styling, layout, typography, animations
├── chrono.css            # Styles for the celestial arc and 3D album continuum
├── main.js               # Three.js 3D hero orb, GSAP scroll triggers, dual-photo parallax
├── chrono-albums.js      # WebGL celestial discography timeline engine with Spotify links
├── serve.py              # Dedicated zero-dependency local dev server (no-cache headers, MIME types)
├── run.bat               # Windows one-click launcher
├── run.sh                # macOS/Linux launcher
├── package.json          # npm configuration and scripts
├── .gitignore            # Git ignore file
├── cloud9-cover.jpg      # Cloud 9 album cover
├── lost-in-abyss-cover.jpg# Lost in Abyss album cover
├── sinner-cover.jpeg     # Sinner album cover
├── cover.jpeg            # Singles collection cover
├── profile.jpeg          # Image 1: tyzen01 (Hybrid Sound Design / Artist Identity)
├── profile2.jpeg         # Image 2: Rahul R. (Lyricist & Melody / The Creator)
└── grain.png             # Film grain texture for WebGL timeline
```

---

## 🌐 Deploying to Production

Because there is **no build step**, you can deploy this folder directly to any static web host:

- **Vercel**: Import or deploy the folder with framework preset set to `Other`.
- **Netlify**: Drag and drop the folder into Netlify Drop, or connect via Git with publish directory set to `.`.
- **GitHub Pages**: Push this folder to a GitHub repository and enable Pages from repository root.
- **Cloudflare Pages**: Connect repository and set build command to None, output directory to `.`.
