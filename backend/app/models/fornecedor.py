from pydantic import BaseModel, Field
from typing import Optional

class Fornecedor(BaseModel):
    id_fornecedor: int = Field(..., description="ID único do fornecedor (Chave Primária)")
    cnpj: str = Field(..., max_length=14)
    nome: str = Field(..., max_length=100)
    politica_devolucao: int
    contato: Optional[str] = None
    status_forn : bool = Field(default=True, description="Flag para exclusão lógica")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "id_fornecedor": 42,
                    "cnpj": "12345678000190",
                    "nome": "Master Química S.A.",
                    "politica_devolucao": 60,
                    "contato": "contato@empresa.com"
                }
            ]
        }
    }