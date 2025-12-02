from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.database import init_db
from app.api.main import api_router
import os

app = FastAPI(
    title="Apartment Management API",
    description="API for apartment management system",
    version="1.0.0"
)

# Configure CORS
import re

def check_origin(origin: str) -> bool:
    """Check if origin is allowed"""
    allowed_patterns = [
        r"^https://.*\.vercel\.app$",  # All Vercel deployments
        r"^http://localhost:\d+$",      # Local development
        r"^http://127\.0\.0\.1:\d+$",   # Local development
    ]
    return any(re.match(pattern, origin) for pattern in allowed_patterns)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^http://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Mount static files for images (only for local development)
if not os.getenv("VERCEL"):
    images_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "Images")
    if os.path.exists(images_path):
        app.mount("/images", StaticFiles(directory=images_path), name="images")

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    await init_db()
    
    # Khởi động scheduler cho bill generation tự động
    from app.core.scheduler import start_scheduler
    start_scheduler()


@app.on_event("shutdown")
async def shutdown_event():
    """Dừng scheduler khi shutdown"""
    from app.core.scheduler import stop_scheduler
    stop_scheduler()

@app.get("/")
async def root():
    return {"message": "Apartment Management API is running"}

# Vercel serverless handler
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    handler = None

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)