from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.configs.config import settings
from app.database.client import connect_to_mongo, close_mongo_connection
from app.routes import fornecedor_router, produto_router, base_conhecimento_router

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

origins = [
    settings.FRONTEND_ORIGIN
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fornecedor_router.router)
app.include_router(produto_router.router)
app.include_router(base_conhecimento_router.router)