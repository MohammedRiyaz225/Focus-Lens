import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import init_db
from app.engine.session_manager import session_manager
from app.api import sessions, analytics, settings as settings_api, calibration, ws

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.debug else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("FocusLens")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing FocusLens backend...")
    # Initialize SQLite database schema
    await init_db()

    # Pass current running event loop to SessionManager for background async callbacks
    loop = asyncio.get_running_loop()
    session_manager.initialize(loop)

    logger.info("FocusLens backend initialized. Privacy check: Camera frames are processed strictly in RAM and never stored.")
    yield

    logger.info("Shutting down FocusLens backend...")
    session_manager.camera_service.stop()
    session_manager.face_tracker.close()
    logger.info("Camera and inference resources gracefully released.")


app = FastAPI(
    title="FocusLens API",
    version=settings.app_version,
    description="Privacy-first visual engagement and attention telemetry estimation engine.",
    lifespan=lifespan
)

# Restrict CORS to localhost web dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(sessions.router)
app.include_router(analytics.router)
app.include_router(settings_api.router)
app.include_router(calibration.router)
app.include_router(ws.router)


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "camera_active": session_manager.camera_service.is_active,
        "simulate_mode": settings.simulate or session_manager.camera_service.simulate,
        "privacy_notice": "Raw video is never saved to disk, database, or network."
    }
