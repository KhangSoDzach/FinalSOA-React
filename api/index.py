import sys
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

from mangum import Mangum
from app.main import app

# Vercel serverless handler
handler = Mangum(app, lifespan="off")