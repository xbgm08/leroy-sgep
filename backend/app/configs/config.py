import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DB_URI: str = os.getenv("DB_URI")
    DB_NAME: str = os.getenv("DB_NAME")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN")

settings = Settings()