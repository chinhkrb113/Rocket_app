from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv
from loguru import logger
import sys

# Load environment variables
load_dotenv()

# Import API routes
try:
    # Import core modules first
    from core.database import init_db, close_db
    from core.config import settings
    
    # Import API routes
    from api.lead_routes import router as lead_router
    from api.student_routes import router as student_router
    from api.enterprise_routes import router as enterprise_router
    
    logger.info("Successfully imported all API routes and core modules")
    
except ImportError as e:
    logger.error(f"Import error: {e}")
    # Create minimal routers for testing
    from fastapi import APIRouter
    lead_router = APIRouter(prefix="/leads", tags=["Lead Analysis"])
    student_router = APIRouter(prefix="/students", tags=["Student Analysis"])
    enterprise_router = APIRouter(prefix="/enterprises", tags=["Enterprise Analysis"])
    
    # Add a test endpoint to student_router
    @student_router.get("/test")
    async def test_endpoint():
        return {"message": "Student router is working", "status": "ok"}
    
    @student_router.post("/analyze-submission")
    async def mock_analyze_submission(request: dict):
        return {
            "student_id": request.get("student_id", 1),
            "submission_type": request.get("submission_data", {}).get("type", "unknown"),
            "analysis_results": {"mock": True},
            "competency_updates": [],
            "overall_score": 85.0,
            "recommendations": ["Great work!", "Keep practicing"],
            "analyzed_at": "2025-08-08T01:25:00Z",
            "processing_time_ms": 1500.0,
            "error": None
        }
    
    # Mock database functions
    async def init_db():
        logger.info("Mock database initialized")
        return True
    
    async def close_db():
        logger.info("Mock database closed")
        return True
    
    class MockSettings:
        LOG_LEVEL = "INFO"
        HOST = "0.0.0.0"
        PORT = 8000
        ENVIRONMENT = "development"
        ALLOWED_HOSTS = ["*"]
    
    settings = MockSettings()

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.LOG_LEVEL
)
logger.add(
    "logs/ai_service.log",
    rotation="500 MB",
    retention="10 days",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
    level=settings.LOG_LEVEL
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting AI Service...")
    await init_db()
    logger.info("Database initialized")
    
    # Load ML models
    logger.info("Loading ML models...")
    # Add model loading logic here
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Service...")
    await close_db()
    logger.info("Database connections closed")

# Create FastAPI app
app = FastAPI(
    title="Rocket Training System - AI Service",
    description="AI-powered services for training and recruitment management",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "Internal server error",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else "An error occurred"
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-service",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Rocket Training System - AI Service",
        "version": "1.0.0",
        "docs": "/docs" if settings.ENVIRONMENT == "development" else "Documentation not available in production"
    }

# Include API routers
# Routes already imported above

app.include_router(lead_router, prefix="/api")
app.include_router(student_router, prefix="/api")
app.include_router(enterprise_router, prefix="/api")

# Metrics endpoint for monitoring
@app.get("/metrics")
async def get_metrics():
    # Add Prometheus metrics here if needed
    return {
        "message": "Metrics endpoint",
        "status": "active"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.ENVIRONMENT == "development",
        log_level=settings.LOG_LEVEL.lower(),
        access_log=True
    )