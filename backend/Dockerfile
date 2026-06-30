# ── Base image ────────────────────────────────────────────────────────────────
# python:3.11-slim is a minimal Python image — no extras, keeps the image small
FROM python:3.11-slim

# ── Working directory ─────────────────────────────────────────────────────────
# All subsequent commands run from /app inside the container
WORKDIR /app

# ── Install dependencies ──────────────────────────────────────────────────────
# Copy requirements.txt FIRST — Docker caches this layer separately.
# If only main.py changes, Docker skips re-installing packages on the next build.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy application code ─────────────────────────────────────────────────────
COPY main.py .

# ── Create data directory ─────────────────────────────────────────────────────
# This is where the JSON file will be stored inside the container
RUN mkdir -p /app/data

# ── Expose port ───────────────────────────────────────────────────────────────
# Tells Docker (and anyone reading this file) that the app listens on 8000
EXPOSE 8000

# ── Start command ─────────────────────────────────────────────────────────────
# --host 0.0.0.0 makes the server reachable from outside the container
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
