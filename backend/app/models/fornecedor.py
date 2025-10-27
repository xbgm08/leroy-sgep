from pydantic import BaseModel, Field
from typing import Optional

class Fornecedor(BaseModel):
    cnpj: str = Field(..., max_length=14)
    nome: str = Field(..., max_length=100)
    politica_devolucao: int
    contato: Optional[str] = None
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "cnpj": "12345678000190",
                    "nome": "Master Química S.A.",
                    "politica_devolucao": 60,
                    "contato": "contato@empresa.com"
                }
            ]
        }
    }