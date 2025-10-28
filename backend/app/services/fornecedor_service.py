from typing import List, Optional
from pymongo.collection import Collection

from app.models.fornecedor import Fornecedor
from app.database.client import get_database

class FornecedorService:
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        self.collection: Collection = self.db['fornecedores']
        
    def get_all(self) -> List[Fornecedor]:
        """Retorna todos os fornecedores cadastrados."""
        fornecedores_data = list(self.collection.find())
        return [Fornecedor(**data) for data in fornecedores_data]

    def create(self, fornecedor: Fornecedor) -> Fornecedor:
        """Cria um novo fornecedor com um ID sequencial (para simplificar a didática)."""
        fornecedor_data = fornecedor.model_dump()
        
        self.collection.insert_one(fornecedor_data)
        
        return Fornecedor(**fornecedor_data)

    def get_by_cnpj(self, cnpj: str) -> Optional[Fornecedor]:
        """Busca um fornecedor pelo CNPJ."""
        fornecedor_data = self.collection.find_one({"cnpj": cnpj})

        if fornecedor_data:
            return Fornecedor(**fornecedor_data)
        return None
    
    def update(self, cnpj: int, fornecedor: Fornecedor) -> Optional[Fornecedor]:
        """Atualiza um fornecedor existente pelo CNPJ."""        
        update_data = fornecedor.model_dump(exclude_none=True, exclude={'cnpj'}) 
        
        result = self.collection.update_one(
            {"cnpj": cnpj},
            {"$set": update_data}
        )
        
        if result.modified_count == 1:
            return self.get_by_cnpj(cnpj) 
        
        return None 

    def delete(self, cnpj: int) -> bool:
        """Exclui um fornecedor pelo ID."""
        result = self.collection.delete_one({"cnpj": cnpj})
        return result.deleted_count == 1