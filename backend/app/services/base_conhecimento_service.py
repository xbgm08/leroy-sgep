from typing import List, Optional, Tuple
from pymongo.collection import Collection
from bson import ObjectId
import re
import unicodedata
from app.database.client import get_database
from app.models.base_conhecimento import BaseConhecimento, ConhecimentoMatch

class BaseConhecimentoService:
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        self.collection: Collection = self.db['base_conhecimento']
        self.collection.create_index("titulo", unique=True)
        
    def get_all(self, apenas_ativos: bool = True) -> List[BaseConhecimento]:
        """Retorna todos os itens da base de conhecimento."""
        query = {"ativo": True} if apenas_ativos else {}
        conhecimentos_data = list(self.collection.find(query))
        
        if not conhecimentos_data:
            return []
        
        conhecimentos = []
        for data in conhecimentos_data:
            data["id"] = str(data.pop("_id"))
            conhecimentos.append(BaseConhecimento(**data))
        
        return conhecimentos

    def create(self, conhecimento: BaseConhecimento) -> BaseConhecimento:
        """Cria um novo item na base de conhecimento."""        
        if self.collection.find_one({"titulo": conhecimento.titulo}):
            raise ValueError("Item com este título já existe.")
        
        conhecimento_data = conhecimento.model_dump(exclude={"id"})
        
        result = self.collection.insert_one(conhecimento_data)
        conhecimento.id = str(result.inserted_id)
        
        return conhecimento

    def get_by_id(self, id: str) -> Optional[BaseConhecimento]:
        """Busca um item pelo ID."""
        try:
            conhecimento_data = self.collection.find_one({"_id": ObjectId(id)})

            if conhecimento_data:
                conhecimento_data["id"] = str(conhecimento_data.pop("_id"))
                return BaseConhecimento(**conhecimento_data)
        except Exception:
            return None
        
        return None
    
    def update(self, id: str, conhecimento: BaseConhecimento) -> Optional[BaseConhecimento]:
        """Atualiza um item existente pelo ID."""        
        try:
            update_data = conhecimento.model_dump(exclude_none=True, exclude={'id'})
            
            result = self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": update_data}
            )
            
            if result.modified_count == 1:
                return self.get_by_id(id)
        except Exception:
            return None
        
        return None

    def delete(self, id: str) -> bool:
        """Desativa um item pelo ID (soft delete)."""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": {"ativo": False}}
            )
            return result.modified_count == 1
        except Exception:
            return False
    
    def normalizar_texto(self, texto: str) -> str:
        """Normaliza o texto para facilitar a comparação de similaridade."""
        # Remove acentos
        texto = ''.join(
            c for c in unicodedata.normalize('NFD', texto)
            if unicodedata.category(c) != 'Mn'
        )
        
        # Lowercase e remove pontuação
        texto = re.sub(r'[^\w\s]', ' ', texto.lower())
        
        # Remove espaços extras
        texto = ' '.join(texto.split())
        
        return texto
    
    def extrair_palavras(self, texto: str) -> List[str]:
        """Extrai palavras relevantes do texto, removendo stopwords comuns."""
        stopwords = {
            'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
            'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'sob',
            'e', 'ou', 'mas', 'que', 'qual', 'quais', 'como', 'quando', 'onde',
            'é', 'são', 'está', 'estão', 'ser', 'estar', 'ter', 'fazer', 'mais',
            'menos', 'muito', 'pouco', 'todo', 'toda', 'isso', 'esse', 'aquele'
        }
        
        texto_normalizado = self.normalizar_texto(texto)
        palavras = texto_normalizado.split()
        
        # Filtra stopwords e palavras muito curtas
        palavras_relevantes = [
            p for p in palavras 
            if p not in stopwords and len(p) > 2
        ]
        
        return palavras_relevantes
    
    def calcular_score(self, mensagem: str, conhecimento: BaseConhecimento) -> Tuple[float, List[str]]:
        """Calcula o score de similaridade entre a mensagem e o item da base de conhecimento."""
        palavras_mensagem = set(self.extrair_palavras(mensagem))
        
        if not palavras_mensagem:
            return 0.0, []
        
        # Normaliza título e keywords
        titulo_normalizado = self.normalizar_texto(conhecimento.titulo)
        keywords_normalizadas = [self.normalizar_texto(k) for k in conhecimento.keywords]
        
        # Calcula matches
        matches_titulo = set()
        matches_keywords = set()
        
        for palavra in palavras_mensagem:
            # Match exato no título (peso maior)
            if palavra in titulo_normalizado:
                matches_titulo.add(palavra)
            
            # Match nas keywords
            for keyword in keywords_normalizadas:
                if palavra in keyword or keyword in palavra:
                    matches_keywords.add(palavra)
        
        # Calcula score ponderado
        peso_titulo = 2.0
        peso_keyword = 1.5
        
        score_titulo = len(matches_titulo) * peso_titulo
        score_keywords = len(matches_keywords) * peso_keyword
        
        score_total = score_titulo + score_keywords
        
        # Normaliza score para 0-100
        max_possible_score = len(palavras_mensagem) * peso_titulo
        score_normalizado = min(100, (score_total / max_possible_score) * 100) if max_possible_score > 0 else 0
        
        # Bonus se todas as palavras importantes tiveram match
        if len(matches_titulo.union(matches_keywords)) == len(palavras_mensagem):
            score_normalizado = min(100, score_normalizado * 1.2)
        
        palavras_matched = list(matches_titulo.union(matches_keywords))
        
        return round(score_normalizado, 2), palavras_matched
    
    def buscar_resposta(self, mensagem: str, min_score: float = 30.0, max_resultados: int = 3) -> List[ConhecimentoMatch]:
        """Busca respostas na base de conhecimento que correspondem à mensagem."""
        items = self.get_all(apenas_ativos=True)
        
        resultados = []
        
        for item in items:
            score, matches = self.calcular_score(mensagem, item)
            
            if score >= min_score:
                resultados.append(ConhecimentoMatch(
                    conhecimento=item,
                    score=score,
                    matches=matches
                ))
        
        resultados.sort(key=lambda x: x.score, reverse=True)
        
        return resultados[:max_resultados]
    
    def incrementar_visualizacao(self, id: str) -> bool:
        """Incrementa contador de visualizações"""
        try:
            result = self.collection.update_one(
                {"_id": ObjectId(id)},
                {
                    "$inc": {"visualizacoes": 1}
                }
            )
            return result.modified_count == 1
        except Exception:
            return False
    
    def get_melhor_resposta(self, mensagem: str) -> Optional[ConhecimentoMatch]:
        """Obtém a melhor resposta para a mensagem dada."""
        resultados = self.buscar_resposta(mensagem, max_resultados=1)
        
        if resultados:
            if resultados[0].conhecimento.id:
                self.incrementar_visualizacao(resultados[0].conhecimento.id)
            return resultados[0]
        
        return None