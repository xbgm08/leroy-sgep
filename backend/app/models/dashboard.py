from pydantic import BaseModel, Field
from typing import List

class ValorRiscoVencimento(BaseModel):
    """Valores em risco de vencimento por faixa de dias."""
    dias_0_30: float = 0.0
    dias_31_60: float = 0.0
    dias_61_90: float = 0.0

class StatusLotesDistribuicao(BaseModel):
    """Distribuição de lotes por faixa de vencimento."""
    acima_90_dias: int = 0      
    em_90_dias: int = 0
    em_60_dias: int = 0
    em_30_dias: int = 0

class ProdutoVencimentoProximo(BaseModel):
    """Produto com lote próximo ao vencimento."""
    codigo_lm: str
    nome_produto: str
    numero_lote: str
    local: str
    categoria: str
    data_validade: str
    dias_para_vencer: int

class ProdutoFaltanteLote(BaseModel):
    """Produto com discrepância entre estoque reportado e lotes cadastrados."""
    nome: str
    falta_atribuir: int
    percentual_concluido: float
    tem_risco_vencimento: bool = False

class EstatisticasEstoque(BaseModel):
    """Estatísticas gerais do estoque."""
    total_produtos: int = 0
    total_lotes: int = 0
    produtos_em_estoque: int = 0
    lotes_perdidos: int = 0

class DashboardData(BaseModel):
    """Dados consolidados do dashboard."""
    valor_total_estoque: float = 0.0
    valor_total_perdido: float = 0.0
    
    estatisticas: EstatisticasEstoque
    valor_em_risco: ValorRiscoVencimento
    status_lotes_distribuicao: StatusLotesDistribuicao
    
    produtos_vencimento_proximo: List[ProdutoVencimentoProximo] = []
    produtos_falta_lote: List[ProdutoFaltanteLote] = []