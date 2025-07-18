# Use Python 3.10 slim image as base
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Install system dependencies and git-lfs
RUN apt-get update && apt-get install -y \
    build-essential \
    git \
    git-lfs \
    curl \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Initialize git-lfs
RUN git lfs install

# Copy Python requirements
COPY src/quran_model/requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code and model files
COPY src/quran_model /app/quran_model

# Generate translation file
RUN python -m quran_model.init_quranenc

# Build ARG for OpenAI API key
ARG OPENAI_API_KEY
ENV OPENAI_API_KEY=${OPENAI_API_KEY}

# Generate embeddings
RUN python -m quran_model.generate_embeddings

# Remove OpenAI API key from environment after generating embeddings
ENV OPENAI_API_KEY=""

# Convert line endings to Unix format (only if file exists)
RUN if [ -f /app/quran_model/quran_terjemahan_sabiq.jsonl ]; then \
    dos2unix /app/quran_model/quran_terjemahan_sabiq.jsonl; \
    fi

# Ensure correct permissions (only if file exists)
RUN if [ -f /app/quran_model/quran_terjemahan_sabiq.jsonl ]; then \
    chmod 644 /app/quran_model/quran_terjemahan_sabiq.jsonl; \
    fi

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8001

# Expose the port
EXPOSE 8001

# Run the application using uvicorn directly
CMD uvicorn quran_model.serve_quran_model:app --host 0.0.0.0 --port 8001