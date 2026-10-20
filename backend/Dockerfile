FROM python:3.11-slim

WORKDIR /app

# Install build dependencies for scientific packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements-dev.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Ensure data and models directories exist
RUN mkdir -p data models

# Seed database and train models during build or initial startup
RUN python -m app.cli seed && python -m app.cli train && python -m app.cli detect

EXPOSE 8000

ENV PYTHONUNBUFFERED=1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
