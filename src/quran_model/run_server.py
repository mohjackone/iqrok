import os
import sys

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

if __name__ == "__main__":
    try:
        # Get port from environment variable with fallback to 8001
        port = int(os.environ.get("PORT", "8001"))
        print(f"Starting server on port {port}")
        
        # Use uvicorn CLI arguments style
        os.system(f"uvicorn quran_model.serve_quran_model:app --host 0.0.0.0 --port {port}")
    except Exception as e:
        print(f"Error starting server: {str(e)}")
        sys.exit(1) 