from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.database.client import connect_to_mongo, close_mongo_connection
from app.routes import fornecedor_router, produto_router

# 


@asynccontextmanager
async def lifespan(app: FastAPI):
    connect_to_mongo()
    yield
    close_mongo_connection()

app = FastAPI(
    title="SGEP - Sistema de Gestão de Estoque de Perecíveis",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(fornecedor_router.router)
app.include_router(produto_router.router)
