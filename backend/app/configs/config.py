import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DB_URI: str = os.getenv("DB_URI")
    DB_NAME: str = os.getenv("DB_NAME")
    FRONTEND_ORIGIN: str = os.getenv("FRONTEND_ORIGIN")
    BASE_IMPORT_PATH: str = os.getenv("BASE_IMPORT_PATH", "./imports")
    WATCH_FOLDER: str = os.getenv("WATCH_FOLDER", os.path.join(BASE_IMPORT_PATH, "pendentes"))
    PROCESSED_FOLDER: str = os.getenv("PROCESSED_FOLDER", os.path.join(BASE_IMPORT_PATH, "processados"))
    ERROR_FOLDER: str = os.getenv("ERROR_FOLDER", os.path.join(BASE_IMPORT_PATH, "erros"))
    PROCESSING_FOLDER: str = os.getenv("PROCESSING_FOLDER", os.path.join(BASE_IMPORT_PATH, "processando"))

settings = Settings()