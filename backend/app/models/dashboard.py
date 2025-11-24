from pydantic import BaseModel, Field
from typing import List

class ValorRiscoVencimento(BaseModel):
    """
    Define os os intervalos de vencimento.
    """
    dias_0_30: float = Field(
        default=0.0, 
        description="Valor total em R$ vencendo nos próximos 30 dias"
    )
    dias_31_60: float = Field(
        default=0.0, 
        description="Valor total em R$ vencendo entre 31 e 60 dias"
    )
    dias_61_90: float = Field(
        default=0.0, 
        description="Valor total em R$ vencendo entre 61 e 90 dias"
    )

class DashboardData(BaseModel):
    """
    Este é o modelo de resposta completo que o seu dashboard (Chart.js)
    irá receber. Ele contém todos os KPIs pré-calculados.
    """
    valor_total_reportado: float = Field(
        ..., 
        description="Valor financeiro total (Preço * Qtd) do estoque reportado (planilha)"
    )
    
    valor_total_perdido: float = Field(
        ..., 
        description="Valor financeiro total de todos os lotes marcados como 'Inativos'"
    )
    
    valor_em_risco: ValorRiscoVencimento = Field(
        ..., 
        description="Um objeto que detalha o valor financeiro em risco de vencimento"
    )