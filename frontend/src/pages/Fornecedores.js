import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import CadastrarFornecedor from '../components/CadastrarFornecedor';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { getFornecedores, deleteFornecedor } from '../api/fornecedorAPI';
import '../styles/Estoque.css';

const Fornecedores = () => {
    const [fornecedores, setFornecedores] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCadastro, setShowCadastro] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [fornecedorToDelete, setFornecedorToDelete] = useState(null);
    const [fornecedorToEdit, setFornecedorToEdit] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarFornecedores();
    }, []);

    const carregarFornecedores = async () => {
        setLoading(true);
        try {
            const data = await getFornecedores();
            setFornecedores(data);
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtrarFornecedores = () => {
        if (!searchTerm.trim()) {
            return fornecedores;
        }

        const termo = searchTerm.toLowerCase();
        return fornecedores.filter(fornecedor =>
            fornecedor.nome.toLowerCase().includes(termo) ||
            fornecedor.cnpj.includes(termo) ||
            (fornecedor.contato && fornecedor.contato.toLowerCase().includes(termo))
        );
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCadastroSuccess = () => {
        setShowCadastro(false);
        setFornecedorToEdit(null);
        carregarFornecedores();
    };

    const handleCloseCadastro = () => {
        setShowCadastro(false);
        setFornecedorToEdit(null);
    };

    const handleOpenCadastro = () => {
        setFornecedorToEdit(null);
        setShowCadastro(true);
    };

    const handleOpenEdicao = (fornecedor) => {
        setFornecedorToEdit(fornecedor);
        setShowCadastro(true);
    };

    const handleOpenDeleteModal = (fornecedor) => {
        setFornecedorToDelete(fornecedor);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setFornecedorToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!fornecedorToDelete) return;

        try {
            await deleteFornecedor(fornecedorToDelete.cnpj);
            setFornecedores(fornecedores.filter(f => f.cnpj !== fornecedorToDelete.cnpj));
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Erro ao deletar fornecedor:', error);
            alert('Erro ao deletar fornecedor. Verifique se não há produtos vinculados.');
        }
    };

    const formatarCNPJ = (cnpj) => {
        if (!cnpj) return '';
        return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    if (loading) {
        return <div>Carregando fornecedores...</div>;
    }

    const fornecedoresFiltrados = filtrarFornecedores();

    return (
        <>
            <div className="titulo">
                <h2>Fornecedores</h2>
                <h4>Aba de Fornecedores</h4>
            </div>

            <button className="fora" onClick={handleOpenCadastro}>
                Cadastrar Fornecedor
            </button>

            <input
                type="text"
                placeholder="Pesquisar por Nome, CNPJ ou Contato..."
                value={searchTerm}
                onChange={handleSearchChange}
            />

            <div className="tabela">
                <table>
                    <thead>
                        <tr>
                            <th>CNPJ</th>
                            <th>Nome</th>
                            <th>Contato</th>
                            <th>Política de Devolução</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {fornecedoresFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    {searchTerm 
                                        ? 'Nenhum fornecedor encontrado com este critério de busca.' 
                                        : 'Nenhum fornecedor cadastrado.'}
                                </td>
                            </tr>
                        ) : (
                            fornecedoresFiltrados.map((fornecedor) => (
                                <tr key={fornecedor.cnpj}>
                                    <td>{formatarCNPJ(fornecedor.cnpj)}</td>
                                    <td>{fornecedor.nome}</td>
                                    <td>{fornecedor.contato || '-'}</td>
                                    <td>{fornecedor.politica_devolucao} dias</td>
                                    <td>
                                        <span className={`cor ${fornecedor.status_forn ? 'verde' : 'vermelho'}`}>
                                            {fornecedor.status_forn ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="container-acoes">
                                            <button 
                                                className="action-button edit" 
                                                title="Editar Fornecedor"
                                                onClick={() => handleOpenEdicao(fornecedor)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className="action-button delete" 
                                                title="Excluir Fornecedor"
                                                onClick={() => handleOpenDeleteModal(fornecedor)}
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showCadastro && (
                <div className="sidebar-overlay" onClick={handleCloseCadastro}>
                    <div className="sidebar-cadastro" onClick={(e) => e.stopPropagation()}>
                        <CadastrarFornecedor
                            onSuccess={handleCadastroSuccess}
                            onClose={handleCloseCadastro}
                            fornecedorToEdit={fornecedorToEdit}
                        />
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja excluir o fornecedor "${fornecedorToDelete?.nome}"? Esta ação não pode ser desfeita.`}
            />
        </>
    );
};

export default Fornecedores;