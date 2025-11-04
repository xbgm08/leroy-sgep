from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.models.produto import Produto, Lote
from app.services.produto_service import ProdutoService

router = APIRouter(prefix="/produtos", tags=["Produtos e Lotes"])

def get_produto_service() -> ProdutoService:
    return ProdutoService()

@router.post("/", response_model=Produto, status_code=status.HTTP_201_CREATED)
def create_produto(produto: Produto, service: ProdutoService = Depends(get_produto_service)):
    """Cria um novo produto."""
    try:
        return service.create(produto)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/", response_model=List[Produto])
def get_produtos(
    nome_produto: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    service: ProdutoService = Depends(get_produto_service)
):
    """Lista produtos com filtro por nome e paginação."""
    return service.get_all(nome_produto=nome_produto, skip=skip, limit=limit)

@router.get("/{codigo_lm}", response_model=Produto)
def get_produto_by_id(codigo_lm: int, service: ProdutoService = Depends(get_produto_service)):
    """Busca um produto específico pelo Código LM."""
    produto = service.get_by_codigo_lm(codigo_lm)
    if not produto:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    return produto

@router.put("/{codigo_lm}", response_model=Produto)
def update_produto(codigo_lm: int, produto: Produto, service: ProdutoService = Depends(get_produto_service)):
    """Atualiza os dados de um produto (exceto lotes)."""
    atualizado = service.update(codigo_lm, produto)
    if not atualizado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado para atualizar")
    return atualizado

@router.delete("/{codigo_lm}", status_code=status.HTTP_204_NO_CONTENT)
def delete_produto(codigo_lm: int, service: ProdutoService = Depends(get_produto_service)):
    """Exclui um produto (exclusão permanente)."""
    if not service.delete(codigo_lm):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado para exclusão")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Sub-Rotas de Lotes ---

@router.post("/{codigo_lm}/lotes", response_model=Produto, status_code=status.HTTP_201_CREATED)
def add_lote_to_produto(codigo_lm: int, lote: Lote, service: ProdutoService = Depends(get_produto_service)):
    """Adiciona um novo lote a um produto e atualiza o estoque."""
    try:
        produto_atualizado = service.adicionar_lote(codigo_lm, lote)
        if not produto_atualizado:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
        return produto_atualizado
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.put("/{codigo_lm}/lotes/{codigo_lote}", response_model=Produto)
def update_lote_data(codigo_lm: int, codigo_lote: str, lote_update: Lote, service: ProdutoService = Depends(get_produto_service)):
    """Atualiza um lote específico e recalcula o estoque."""
    atualizado = service.update_lote(codigo_lm, codigo_lote, lote_update)
    if not atualizado:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote ou Produto não encontrado para atualizar")
    return atualizado

@router.delete("/{codigo_lm}/lotes/{codigo_lote}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lote_data(codigo_lm: int, codigo_lote: str, service: ProdutoService = Depends(get_produto_service)):
    """Exclui um lote específico e recalcula o estoque."""
    if not service.deletar_lote(codigo_lm, codigo_lote):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lote ou Produto não encontrado para exclusão")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/importar/processar-pasta", summary="Processa planilhas da pasta do servidor")
def processar_pasta_de_importacao(
    service: ProdutoService = Depends(get_produto_service)
):
    """
    Inicia o processo de importação em lote.
    
    O sistema irá ler todos os arquivos .xlsx da pasta "pendentes"
    (configurada no servidor), processá-los e movê-los para as pastas
    "processados" ou "erros".
    
    Esta rota não recebe arquivos, ela apenas dispara a ação.
    """
    try:
        resultado = service.importar_produtos_from_excel()
        return resultado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno no processamento: {e}")