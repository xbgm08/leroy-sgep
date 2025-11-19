from fastapi import APIRouter, Depends, HTTPException, Response, status
from typing import List, Optional
from app.models.base_conhecimento import BaseConhecimento, ConhecimentoMatch 
from app.services.base_conhecimento_service import BaseConhecimentoService

router = APIRouter(prefix="/base-conhecimento", tags=["Base de Conhecimento"])

def get_base_conhecimento_service() -> BaseConhecimentoService:
    return BaseConhecimentoService()

@router.get("/", response_model=List[BaseConhecimento])
def get_all_conhecimentos(
        apenas_ativos: bool = True, 
        service: BaseConhecimentoService = Depends(get_base_conhecimento_service)
):
    """Retorna todos os itens da base de conhecimento."""
    return service.get_all(apenas_ativos=apenas_ativos)

@router.get("/{id}", response_model=BaseConhecimento)
def get_conhecimento_by_id(
    id: str, 
    service: BaseConhecimentoService = Depends(get_base_conhecimento_service)
):
    """Retorna um item da base de conhecimento pelo ID."""
    conhecimento = service.get_by_id(id)
    if not conhecimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Item com ID {id} não encontrado"
        )
    return conhecimento

@router.post("/", response_model=BaseConhecimento, status_code=status.HTTP_201_CREATED)
def create_conhecimento(
    conhecimento: BaseConhecimento, 
    service: BaseConhecimentoService = Depends(get_base_conhecimento_service)
):
    """Cria um novo item na base de conhecimento."""
    try:
        return service.create(conhecimento)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    
@router.put("/{id}", response_model=BaseConhecimento)
def update_conhecimento(
    id: str, 
    conhecimento: BaseConhecimento, 
    service: BaseConhecimentoService = Depends(get_base_conhecimento_service)
):
    """Atualiza um item existente na base de conhecimento."""
    conhecimento_atualizado = service.update(id, conhecimento)
    if not conhecimento_atualizado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Item com ID {id} não encontrado para atualizar"
        )
    return conhecimento_atualizado

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conhecimento(
    id: str, 
    service: BaseConhecimentoService = Depends(get_base_conhecimento_service)
):
    """Exclui um item da base de conhecimento pelo ID."""
    if not service.delete(id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=f"Item com ID {id} não encontrado para exclusão"
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/buscar", response_model=List[ConhecimentoMatch])
def buscar_conhecimentos(
    mensagem: str,
    min_score: float = 30.0,
    max_resultados: int = 3,
    service: BaseConhecimentoService = Depends(get_base_conhecimento_service)
):
    """Busca itens relevantes na base de conhecimento."""
    if len(mensagem) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mensagem deve ter no mínimo 3 caracteres"
        )
    
    if not 0 <= min_score <= 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Score mínimo deve estar entre 0 e 100"
        )
    
    if not 1 <= max_resultados <= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Número máximo de resultados deve estar entre 1 e 10"
        )
    
    return service.buscar_resposta(mensagem, min_score, max_resultados)

@router.get("/resposta/melhor", response_model=ConhecimentoMatch)
def obter_melhor_resposta(
    mensagem: str,
    service: BaseConhecimentoService = Depends(get_base_conhecimento_service)
):
    """Retorna a melhor resposta para a mensagem do usuário."""
    if len(mensagem) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mensagem deve ter no mínimo 3 caracteres"
        )
    
    resultado = service.get_melhor_resposta(mensagem)
    
    if not resultado:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Nenhuma resposta relevante encontrada. Tente reformular sua pergunta ou escolha uma das opções sugeridas."
        )
    
    return resultado