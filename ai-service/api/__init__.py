# AI Service API Package
# This package contains all API routes for the AI service

from .lead_routes import router as lead_router
from .student_routes import router as student_router
from .enterprise_routes import router as enterprise_router

__all__ = [
    "lead_router",
    "student_router", 
    "enterprise_router"
]