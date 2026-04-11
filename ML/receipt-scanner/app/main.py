from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import scan
from app.services.ocr_service import get_ocr_instance

app = FastAPI(
    title="Receipt Scanner API",
    description="Extracts structured expense data from receipt images using PaddleOCR.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(scan.router, prefix="/api", tags=["Scanner"])

@app.on_event("startup")
async def startup_event():
    # Preload PaddleOCR singleton at startup to eliminate cold start
    print("Preloading PaddleOCR model...")
    get_ocr_instance()
    print("PaddleOCR model loaded successfully.")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}
