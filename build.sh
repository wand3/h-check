#!/bin/bash
# Optimized build for Vercel
export PIP_NO_CACHE_DIR=1
export PYTHONDONTWRITEBYTECODE=1

# Install with optimizations
pip install -r requirements.txt --no-cache-dir --compile --no-deps

# Remove unnecessary files
find . -name "*.pyc" -delete
find . -name "__pycache__" -type d -exec rm -rf {} + 2>/dev/null || true
find . -name "*.so" -exec strip {} \; 2>/dev/null || true