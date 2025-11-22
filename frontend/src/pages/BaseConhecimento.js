import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import CadastrarConhecimento from '../components/CadastrarConhecimento';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { listarConhecimentos, deletarConhecimento } from '../api/conhecimentoAPI';
import '../styles/BaseConhecimento.css';

const BaseConhecimento = () => {
    const [conhecimentos, setConhecimentos] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCadastro, setShowCadastro] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [conhecimentoToDelete, setConhecimentoToDelete] = useState(null);
    const [conhecimentoToEdit, setConhecimentoToEdit] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filtroCategoria, setFiltroCategoria] = useState('todas');
    const [filtroAtivo, setFiltroAtivo] = useState('todos');

    useEffect(() => {
        carregarConhecimentos();
    }, []);

    const carregarConhecimentos = async () => {
        setLoading(true);
        try {
            const data = await listarConhecimentos(false); 
            setConhecimentos(data);
        } catch (error) {
            console.error('Erro ao carregar base de conhecimento:', error);
        } finally {
            setLoading(false);
        }
    };

    const filtrarConhecimentos = () => {
        let filtered = conhecimentos;

        if (searchTerm.trim()) {
            const termo = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.titulo.toLowerCase().includes(termo) ||
                item.resposta.toLowerCase().includes(termo) ||
                item.keywords.some(k => k.toLowerCase().includes(termo)) ||
                (item.categoria && item.categoria.toLowerCase().includes(termo))
            );
        }

        if (filtroCategoria !== 'todas') {
            filtered = filtered.filter(item => item.categoria === filtroCategoria);
        }

        if (filtroAtivo !== 'todos') {
            const isAtivo = filtroAtivo === 'ativos';
            filtered = filtered.filter(item => item.ativo === isAtivo);
        }

        return filtered;
    };

    const obterCategorias = () => {
        const categorias = new Set(conhecimentos.map(item => item.categoria).filter(Boolean));
        return Array.from(categorias).sort();
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleCadastroSuccess = () => {
        setShowCadastro(false);
        setConhecimentoToEdit(null);
        carregarConhecimentos();
    };

    const handleCloseCadastro = () => {
        setShowCadastro(false);
        setConhecimentoToEdit(null);
    };

    const handleOpenCadastro = () => {
        setConhecimentoToEdit(null);
        setShowCadastro(true);
    };

    const handleOpenEdicao = (conhecimento) => {
        setConhecimentoToEdit(conhecimento);
        setShowCadastro(true);
    };

    const handleOpenDeleteModal = (conhecimento) => {
        setConhecimentoToDelete(conhecimento);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => {
        setShowDeleteModal(false);
        setConhecimentoToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!conhecimentoToDelete) return;

        try {
            await deletarConhecimento(conhecimentoToDelete.id);
            setConhecimentos(conhecimentos.filter(item => item.id !== conhecimentoToDelete.id));
            handleCloseDeleteModal();
        } catch (error) {
            console.error('Erro ao deletar conhecimento:', error);
            alert('Erro ao deletar item da base de conhecimento.');
        }
    };

    if (loading) {
        return <div>Carregando base de conhecimento...</div>;
    }

    const conhecimentosFiltrados = filtrarConhecimentos();
    const categorias = obterCategorias();

    return (
        <>
            <div className="conhecimento-titulo">
                <h2>Base de Conhecimento</h2>
                <h4>Gerenciamento de FAQs e Respostas do Assistente Virtual</h4>
            </div>

            <button className="conhecimento-btn-cadastrar" onClick={handleOpenCadastro}>
                Cadastrar Conhecimento
            </button>

            <div className="conhecimento-filtros">
                <input
                    type="text"
                    placeholder="Pesquisar por título, resposta, palavras-chave ou categoria..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                />

                <select 
                    value={filtroCategoria} 
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                >
                    <option value="todas">Todas Categorias</option>
                    {categorias.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>

                <select 
                    value={filtroAtivo} 
                    onChange={(e) => setFiltroAtivo(e.target.value)}
                >
                    <option value="todos">Todos Status</option>
                    <option value="ativos">Ativos</option>
                    <option value="inativos">Inativos</option>
                </select>
            </div>

            <div className="conhecimento-tabela">
                <table>
                    <thead>
                        <tr>
                            <th>Título</th>
                            <th>Categoria</th>
                            <th>Palavras-chave</th>
                            <th>Visualizações</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conhecimentosFiltrados.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    {searchTerm || filtroCategoria !== 'todas' || filtroAtivo !== 'todos'
                                        ? 'Nenhum item encontrado com os critérios de busca.' 
                                        : 'Nenhum item cadastrado na base de conhecimento.'}
                                </td>
                            </tr>
                        ) : (
                            conhecimentosFiltrados.map((conhecimento) => (
                                <tr key={conhecimento.id}>
                                    <td style={{ maxWidth: '300px' }}>{conhecimento.titulo}</td>
                                    <td>
                                        {conhecimento.categoria ? (
                                            <span className="conhecimento-status azul">{conhecimento.categoria}</span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.85rem' }}>
                                        {conhecimento.keywords.slice(0, 3).join(', ')}
                                        {conhecimento.keywords.length > 3 && '...'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        👁️ {conhecimento.visualizacoes}
                                    </td>
                                    <td>
                                        <span className={`conhecimento-status ${conhecimento.ativo ? 'verde' : 'vermelho'}`}>
                                            {conhecimento.ativo ? (
                                                <><FaToggleOn /> Ativo</>
                                            ) : (
                                                <><FaToggleOff /> Inativo</>
                                            )}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="conhecimento-container-acoes">
                                            <button 
                                                className="conhecimento-action-button edit" 
                                                title="Editar Conhecimento"
                                                onClick={() => handleOpenEdicao(conhecimento)}
                                            >
                                                <FaEdit />
                                            </button>
                                            <button 
                                                className="conhecimento-action-button delete" 
                                                title="Desativar Conhecimento"
                                                onClick={() => handleOpenDeleteModal(conhecimento)}
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
                <div className="conhecimento-sidebar-overlay" onClick={handleCloseCadastro}>
                    <div className="conhecimento-sidebar-cadastro" onClick={(e) => e.stopPropagation()}>
                        <CadastrarConhecimento
                            onSuccess={handleCadastroSuccess}
                            onClose={handleCloseCadastro}
                            conhecimentoToEdit={conhecimentoToEdit}
                        />
                    </div>
                </div>
            )}

            <ConfirmDeleteModal
                isOpen={showDeleteModal}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Confirmar Desativação"
                message={`Tem certeza que deseja desativar o conhecimento "${conhecimentoToDelete?.titulo}"? Ele não aparecerá mais no assistente virtual.`}
            />
        </>
    );
};

export default BaseConhecimento;