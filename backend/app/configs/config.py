import os
from dotenv import load_dotenv
from typing import List

load_dotenv()

class Settings:
    # Usamos o construtor __init__ para garantir que as variáveis 
    # são lidas na ordem correta.
    def __init__(self):
        
        # --- Configuração do Banco de Dados ---
        self.DB_URI: str = os.getenv("DB_URI")
        self.DB_NAME: str = os.getenv("DB_NAME")
        
        # --- Configuração do CORS (Lendo múltiplas origens) ---
        
        # 1. Lê a string do .env (ex: "http://localhost:3000,http://outro.site")
        #    O valor padrão é o do React.
        frontend_origins_str: str = os.getenv("FRONTEND_ORIGINS", "http://localhost:3000")
        
        # 2. Converte a string numa lista de Python
        self.FRONTEND_ORIGINS: List[str] = [
            url.strip() for url in frontend_origins_str.split(',')
        ]

        # --- Configuração das Pastas de Importação (Corrigido) ---
        
        # 1. Obtém o caminho base *primeiro*
        self.BASE_IMPORT_PATH: str = os.getenv("BASE_IMPORT_PATH", "./imports")
        
        # 2. Agora, usa 'self.BASE_IMPORT_PATH' (que já existe)
        #    para construir os caminhos padrão
        self.WATCH_FOLDER: str = os.getenv(
            "WATCH_FOLDER", 
            os.path.join(self.BASE_IMPORT_PATH, "pendentes")
        )
        self.PROCESSED_FOLDER: str = os.getenv(
            "PROCESSED_FOLDER", 
            os.path.join(self.BASE_IMPORT_PATH, "processados")
        )
        self.ERROR_FOLDER: str = os.getenv(
            "ERROR_FOLDER", 
            os.path.join(self.BASE_IMPORT_PATH, "erros")
        )
        self.PROCESSING_FOLDER: str = os.getenv(
            "PROCESSING_FOLDER", 
            os.path.join(self.BASE_IMPORT_PATH, "processando")
        )

# Cria a instância única que será importada pelo 'main.py'
settings = Settings()