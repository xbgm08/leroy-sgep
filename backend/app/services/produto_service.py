from typing import List, Optional
from pymongo.collection import Collection
from pymongo import UpdateOne
from datetime import datetime, timezone
from app.models.produto import Produto, Lote
from app.database.client import get_database
import pandas as pd
import os
import shutil
from pathlib import Path

class ProdutoService:
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        
        #Coleções
        self.collection: Collection = self.db['produtos']
        self.fornecedor_collection: Collection = self.db['fornecedores']

        #indices
        self.collection.create_index("codigo_lm", unique=True)
        self.collection.create_index("lotes.codigo_lote", unique=True, sparse=True)
        self.collection.create_index([("nome_produto", "text")]) # Para busca por nome

        # --- CAMINHOS ---
        
        base_path_str = os.getenv("BASE_IMPORT_PATH", "C:/importar")
        
        watch_folder_str = os.getenv(
            "IMPORT_WATCH_FOLDER", 
            os.path.join(base_path_str, "pendentes")
        )
        processed_folder_str = os.getenv(
            "IMPORT_PROCESSED_FOLDER", 
            os.path.join(base_path_str, "processados")
        )
        error_folder_str = os.getenv(
            "IMPORT_ERROR_FOLDER", 
            os.path.join(base_path_str, "erros")
        )
        
        processing_folder_str = os.path.join(base_path_str, "processando")

        self.WATCH_FOLDER = Path(watch_folder_str)
        self.PROCESSED_FOLDER = Path(processed_folder_str)
        self.ERROR_FOLDER = Path(error_folder_str)
        self.PROCESSING_FOLDER = Path(processing_folder_str)
        
    def get_all(self, nome_produto: Optional[str] = None, skip: int = 0, limit: int = 10) -> List[Produto]:
        query = {}
        if nome_produto:
            query["nome_produto"] = {"$regex": nome_produto, "$options": "i"}
        produtos_data = list(self.collection.find(query).skip(skip).limit(limit))
        return [Produto(**data) for data in produtos_data]

    def create(self, produto: Produto) -> Produto:
        if self.collection.find_one({"codigo_lm": produto.codigo_lm}):
            raise ValueError(f"Produto com código LM {produto.codigo_lm} já existe.")
        if produto.fornecedor_id and produto.fornecedor_id > 0:
            if not self.fornecedor_collection.find_one({"id_fornecedor": produto.fornecedor_id}):
                raise ValueError(f"Fornecedor com ID {produto.fornecedor_id} não encontrado.")
        else:
            produto.fornecedor_id = None
        produto_data = produto.model_dump()
        self.collection.insert_one(produto_data)
        return produto

    def get_by_codigo_lm(self, codigo_lm: int) -> Optional[Produto]:
        produto_data = self.collection.find_one({"codigo_lm": codigo_lm})
        if produto_data:
            return Produto(**produto_data)
        return None

    def adicionar_lote(self, codigo_lm: int, lote: Lote) -> Optional[Produto]:
        """Adiciona um novo lote, calculando seu valor de estoque."""
        
        # buscar o produto primeiro para obter o preco_unit
        produto_atual = self.get_by_codigo_lm(codigo_lm)
        if not produto_atual:
            return None # Produto não encontrado

        #Validação de lote duplicado
        if self.collection.find_one({"lotes.codigo_lote": lote.codigo_lote}):
            raise ValueError(f"Lote com código {lote.codigo_lote} já existe.")
            
        # Calcular o valor_lote
        # Usa o preco_unit do produto pai e a quantidade do novo lote
        lote.valor_lote = round(produto_atual.preco_unit * lote.quantidade_lote, 2)
        
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
        """Atualiza os dados de um produto e recalcula o valor dos lotes se o preço mudar."""
        
        produto_atual = self.get_by_codigo_lm(codigo_lm)
        if not produto_atual:
            return None
        
        update_data = produto.model_dump(exclude={'codigo_lm', 'lotes'}, exclude_unset=True)
        
        if "preco_unit" in update_data and update_data["preco_unit"] != produto_atual.preco_unit:
            novo_preco_unit = update_data["preco_unit"]
            novos_lotes_data = [] # Vamos recriar o array de lotes
            
            # Itera nos lotes que já existem no banco
            for lote_existente in produto_atual.lotes:
                # Recalcula o valor de cada lote
                lote_existente.valor_lote = round(novo_preco_unit * lote_existente.quantidade_lote, 2)
                novos_lotes_data.append(lote_existente.model_dump())
            
            # Adiciona o array de lotes (com valores atualizados) ao $set
            update_data["lotes"] = novos_lotes_data
        
        result = self.collection.update_one(
            {"codigo_lm": codigo_lm},
            {"$set": update_data}
        )
        
        if result.matched_count == 1:
            return self.get_by_codigo_lm(codigo_lm)
            
        return None

    def delete(self, codigo_lm: int) -> bool:
        # ... (este método não muda)
        result = self.collection.delete_one({"codigo_lm": codigo_lm})
        return result.deleted_count == 1

    def update_lote(self, codigo_lm: int, codigo_lote: str, lote_update: Lote) -> Optional[Produto]:
        """
        Atualiza um lote e recalcula o estoque E o valor do lote.
        """
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
        
        # Usa o preco_unit do produto pai e a nova quantidade do lote
        update_data["valor_lote"] = round(produto_atual.preco_unit * lote_update.quantidade_lote, 2)
        
        set_fields = {f"lotes.$.{key}": value for key, value in update_data.items()}

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

    def deletar_lote(self, codigo_lm: int, codigo_lote: str) -> bool:
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
                    "lotes.$.data_atualizacao_ativo": datetime.now(timezone.utc)
                },
                "$inc": {"estoque_calculado": -quantidade_a_subtrair}
            }
        )
        return result.modified_count == 1
    

    def importar_produtos_from_excel(self) -> dict:
        """
        Lê TODOS os arquivos .xlsx da pasta "pendentes", processa-os (calculando
        o preco_unit) e os move para "processados" ou "erros".
        """
        
        os.makedirs(self.PROCESSED_FOLDER, exist_ok=True)
        os.makedirs(self.ERROR_FOLDER, exist_ok=True)
        os.makedirs(self.PROCESSING_FOLDER, exist_ok=True)

        files_to_process = list(self.WATCH_FOLDER.glob("*.xlsx"))

        if not files_to_process:
            return {"message": "Nenhum arquivo .xlsx encontrado na pasta 'pendentes'."}

        report = {"arquivos_processados_com_sucesso": [], "arquivos_com_erro": []}

        for file_path in files_to_process:
            
            processing_file_path = self.PROCESSING_FOLDER / file_path.name
            try:
                shutil.move(str(file_path), processing_file_path)
            except Exception as move_error:
                # ... (lógica de erro de 'move' não muda)
                report["arquivos_com_erro"].append({
                    "arquivo": file_path.name,
                    "erro": f"Erro CRÍTICO ao mover arquivo para 'processando': {move_error}"
                })
                continue 

            try:
                # --- EXTRAIR ---
                df = pd.read_excel(processing_file_path, engine='openpyxl')

                # --- TRANSFORMAR ---
                
                colunas_esperadas = ['Material', 'Qtd. Estoque', 'Seção', 'Subseção', 'Estoque Valor', 'Loja']
                if not all(col in df.columns for col in colunas_esperadas):
                    raise ValueError(f"Arquivo fora do formato. Faltando uma das colunas: {colunas_esperadas}")
                
                df = df.dropna(subset=['Material', 'Seção', 'Subseção'])
                df = df[df['Material'].str.strip() != '']
                
                # ... (Tratamento de Material, Qtd. Estoque não muda)
                df['codigo_lm_str'] = df['Material'].astype(str).str.slice(0, 8).str.strip()
                df['nome_produto'] = df['Material'].astype(str).str.slice(8).str.strip()
                df['codigo_lm'] = pd.to_numeric(df['codigo_lm_str'], errors='coerce')
                df['estoque_reportado'] = pd.to_numeric(df['Qtd. Estoque'], errors='coerce').fillna(0).astype(int)
                
                
                def limpar_valor_monetario(valor) -> float:
                    """
                    Converte uma string/float monetário (ex: "10.216,62" ou 18.9999) 
                    para um float arredondado a 2 casas decimais.
                    """
                    if pd.isna(valor):
                        return 0.0
                    
                    valor_str = str(valor).strip()
                    
                    if ',' in valor_str:
                        valor_str = valor_str.replace('.', '', regex=False)
                        valor_str = valor_str.replace(',', '.', regex=False)
                    
                    resultado_numerico = pd.to_numeric(valor_str, errors='coerce')
                    
                    if pd.isna(resultado_numerico):
                        return 0.0
                    else:
                        # Arredonda o valor para 2 casas decimais ANTES de retornar
                        return round(float(resultado_numerico), 2)
                
                # Aplica a nova função de limpeza
                df['estoque_valor_float'] = df['Estoque Valor'].apply(limpar_valor_monetario)
                
                

                # Cálculo do preco_unit (já estava a arredondar, o que é ótimo)
                df['preco_unit_calculado'] = 0.0
                mask_estoque_valido = df['estoque_reportado'] > 0
                df.loc[mask_estoque_valido, 'preco_unit_calculado'] = (
                    df['estoque_valor_float'] / df['estoque_reportado']
                ).round(2)
                
                # ... (Tratamento de Seção, Subseção, Filtro final e Nulos não muda)
                secao_split = df['Seção'].astype(str).str.split(' - ', n=1, expand=True)
                df['cod_secao'] = pd.to_numeric(secao_split[0], errors='coerce')
                df['secao'] = secao_split[1].str.strip()
                
                subsecao_split = df['Subseção'].astype(str).str.split(' - ', n=1, expand=True)
                df['cod_subsecao'] = pd.to_numeric(subsecao_split[0], errors='coerce')
                df['subsecao'] = subsecao_split[1].str.strip()
                
                df = df.dropna(subset=['codigo_lm'])
                df['codigo_lm'] = df['codigo_lm'].astype(int)
                df = df.where(pd.notna(df), None)
                
                
                # --- CARREGAR ---
                operacoes_bulk = []
                for record in df.to_dict("records"):
                    
                    filtro = {"codigo_lm": record['codigo_lm']}
                    
                    dados_set = {
                        "estoque_reportado": record['estoque_reportado'],
                        "nome_produto": record['nome_produto'],
                        "cod_secao": record.get('cod_secao'),
                        "secao": record.get('secao'),
                        "cod_subsecao": record.get('cod_subsecao'),
                        "subsecao": record.get('subsecao'),
                        
                        # O preco_unit que vai para o $set já vem arredondado
                        "preco_unit": record.get('preco_unit_calculado', 0.0) 
                    }
                    
                    dados_setOnInsert = {
                        "codigo_lm": record['codigo_lm'],
                        "marca": "Aguardando Cadastro",
                        "ficha_tec": "Aguardando Cadastro",
                        "link_prod": "Aguardando Cadastro",
                        "cor": "Aguardando Cadastro",
                        "avs": False,
                        "ativo": True,
                        "total_estoque": 0,
                        "lotes": []
                    }
                    
                    update_op = {
                        "$set": dados_set,
                        "$setOnInsert": dados_setOnInsert
                    }
                    operacoes_bulk.append(UpdateOne(filtro, update_op, upsert=True))

                if not operacoes_bulk:
                    raise ValueError("Nenhum dado válido encontrado dentro da planilha.")

                resultado = self.collection.bulk_write(operacoes_bulk)
                
                shutil.move(str(processing_file_path), self.PROCESSED_FOLDER / processing_file_path.name)
                report["arquivos_processados_com_sucesso"].append({
                    "arquivo": processing_file_path.name,
                    "produtos_criados": resultado.upserted_count,
                    "produtos_atualizados": resultado.modified_count
                })

            except Exception as e:
                try:
                    shutil.move(str(processing_file_path), self.ERROR_FOLDER / processing_file_path.name)
                    report["arquivos_com_erro"].append({
                        "arquivo": processing_file_path.name,
                        "erro": str(e)
                    })
                except Exception as move_error:
                    report["arquivos_com_erro"].append({
                        "arquivo": processing_file_path.name,
                        "erro": f"Erro ao processar: {e}. Erro ao mover para 'erros': {move_error}"
                    })
        
        return report