#!/usr/bin/env bash
# tyzen01 Standalone Portfolio Server Launcher
cd "$(dirname "$0")" || exit 1

echo "==================================================="
echo "  Starting tyzen01 Standalone Portfolio Server..."
echo "==================================================="
echo ""

if command -v python3 &>/dev/null; then
    python3 serve.py 5173 --open
elif command -v python &>/dev/null; then
    python serve.py 5173 --open
elif command -v npx &>/dev/null; then
    npx serve -l 5173 .
else
    echo "[Error] Neither Python nor Node.js was found in PATH."
    echo "Please install Python 3 or Node.js to run the local server."
fi

