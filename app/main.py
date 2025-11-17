import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import h_check_router, auth_router, user_router
import uvicorn
from app.database.db_engine import get_session, create_db_and_tables
from .logger import logger
from fastapi.staticfiles import StaticFiles
from pathlib import Path


def create_app() -> FastAPI:
    app: FastAPI = FastAPI(db_lifespan=get_session)
    logger.info(f'Application started -----------')


    origins = [
        "http://localhost:5173/",
        "http://127.0.0.1:8000/*",
        "https://h-check.pages.dev/*",
        "*"
    ]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"]
    )
    # Include routes
    app.include_router(h_check_router, tags=["FHIR"])
    app.include_router(auth_router)
    app.include_router(user_router)

    return app

app = create_app()
# Startup event
@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

