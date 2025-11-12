import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaListUl, FaInfoCircle } from 'react-icons/fa';
import '../styles/Estoque.css';
import '../styles/Modal.css';
import { getProdutos, deleteProduto } from '../api/produtoAPI';
import LotesModal from '../components/LotesModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CadastroProduto from '../components/CadastrarProduto';

const Estoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [isCadastroOpen, setIsCadastroOpen] = useState(false);

 const carregarDados = async () => {
    setLoading(true);

    try {
      const dados = await getProdutos();
      setProdutos(dados);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const getValidadeMaisProxima = (lotes) => {
    if (!lotes || lotes.length === 0) return null;

    const lotesAtivos = lotes.filter(l => l.ativo === true);
    if (lotesAtivos.length === 0) return null;

    const dataMaisProxima = lotesAtivos.reduce((dataAntiga, loteAtual) => {
      const dataLote = new Date(loteAtual.data_validade);
      return dataLote < dataAntiga ? dataLote : dataAntiga;
    }, new Date(lotesAtivos[0].data_validade));

    return dataMaisProxima;
  };

  const formatarData = (data) => {
    if (!data) return "N/A";
    const dataObj = new Date(data);
    return new Date(dataObj.getTime() + dataObj.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
  };

  const getStatusEtiqueta = (dataValidade) => {
    if (!dataValidade) return { texto: 'Sem Lotes', classe: 'preto' };

    const hoje = new Date();
    const diffTime = dataValidade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { texto: 'Vencido', classe: 'vermelho' };
    if (diffDays <= 30) return { texto: 'Crítico', classe: 'laranja', legenda: 'Vence em até 30 dias' };
    if (diffDays <= 90) return { texto: 'Atenção', classe: 'amarelo', legenda: 'Vence em até 90 dias' };
    return { texto: 'Seguro', classe: 'verde', legenda: 'Vence em mais de 90 dias' };
  };

  const filtrarProdutos = () => {
    if (!searchTerm.trim()) {
      return produtos;
    }

    const termoBusca = searchTerm.toLowerCase().trim();

    return produtos.filter(produto => {
      const codigoLM = produto.codigo_lm?.toString().toLowerCase() || '';
      const ean = produto.ean?.toString().toLowerCase() || '';
      const nome = produto.nome_produto?.toLowerCase() || '';
      const marca = produto.marca?.toLowerCase() || '';
      const fornecedor = produto.fornecedor_nome?.toLowerCase() || '';

      return (
        codigoLM.includes(termoBusca) ||
        ean.includes(termoBusca) ||
        nome.includes(termoBusca) ||
        marca.includes(termoBusca) ||
        fornecedor.includes(termoBusca)
      );
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenLotesModal = (produto) => {
    setProdutoSelecionado(produto);
    setIsModalOpen(true);
  };

  const handleCloseLotesModal = () => {
    setIsModalOpen(false);
    setProdutoSelecionado(null);
  };

  const handleOpenDeleteModal = (produto) => {
    setProductToDelete(produto);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    
    const success = await deleteProduto(productToDelete.codigo_lm); 
    
    if (success) {
      setProdutos(produtos.filter(p => p.codigo_lm !== productToDelete.codigo_lm));
    } else {
      console.error("Falha ao deletar o produto.");
    }
    
    handleCloseDeleteModal();
  };

  const handleOpenCadastro = () => {
    setIsCadastroOpen(true);
  };

  const handleCloseCadastro = () => {
    setIsCadastroOpen(false);
  };

  const handleProdutoCadastrado = () => {
    carregarDados();
    setIsCadastroOpen(false);
  };

  if (loading) {
    return <div>Carregando dados do estoque...</div>;
  }

  const produtosFiltrados = filtrarProdutos();

  return (
    <>
      <div className="titulo">
        <h2>Estoque</h2>
        <h4>Aba dos Produtos</h4>
      </div>

      <button className="fora" onClick={handleOpenCadastro}>Cadastrar Produto</button>

      <input 
        type="text" 
        placeholder="Pesquisar por Código LM, EAN, Nome, Marca ou Fornecedor..." 
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <div className="tabela">
        <table>
          <thead>
            <tr>
              <th>Cód. LM</th>
              <th>EAN</th>
              <th>Nome do Produto</th>
              <th>Marca</th>
              <th>Fornecedor</th>
              <th>Preço Unitário</th>
              <th>Estoque Total</th>
              <th>Validade Mais Próxima</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr>
                <td colSpan="10">
                  {searchTerm ? 'Nenhum produto encontrado com este critério de busca.' : 'Nenhum produto encontrado.'}
                </td>
              </tr>
            ) : (
              produtosFiltrados.map((produto) => {
                const validadeProxima = getValidadeMaisProxima(produto.lotes);
                const statusInfo = getStatusEtiqueta(validadeProxima);

                return (
                  <tr key={produto.codigo_lm}>
                    <td>{produto.codigo_lm}</td>
                    <td>{produto.ean || 'N/A'}</td>
                    <td>{produto.nome_produto}</td>
                    <td>{produto.marca}</td>
                    <td>{produto.fornecedor_nome || 'N/A'}</td>
                    <td>R$ {produto.preco_unit?.toFixed(2)}</td>
                    <td>{produto.estoque_calculado}</td>
                    <td>{formatarData(validadeProxima)}</td>
                    <td className={`cor ${statusInfo.classe}`} title={statusInfo.legenda}>{statusInfo.texto}</td>
                    <td>
                      <div className="container-acoes">
                        <button className="action-button edit" title='Editar Produto'>
                          <FaEdit />
                        </button>
                        <button className="action-button delete" title='Excluir Produto' onClick={() => handleOpenDeleteModal(produto)}>
                          <FaTrashAlt />
                        </button>
                        <button className="action-button view" title='Ver lotes' onClick={() => handleOpenLotesModal(produto)}>
                          <FaListUl />
                        </button>
                        <button className="action-button info" title="Ficha Técnica">
                          <FaInfoCircle />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isCadastroOpen && (
        <div className="sidebar-overlay" onClick={handleCloseCadastro}>
          <div className="sidebar-cadastro" onClick={(e) => e.stopPropagation()}>
            <CadastroProduto 
              onProdutoCadastrado={handleProdutoCadastrado}
              onClose={handleCloseCadastro}
            />
          </div>
        </div>
      )}

      <LotesModal
        isOpen={isModalOpen}
        onClose={handleCloseLotesModal}
        produto={produtoSelecionado}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message={`Tem certeza que deseja excluir o produto "${productToDelete?.nome_produto}"? Esta ação não pode ser desfeita.`}
      />
    </>
  );
};

export default Estoque;