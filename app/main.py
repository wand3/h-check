import os
from fastapi import FastAPI, Request
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware import Middleware
from .routes import h_check_router, auth_router, user_router
import uvicorn
from .database.db_engine import get_session, create_db_and_tables
from .logger import logger
from fastapi.staticfiles import StaticFiles
from pathlib import Path

middleware = [
    Middleware(
        CORSMiddleware,
        allow_origins=["https://h-check.pages.dev", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
]


def create_app() -> FastAPI:
    # middleware = [
    #     Middleware(
    #         CORSMiddleware,
    #         allow_origins=["https://h-check.pages.dev", "http://localhost:5173"],
    #         allow_credentials=True,
    #         allow_methods=["*"],
    #         allow_headers=["*"],
    #     )
    # ]
    #
    # app: FastAPI = FastAPI(
    #     db_lifespan=get_session,
    #     middleware=middleware  # Add middleware at app creation
    # )
    # logger.info('Application started -----------')


    app: FastAPI = FastAPI(db_lifespan=get_session, middleware=middleware)
    logger.info(f'Application started -----------')

    # origins = [
    #     "http://localhost:5173",
    #     "https://h-check.pages.dev"
    # ]
    #
    # app.add_middleware(
    #     CORSMiddleware,
    #     allow_origins=origins,
    #     allow_credentials=True,
    #     allow_methods=["*"],
    #     allow_headers=["*"]
    # )

    # Include routes
    app.include_router(h_check_router, tags=["FHIR"])
    app.include_router(auth_router)
    app.include_router(user_router)

    return app

app = create_app()


# @app.middleware("https")
# async def add_cors_header(request: Request, call_next):
#     response = await call_next(request)
#     response.headers["Access-Control-Allow-Origin"] = origins
#     response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
#     response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, X-Requested-With, Access-Control-Request-Method, Access-Control-Request-Headers"
#     response.headers["Access-Control-Allow-Credentials"] = "true"
#
#     return response

# Startup event
@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)

