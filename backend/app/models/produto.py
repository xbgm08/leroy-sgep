from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, computed_field

class Lote(BaseModel):
    codigo_lote: str
    data_fabricacao: datetime
    data_validade: datetime
    prazo_validade_meses: int
    quantidade_lote: int
    ativo: bool = Field(default=True)
    data_alteracao_status: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    valor_lote: float

class Produto(BaseModel):
    nome_produto: str = Field(..., max_length=200)
    codigo_lm: int
    ean: Optional[int] = None
    marca: str = Field(..., max_length=100)
    ficha_tec: str = Field(..., max_length=500)
    link_prod: str = Field(..., max_length=300)
    cor: Optional[str] = Field(..., max_length=50)
    secao: Optional[str] = Field(None, max_length=200)
    cod_secao: Optional[int] = None
    subsecao: Optional[str] = Field(None, max_length=200)
    cod_subsecao: Optional[int] = None
    avs: bool = Field(default=False)
    preco_unit: float
    estoque_calculado: int = 0
    estoque_reportado: Optional[int] = None
    fornecedor_cnpj: str
    fornecedor_nome: Optional[str] = None
    lotes: List[Lote]
    
    @computed_field
    @property
    def valor_estoque_calculado(self) -> float:
        """Calcula o valor total do estoque do produto (Preço Unit. * Estoque Total)"""
        return round(self.preco_unit * self.estoque_calculado, 2)
    
    @computed_field
    @property
    def discrepancia_estoque(self) -> Optional[int]:
        """Calcula a diferença entre o estoque reportado e o estoque calculado."""
        if self.estoque_reportado is None:
            return 0
            
        return self.estoque_reportado - self.estoque_calculado
    
    @computed_field
    @property
    def valor_estoque_total(self) -> Optional[float]:
        """Calcula o valor total do estoque baseado no estoque reportado."""
        if self.estoque_reportado is None:
            return None
            
        return self.preco_unit * self.estoque_reportado
    
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
                    "secao": "Construção",
                    "cod_secao": 10,
                    "subsecao": "Argamassas",
                    "cod_subsecao": 101,
                    "avs": False,
                    "preco_unit": 15.75,
                    "estoque_calculado": 150,
                    "estoque_reportado": 145,
                    "fornecedor_cnpj": "12345678000190",
                    "lotes": [
                        {
                            "codigo_lote": "132ABC",
                            "data_fabricacao": "2023-01-15T00:00:00",
                            "data_validade": "2025-01-15T00:00:00",
                            "prazo_validade_meses": 24,
                            "quantidade_lote": 100,
                            "ativo": True,
                            "data_alteracao_status": "2023-01-15T00:00:00",
                            "valor_lote": 1575.00                          
                        },
                        {
                            "codigo_lote": "456DEF",
                            "data_fabricacao": "2023-03-10T00:00:00",
                            "data_validade": "2025-03-10T00:00:00",
                            "prazo_validade_meses": 24,
                            "quantidade_lote": 50,
                            "ativo": True,
                            "data_alteracao_status": "2023-03-10T00:00:00",
                            "valor_lote": 787.50
                        }
                    ]                    
                }
            ]
        }
    }