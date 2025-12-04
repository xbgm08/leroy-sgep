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
        now_plus_15 = now + timedelta(days=15)
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
                                "lotes_acima_90": { 
                                    "$sum": {
                                        "$cond": [
                                            {
                                                "$and": [
                                                    { "$eq": ["$lotes.ativo", True] },
                                                    { "$gt": ["$validade", now_plus_90] }
                                                ]
                                            },
                                            1, 0
                                        ]
                                    }
                                },
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
                                "validade": "$lotes.data_validade"
                            }
                        },
                        { 
                            "$match": { 
                                "validade": { 
                                    "$gte": now,
                                    "$lte": now_plus_15
                                } 
                            } 
                        },
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
                                "local": { "$literal": "" },  
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
                                },
                                "lotes_em_risco_count": {
                                    "$size": {
                                        "$filter": {
                                            "input": { "$ifNull": ["$lotes", []] },
                                            "as": "lote",
                                            "cond": {
                                                "$and": [
                                                    { "$eq": ["$$lote.ativo", True] },
                                                    { "$gte": ["$$lote.data_validade", now] },
                                                    { "$lte": ["$$lote.data_validade", now_plus_90] }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        { "$match": { "falta": { "$gt": 0 } } },
                        {
                            "$addFields": {
                                "tem_risco_vencimento": { "$gt": ["$lotes_em_risco_count", 0] }
                            }
                        },
                        { 
                            "$sort": { 
                                "tem_risco_vencimento": -1,
                                "falta": -1 
                            } 
                        },
                        { "$limit": 10 },
                        {
                            "$project": {
                                "nome": "$nome_produto",
                                "falta_atribuir": "$falta",
                                "reportado": { "$ifNull": ["$estoque_reportado", 1] },
                                "calculado": { "$ifNull": ["$estoque_calculado", 0] },
                                "tem_risco_vencimento": 1
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
            kpis_list = data.get("kpis_gerais", [])
            kpis_data = kpis_list[0] if kpis_list else {}
            
            lotes_list = data.get("lotes_info", [])
            lotes_data = lotes_list[0] if lotes_list else {}
            
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
                acima_90_dias=lotes_data.get("lotes_acima_90", 0),
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
                    ),
                    tem_risco_vencimento=bool(item.get("tem_risco_vencimento", False))
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
    
    def get_product_lote_status(self, nome_produto: str) -> StatusLotesDistribuicao:
        """Calcula a distribuição de status de lotes para um produto específico (Ponderado por Quantidade)."""
        now = datetime.now()
        now_plus_30 = now + timedelta(days=30)
        now_plus_60 = now + timedelta(days=60)
        now_plus_90 = now + timedelta(days=90)

        pipeline = [
            { "$match": { "nome_produto": nome_produto } },
            { "$unwind": "$lotes" },
            { "$match": { "lotes.ativo": True } },
            {
                "$project": {
                    "validade": "$lotes.data_validade",
                    "quantidade": { "$ifNull": ["$lotes.quantidade_lote", 0] } 
                }
            },
            {
                "$group": {
                    "_id": None,
                    "lotes_30_dias": {
                        "$sum": {
                            "$cond": [{ "$and": [{ "$gte": ["$validade", now] }, { "$lte": ["$validade", now_plus_30] }] }, "$quantidade", 0]
                        }
                    },
                    "lotes_60_dias": {
                        "$sum": {
                            "$cond": [{ "$and": [{ "$gt": ["$validade", now_plus_30] }, { "$lte": ["$validade", now_plus_60] }] }, "$quantidade", 0]
                        }
                    },
                    "lotes_90_dias": {
                        "$sum": {
                            "$cond": [{ "$and": [{ "$gt": ["$validade", now_plus_60] }, { "$lte": ["$validade", now_plus_90] }] }, "$quantidade", 0]
                        }
                    },
                    "lotes_acima_90": {
                        "$sum": {
                            "$cond": [{ "$gt": ["$validade", now_plus_90] }, "$quantidade", 0]
                        }
                    }
                }
            }
        ]

        result = list(self.produtos_collection.aggregate(pipeline))
        
        if not result:
            return StatusLotesDistribuicao()

        data = result[0]
        
        return StatusLotesDistribuicao(
            acima_90_dias=int(data.get("lotes_acima_90", 0)),
            em_90_dias=int(data.get("lotes_90_dias", 0)),
            em_60_dias=int(data.get("lotes_60_dias", 0)),
            em_30_dias=int(data.get("lotes_30_dias", 0))
        )