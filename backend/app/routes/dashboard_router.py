from fastapi import APIRouter, Depends, HTTPException, status
from app.services.dashboard_service import DashboardService
from app.models.dashboard import DashboardData, StatusLotesDistribuicao

router = APIRouter(prefix="/dashboard", tags=["Dashboard & KPIs"])

def get_dashboard_service() -> DashboardService:
    return DashboardService()

@router.get("/kpis", response_model=DashboardData, status_code=status.HTTP_200_OK)
async def get_dashboard_kpis(
    service: DashboardService = Depends(get_dashboard_service)
):
    """Retorna KPIs consolidados do dashboard."""
    try:
        return service.get_dashboard_kpis()
    except ConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Erro de conexão com banco de dados: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao calcular KPIs do dashboard: {str(e)}"
        )
        
@router.get("/status-produto/{nome_produto}", response_model=StatusLotesDistribuicao)
async def get_product_status(
    nome_produto: str,
    service: DashboardService = Depends(get_dashboard_service)
):
    """Retorna a distribuição de lotes de um produto específico."""
    try:
        return service.get_product_lote_status(nome_produto)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar status do produto: {str(e)}"
        )