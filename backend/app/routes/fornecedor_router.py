from fastapi import APIRouter, Depends, HTTPException, Response, status
from typing import List, Optional
from app.models.fornecedor import Fornecedor
from app.services.fornecedor_service import FornecedorService

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])

def get_fornecedor_service() -> FornecedorService:
    return FornecedorService()

@router.get("/", response_model=List[Fornecedor])
def get_all_fornecedores(
    nome: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    service: FornecedorService = Depends(get_fornecedor_service)
):
    """Lista fornecedores com filtro por nome e paginação."""
    return service.get_all(nome=nome, skip=skip, limit=limit)

@router.get("/buscar/cnpj/{cnpj}", response_model=Fornecedor)
def get_fornecedor_by_cnpj(cnpj: str, service: FornecedorService = Depends(get_fornecedor_service)):
    """Busca um fornecedor específico pelo CNPJ."""
    fornecedor = service.get_by_cnpj(cnpj)
    if not fornecedor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fornecedor com CNPJ {cnpj} não encontrado")
    return fornecedor

@router.get("/{id_fornecedor}", response_model=Fornecedor)
def get_fornecedor_by_id(id_fornecedor: int, service: FornecedorService = Depends(get_fornecedor_service)):
    """Busca um fornecedor pelo seu ID primário."""
    fornecedor = service.get_by_id_fornecedor(id_fornecedor)
    if not fornecedor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fornecedor com ID {id_fornecedor} não encontrado")
    return fornecedor

@router.post("/", response_model=Fornecedor, status_code=status.HTTP_201_CREATED)
def create_fornecedor(fornecedor: Fornecedor, service: FornecedorService = Depends(get_fornecedor_service)):
    """Cria um novo fornecedor."""
    try:
        return service.create(fornecedor)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{id_fornecedor}", response_model=Fornecedor)
def update_fornecedor(id_fornecedor: int, fornecedor: Fornecedor, service: FornecedorService = Depends(get_fornecedor_service)):
    """Atualiza um fornecedor existente."""
    fornecedor_atualizado = service.update(id_fornecedor, fornecedor)
    if not fornecedor_atualizado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fornecedor com ID {id_fornecedor} não encontrado para atualizar")
    return fornecedor_atualizado

@router.delete("/{id_fornecedor}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fornecedor(id_fornecedor: int, service: FornecedorService = Depends(get_fornecedor_service)):
    """Exclui um fornecedor (exclusão permanente)."""
    if not service.delete(id_fornecedor):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fornecedor com ID {id_fornecedor} não encontrado para exclusão")
    return Response(status_code=status.HTTP_204_NO_CONTENT)