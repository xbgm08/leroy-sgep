from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel, Field, computed_field

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Lote(BaseModel):
    codigo_lote: str
    data_fabricacao: datetime
    data_validade: datetime
    prazo_validade_meses: int
    quantidade_lote: int
    ativo: bool = Field(default=True, description="Status do lote (True=Ativo, False=Inativo)")
    data_alteracao_status: datetime = Field(default_factory=get_utc_now)
    valor_lote: float = Field(default=0.0, description="Valor do estoque do lote (Preço Unit. Produto * Qtd. Lote)")

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
    fornecedor_id: Optional[int] = None # <-- Chave int consistente
    lotes: List[Lote] = []

    @computed_field
    @property
    def valor_estoque_calculado(self) -> float:
        """Calcula o valor total do estoque do produto (Preço Unit. * Estoque Total)"""
        # Este valor é calculado dinamicamente e aparecerá no JSON de resposta
        return self.preco_unit * self.estoque_calculado
    
    @computed_field
    @property
    def discrepancia_estoque(self) -> Optional[int]:
        """Calcula a diferença entre o estoque reportado e o estoque calculado."""
        
        # Se não houver estoque reportado, não há discrepância
        if self.estoque_reportado is None:
            return 0 # Ou 'None' se preferir
            
        # Retorna a diferença (ex: 1000 - 700 = 300)
        return self.estoque_reportado - self.estoque_calculado
    
    @computed_field
    @property
    def valor_estoque_total(self) -> Optional[float]:
        """
        Valor do Estoque REPORTADO (Preço Unit. * estoque_reportado).
        Retorna None se o estoque_reportado não foi preenchido.
        """
        if self.estoque_reportado is None:
            return None # Não podemos calcular o valor se não houver estoque reportado
            
        return self.preco_unit * self.estoque_reportado
    
    