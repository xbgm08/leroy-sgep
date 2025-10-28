from typing import List, Optional
from pymongo.collection import Collection
from app.models.produto import Produto, Lote
from app.database.client import get_database

class ProdutoService:
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        self.collection: Collection = self.db['produtos']
        
    def get_all(self) -> List[Produto]:
        """Retorna todos os produtos cadastrados."""
        produtos_data = list(self.collection.find())
        return [Produto(**data) for data in produtos_data]

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
        """Adiciona um novo lote à lista de lotes de um produto existente."""
        lote_data = lote.model_dump()
        
        result = self.collection.update_one(
            {"codigo_lm": codigo_lm},
            {"$push": {"lotes": lote_data}}
        )

        if result.modified_count == 1:
            return self.get_by_codigo_lm(codigo_lm)
        
        return None


    def update(self, codigo_lm: int, produto: Produto) -> Optional[Produto]:
        """Atualiza os campos do produto principal (não os lotes)."""
        update_data = produto.model_dump(exclude_none=True, exclude={'codigo_lm', 'lotes'})
        
        result = self.collection.update_one(
            {"codigo_lm": codigo_lm},
            {"$set": update_data}
        )
        
        if result.modified_count == 1:
            return self.get_by_codigo_lm(codigo_lm)
            
        return None

    def delete(self, codigo_lm: int) -> bool:
        """Exclui o produto principal e todos os seus lotes."""
        result = self.collection.delete_one({"codigo_lm": codigo_lm})

        return result.deleted_count == 1

    def update_lote(self, codigo_lm: int, codigo_lote: int, lote_update: Lote) -> Optional[Produto]:
        """Atualiza os campos de um lote específico dentro do produto."""
        update_data = lote_update.model_dump(exclude_none=True)
        update_data.pop('codigo_lote', None) 
        
        set_fields = {
            f"lotes.$.{key}": value 
            for key, value in update_data.items()
        }

        result = self.collection.update_one(
            {"codigo_lm": codigo_lm, "lotes.codigo_lote": codigo_lote},
            {"$set": set_fields}
        )

        if result.modified_count == 1:
            return self.get_by_codigo_lm(codigo_lm)
        
        return None

    def deletar_lote(self, codigo_lm: int, codigo_lote: int) -> bool:
        """Remove um lote específico da lista de lotes de um produto."""
        result = self.collection.update_one(
            {"codigo_lm": codigo_lm},
            {"$pull": {"lotes": {"codigo_lote": codigo_lote}}}
        )
        
        return result.modified_count == 1