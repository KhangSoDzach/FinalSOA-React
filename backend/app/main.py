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
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://*.vercel.app",  # Allow all Vercel preview deployments
    ],
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