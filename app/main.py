import os
from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from starlette.middleware.trustedhost import TrustedHostMiddleware

from .routes import h_check_router, auth_router, user_router
import uvicorn
from .database.db_engine import get_session, create_db_and_tables
from .logger import logger
from fastapi.staticfiles import StaticFiles
from pathlib import Path



def create_app() -> FastAPI:
    logger.info('Application is starting -----------')
    middleware = [
        Middleware(
            CORSMiddleware,
            allow_origins=["https://h-check.pages.dev", "http://localhost:5173"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    ]
    appl: FastAPI = FastAPI(db_lifespan=get_session, middleware=middleware)

    logger.info(f'Application started -----------')

    # Include routes
    appl.include_router(h_check_router, tags=["FHIR"])
    appl.include_router(auth_router)
    appl.include_router(user_router)


    return appl

app = create_app()


# Startup event
@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

