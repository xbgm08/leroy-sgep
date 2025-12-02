import React, { useState, useEffect } from 'react';
import { getDashboardData } from '../api/dashboardAPI';
import '../styles/Dashboard.css';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await getDashboardData();
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
        status_lotes_distribuicao = {
            em_90_dias: 0,
            em_60_dias: 0,
            em_30_dias: 0
        },
        produtos_vencimento_proximo = [],
        produtos_falta_lote = []
    } = data;

    const pieData = [
        { name: 'Mais de 90 dias', value: status_lotes_distribuicao.em_90_dias, color: '#4CAF50' },
        { name: 'Entre 31-60 dias', value: status_lotes_distribuicao.em_60_dias, color: '#FFC107' },
        { name: 'Menos de 30 dias', value: status_lotes_distribuicao.em_30_dias, color: '#E53935' }
    ].filter(item => item.value > 0);

    const barData = produtos_falta_lote.slice(0, 10).map(item => ({
        nome: item.nome.length > 25 ? item.nome.substring(0, 22) + '...' : item.nome,
        falta: item.falta_atribuir,
        percentual: item.percentual_concluido
    }));

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
                {/* Valor Total do Estoque */}
                <div className="kpi-card estoque-card">
                    <div className="kpi-header">
                        <h3>Valor Total do Estoque</h3>
                    </div>
                    <div className="kpi-value">{formatCurrency(valor_total_estoque)}</div>
                    <div className="kpi-footer">
                        <span>Valor total do inventário</span>
                    </div>
                </div>

                {/* Lotes Cadastrados */}
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

                {/* Perdas do Estoque */}
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
                <div className="chart-card">
                    <h3>Status dos Lotes</h3>
                    
                    {pieData.length > 0 ? (
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
                                    formatter={(value) => `${value} lotes`}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    height={36}
                                    formatter={(value, entry) => `${entry.payload.name} (${entry.payload.value})`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">
                            <p>Nenhum lote cadastrado no momento</p>
                        </div>
                    )}
                </div>

                {/* Produtos Próximos do Vencimento */}
                <div className="chart-card">
                    <div className="chart-card-header">
                        <h3>Produtos Próximos do Vencimento</h3>
                        {produtos_vencimento_proximo.length > 0 && (
                            <span className="items-badge">{produtos_vencimento_proximo.length} itens</span>
                        )}
                    </div>
                    
                    <div className="produtos-vencimento-list">
                        {produtos_vencimento_proximo.length === 0 ? (
                            <div className="empty-list">
                                <p>✅ Nenhum produto próximo ao vencimento</p>
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

                {/* Falta Atribuir Lote - Gráfico de Barras Horizontais */}
                <div className="chart-card">
                    <h3>Falta Atribuir Lote (Top 10)</h3>
                    <p className="chart-subtitle">Produtos onde o estoque reportado é maior que o cadastrado em lotes</p>
                    
                    {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart
                                data={barData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis type="number" stroke="#666" />
                                <YAxis 
                                    dataKey="nome" 
                                    type="category" 
                                    width={150}
                                    stroke="#666"
                                    style={{ fontSize: '12px' }}
                                />
                                <Tooltip 
                                    formatter={(value, name) => {
                                        if (name === 'falta') return [`${value} unidades`, 'Falta atribuir'];
                                        if (name === 'percentual') return [`${value.toFixed(1)}%`, 'Concluído'];
                                        return value;
                                    }}
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }}
                                />
                                <Bar dataKey="falta" fill="#2196F3" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-chart">
                            <p>✅ Nenhum produto com discrepância de lotes</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;