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
    && rm -rf /var/lib/apt/lists/*

# Initialize git-lfs
RUN git lfs install

# Copy Python requirements
COPY src/quran_model/requirements.txt requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code and model files
COPY src/quran_model /app/quran_model

# Verify embedding files exist
RUN python -c 'import os; \
    files = ["embedding_korpus_" + str(i) + ".pkl" for i in range(1, 6)]; \
    missing = [f for f in files if not os.path.exists(os.path.join("/app/quran_model", f))]; \
    assert not missing, f"Missing embedding files: {missing}"'

# Set environment variables
ENV PYTHONPATH=/app
ENV PORT=8001

# Expose the port
EXPOSE 8001

# Run the application using uvicorn directly
CMD ["sh", "-c", "uvicorn quran_model.serve_quran_model:app --host 0.0.0.0 --port $PORT"] 