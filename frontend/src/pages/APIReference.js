import React, { useState } from 'react';
import { FaCode, FaServer, FaCopy, FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import '../styles/APIReference.css';

const APIReference = () => {
    const [expandedSection, setExpandedSection] = useState(null);
    const [copiedEndpoint, setCopiedEndpoint] = useState(null);

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

    const apiSections = [
        {
            id: 'produtos',
            title: 'Produtos',
            description: 'Gerenciamento de produtos e estoque',
            endpoints: [
                {
                    method: 'GET',
                    path: '/produtos/',
                    description: 'Lista todos os produtos com estoque calculado',
                    response: {
                        status: 200,
                        body: [
                            {
                                codigo_lm: "12345",
                                ean: "7891234567890",
                                nome_produto: "Produto Exemplo",
                                marca: "Marca X",
                                preco_unit: 99.90,
                                fornecedor_cnpj: "12345678000199",
                                fornecedor_nome: "Fornecedor ABC",
                                estoque_calculado: 100,
                                lotes: []
                            }
                        ]
                    }
                },
                {
                    method: 'GET',
                    path: '/produtos/{codigo_lm}',
                    description: 'Busca um produto específico com seus lotes',
                    params: [{ name: 'codigo_lm', type: 'string', description: 'Código LM do produto' }],
                    response: {
                        status: 200,
                        body: {
                            codigo_lm: "12345",
                            ean: "7891234567890",
                            nome_produto: "Produto Exemplo",
                            marca: "Marca X",
                            preco_unit: 99.90,
                            fornecedor_cnpj: "12345678000199",
                            lotes: [
                                {
                                    id: "507f1f77bcf86cd799439011",
                                    numero_lote: "LT001",
                                    data_validade: "2025-12-31",
                                    quantidade: 50
                                }
                            ]
                        }
                    }
                },
                {
                    method: 'POST',
                    path: '/produtos/',
                    description: 'Cria um novo produto',
                    body: {
                        codigo_lm: "12345",
                        ean: "7891234567890",
                        nome_produto: "Produto Novo",
                        marca: "Marca Y",
                        preco_unit: 149.90,
                        fornecedor_cnpj: "12345678000199"
                    },
                    response: {
                        status: 201,
                        body: {
                            codigo_lm: "12345",
                            message: "Produto criado com sucesso"
                        }
                    }
                },
                {
                    method: 'PUT',
                    path: '/produtos/{codigo_lm}',
                    description: 'Atualiza um produto existente',
                    params: [{ name: 'codigo_lm', type: 'string', description: 'Código LM do produto' }],
                    body: {
                        nome_produto: "Produto Atualizado",
                        marca: "Marca Z",
                        preco_unit: 159.90
                    },
                    response: {
                        status: 200,
                        body: { message: "Produto atualizado com sucesso" }
                    }
                },
                {
                    method: 'DELETE',
                    path: '/produtos/{codigo_lm}',
                    description: 'Remove um produto e todos os seus lotes',
                    params: [{ name: 'codigo_lm', type: 'string', description: 'Código LM do produto' }],
                    response: {
                        status: 204,
                        body: null
                    }
                }
            ]
        },
        {
            id: 'fornecedores',
            title: 'Fornecedores',
            description: 'Gerenciamento de fornecedores',
            endpoints: [
                {
                    method: 'GET',
                    path: '/fornecedores/',
                    description: 'Lista todos os fornecedores cadastrados',
                    response: {
                        status: 200,
                        body: [
                            {
                                cnpj: "12345678000199",
                                nome: "Fornecedor ABC",
                                contato: "contato@fornecedor.com",
                                politica_devolucao: 30,
                                status_forn: true
                            }
                        ]
                    }
                },
                {
                    method: 'GET',
                    path: '/fornecedores/{cnpj}',
                    description: 'Busca um fornecedor específico por CNPJ',
                    params: [{ name: 'cnpj', type: 'string', description: 'CNPJ do fornecedor (apenas números)' }],
                    response: {
                        status: 200,
                        body: {
                            cnpj: "12345678000199",
                            nome: "Fornecedor ABC",
                            contato: "contato@fornecedor.com",
                            politica_devolucao: 30,
                            status_forn: true
                        }
                    }
                },
                {
                    method: 'POST',
                    path: '/fornecedores/',
                    description: 'Cria um novo fornecedor',
                    body: {
                        cnpj: "12345678000199",
                        nome: "Fornecedor Novo",
                        contato: "email@fornecedor.com",
                        politica_devolucao: 45,
                        status_forn: true
                    },
                    response: {
                        status: 201,
                        body: {
                            cnpj: "12345678000199",
                            message: "Fornecedor criado com sucesso"
                        }
                    }
                },
                {
                    method: 'PUT',
                    path: '/fornecedores/{cnpj}',
                    description: 'Atualiza um fornecedor existente',
                    params: [{ name: 'cnpj', type: 'string', description: 'CNPJ do fornecedor (apenas números)' }],
                    body: {
                        nome: "Fornecedor Atualizado",
                        contato: "novo@email.com",
                        politica_devolucao: 60,
                        status_forn: true
                    },
                    response: {
                        status: 200,
                        body: { message: "Fornecedor atualizado com sucesso" }
                    }
                },
                {
                    method: 'DELETE',
                    path: '/fornecedores/{cnpj}',
                    description: 'Remove um fornecedor (se não tiver produtos vinculados)',
                    params: [{ name: 'cnpj', type: 'string', description: 'CNPJ do fornecedor (apenas números)' }],
                    response: {
                        status: 204,
                        body: null
                    }
                }
            ]
        },
        {
            id: 'conhecimento',
            title: 'Base de Conhecimento',
            description: 'Gerenciamento da base de conhecimento do assistente virtual',
            endpoints: [
                {
                    method: 'GET',
                    path: '/base-conhecimento/',
                    description: 'Lista itens da base de conhecimento',
                    params: [
                        { name: 'apenas_ativos', type: 'boolean', description: 'Filtrar apenas ativos (default: true)' }
                    ],
                    response: {
                        status: 200,
                        body: [
                            {
                                id: "507f1f77bcf86cd799439011",
                                titulo: "Como adicionar produto?",
                                resposta: "Para adicionar um produto, acesse a tela de Estoque...",
                                keywords: ["produto", "adicionar", "cadastro"],
                                categoria: "produtos",
                                ativo: true,
                                visualizacoes: 15
                            }
                        ]
                    }
                },
                {
                    method: 'GET',
                    path: '/base-conhecimento/{id}',
                    description: 'Busca um item específico da base de conhecimento',
                    params: [{ name: 'id', type: 'string', description: 'ID do conhecimento (ObjectId do MongoDB)' }],
                    response: {
                        status: 200,
                        body: {
                            id: "507f1f77bcf86cd799439011",
                            titulo: "Como adicionar produto?",
                            resposta: "Para adicionar um produto, acesse a tela de Estoque...",
                            keywords: ["produto", "adicionar", "cadastro"],
                            categoria: "produtos",
                            ativo: true,
                            visualizacoes: 15
                        }
                    }
                },
                {
                    method: 'GET',
                    path: '/base-conhecimento/resposta/melhor',
                    description: 'Retorna a melhor resposta para uma mensagem (score > 70)',
                    params: [
                        { name: 'mensagem', type: 'string', description: 'Pergunta ou mensagem do usuário' }
                    ],
                    response: {
                        status: 200,
                        body: {
                            titulo: "Como adicionar produto?",
                            resposta: "Para adicionar um produto, acesse a tela de Estoque...",
                            score: 85.5,
                            visualizacoes: 16
                        }
                    }
                },
                {
                    method: 'POST',
                    path: '/base-conhecimento/buscar',
                    description: 'Busca múltiplas respostas por similaridade semântica',
                    params: [
                        { name: 'mensagem', type: 'string', description: 'Mensagem para buscar' },
                        { name: 'min_score', type: 'number', description: 'Score mínimo (default: 30.0)' },
                        { name: 'max_resultados', type: 'number', description: 'Máximo de resultados (default: 3)' }
                    ],
                    response: {
                        status: 200,
                        body: [
                            {
                                titulo: "Como adicionar produto?",
                                resposta: "Para adicionar um produto...",
                                score: 85.5,
                                categoria: "produtos"
                            },
                            {
                                titulo: "Como editar produto?",
                                resposta: "Para editar um produto...",
                                score: 72.3,
                                categoria: "produtos"
                            }
                        ]
                    }
                },
                {
                    method: 'POST',
                    path: '/base-conhecimento/',
                    description: 'Cria novo item de conhecimento',
                    body: {
                        titulo: "Como editar fornecedor?",
                        resposta: "Para editar um fornecedor, acesse a tela de Fornecedores...",
                        keywords: ["fornecedor", "editar", "atualizar"],
                        categoria: "fornecedores",
                        ativo: true
                    },
                    response: {
                        status: 201,
                        body: {
                            id: "507f1f77bcf86cd799439011",
                            message: "Conhecimento criado com sucesso"
                        }
                    }
                },
                {
                    method: 'PUT',
                    path: '/base-conhecimento/{id}',
                    description: 'Atualiza item de conhecimento',
                    params: [{ name: 'id', type: 'string', description: 'ID do conhecimento (ObjectId do MongoDB)' }],
                    body: {
                        titulo: "Como editar fornecedor?",
                        resposta: "Resposta atualizada sobre edição de fornecedores...",
                        keywords: ["fornecedor", "editar", "modificar", "alterar"],
                        categoria: "fornecedores",
                        ativo: true
                    },
                    response: {
                        status: 200,
                        body: { message: "Conhecimento atualizado com sucesso" }
                    }
                },
                {
                    method: 'DELETE',
                    path: '/base-conhecimento/{id}',
                    description: 'Remove permanentemente um item de conhecimento',
                    params: [{ name: 'id', type: 'string', description: 'ID do conhecimento (ObjectId do MongoDB)' }],
                    response: {
                        status: 204,
                        body: null
                    }
                }
            ]
        }
    ];

    const toggleSection = (sectionId) => {
        setExpandedSection(expandedSection === sectionId ? null : sectionId);
    };

    const copyToClipboard = (text, endpoint) => {
        navigator.clipboard.writeText(text);
        setCopiedEndpoint(endpoint);
        setTimeout(() => setCopiedEndpoint(null), 2000);
    };

    const getMethodClass = (method) => {
        const classes = {
            'GET': 'api-method-get',
            'POST': 'api-method-post',
            'PUT': 'api-method-put',
            'DELETE': 'api-method-delete'
        };
        return classes[method] || 'api-method-default';
    };

    return (
        <>
            <div className="api-titulo">
                <h2>API Reference</h2>
                <h4>Documentação completa da API do SGEP</h4>
            </div>

            <div className="api-info-card">
                <div className="api-info-header">
                    <FaServer className="api-info-icon" />
                    <div>
                        <h3>Base URL</h3>
                        <code className="api-base-url">{API_BASE_URL}</code>
                    </div>
                </div>
                <p className="api-info-description">
                    Todas as requisições devem ser feitas para esta URL base.
                    Certifique-se de incluir o caminho completo do endpoint.
                </p>
            </div>

            <div className="api-sections">
                {apiSections.map((section) => (
                    <div key={section.id} className="api-section">
                        <div
                            className="api-section-header"
                            onClick={() => toggleSection(section.id)}
                        >
                            <div className="api-section-title">
                                <FaCode />
                                <div>
                                    <h3>{section.title}</h3>
                                    <p>{section.description}</p>
                                </div>
                            </div>
                            {expandedSection === section.id ? <FaChevronUp /> : <FaChevronDown />}
                        </div>

                        {expandedSection === section.id && (
                            <div className="api-endpoints">
                                {section.endpoints.map((endpoint, index) => (
                                    <div key={index} className="api-endpoint">
                                        <div className="api-endpoint-header">
                                            <span className={`api-method ${getMethodClass(endpoint.method)}`}>
                                                {endpoint.method}
                                            </span>
                                            <code className="api-path">{endpoint.path}</code>
                                            <button
                                                className="api-copy-btn"
                                                onClick={() => copyToClipboard(
                                                    `${API_BASE_URL}${endpoint.path}`,
                                                    `${section.id}-${index}`
                                                )}
                                                title="Copiar URL completa"
                                            >
                                                {copiedEndpoint === `${section.id}-${index}` ? (
                                                    <FaCheck />
                                                ) : (
                                                    <FaCopy />
                                                )}
                                            </button>
                                        </div>

                                        <p className="api-endpoint-description">{endpoint.description}</p>

                                        {endpoint.params && (
                                            <div className="api-params">
                                                <h4>Parâmetros:</h4>
                                                <ul>
                                                    {endpoint.params.map((param, pIndex) => (
                                                        <li key={pIndex}>
                                                            <code>{param.name}</code>
                                                            <span className="api-param-type">({param.type})</span>
                                                            {' - '}{param.description}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {endpoint.body && (
                                            <div className="api-request">
                                                <h4>Request Body:</h4>
                                                <pre className="api-code">
                                                    {JSON.stringify(endpoint.body, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        <div className="api-response">
                                            <h4>Response ({endpoint.response.status}):</h4>
                                            {endpoint.response.body ? (
                                                <pre className="api-code">
                                                    {JSON.stringify(endpoint.response.body, null, 2)}
                                                </pre>
                                            ) : (
                                                <p className="api-no-content">No Content</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </>
    );
};

export default APIReference;