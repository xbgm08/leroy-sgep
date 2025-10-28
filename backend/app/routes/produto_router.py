from typing import List
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.models.produto import Produto, Lote
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/produtos", tags=["Produtos e Lotes"])

def get_produto_service() -> ProdutoService:
    return ProdutoService()

@router.post("/", response_model=Produto, status_code=status.HTTP_201_CREATED)
def create_produto(produto: Produto, service: ProdutoService = Depends(get_produto_service)):
    return service.create(produto)

@router.get("/", response_model=List[Produto])
def get_produtos(service: ProdutoService = Depends(get_produto_service)):
    return service.get_all()

@router.get("/{codigo_lm}", response_model=Produto)
def get_produto_by_id(codigo_lm: int, service: ProdutoService = Depends(get_produto_service)):
    produto = service.get_by_codigo_lm(codigo_lm)
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return produto

@router.put("/{codigo_lm}", response_model=Produto)
def update_produto(codigo_lm: int, produto: Produto, service: ProdutoService = Depends(get_produto_service)):
    atualizado = service.update(codigo_lm, produto)
    if not atualizado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado para atualizar")
    return atualizado

@router.delete("/{codigo_lm}", status_code=status.HTTP_204_NO_CONTENT)
def delete_produto(codigo_lm: int, service: ProdutoService = Depends(get_produto_service)):
    if not service.delete(codigo_lm):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado para exclusão")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/{codigo_lm}/lotes", response_model=Produto, status_code=status.HTTP_201_CREATED)
def add_lote_to_produto(codigo_lm: int, lote: Lote, service: ProdutoService = Depends(get_produto_service)):
    return service.adicionar_lote(codigo_lm, lote)

@router.put("/{codigo_lm}/lotes/{codigo_lote}", response_model=Produto)
def update_lote_data(codigo_lm: int, codigo_lote: str, lote_update: Lote, service: ProdutoService = Depends(get_produto_service)):
    atualizado = service.update_lote(codigo_lm, codigo_lote, lote_update)
    if not atualizado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado para atualizar")
    return atualizado

@router.delete("/{codigo_lm}/lotes/{codigo_lote}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lote_data(codigo_lm: int, codigo_lote: str, service: ProdutoService = Depends(get_produto_service)):
    if not service.deletar_lote(codigo_lm, codigo_lote):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote não encontrado para exclusão")
    return Response(status_code=status.HTTP_204_NO_CONTENT)