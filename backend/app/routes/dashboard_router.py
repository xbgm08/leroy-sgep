from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.services.dashboard_service import DashboardService
from app.models.dashboard import DashboardData

router = APIRouter(prefix="/dashboard", tags=["Dashboard & KPIs"])

# Injeção de dependência (para obter o serviço)
def get_dashboard_service() -> DashboardService:
    return DashboardService()

@router.get("/kpis", response_model=DashboardData)
def get_dashboard_kpis(
    service: DashboardService = Depends(get_dashboard_service)
):
    """
    Endpoint de alta performance para o dashboard.
    
    Retorna um objeto JSON único com todos os KPIs calculados:
    - Valor Total Reportado
    - Valor Total Perdido (Lotes Inativos)
    - Valor em Risco (agrupado por 30/60/90 dias)
    """
    try:
        # Chama o serviço que faz todo o trabalho pesado
        return service.get_dashboard_kpis()
    except Exception as e:
        # Se a agregação falhar, retorna um erro 500
        raise HTTPException(status_code=500, detail=f"Erro ao calcular KPIs do dashboard: {e}")