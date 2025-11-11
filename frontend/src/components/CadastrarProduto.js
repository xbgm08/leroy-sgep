import React, { useState, useEffect } from 'react';
import { createProduto } from '../api/produtoAPI';
import { getFornecedores } from '../api/fornecedorAPI';
import '../styles/CadastroProduto.css';

const initialState = {
    nome_produto: "",
    codigo_lm: "",
    ean: "",
    marca: "",
    ficha_tec: "",
    link_prod: "",
    cor: "",
    secao: "",
    cod_secao: "",
    subsecao: "",
    cod_subsecao: "",
    avs: false,
    preco_unit: "",
    estoque_calculado: "",
    fornecedor_cnpj: "",
    fornecedor_nome: ""
};

const CadastroProduto = ({ onProdutoCadastrado, onClose }) => {
    const [formData, setFormData] = useState(initialState);
    const [fornecedores, setFornecedores] = useState([]);
    const [loadingFornecedores, setLoadingFornecedores] = useState(true);

    useEffect(() => {
        const carregarFornecedores = async () => {
            try {
                const dados = await getFornecedores();
                setFornecedores(dados);
            } catch (error) {
                console.error('Erro ao carregar fornecedores:', error);
            } finally {
                setLoadingFornecedores(false);
            }
        };

        carregarFornecedores();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFornecedorChange = (e) => {
        const cnpj = e.target.value;
        const fornecedorSelecionado = fornecedores.find(f => f.cnpj === cnpj);
        
        setFormData(prevState => ({
            ...prevState,
            fornecedor_cnpj: cnpj,
            fornecedor_nome: fornecedorSelecionado ? fornecedorSelecionado.nome : ""
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const dadosParaAPI = {
                nome_produto: formData.nome_produto,
                codigo_lm: parseInt(formData.codigo_lm, 10),
                ean: formData.ean ? parseInt(formData.ean, 10) : null,
                marca: formData.marca,
                ficha_tec: formData.ficha_tec,
                link_prod: formData.link_prod,
                cor: formData.cor || null,
                secao: formData.secao || null,
                cod_secao: formData.cod_secao ? parseInt(formData.cod_secao, 10) : null,
                subsecao: formData.subsecao || null,
                cod_subsecao: formData.cod_subsecao ? parseInt(formData.cod_subsecao, 10) : null,
                avs: formData.avs,
                preco_unit: parseFloat(formData.preco_unit),
                estoque_calculado: parseInt(formData.estoque_calculado, 10),
                fornecedor_cnpj: formData.fornecedor_cnpj,
                fornecedor_nome: formData.fornecedor_nome || null,
                lotes: []
            };

            await createProduto(dadosParaAPI);
            
            alert('Produto cadastrado com sucesso!');
            onProdutoCadastrado(); 
            setFormData(initialState); 

        } catch (error) {
            console.error(error);
            alert(`Erro ao cadastrar produto: ${error.message}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="cadastro-form">
            <h1>Cadastrar Produto</h1>
            
            <div className="linha">
                <div className="campo">
                    <label htmlFor="nome_produto">Nome do Produto:</label>
                    <input className="caixa" id="nome_produto" name="nome_produto" type="text" onChange={handleChange} value={formData.nome_produto} maxLength="200" required />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="codigo_lm">Código LM:</label>
                    <input className="caixa" id="codigo_lm" name="codigo_lm" type="number" onChange={handleChange} value={formData.codigo_lm} required />
                </div>
                <div className="campo">
                    <label htmlFor="ean">EAN:</label>
                    <input className="caixa" id="ean" name="ean" type="number" onChange={handleChange} value={formData.ean} />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="marca">Marca:</label>
                    <input className="caixa" id="marca" name="marca" type="text" onChange={handleChange} value={formData.marca} maxLength="100" required />
                </div>
                <div className="campo">
                    <label htmlFor="cor">Cor:</label>
                    <input className="caixa" id="cor" name="cor" type="text" onChange={handleChange} value={formData.cor} maxLength="50" />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="cod_secao">Código da Seção:</label>
                    <input className="caixa" id="cod_secao" name="cod_secao" type="number" onChange={handleChange} value={formData.cod_secao} />
                </div>
                <div className="campo">
                    <label htmlFor="secao">Seção:</label>
                    <input className="caixa" id="secao" name="secao" type="text" onChange={handleChange} value={formData.secao} maxLength="200" />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="cod_subsecao">Código da Subseção:</label>
                    <input className="caixa" id="cod_subsecao" name="cod_subsecao" type="number" onChange={handleChange} value={formData.cod_subsecao} />
                </div>
                <div className="campo">
                    <label htmlFor="subsecao">Subseção:</label>
                    <input className="caixa" id="subsecao" name="subsecao" type="text" onChange={handleChange} value={formData.subsecao} maxLength="200" />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="fornecedor_cnpj">Fornecedor:</label>
                    <select 
                        className="caixa" 
                        id="fornecedor_cnpj" 
                        name="fornecedor_cnpj" 
                        onChange={handleFornecedorChange} 
                        value={formData.fornecedor_cnpj}
                        required
                        disabled={loadingFornecedores}
                    >
                        <option value="">
                            {loadingFornecedores ? 'Carregando...' : 'Selecione um fornecedor'}
                        </option>
                        {fornecedores.map((fornecedor) => (
                            <option key={fornecedor.cnpj} value={fornecedor.cnpj}>
                                {fornecedor.nome} - {fornecedor.cnpj}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="preco_unit">Preço Unitário (R$):</label>
                    <input className="caixa" id="preco_unit" name="preco_unit" type="number" step="0.01" onChange={handleChange} value={formData.preco_unit} required />
                </div>
                <div className="campo">
                    <label htmlFor="estoque_calculado">Estoque Inicial:</label>
                    <input className="caixa" id="estoque_calculado" name="estoque_calculado" type="number" onChange={handleChange} value={formData.estoque_calculado} required />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="link_prod">Link do Produto:</label>
                    <input className="caixa" id="link_prod" name="link_prod" type="url" onChange={handleChange} value={formData.link_prod} maxLength="300" />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="ficha_tec">Ficha Técnica (URL):</label>
                    <input className="caixa" id="ficha_tec" name="ficha_tec" type="url" onChange={handleChange} value={formData.ficha_tec} maxLength="500" />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="avs">
                        <input type="checkbox" id="avs" name="avs" onChange={handleChange} checked={formData.avs} />
                        AVS (Alto Valor de Segurança)
                    </label>
                </div>
            </div>

            <div className="linha">
                <button className="botao" type="submit">Adicionar</button>
                <button className="botao" type="button" onClick={onClose}>
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default CadastroProduto;