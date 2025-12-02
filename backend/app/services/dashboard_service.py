from typing import List
from pymongo.collection import Collection
from datetime import datetime, timedelta

from app.models.dashboard import (
    DashboardData, 
    ValorRiscoVencimento,
    StatusLotesDistribuicao,
    ProdutoVencimentoProximo,
    ProdutoFaltanteLote,
    EstatisticasEstoque
)
from app.database.client import get_database

class DashboardService:
    """Serviço para cálculo de KPIs e métricas do dashboard."""
    
    def __init__(self):
        self.db = get_database()
        if self.db is None:
            raise ConnectionError("Falha na conexão com o MongoDB.")
        self.produtos_collection: Collection = self.db['produtos']
    
    def get_dashboard_kpis(self) -> DashboardData:
        """
        Calcula todos os KPIs do dashboard em uma única agregação otimizada.
        
        Returns:
            DashboardData: Objeto com todos os KPIs calculados
        """
        now = datetime.now()
        now_plus_30 = now + timedelta(days=30)
        now_plus_60 = now + timedelta(days=60)
        now_plus_90 = now + timedelta(days=90)

        pipeline = [
            {
                "$facet": {
                    # 1. KPIs Gerais
                    "kpis_gerais": [
                        {
                            "$group": {
                                "_id": None,
                                "total_produtos": { "$sum": 1 },
                                "produtos_em_estoque": {
                                    "$sum": { "$cond": [{ "$gt": ["$estoque_reportado", 0] }, 1, 0] }
                                },
                                "valor_total": {
                                    "$sum": { "$multiply": ["$preco_unit", { "$ifNull": ["$estoque_reportado", 0] }] }
                                }
                            }
                        }
                    ],
                    
                    # 2. Lotes e Perdas
                    "lotes_info": [
                        { "$unwind": { "path": "$lotes", "preserveNullAndEmptyArrays": False } },
                        {
                            "$addFields": {
                                "validade": "$lotes.data_validade",
                                "valor_lote": { "$multiply": ["$preco_unit", "$lotes.quantidade_lote"] }
                            }
                        },
                        {
                            "$group": {
                                "_id": None,
                                "total_lotes": { "$sum": 1 },
                                "lotes_perdidos": {
                                    "$sum": { "$cond": [{ "$eq": ["$lotes.ativo", False] }, 1, 0] }
                                },
                                "valor_perdido": {
                                    "$sum": { "$cond": [{ "$eq": ["$lotes.ativo", False] }, "$valor_lote", 0] }
                                },
                                # Contagem para gráfico pizza
                                "lotes_30_dias": {
                                    "$sum": {
                                        "$cond": [
                                            {
                                                "$and": [
                                                    { "$eq": ["$lotes.ativo", True] },
                                                    { "$gte": ["$validade", now] },
                                                    { "$lte": ["$validade", now_plus_30] }
                                                ]
                                            },
                                            1, 0
                                        ]
                                    }
                                },
                                "lotes_60_dias": {
                                    "$sum": {
                                        "$cond": [
                                            {
                                                "$and": [
                                                    { "$eq": ["$lotes.ativo", True] },
                                                    { "$gt": ["$validade", now_plus_30] },
                                                    { "$lte": ["$validade", now_plus_60] }
                                                ]
                                            },
                                            1, 0
                                        ]
                                    }
                                },
                                "lotes_90_dias": {
                                    "$sum": {
                                        "$cond": [
                                            {
                                                "$and": [
                                                    { "$eq": ["$lotes.ativo", True] },
                                                    { "$gt": ["$validade", now_plus_60] },
                                                    { "$lte": ["$validade", now_plus_90] }
                                                ]
                                            },
                                            1, 0
                                        ]
                                    }
                                },
                                # Valores em risco
                                "risco_0_30": {
                                    "$sum": {
                                        "$cond": [
                                            {
                                                "$and": [
                                                    { "$eq": ["$lotes.ativo", True] },
                                                    { "$gte": ["$validade", now] },
                                                    { "$lte": ["$validade", now_plus_30] }
                                                ]
                                            },
                                            "$valor_lote", 0
                                        ]
                                    }
                                },
                                "risco_31_60": {
                                    "$sum": {
                                        "$cond": [
                                            {
                                                "$and": [
                                                    { "$eq": ["$lotes.ativo", True] },
                                                    { "$gt": ["$validade", now_plus_30] },
                                                    { "$lte": ["$validade", now_plus_60] }
                                                ]
                                            },
                                            "$valor_lote", 0
                                        ]
                                    }
                                },
                                "risco_61_90": {
                                    "$sum": {
                                        "$cond": [
                                            {
                                                "$and": [
                                                    { "$eq": ["$lotes.ativo", True] },
                                                    { "$gt": ["$validade", now_plus_60] },
                                                    { "$lte": ["$validade", now_plus_90] }
                                                ]
                                            },
                                            "$valor_lote", 0
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    
                    # 3. Top 5 Produtos Próximos ao Vencimento
                    "vencimentos_proximos": [
                        { "$unwind": { "path": "$lotes", "preserveNullAndEmptyArrays": False } },
                        { "$match": { "lotes.ativo": True } },
                        {
                            "$addFields": {
                                # ✅ CORREÇÃO: Remover $dateFromString pois já é datetime
                                "validade": "$lotes.data_validade"
                            }
                        },
                        { "$match": { "validade": { "$gte": now } } },
                        {
                            "$addFields": {
                                "dias_para_vencer": {
                                    "$toInt": {
                                        "$divide": [
                                            { "$subtract": ["$validade", now] },
                                            86400000
                                        ]
                                    }
                                }
                            }
                        },
                        { "$sort": { "dias_para_vencer": 1 } },
                        { "$limit": 5 },
                        {
                            "$project": {
                                "codigo_lm": 1,
                                "nome_produto": 1,
                                "codigo_lote": "$lotes.codigo_lote",
                                "local": { "$literal": "" },  # ✅ Campo não existe no modelo atual
                                "categoria": { "$ifNull": ["$secao", ""] },
                                "data_validade": {
                                    "$dateToString": {
                                        "format": "%Y-%m-%d",
                                        "date": "$lotes.data_validade"
                                    }
                                },
                                "dias_para_vencer": 1
                            }
                        }
                    ],
                    
                    # 4. Top 10 Produtos Falta Atribuir Lote
                    "falta_lote": [
                        {
                            "$addFields": {
                                "falta": {
                                    "$subtract": [
                                        { "$ifNull": ["$estoque_reportado", 0] },
                                        { "$ifNull": ["$estoque_calculado", 0] }
                                    ]
                                }
                            }
                        },
                        { "$match": { "falta": { "$gt": 0 } } },
                        { "$sort": { "falta": -1 } },
                        { "$limit": 10 },
                        {
                            "$project": {
                                "nome": "$nome_produto",
                                "falta_atribuir": "$falta",
                                "reportado": { "$ifNull": ["$estoque_reportado", 1] },
                                "calculado": { "$ifNull": ["$estoque_calculado", 0] }
                            }
                        }
                    ]
                }
            }
        ]
        
        try:
            result = list(self.produtos_collection.aggregate(pipeline))
            
            if not result:
                return self._dados_vazios()
            
            data = result[0]
            
            # Processa KPIs Gerais
            kpis_data = data.get("kpis_gerais", [{}])[0]
            lotes_data = data.get("lotes_info", [{}])[0]
            
            estatisticas = EstatisticasEstoque(
                total_produtos=kpis_data.get("total_produtos", 0),
                total_lotes=lotes_data.get("total_lotes", 0),
                produtos_em_estoque=kpis_data.get("produtos_em_estoque", 0),
                lotes_perdidos=lotes_data.get("lotes_perdidos", 0)
            )
            
            # Valores em Risco
            valor_em_risco = ValorRiscoVencimento(
                dias_0_30=round(lotes_data.get("risco_0_30", 0.0), 2),
                dias_31_60=round(lotes_data.get("risco_31_60", 0.0), 2),
                dias_61_90=round(lotes_data.get("risco_61_90", 0.0), 2)
            )
            
            # Distribuição Status Lotes (para gráfico pizza)
            status_distribuicao = StatusLotesDistribuicao(
                em_90_dias=lotes_data.get("lotes_90_dias", 0),
                em_60_dias=lotes_data.get("lotes_60_dias", 0),
                em_30_dias=lotes_data.get("lotes_30_dias", 0)
            )
            
            # Produtos Próximos ao Vencimento
            produtos_proximos = [
                ProdutoVencimentoProximo(
                    codigo_lm=str(item["codigo_lm"]),
                    nome_produto=item["nome_produto"],
                    numero_lote=item["codigo_lote"],
                    local=item.get("local", ""),
                    categoria=item.get("categoria", ""),
                    data_validade=item["data_validade"],
                    dias_para_vencer=item["dias_para_vencer"]
                )
                for item in data.get("vencimentos_proximos", [])
            ]
            
            # Produtos Falta Lote
            produtos_falta = [
                ProdutoFaltanteLote(
                    nome=item["nome"],
                    falta_atribuir=item["falta_atribuir"],
                    percentual_concluido=round(
                        (item["calculado"] / item["reportado"]) * 100 if item["reportado"] > 0 else 0,
                        1
                    )
                )
                for item in data.get("falta_lote", [])
            ]
            
            return DashboardData(
                valor_total_estoque=round(kpis_data.get("valor_total", 0.0), 2),
                valor_total_perdido=round(lotes_data.get("valor_perdido", 0.0), 2),
                estatisticas=estatisticas,
                valor_em_risco=valor_em_risco,
                status_lotes_distribuicao=status_distribuicao,
                produtos_vencimento_proximo=produtos_proximos,
                produtos_falta_lote=produtos_falta
            )
            
        except Exception as e:
            print(f"Erro ao calcular KPIs do dashboard: {e}")
            raise
    
    def _dados_vazios(self) -> DashboardData:
        """Retorna estrutura vazia de dados."""
        return DashboardData(
            valor_total_estoque=0.0,
            valor_total_perdido=0.0,
            estatisticas=EstatisticasEstoque(),
            valor_em_risco=ValorRiscoVencimento(),
            status_lotes_distribuicao=StatusLotesDistribuicao(),
            produtos_vencimento_proximo=[],
            produtos_falta_lote=[]
        )