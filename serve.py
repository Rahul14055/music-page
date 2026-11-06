#!/usr/bin/env python3
"""
tyzen01 — Standalone Local Development Server

Run this script directly from inside the rahul folder:
    python serve.py [port] [--open]

Examples:
    python serve.py          # Runs on http://localhost:5173
    python serve.py 3000     # Runs on http://localhost:3000
    python serve.py --open   # Runs and opens your default browser
"""

import http.server
import os
import socketserver
import sys
import webbrowser

DEFAULT_PORT = 5173

# Ensure the working directory is the script's directory (rahul/)
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(SCRIPT_DIR)

MIME_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".woff2": "font/woff2",
    ".woff": "font/woff",
    ".ttf": "font/ttf",
}


class StandaloneHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler with no-cache headers and accurate MIME types."""

    def end_headers(self):
        # Disable caching during development so changes are instantly reflected
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def guess_type(self, path):
        lowered = str(path).lower()
        for ext, mime in MIME_TYPES.items():
            if lowered.endswith(ext):
                return mime
        return super().guess_type(path)

    def log_message(self, fmt, *args):
        # Clean console log: suppress routine 200/304 noise
        msg = fmt % args
        if " 200 " not in msg and " 304 " not in msg:
            sys.stderr.write(f"  {msg}\n")


class ThreadedServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def parse_args():
    port = DEFAULT_PORT
    auto_open = False

    for arg in sys.argv[1:]:
        if arg == "--open" or arg == "-o":
            auto_open = True
        elif arg.isdigit():
            port = int(arg)
        elif arg in ("--help", "-h"):
            print(__doc__)
            sys.exit(0)

    return port, auto_open


def main():
    port, auto_open = parse_args()
    url = f"http://localhost:{port}"

    banner = f"""
===================================================================
  tyzen01 — Composer / Producer Portfolio
  Running independently from: {SCRIPT_DIR}
-------------------------------------------------------------------
  -> Local:    {url}/
  -> Albums:   {url}/#albums
  -> Spotify:  https://open.spotify.com/artist/7rjJADLNKk5RKndDXQrWpA

  Press Ctrl+C to stop the server
===================================================================
"""
    print(banner, flush=True)

    if auto_open:
        webbrowser.open(url)

    try:
        with ThreadedServer(("127.0.0.1", port), StandaloneHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[tyzen01] Server stopped. Goodbye!\n")
    except OSError as e:
        if e.errno == 98 or e.winerror == 10048:
            print(f"\n[Error] Port {port} is already in use. Try running with a different port:")
            print(f"  python serve.py {port + 1}\n")
        else:
            raise


if __name__ == "__main__":
    main()

