import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.config.settings import settings
from app.firebase.client import init_firebase
from app.api import auth, students, teachers, classes, subjects, attendance, reports, academic, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup initialization
    init_firebase()
    print(f"Smart Attendance AI System initialized in {settings.ENV} mode on {settings.HOST}:{settings.PORT}")
    yield
    # Shutdown cleanup
    print("Shutting down Smart Attendance API server...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Smart Attendance Monitoring System API",
    lifespan=lifespan
)

# Production-ready CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(academic.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(students.router, prefix=settings.API_PREFIX)
app.include_router(teachers.router, prefix=settings.API_PREFIX)
app.include_router(classes.router, prefix=settings.API_PREFIX)
app.include_router(subjects.router, prefix=settings.API_PREFIX)
app.include_router(attendance.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)

@app.get("/health")
def health_check():
    """Health check endpoint for container orchestrators and load balancers"""
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENV
    }

if __name__ == "__main__":
    is_dev = settings.ENV == "development"
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=is_dev)
