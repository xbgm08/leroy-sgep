import React from 'react';
import '../styles/Modal.css';
import { FaTimes } from 'react-icons/fa';

const DetalheProdutoModal = ({ isOpen, onClose, produto }) => {
    if (!isOpen || !produto) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Detalhes do Produto</h2>
                    <button className="modal-close" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-body">
                    <div className="detalhe-section">
                        <h3>Informações Básicas</h3>
                        <div className="detalhe-grid">
                            <div className="detalhe-item">
                                <label>Nome do Produto:</label>
                                <span>{produto.nome_produto}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Código LM:</label>
                                <span>{produto.codigo_lm}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>EAN:</label>
                                <span>{produto.ean || 'N/A'}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Marca:</label>
                                <span>{produto.marca}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Cor:</label>
                                <span>{produto.cor || 'N/A'}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>AVS:</label>
                                <span className={produto.avs ? 'badge-avs-sim' : 'badge-avs-nao'}>
                                    {produto.avs ? 'Sim' : 'Não'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="detalhe-section">
                        <h3>Categorização</h3>
                        <div className="detalhe-grid">
                            <div className="detalhe-item">
                                <label>Seção:</label>
                                <span>{produto.secao || 'N/A'}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Código da Seção:</label>
                                <span>{produto.cod_secao || 'N/A'}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Subseção:</label>
                                <span>{produto.subsecao || 'N/A'}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Código da Subseção:</label>
                                <span>{produto.cod_subsecao || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detalhe-section">
                        <h3>Estoque e Valores</h3>
                        <div className="detalhe-grid">
                            <div className="detalhe-item">
                                <label>Preço Unitário:</label>
                                <span>R$ {produto.preco_unit?.toFixed(2)}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Estoque Calculado:</label>
                                <span>{produto.estoque_calculado}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Estoque Reportado:</label>
                                <span>{produto.estoque_reportado || 'N/A'}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>Valor Total em Estoque:</label>
                                <span>R$ {(produto.preco_unit * produto.estoque_calculado)?.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detalhe-section">
                        <h3>Fornecedor</h3>
                        <div className="detalhe-grid">
                            <div className="detalhe-item">
                                <label>Nome:</label>
                                <span>{produto.fornecedor_nome || 'N/A'}</span>
                            </div>
                            <div className="detalhe-item">
                                <label>CNPJ:</label>
                                <span>{produto.fornecedor_cnpj}</span>
                            </div>
                        </div>
                    </div>

                    <div className="detalhe-section">
                        <h3>Links e Documentação</h3>
                        <div className="detalhe-links">
                            <div className="detalhe-item">
                                <label>Link do Produto:</label>
                                {produto.link_prod ? (
                                    <a href={produto.link_prod} target="_blank" rel="noopener noreferrer" className="link-externo">
                                        Abrir Link do Produto
                                    </a>
                                ) : (
                                    <span>N/A</span>
                                )}
                            </div>
                            <div className="detalhe-item">
                                <label>Ficha Técnica:</label>
                                {produto.ficha_tec ? (
                                    <a href={produto.ficha_tec} target="_blank" rel="noopener noreferrer" className="link-externo">
                                        Abrir Ficha Técnica
                                    </a>
                                ) : (
                                    <span>N/A</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="botao" type="button" onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetalheProdutoModal;