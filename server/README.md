# Nebula Sync — Backend (FastAPI)

This is a minimal FastAPI backend scaffold for local development and testing.

The GaanaPy source now lives inside `server/GaanaPy`, so there is no separate top-level backend folder to run or maintain.

Run the server:

```sh
cd server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Run tests:

```sh
cd server
pytest -q
```
