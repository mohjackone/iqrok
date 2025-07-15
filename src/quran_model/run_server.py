import os
import sys

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Now we can import from the quran_model package
from quran_model.serve_quran_model import app
import uvicorn

if __name__ == "__main__":
    # Get port from environment variable with fallback to 8001
    port = int(os.environ.get("PORT", 8001))
    
    # Railway requires binding to 0.0.0.0
    uvicorn.run(app, host="0.0.0.0", port=port) 