import React, { useState } from 'react';
import '../styles/Modal.css';
import { FaTimes, FaEdit, FaTrashAlt, FaPlus } from 'react-icons/fa';
import CadastrarLote from './CadastrarLote';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { deleteLote } from '../api/loteAPI';

const LotesModal = ({ isOpen, onClose, produto, onLoteAtualizado }) => {
    const [mostrarCadastro, setMostrarCadastro] = useState(false);
    const [loteParaEditar, setLoteParaEditar] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [loteToDelete, setLoteToDelete] = useState(null);

    if (!isOpen || !produto) {
        return null;
    }

    const formatarData = (dataISO) => {
        const dataObj = new Date(dataISO);
        return new Date(dataObj.getTime() + dataObj.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
    };

    const handleOpenCadastro = () => {
        setLoteParaEditar(null);
        setMostrarCadastro(true);
    };

    const handleOpenEdicao = (lote) => {
        setLoteParaEditar(lote);
        setMostrarCadastro(true);
    };

    const handleCloseCadastro = () => {
        setMostrarCadastro(false);
        setLoteParaEditar(null);
    };

    const handleLoteCadastrado = () => {
        setMostrarCadastro(false);
        setLoteParaEditar(null);
        onLoteAtualizado(); 
    };

    const handleOpenDeleteModal = (lote) => {
        setLoteToDelete(lote);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setLoteToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!loteToDelete) return;

        const success = await deleteLote(produto.codigo_lm, loteToDelete.codigo_lote);

        if (success) {
            alert('Lote excluído com sucesso!');
            onLoteAtualizado();
        } else {
            alert('Erro ao excluir o lote.');
        }

        handleCloseDeleteModal();
    };

    if (mostrarCadastro) {
        return (
            <div className="modal-overlay" onClick={handleCloseCadastro}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <CadastrarLote
                        produto={produto}
                        onLoteCadastrado={handleLoteCadastrado}
                        onClose={handleCloseCadastro}
                        loteParaEditar={loteParaEditar}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Lotes do Produto: {produto.nome_produto}</h2>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button 
                                className="btn-adicionar-lote" 
                                onClick={handleOpenCadastro}
                                title="Adicionar Lote"
                            >
                                <FaPlus /> Adicionar Lote
                            </button>
                            <button className="modal-close-button" onClick={onClose}>
                                <FaTimes />
                            </button>
                        </div>
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
                                            <td>{lote.ativo ? "Ativo" : "Inativo"}</td>
                                            <td>
                                                <div className="modal-container-acoes">
                                                    <button 
                                                        className="modal-action-button edit" 
                                                        title='Editar Lote'
                                                        onClick={() => handleOpenEdicao(lote)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button 
                                                        className="modal-action-button delete" 
                                                        title='Excluir Lote'
                                                        onClick={() => handleOpenDeleteModal(lote)}
                                                        disabled={!lote.ativo}
                                                    >
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

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir o lote "${loteToDelete?.codigo_lote}"? Esta ação irá desativar o lote e ajustar o estoque.`}
            />
        </>
    );
};

export default LotesModal;