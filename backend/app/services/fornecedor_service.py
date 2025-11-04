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
        # Índices
        self.collection.create_index("id_fornecedor", unique=True)
        self.collection.create_index("cnpj", unique=True)
        self.collection.create_index([("nome", "text")]) # Para busca por nome
        
    def get_all(self, nome: Optional[str] = None, skip: int = 0, limit: int = 10) -> List[Fornecedor]:
        query = {}
        if nome:
            query["$text"] = { "$search": nome }
            
        fornecedores_data = list(self.collection.find(query).skip(skip).limit(limit))
        return [Fornecedor(**data) for data in fornecedores_data]

    def create(self, fornecedor: Fornecedor) -> Fornecedor:
        if self.collection.find_one({"$or": [
            {"id_fornecedor": fornecedor.id_fornecedor},
            {"cnpj": fornecedor.cnpj}
        ]}):
            raise ValueError("Fornecedor com este ID ou CNPJ já existe.")
            
        fornecedor_data = fornecedor.model_dump()
        self.collection.insert_one(fornecedor_data)
        return fornecedor

    def get_by_id_fornecedor(self, id_fornecedor: int) -> Optional[Fornecedor]:
        fornecedor_data = self.collection.find_one({"id_fornecedor": id_fornecedor})
        if fornecedor_data:
            return Fornecedor(**fornecedor_data)
        return None
    
    def get_by_cnpj(self, cnpj: str) -> Optional[Fornecedor]:
        fornecedor_data = self.collection.find_one({"cnpj": cnpj})
        if fornecedor_data:
            return Fornecedor(**fornecedor_data)
        return None
    
    def update(self, id_fornecedor: int, fornecedor: Fornecedor) -> Optional[Fornecedor]:
        update_data = fornecedor.model_dump(exclude={'id_fornecedor', 'cnpj'}, exclude_unset=True) 
        
        result = self.collection.update_one(
            {"id_fornecedor": id_fornecedor},
            {"$set": update_data}
        )
        if result.modified_count == 1:
            return self.get_by_id_fornecedor(id_fornecedor) 
        return None 

    def delete(self, id_fornecedor: int) -> bool:
        result = self.collection.delete_one({"id_fornecedor": id_fornecedor})
        return result.deleted_count == 1