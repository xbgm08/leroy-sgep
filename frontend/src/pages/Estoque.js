import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrashAlt, FaListUl, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimesCircle, FaClock, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../styles/Estoque.css';
import { getProdutos, deleteProduto } from '../api/produtoAPI';
import LotesModal from '../components/LotesModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import CadastroProduto from '../components/CadastrarProduto';
import DetalheProdutoModal from '../components/DetalheProdutoModal';
import ImportarProdutos from '../components/ImportarProdutos';

const Estoque = () => {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [itensPorPagina] = useState(50);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [isCadastroOpen, setIsCadastroOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState(null);

  const [isDetalheModalOpen, setIsDetalheModalOpen] = useState(false);
  const [produtoDetalhe, setProdutoDetalhe] = useState(null);

  const [isImportarOpen, setIsImportarOpen] = useState(false);

 const carregarDados = async (pagina = 1, termoBusca = '') => {
    setLoading(true);

    try {
      const skip = (pagina - 1) * itensPorPagina;
      const dados = await getProdutos(skip, itensPorPagina, termoBusca);
      
      setProdutos(dados.produtos || []);
      setTotalRegistros(dados.total || 0);
      setPaginaAtual(pagina);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setProdutos([]);
      setTotalRegistros(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados(1, '');
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      carregarDados(1, searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina);

  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) {
      carregarDados(paginaAtual - 1, searchTerm);
    }
  };

  const handleProximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      carregarDados(paginaAtual + 1, searchTerm);
    }
  };

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
    if (!dataValidade) return { 
      texto: 'Sem Lotes', 
      classe: 'preto',
      icone: <FaClock />
    };

    const hoje = new Date();
    const diffTime = dataValidade.getTime() - hoje.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { 
      texto: 'Vencido', 
      classe: 'vermelho',
      icone: <FaTimesCircle />
    };
    if (diffDays <= 30) return { 
      texto: 'Crítico', 
      classe: 'laranja', 
      legenda: 'Vence em até 30 dias',
      icone: <FaExclamationTriangle />
    };
    if (diffDays <= 90) return { 
      texto: 'Atenção', 
      classe: 'amarelo', 
      legenda: 'Vence em até 90 dias',
      icone: <FaExclamationTriangle />
    };
    return { 
      texto: 'Seguro', 
      classe: 'verde', 
      legenda: 'Vence em mais de 90 dias',
      icone: <FaCheckCircle />
    };
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

  const handleLoteAtualizado = async () => {
    await carregarDados(paginaAtual, searchTerm);
    
    if (produtoSelecionado) {
      const skip = (paginaAtual - 1) * itensPorPagina;
      const dados = await getProdutos(skip, itensPorPagina, searchTerm);
      const produtoAtualizado = dados.produtos.find(
        p => p.codigo_lm === produtoSelecionado.codigo_lm
      );
      if (produtoAtualizado) {
        setProdutoSelecionado(produtoAtualizado);
      }
    }
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
      await carregarDados(paginaAtual, searchTerm);
    } else {
      console.error("Falha ao deletar o produto.");
    }
    
    handleCloseDeleteModal();
  };

  const handleOpenCadastro = () => {
    setProdutoParaEditar(null);
    setIsCadastroOpen(true);
  };

  const handleOpenEdicao = (produto) => {
    setProdutoParaEditar(produto);
    setIsCadastroOpen(true);
  };

  const handleCloseCadastro = () => {
    setIsCadastroOpen(false);
    setProdutoParaEditar(null);
  };

  const handleProdutoCadastrado = () => {
    carregarDados(paginaAtual, searchTerm);
    setIsCadastroOpen(false);
  };

  const handleOpenDetalheModal = (produto) => {
    setProdutoDetalhe(produto);
    setIsDetalheModalOpen(true);
  };

  const handleCloseDetalheModal = () => {
    setIsDetalheModalOpen(false);
    setProdutoDetalhe(null);
  };

  const handleOpenImportar = () => {
    setIsImportarOpen(true);
  };

  const handleCloseImportar = () => {
    setIsImportarOpen(false);
  };

  const handleImportSuccess = () => {
    carregarDados(paginaAtual, searchTerm);
    setIsImportarOpen(false);
  };

  if (loading) {
    return <div>Carregando dados do estoque...</div>;
  }

  const produtosFiltrados = filtrarProdutos();

  return (
    <>
      <div className="estoque-titulo">
        <h2>Estoque</h2>
        <h4>Aba dos Produtos</h4>
      </div>

      <div className="estoque-botoes-container">
        <button className="estoque-btn-cadastrar" onClick={handleOpenCadastro}>
          Cadastrar Produto
        </button>
        <button className="estoque-btn-importar" onClick={handleOpenImportar}>
          📤 Importar Excel
        </button>
      </div>

      <input 
        className="estoque-search-input"
        type="text" 
        placeholder="Pesquisar por Código LM, EAN, Nome, Marca ou Fornecedor..." 
        value={searchTerm}
        onChange={handleSearchChange}
      />

      <div className="estoque-paginacao-info">
        <span>
          Mostrando {produtos.length > 0 ? ((paginaAtual - 1) * itensPorPagina + 1) : 0} - {Math.min(paginaAtual * itensPorPagina, totalRegistros)} de {totalRegistros} produtos
          {searchTerm && ` (filtrados)`}
        </span>
      </div>

      <div className="estoque-tabela">
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
            {produtosFiltrados.length === 0 ? (
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
                    <td>
                      <span className={`estoque-status ${statusInfo.classe}`} title={statusInfo.legenda}>
                        {statusInfo.icone} {statusInfo.texto}
                      </span>
                    </td>
                    <td>
                      <div className="estoque-container-acoes">
                        <button className="estoque-action-button edit" title='Editar Produto' onClick={() => handleOpenEdicao(produto)}>
                          <FaEdit />
                        </button>
                        <button className="estoque-action-button delete" title='Excluir Produto' onClick={() => handleOpenDeleteModal(produto)}>
                          <FaTrashAlt />
                        </button>
                        <button className="estoque-action-button view" title='Ver lotes' onClick={() => handleOpenLotesModal(produto)}>
                          <FaListUl />
                        </button>
                        <button className="estoque-action-button info" title="Detalhes do Produto" onClick={() => handleOpenDetalheModal(produto)}>
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

      {totalPaginas > 1 && (
        <div className="estoque-paginacao">
          <button 
            className="estoque-paginacao-btn"
            onClick={handlePaginaAnterior}
            disabled={paginaAtual === 1}
          >
            <FaChevronLeft /> Anterior
          </button>
          
          <span className="estoque-paginacao-texto">
            Página {paginaAtual} de {totalPaginas}
          </span>
          
          <button 
            className="estoque-paginacao-btn"
            onClick={handleProximaPagina}
            disabled={paginaAtual === totalPaginas}
          >
            Próxima <FaChevronRight />
          </button>
        </div>
      )}

      {isCadastroOpen && (
        <div className="estoque-sidebar-overlay" onClick={handleCloseCadastro}>
          <div className="estoque-sidebar-cadastro" onClick={(e) => e.stopPropagation()}>
            <CadastroProduto 
              onProdutoCadastrado={handleProdutoCadastrado}
              onClose={handleCloseCadastro}
              produtoParaEditar={produtoParaEditar}
            />
          </div>
        </div>
      )}

      {isImportarOpen && (
        <ImportarProdutos
          onClose={handleCloseImportar}
          onImportSuccess={handleImportSuccess}
        />
      )}

      <LotesModal
        isOpen={isModalOpen}
        onClose={handleCloseLotesModal}
        produto={produtoSelecionado}
        onLoteAtualizado={handleLoteAtualizado}
      />

      <DetalheProdutoModal
        isOpen={isDetalheModalOpen}
        onClose={handleCloseDetalheModal}
        produto={produtoDetalhe}
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