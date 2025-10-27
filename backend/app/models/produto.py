from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class Lote(BaseModel):
    codigo_lote: int
    data_fabricacao: datetime
    data_validade: datetime
    prazo_validade_meses: int
    quantidade_lote: int
    valor_compra_unitario: float
    status: str = Field("Ativo")
    motivo_perda: Optional[str] = None
    data_alteracao_status: datetime

class Produto(BaseModel):
    nome_produto: str = Field(..., max_length=200)
    codigo_lm: int
    ean: int
    marca: str = Field(..., max_length=100)
    ficha_tec: str = Field(..., max_length=500)
    link_prod: str = Field(..., max_length=300)
    cor: str = Field(..., max_length=50)
    dimensoes: List[float]
    volume: int
    avs: bool
    secao: str = Field(..., max_length=100)
    subsecao: str = Field(..., max_length=100)
    localizacao: str = Field(..., max_length=100)
    preco_unit: float
    total_estoque: int
    fornecedor_id: int
    lotes: List[Lote]
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "nome_produto": "Argamassas AC-III 20kg",
                    "codigo_lm": 123456,
                    "ean": 7891234567890,
                    "marca": "Construmax",
                    "ficha_tec": "https://example.com/ficha-tecnica.pdf",
                    "link_prod": "https://example.com/produto/argamassas-ac-iii",
                    "cor": "Cinza",
                    "dimensoes": [30.0, 20.0, 10.0],
                    "volume": 6000,
                    "avs": True,
                    "secao": "Materiais de Construção",
                    "subsecao": "Argamassas",
                    "localizacao": "Corredor 5, Prateleira 3",
                    "preco_unit": 15.75,
                    "total_estoque": 150,
                    "fornecedor_id": 42,
                    "lotes": [
                        {
                            "codigo_lote": 1,
                            "data_fabricacao": "2023-01-15T00:00:00",
                            "data_validade": "2025-01-15T00:00:00",
                            "prazo_validade_meses": 24,
                            "quantidade_lote": 100,
                            "valor_compra_unitario": 10.50,
                            "status": "Ativo",
                            "motivo_perda": None,
                            "data_alteracao_status": "2023-01-15T00:00:00"
                        },
                        {
                            "codigo_lote": 2,
                            "data_fabricacao": "2023-03-10T00:00:00",
                            "data_validade": "2025-03-10T00:00:00",
                            "prazo_validade_meses": 24,
                            "quantidade_lote": 50,
                            "valor_compra_unitario": 10.75,
                            "status": "Ativo",
                            "motivo_perda": None,
                            "data_alteracao_status": "2023-03-10T00:00:00"
                        }
                    ]                    
                }
            ]
        }
    }