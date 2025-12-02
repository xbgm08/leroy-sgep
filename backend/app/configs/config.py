import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DB_URI: str = os.getenv("DB_URI")
    DB_NAME: str = os.getenv("DB_NAME")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN")
    BASE_IMPORT_PATH: str = os.getenv("BASE_IMPORT_PATH", "./imports")
    PENDING_FOLDER: str = os.getenv("PENDING_FOLDER", os.path.join(BASE_IMPORT_PATH, "pending"))
    PROCESSED_FOLDER: str = os.getenv("PROCESSED_FOLDER", os.path.join(BASE_IMPORT_PATH, "processed"))
    ERROR_FOLDER: str = os.getenv("ERROR_FOLDER", os.path.join(BASE_IMPORT_PATH, "errors"))
    PROCESSING_FOLDER: str = os.getenv("PROCESSING_FOLDER", os.path.join(BASE_IMPORT_PATH, "processing"))

settings = Settings()