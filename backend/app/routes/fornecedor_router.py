from fastapi import APIRouter, Depends, HTTPException, Response, status
from typing import List, Optional
from app.models.fornecedor import Fornecedor
from app.services.fornecedor_service import FornecedorService

router = APIRouter(prefix="/fornecedores", tags=["Fornecedores"])

def get_fornecedor_service() -> FornecedorService:
    return FornecedorService()

@router.get("/", response_model=list[Fornecedor])
def get_all_fornecedores(service: FornecedorService = Depends(get_fornecedor_service)):
    """Retorna a lista de todos os fornecedores cadastrados."""
    return service.get_all()

@router.get("/{cnpj}", response_model=Fornecedor)
def get_fornecedor_by_id(cnpj: str, service: FornecedorService = Depends(get_fornecedor_service)):
    """Retorna um fornecedor pelo CNPJ."""
    fornecedor = service.get_by_cnpj(cnpj)
    if not fornecedor:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fornecedor com CNPJ {cnpj} não encontrado")
    return fornecedor

@router.post("/", response_model=Fornecedor, status_code=status.HTTP_201_CREATED)
def create_fornecedor(fornecedor: Fornecedor, service: FornecedorService = Depends(get_fornecedor_service)):
    """Cria um novo fornecedor."""
    try:
        return service.create(fornecedor)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{cnpj}", response_model=Fornecedor)
def update_fornecedor(cnpj: str, fornecedor: Fornecedor, service: FornecedorService = Depends(get_fornecedor_service)):
    """Atualiza os dados de um fornecedor existente."""
    fornecedor_atualizado = service.update(cnpj, fornecedor)
    if not fornecedor_atualizado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fornecedor com CNPJ {cnpj} não encontrado para atualizar")
    return fornecedor_atualizado

@router.delete("/{cnpj}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fornecedor(cnpj: str, service: FornecedorService = Depends(get_fornecedor_service)):
    """Exclui um fornecedor pelo CNPJ."""
    if not service.delete(cnpj):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Fornecedor com CNPJ {cnpj} não encontrado para exclusão")
    return Response(status_code=status.HTTP_204_NO_CONTENT)