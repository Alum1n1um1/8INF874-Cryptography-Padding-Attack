# ── Build stage ────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

# Prevents Python from writing .pyc files and buffers stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application source
COPY app.py crypto.py index.html ./

# ── Runtime ────────────────────────────────────────────────────────────────────
EXPOSE 5000

# Use Gunicorn for a production-grade server
# Fall back to `flask run` if you prefer dev mode (see docker-compose.yml)
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=5000"]
