# app/services/dashboard_service.py

from pymongo.collection import Collection
from datetime import datetime, timezone, timedelta
from app.models.dashboard import DashboardData, ValorRiscoVencimento
from app.database.client import get_database

class DashboardService:
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        
        # Este serviço só precisa da coleção de produtos
        self.collection: Collection = self.db['produtos']
        
    def get_dashboard_kpis(self) -> DashboardData:
        """
        Calcula todos os KPIs do dashboard em uma única e eficiente
        consulta de agregação ($facet) no MongoDB.
        """
        
        # --- 1. Definir os intervalos de data para o risco ---
        # Usamos datetime.now(timezone.utc)
        now = datetime.now(timezone.utc)
        now_plus_30 = now + timedelta(days=30)
        now_plus_60 = now + timedelta(days=60)
        now_plus_90 = now + timedelta(days=90)

        # --- 2. Construir o Aggregation Pipeline ---
        pipeline = [
            {
                # $facet permite executar múltiplas "sub-queries" de agregação
                # em paralelo sobre os mesmos dados (a coleção 'produtos').
                "$facet": {
                    
                    # Pipeline 1: Calcula o Valor Total Reportado
                    "pipeline_valor_reportado": [
                        {
                            "$group": {
                                "_id": None,
                                "total": {
                                    "$sum": {
                                        # (preco_unit * estoque_reportado)
                                        # Esta é a lógica do seu @computed_field 'valor_estoque_total',
                                        # mas executada dentro do MongoDB.
                                        "$multiply": [
                                            "$preco_unit",
                                            { "$ifNull": ["$estoque_reportado", 0] } # Trata casos onde 'estoque_reportado' é None
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    
                    # Pipeline 2: Calcula os KPIs baseados em Lotes
                    "pipeline_lotes": [
                        { "$unwind": "$lotes" }, # "Desmonta" os lotes em documentos separados
                        
                        {
                            "$addFields": {
                                "lote_data_validade_dt": {
                                    "$toDate": "$lotes.data_validade"
                                }
                            }
                        },

                        # Agora agrupamos todos os lotes
                        {
                            "$group": {
                                "_id": None,
                                
                                # KPI: Valor Total Perdido (Lotes Inativos)
                                "valor_total_perdido": {
                                    "$sum": {
                                        "$cond": [
                                            { "$eq": ["$lotes.ativo", False] }, # SE o lote está inativo (False)
                                            "$lotes.valor_lote",           # ENTÃO soma seu valor
                                            0                                 # SENÃO soma 0
                                        ]
                                    }
                                },

                                # KPI: Risco 0-30 dias
                                "risco_0_30": {
                                    "$sum": {
                                        "$cond": [
                                            { "$and": [
                                                { "$eq": ["$lotes.ativo", True] },
                                                # --- 2. MODIFICADO: Use a nova data convertida ---
                                                { "$gte": ["$lote_data_validade_dt", now] },
                                                { "$lte": ["$lote_data_validade_dt", now_plus_30] }
                                            ]},
                                            "$lotes.valor_lote", 0
                                        ]
                                    }
                                },
                                
                                # KPI: Risco 31-60 dias
                                "risco_31_60": {
                                    "$sum": {
                                        "$cond": [
                                            { "$and": [
                                                { "$eq": ["$lotes.ativo", True] },
                                                # --- 3. MODIFICADO: Use a nova data convertida ---
                                                { "$gt": ["$lote_data_validade_dt", now_plus_30] },
                                                { "$lte": ["$lote_data_validade_dt", now_plus_60] }
                                            ]},
                                            "$lotes.valor_lote", 0
                                        ]
                                    }
                                },
                                
                                # KPI: Risco 61-90 dias
                                "risco_61_90": {
                                    "$sum": {
                                        "$cond": [
                                            { "$and": [
                                                { "$eq": ["$lotes.ativo", True] },
                                                # --- 4. MODIFICADO: Use a nova data convertida ---
                                                { "$gt": ["$lote_data_validade_dt", now_plus_60] },
                                                { "$lte": ["$lote_data_validade_dt", now_plus_90] }
                                            ]},
                                            "$lotes.valor_lote", 0
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]
        
        # --- 3. Executar a Agregação ---
        try:
            result = list(self.collection.aggregate(pipeline))
            
            # O resultado do $facet é um array com um objeto
            if not result:
                raise ValueError("Agregação não retornou resultados.")
            
            data = result[0]
            
            # --- 4. Extrair e Limpar os Resultados ---
            
            # Para 'valor_total_reportado'
            if data["pipeline_valor_reportado"]:
                valor_reportado = data["pipeline_valor_reportado"][0].get("total", 0.0)
            else:
                valor_reportado = 0.0
            
            # Para os KPIs de lote
            if data["pipeline_lotes"]:
                lote_data = data["pipeline_lotes"][0]
                valor_perdido = lote_data.get("valor_total_perdido", 0.0)
                risco_vencimento = ValorRiscoVencimento(
                    dias_0_30=round(lote_data.get("risco_0_30", 0.0), 2),
                    dias_31_60=round(lote_data.get("risco_31_60", 0.0), 2),
                    dias_61_90=round(lote_data.get("risco_61_90", 0.0), 2)
                )
            else:
                valor_perdido = 0.0
                risco_vencimento = ValorRiscoVencimento() # Valores padrão (0.0)
                
            # --- 5. Retornar o modelo Pydantic ---
            return DashboardData(
                valor_total_reportado=round(valor_reportado, 2),
                valor_total_perdido=round(valor_perdido, 2),
                valor_em_risco=risco_vencimento
            )
            
        except Exception as e:
            print(f"Erro ao agregar dados do dashboard: {e}")
            raise