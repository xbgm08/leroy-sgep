from pymongo import MongoClient
from app.configs.config import settings
from typing import Optional

client: Optional[MongoClient] = None
db = None

async def connect_to_mongo():
    """Estabelece a conexão com o MongoDB."""
    global client, db
    try:
        client = MongoClient(settings.DB_URI)
        client.admin.command('ping') 
        db = client[settings.DB_NAME]
        print(f"MongoDB conectado com sucesso ao banco: {settings.DB_NAME}")
    except Exception as e:
        print(f"ERRO DE CONEXÃO COM MONGODB: {e}")

async def close_mongo_connection():
    """Fecha a conexão com o MongoDB."""
    global client
    if client:
        client.close()
        print("MongoDB desconectado.")

async def get_database():
    """Retorna a instância do banco de dados (db)."""
    return db