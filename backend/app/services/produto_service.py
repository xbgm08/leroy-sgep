import pandas as pd
import os
import shutil

from typing import List, Optional
from pymongo.collection import Collection
from pymongo import UpdateOne
from datetime import datetime, timezone
from app.models.produto import Produto, Lote
from app.database.client import get_database
from app.services.fornecedor_service import FornecedorService
from pathlib import Path

class ProdutoService:
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        self.collection: Collection = self.db['produtos']
        self.fornecedor_collection: Collection = self.db['fornecedores']
        
    def get_all(self) -> List[Produto]:
        """Retorna todos os produtos cadastrados."""
        produtos_data = list(self.collection.find())
        fornecedor_service = FornecedorService()
        todos_fornecedores = fornecedor_service.get_all()
        fornecedor_map = {f.cnpj: f.nome for f in todos_fornecedores if f.cnpj is not None}
        
        resultados = []
        for data in produtos_data:
            produto = Produto(**data)
            produto.fornecedor_nome = fornecedor_map.get(produto.fornecedor_cnpj)
            resultados.append(produto)

        return resultados

    def create(self, produto: Produto) -> Produto:
        """Cria um novo produto."""    
        produto_data = produto.model_dump()
        
        self.collection.insert_one(produto_data)
        
        return Produto(**produto_data)

    def get_by_codigo_lm(self, codigo_lm: int) -> Optional[Produto]:
        """Busca um produto pelo código LM."""
        produto_data = self.collection.find_one({"codigo_lm": codigo_lm})

        if produto_data:
            return Produto(**produto_data)
        return None

    def adicionar_lote(self, codigo_lm: int, lote: Lote) -> Optional[Produto]:
        """Adiciona um novo lote ao produto e atualiza o estoque calculado."""
        produto_atual = self.get_by_codigo_lm(codigo_lm)
        if not produto_atual:
            return None
        
        if self.collection.find_one({"lotes.codigo_lote": lote.codigo_lote}):
            raise ValueError(f"Lote com código {lote.codigo_lote} já existe.")
        
        lote.valor_lote = produto_atual.preco_unit * lote.quantidade_lote
        
        lote_data = lote.model_dump()
        
        incremento_estoque = 0
        if lote.ativo:
            incremento_estoque = lote.quantidade_lote
        
        result = self.collection.update_one(
            {"codigo_lm": codigo_lm},
            {
                "$push": {"lotes": lote_data},
                "$inc": {"estoque_calculado": incremento_estoque} 
            }
        )

        if result.modified_count == 1:
            return self.get_by_codigo_lm(codigo_lm)
        
        return None

    def update(self, codigo_lm: int, produto: Produto) -> Optional[Produto]:
        """Atualiza os dados de um produto existente pelo código LM."""
        produto_atual = self.get_by_codigo_lm(codigo_lm)
        if not produto_atual:
            return None
        
        update_data = produto.model_dump(exclude={'codigo_lm', 'lotes'}, exclude_unset=True)
        
        if "preco_unit" in update_data and update_data["preco_unit"] != produto_atual.preco_unit:
            novo_preco_unit = update_data["preco_unit"]
            novos_lotes_data = []
            
            for lote_existente in produto_atual.lotes:
                lote_existente.valor_lote = novo_preco_unit * lote_existente.quantidade_lote
                novos_lotes_data.append(lote_existente.model_dump())
            
            update_data["lotes"] = novos_lotes_data
        
        result = self.collection.update_one(
            {"codigo_lm": codigo_lm},
            {"$set": update_data}
        )
        
        if result.matched_count == 1:
            return self.get_by_codigo_lm(codigo_lm)
            
        return None

    def delete(self, codigo_lm: int) -> bool:
        """Exclui o produto principal e todos os seus lotes."""
        result = self.collection.delete_one({"codigo_lm": codigo_lm})

        return result.deleted_count == 1

    def update_lote(self, codigo_lm: int, codigo_lote: int, lote_update: Lote) -> Optional[Produto]:
        """Atualiza os campos de um lote específico dentro do produto."""
        produto_atual = self.get_by_codigo_lm(codigo_lm)
        
        if not produto_atual: return None
        
        lote_antigo = next((l for l in produto_atual.lotes if l.codigo_lote == codigo_lote), None)
        if not lote_antigo: return None
        
        delta_quantidade = 0
        status_mudou_para_inativo = (lote_update.ativo is False and lote_antigo.ativo is True)
        status_mudou_para_ativo = (lote_update.ativo is True and lote_antigo.ativo is False)

        if status_mudou_para_inativo:
            delta_quantidade = -lote_antigo.quantidade_lote
        elif status_mudou_para_ativo:
            delta_quantidade = lote_update.quantidade_lote
        elif lote_antigo.ativo is True:
            delta_quantidade = lote_update.quantidade_lote - lote_antigo.quantidade_lote
        
        update_data = lote_update.model_dump(exclude={'codigo_lote'}, exclude_unset=True)
        update_data["data_atualizacao_ativo"] = datetime.now(timezone.utc)
        update_data["valor_lote"] = produto_atual.preco_unit * lote_update.quantidade_lote
        update_data.pop('codigo_lote', None) 
        
        set_fields = {
            f"lotes.$.{key}": value 
            for key, value in update_data.items()
        }

        result = self.collection.update_one(
            {"codigo_lm": codigo_lm, "lotes.codigo_lote": codigo_lote},
            {
                "$set": set_fields,
                "$inc": {"estoque_calculado": delta_quantidade}
            }
        )

        if result.modified_count == 1:
            return self.get_by_codigo_lm(codigo_lm)
        
        return None

    def deletar_lote(self, codigo_lm: int, codigo_lote: int) -> bool:
        """Remove um lote específico da lista de lotes de um produto."""
        produto_atual = self.get_by_codigo_lm(codigo_lm)
        if not produto_atual: return False
        
        lote_para_deletar = next((l for l in produto_atual.lotes if l.codigo_lote == codigo_lote), None)
        if not lote_para_deletar or lote_para_deletar.ativo is False:
            return False
        
        quantidade_a_subtrair = lote_para_deletar.quantidade_lote
        
        result = self.collection.update_one(
           {"codigo_lm": codigo_lm, "lotes.codigo_lote": codigo_lote},
            {
                "$set": {
                    "lotes.$.ativo": False, 
                    "lotes.$.data_alteracao_status": datetime.now(timezone.utc)
                },
                "$inc": {"estoque_calculado": -quantidade_a_subtrair}
            }
        )
        
        return result.modified_count == 1