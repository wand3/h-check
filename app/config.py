import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env


basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    # Database
    # Use test database if TESTING environment variable is set to 'true'
    if os.getenv("TESTING", "false").lower() == "true":
        DATABASE_URL: str = os.getenv("TEST_DATABASE_URL",
                                      "postgresql+asyncpg://postgres:ma3str0@localhost:5432/hchecktest")
        SYNC_DATABASE_URL: str = os.getenv("TEST_SYNC_DATABASE_URL",
                                           "postgresql://postgres:ma3str0@localhost:5432/hchecktest")
    else:
        DATABASE_URL: str = os.getenv("DATABASE_URL")
        SYNC_DATABASE_URL: str = os.getenv("SYNC_DATABASE_URL")

    ACCESS_TOKEN_EXPIRE_MINUTES = 10
    # FHIR Server
    FHIR_BASE_URL: str = os.getenv("FHIR_BASE_URL", "https://hapi.fhir.org/baseR5")

    SECRET_KEY: str = 'ONE'
    ALGORITHM: str = "HS256"
    # DATABASE_URI = os.getenv('CLUSTER') or 'mongodb://127.0.0.1:27017/'
