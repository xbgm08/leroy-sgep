import pandas as pd
import os
import shutil
import io

from typing import List, Optional
from pymongo.collection import Collection
from pymongo import UpdateOne
from datetime import datetime, timezone
from app.models.produto import Produto, Lote
from app.database.client import get_database
from app.services.fornecedor_service import FornecedorService
from pathlib import Path
from app.configs.config import settings

class ProdutoService:
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        self.collection: Collection = self.db['produtos']
        self.fornecedor_collection: Collection = self.db['fornecedores']
        
    def get_all(self, termo_busca: Optional[str] = None, skip: int = 0, limit: int = 50) -> dict:
        """Retorna todos os produtos cadastrados."""
        query = {}

        if termo_busca:
            regex_term = {"$regex": termo_busca, "$options": "i"}
            or_conditions = [
                {"nome_produto": regex_term},
                {"marca": regex_term},
            ]
            
            if termo_busca.isdigit():
                or_conditions.append({"codigo_lm": int(termo_busca)})
                or_conditions.append({"codigo_lm_str": {"$regex": f"^{termo_busca}", "$options": "i"}})
                or_conditions.append({"ean": int(termo_busca)})
            
            query["$or"] = or_conditions

        total = self.collection.count_documents(query)
        
        cursor = self.collection.find(query).skip(skip)
        
        if limit > 0:
            cursor = cursor.limit(limit)
            
        produtos_data = list(cursor)

        fornecedor_service = FornecedorService()
        todos_fornecedores = fornecedor_service.get_all()
        fornecedor_map = {f.cnpj: f.nome for f in todos_fornecedores}
        
        resultados = []
        for data in produtos_data:
            produto = Produto(**data)
            if produto.fornecedor_cnpj and produto.fornecedor_cnpj in fornecedor_map:
                produto.fornecedor_nome = fornecedor_map[produto.fornecedor_cnpj]
            resultados.append(produto)

        return {
            "produtos": resultados,
            "total": total,
            "skip": skip,
            "limit": limit if limit > 0 else total
        }

    def create(self, produto: Produto) -> Produto:
        """Cria um novo produto."""    
        produto_data = produto.model_dump(exclude={'fornecedor_nome'})
        
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
        
        update_data = produto.model_dump(exclude={'codigo_lm', 'lotes', 'fornecedor_nome'}, exclude_unset=True)
        
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
        
        update_data = lote_update.model_dump(exclude={'codigo_lote', 'fornecedor_nome'}, exclude_unset=True)
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
    
    def importar_produtos_from_excel(self) -> dict:
        """Processa arquivos .xlsx de uma pasta específica para importar produtos em massa."""
        
        # Garante que as pastas de destino existam
        os.makedirs(settings.PROCESSED_FOLDER, exist_ok=True)
        os.makedirs(settings.ERROR_FOLDER, exist_ok=True)
        os.makedirs(settings.PROCESSING_FOLDER, exist_ok=True)

        files_to_process = list(settings.WATCH_FOLDER.glob("*.xlsx"))

        if not files_to_process:
            return {"message": "Nenhum arquivo .xlsx encontrado na pasta 'pendentes'."}

        report = {"arquivos_processados_com_sucesso": [], "arquivos_com_erro": []}

        for file_path in files_to_process:
            processing_file_path = settings.PROCESSING_FOLDER / file_path.name
            try:
                shutil.move(str(file_path), processing_file_path)
            except Exception as move_error:
                report["arquivos_com_erro"].append({
                    "arquivo": file_path.name,
                    "erro": f"Erro CRÍTICO ao mover arquivo para 'processando': {move_error}"
                })
                continue 

            try:
                df = pd.read_excel(processing_file_path, engine='openpyxl')

                colunas_esperadas = ['Material', 'Qtd. Estoque', 'Seção', 'Subseção', 'Estoque Valor', 'Loja']
                if not all(col in df.columns for col in colunas_esperadas):
                    raise ValueError(f"Arquivo fora do formato. Faltando uma das colunas: {colunas_esperadas}")
                
                df = df.dropna(subset=['Material', 'Seção', 'Subseção'])
                df = df[df['Material'].str.strip() != '']
                
                df['codigo_lm_str'] = df['Material'].astype(str).str.slice(0, 8).str.strip()
                df['nome_produto'] = df['Material'].astype(str).str.slice(8).str.strip()
                df['codigo_lm'] = pd.to_numeric(df['codigo_lm_str'], errors='coerce')                
                df['estoque_reportado'] = pd.to_numeric(df['Qtd. Estoque'], errors='coerce').fillna(0).astype(int)
                
                def limpar_valor_monetario(valor) -> float:
                    """Converte uma string monetária para float, tratando vírgulas e pontos."""
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
                        return round(float(resultado_numerico), 2)
                
                df['estoque_valor_float'] = df['Estoque Valor'].apply(limpar_valor_monetario)
                df['preco_unit_calculado'] = 0.0
                mask_estoque_valido = df['estoque_reportado'] > 0
                df.loc[mask_estoque_valido, 'preco_unit_calculado'] = (
                    df['estoque_valor_float'] / df['estoque_reportado']
                ).round(2)
                
                secao_split = df['Seção'].astype(str).str.split(' - ', n=1, expand=True)
                df['cod_secao'] = pd.to_numeric(secao_split[0], errors='coerce')
                df['secao'] = secao_split[1].str.strip()
                
                subsecao_split = df['Subseção'].astype(str).str.split(' - ', n=1, expand=True)
                df['cod_subsecao'] = pd.to_numeric(subsecao_split[0], errors='coerce')
                df['subsecao'] = subsecao_split[1].str.strip()
                
                df = df.dropna(subset=['codigo_lm'])
                df['codigo_lm'] = df['codigo_lm'].astype(int)
                
                df = df.where(pd.notna(df), None)
                
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
    
    def importar_produtos_via_upload(self, file_content: bytes, filename: str) -> dict:
        """Processa um arquivo Excel recebido diretamente via upload (bytes)."""
        try:
            # Lê o Excel diretamente da memória (bytes)
            df = pd.read_excel(io.BytesIO(file_content), engine='openpyxl')
            
            # Validação de colunas
            colunas_esperadas = ['Material', 'Qtd. Estoque', 'Seção', 'Subseção', 'Estoque Valor', 'Loja']
            if not all(col in df.columns for col in colunas_esperadas):
                raise ValueError(f"Arquivo fora do formato. Colunas esperadas: {colunas_esperadas}")
            
            # Limpeza de dados
            df = df.dropna(subset=['Material', 'Seção', 'Subseção'])
            df = df[df['Material'].astype(str).str.strip() != '']
            
            # Extração de código LM e nome do produto
            df['codigo_lm_str'] = df['Material'].astype(str).str.slice(0, 8).str.strip()
            df['nome_produto'] = df['Material'].astype(str).str.slice(8).str.strip().str.lstrip('-').str.strip()
            df['codigo_lm'] = pd.to_numeric(df['codigo_lm_str'], errors='coerce')
            df['estoque_reportado'] = pd.to_numeric(df['Qtd. Estoque'], errors='coerce').fillna(0).astype(int)
            
            # Função para limpar valores monetários
            def limpar_valor_monetario(valor) -> float:
                if pd.isna(valor):
                    return 0.0
                valor_str = str(valor).strip()
                if ',' in valor_str:
                    valor_str = valor_str.replace('.', '').replace(',', '.')
                res = pd.to_numeric(valor_str, errors='coerce')
                return round(float(res), 2) if not pd.isna(res) else 0.0
            
            df['estoque_valor_float'] = df['Estoque Valor'].apply(limpar_valor_monetario)
            
            # Cálculo do preço unitário
            df['preco_unit_calculado'] = 0.0
            mask_valido = df['estoque_reportado'] > 0
            df.loc[mask_valido, 'preco_unit_calculado'] = (
                df['estoque_valor_float'] / df['estoque_reportado']
            ).round(2)
            
            # Processamento de seção e subseção
            secao_split = df['Seção'].astype(str).str.split(' - ', n=1, expand=True)
            df['cod_secao'] = pd.to_numeric(secao_split[0], errors='coerce')
            df['secao'] = secao_split[1].str.strip() if secao_split.shape[1] > 1 else None
            
            subsecao_split = df['Subseção'].astype(str).str.split(' - ', n=1, expand=True)
            df['cod_subsecao'] = pd.to_numeric(subsecao_split[0], errors='coerce')
            df['subsecao'] = subsecao_split[1].str.strip() if subsecao_split.shape[1] > 1 else None
            
            # Limpeza final
            df = df.dropna(subset=['codigo_lm'])
            df['codigo_lm'] = df['codigo_lm'].astype(int)
            df = df.where(pd.notna(df), None)
            
            # Preparação de operações bulk
            operacoes_bulk = []
            for record in df.to_dict("records"):
                filtro = {"codigo_lm": record['codigo_lm']}
                
                # Dados que sempre serão atualizados
                dados_set = {
                    "estoque_reportado": record['estoque_reportado'],
                    "nome_produto": record['nome_produto'],
                    "cod_secao": record.get('cod_secao'),
                    "secao": record.get('secao'),
                    "cod_subsecao": record.get('cod_subsecao'),
                    "subsecao": record.get('subsecao'),
                    "preco_unit": record.get('preco_unit_calculado', 0.0),
                }
                
                # Dados inseridos apenas se for um produto novo
                dados_setOnInsert = {
                    "codigo_lm": record['codigo_lm'],
                    "marca": "Aguardando Cadastro",
                    "ficha_tec": "Aguardando Cadastro",
                    "link_prod": "Aguardando Cadastro",
                    "cor": "Aguardando Cadastro",
                    "avs": False,
                    "estoque_calculado": 0,
                    "lotes": [],
                    "fornecedor_cnpj": "" 
                }
                
                operacoes_bulk.append(
                    UpdateOne(
                        filtro,
                        {"$set": dados_set, "$setOnInsert": dados_setOnInsert},
                        upsert=True
                    )
                )

            if operacoes_bulk:
                resultado = self.collection.bulk_write(operacoes_bulk)
                return {
                    "mensagem": "Importação via upload concluída com sucesso.",
                    "detalhes": {
                        "arquivo": filename,
                        "produtos_criados": resultado.upserted_count,
                        "produtos_atualizados": resultado.modified_count,
                        "total_processados": len(operacoes_bulk)
                    }
                }
            else:
                raise ValueError("Nenhum dado válido encontrado para importar na planilha enviada.")

        except pd.errors.EmptyDataError:
            raise ValueError("Arquivo Excel está vazio.")
        except Exception as e:
            raise ValueError(f"Erro ao processar arquivo de upload: {str(e)}")