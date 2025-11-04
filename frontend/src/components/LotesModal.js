import React from 'react';
import '../styles/Modal.css';
import { FaTimes, FaEdit, FaTrashAlt } from 'react-icons/fa';

const LotesModal = ({ isOpen, onClose, produto }) => {
    if (!isOpen || !produto) {
        return null;
    }

    const formatarData = (dataISO) => {
        const dataObj = new Date(dataISO);
        return new Date(dataObj.getTime() + dataObj.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Lotes do Produto: {produto.nome_produto}</h2>
                    <button className="modal-close-button" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    <table>
                        <thead>
                            <tr>
                                <th>Cód. Lote</th>
                                <th>Qtd.</th>
                                <th>Data de Fabricação</th>
                                <th>Data de Validade</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {produto.lotes.length === 0 ? (
                                <tr>
                                    <td colSpan="6">Este produto não possui lotes cadastrados.</td>
                                </tr>
                            ) : (
                                produto.lotes.map((lote) => (
                                    <tr key={lote.codigo_lote}>
                                        <td>{lote.codigo_lote}</td>
                                        <td>{lote.quantidade_lote}</td>
                                        <td>{formatarData(lote.data_fabricacao)}</td>
                                        <td>{formatarData(lote.data_validade)}</td>
                                        <td>{lote.status}</td>
                                        <td>
                                            <div className="modal-container-acoes">
                                                <button className="modal-action-button edit" title='Editar Lote'>
                                                    <FaEdit />
                                                </button>
                                                <button className="modal-action-button delete" title='Excluir Lote'>
                                                    <FaTrashAlt />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LotesModal;