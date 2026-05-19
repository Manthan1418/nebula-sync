#!/bin/sh
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
if [ -d venv ]; then
    . venv/bin/activate
fi
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
