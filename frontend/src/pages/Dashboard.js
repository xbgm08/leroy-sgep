import React, { useState, useEffect } from 'react';
import { getDashboardData, getProductStatus } from '../api/dashboardAPI';
import '../styles/Dashboard.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TbRefresh, TbAlertTriangle } from 'react-icons/tb';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [loadingChart, setLoadingChart] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getDashboardData();
                setData(result);
                setChartData(result.status_lotes_distribuicao);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleProductClick = async (nomeProduto) => {
        if (selectedProduct === nomeProduto) return;
        
        setLoadingChart(true);
        setSelectedProduct(nomeProduto);
        
        try {
            const statusProduto = await getProductStatus(nomeProduto);
            setChartData(statusProduto);
        } catch (error) {
            console.error("Erro ao carregar status do produto:", error);
        } finally {
            setLoadingChart(false);
        }
    };

    const handleResetFilter = () => {
        setSelectedProduct(null);
        setChartData(data.status_lotes_distribuicao);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Carregando dashboard...</p>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="dashboard-error">
                <p>❌ Erro ao carregar dados do dashboard.</p>
                <button onClick={() => window.location.reload()}>Tentar novamente</button>
            </div>
        );
    }

    const formatCurrency = (val) => (val || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });

    const {
        valor_total_estoque = 0,
        valor_total_perdido = 0,
        estatisticas = {
            total_lotes: 0,
            produtos_em_estoque: 0,
            lotes_perdidos: 0
        },
        produtos_vencimento_proximo = [],
        produtos_falta_lote = []
    } = data;

    const currentDistribution = chartData || { 
        em_30_dias: 0, 
        em_60_dias: 0, 
        em_90_dias: 0, 
        acima_90_dias: 0 
    };

    const pieData = [
        { name: 'Mais de 90 dias', value: currentDistribution.acima_90_dias || 0, color: '#4CAF50' },
        { name: 'Entre 61-90 dias', value: currentDistribution.em_90_dias || 0, color: '#FFEB3B' },
        { name: 'Entre 31-60 dias', value: currentDistribution.em_60_dias || 0, color: '#FFC107' },
        { name: 'Menos de 30 dias', value: currentDistribution.em_30_dias || 0, color: '#E53935' }
    ].filter(item => item.value > 0);

    const totalLotesChart = pieData.reduce((acc, item) => acc + item.value, 0);
    const totalLotesProximoVencimento = (currentDistribution.em_30_dias || 0) + 
                                         (currentDistribution.em_60_dias || 0);
    const percentualRisco = totalLotesChart > 0
        ? ((totalLotesProximoVencimento / totalLotesChart) * 100).toFixed(1)
        : 0;

    const produtosOrdenados = [...produtos_falta_lote]
        .sort((a, b) => {
            if (a.tem_risco_vencimento === b.tem_risco_vencimento) {
                return b.falta_atribuir - a.falta_atribuir;
            }
            return a.tem_risco_vencimento ? -1 : 1;
        })
        .slice(0, 10);

    const getDiasClass = (dias) => {
        if (dias <= 30) return 'vence-critico';
        if (dias <= 60) return 'vence-alerta';
        return 'vence-normal';
    };

    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '14px', fontWeight: 'bold' }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Dashboard</h1>
            </header>

            {/* KPIs Superiores */}
            <div className="kpis-grid">
                <div className="kpi-card estoque-card">
                    <div className="kpi-header">
                        <h3>Valor Total do Estoque</h3>
                    </div>
                    <div className="kpi-value">{formatCurrency(valor_total_estoque)}</div>
                    <div className="kpi-footer">
                        <span>Valor total do inventário</span>
                    </div>
                </div>

                <div className="kpi-card lotes-card">
                    <div className="kpi-header">
                        <h3>Lotes Cadastrados</h3>
                    </div>
                    <div className="kpi-value">{estatisticas.total_lotes}</div>
                    <div className="kpi-footer">
                        <span>Total de lotes no sistema</span>
                        <div className="sub-info">
                            <span>Nº de produtos em estoque</span>
                            <strong>{estatisticas.produtos_em_estoque}</strong>
                        </div>
                    </div>
                </div>

                <div className="kpi-card perdas-card">
                    <div className="kpi-header">
                        <h3>Perdas do Estoque</h3>
                    </div>
                    <div className="kpi-value">{formatCurrency(valor_total_perdido)}</div>
                    <div className="kpi-footer">
                        <span>Valor total em lotes perdidos</span>
                        <div className="sub-info">
                            <span>Lotes perdidos</span>
                            <strong>{estatisticas.lotes_perdidos}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cards Inferiores */}
            <div className="charts-grid">
                {/* Status dos Lotes - Gráfico Pizza */}
                <div className={`chart-card ${selectedProduct ? 'highlight-card' : ''}`}>
                    <div className="chart-card-header">
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <h3>Status dos Lotes</h3>
                            {selectedProduct && (
                                <span style={{ fontSize: '12px', color: '#2196F3', fontWeight: 'bold', marginTop: '4px' }}>
                                    Filtrado: {selectedProduct}
                                </span>
                            )}
                        </div>
                        {selectedProduct && (
                            <button 
                                onClick={handleResetFilter} 
                                className="reset-filter-btn" 
                                title="Voltar para Visão Geral"
                            >
                                <TbRefresh size={20} />
                            </button>
                        )}
                    </div>

                    {loadingChart ? (
                        <div className="chart-loading-overlay">
                            <div className="spinner"></div>
                            <p>Atualizando gráfico...</p>
                        </div>
                    ) : pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={renderCustomLabel}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value) => `${value} ${selectedProduct ? 'unidades' : 'lotes'}`}
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        formatter={(value, entry) => `${entry.payload.name} (${entry.payload.value})`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="status-summary">
                                <div className="summary-item critical">
                                    <span className="summary-label">Em Risco</span>
                                    <span className="summary-value">{totalLotesProximoVencimento}</span>
                                    <span className="summary-detail">{percentualRisco}% do total</span>
                                </div>
                                <div className="summary-divider"></div>
                                <div className="summary-item info">
                                    <span className="summary-label">Total</span>
                                    <span className="summary-value">{totalLotesChart}</span>
                                    <span className="summary-detail">
                                        {selectedProduct ? 'Unidades em estoque' : 'Lotes cadastrados'}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="empty-chart">
                            <p>Nenhum lote encontrado {selectedProduct && 'para este produto'}.</p>
                        </div>
                    )}
                </div>

                {/* Reconciliação de Estoque com Priorização */}
                <div className="chart-card">
                    <h3>Reconciliação de Estoque</h3>
                    <p className="chart-subtitle">Clique em um produto para ver o status dos seus lotes</p>

                    {produtosOrdenados.length > 0 ? (
                        <div className="bar-list">
                            {produtosOrdenados.map((prod, idx) => {
                                const isSelected = selectedProduct === prod.nome;
                                return (
                                    <div
                                        key={idx}
                                        className={`bar-item ${isSelected ? 'selected-item' : ''}`}
                                        onClick={() => handleProductClick(prod.nome)}
                                        style={{
                                            cursor: 'pointer',
                                            borderLeft: prod.tem_risco_vencimento 
                                                ? '4px solid #E53935' 
                                                : (isSelected ? '4px solid #2196F3' : '4px solid transparent'),
                                            backgroundColor: isSelected 
                                                ? '#e3f2fd' 
                                                : (prod.tem_risco_vencimento ? '#fff5f5' : 'white')
                                        }}
                                    >
                                        <div className="bar-header">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {prod.tem_risco_vencimento && (
                                                    <TbAlertTriangle size={16} color="#E53935" />
                                                )}
                                                <span className="bar-name" title={prod.nome}>
                                                    {prod.nome.length > 25 ? prod.nome.substring(0, 22) + '...' : prod.nome}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="progress-track">
                                            <div 
                                                className="progress-fill" 
                                                style={{ width: `${Math.min(100, prod.percentual_concluido)}%` }}
                                            ></div>
                                        </div>
                                        <div className="bar-footer">
                                            <span>{prod.percentual_concluido.toFixed(1)}% Cadastrado</span>
                                            <span className="bar-values">
                                                Falta: <strong>{prod.falta_atribuir}</strong> un
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="empty-chart">
                            <p>✅ Nenhum produto com discrepância de lotes</p>
                        </div>
                    )}
                </div>

                {/* Produtos Próximos do Vencimento */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Produtos Próximos do Vencimento</h3>
                        {produtos_vencimento_proximo.length > 0 && (
                            <span className="items-badge critical-badge">
                                {produtos_vencimento_proximo.length} produtos ≤ 15 dias
                            </span>
                        )}
                    </div>

                    <p className="chart-subtitle">
                        Produtos com vencimento em até 15 dias (urgente)
                    </p>

                    <div className="produtos-vencimento-list">
                        {produtos_vencimento_proximo.length === 0 ? (
                            <div className="empty-list">
                                <p>✅ Nenhum produto vencendo nos próximos 15 dias</p>
                            </div>
                        ) : (
                            produtos_vencimento_proximo.map((produto, idx) => (
                                <div key={idx} className="produto-vencimento-item">
                                    <div className="produto-info">
                                        <h4>{produto.nome_produto}</h4>
                                        <div className="produto-detalhes">
                                            <span>Lote: <strong>{produto.numero_lote}</strong></span>
                                            {produto.categoria && <span>Categoria: <strong>{produto.categoria}</strong></span>}
                                        </div>
                                    </div>
                                    <div className="produto-vencimento">
                                        <div className="vence-label">Vence em</div>
                                        <div className={`dias-badge ${getDiasClass(produto.dias_para_vencer)}`}>
                                            {produto.dias_para_vencer} dias
                                        </div>
                                        <div className="data-vencimento">{produto.data_validade}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;