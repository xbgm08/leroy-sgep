from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, timezone

class BaseConhecimento(BaseModel):
    """
    Modelo para base de conhecimento do sistema (FAQs, tutoriais, ajuda)
    """
    id: Optional[str] = None
    titulo: str = Field(..., max_length=200)
    resposta: str = Field(..., max_length=2000)
    keywords: List[str]
    categoria: Optional[str] = Field(None, max_length=50)
    ativo: bool = Field(default=True)

class ConhecimentoMatch(BaseModel):
    """
    Modelo para resultado de busca com score de similaridade
    """
    conhecimento: BaseConhecimento
    score: float
    matches: List[str] = []