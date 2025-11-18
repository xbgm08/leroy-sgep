import React, { useState, useEffect } from 'react';
import { createLote, updateLote } from '../api/loteAPI';
import '../styles/CadastroProduto.css';

const initialState = {
    codigo_lote: "",
    data_fabricacao: "",
    data_validade: "",
    prazo_validade_meses: "",
    quantidade_lote: "",
    ativo: true
};

const CadastrarLote = ({ produto, onLoteCadastrado, onClose, loteParaEditar = null }) => {
    const [formData, setFormData] = useState(initialState);

    const isEditMode = !!loteParaEditar;

    useEffect(() => {
        if (loteParaEditar) {
            // Converter datas ISO para formato yyyy-MM-dd para o input
            const dataFab = loteParaEditar.data_fabricacao ? 
                new Date(loteParaEditar.data_fabricacao).toISOString().split('T')[0] : "";
            const dataVal = loteParaEditar.data_validade ? 
                new Date(loteParaEditar.data_validade).toISOString().split('T')[0] : "";

            setFormData({
                codigo_lote: loteParaEditar.codigo_lote || "",
                data_fabricacao: dataFab,
                data_validade: dataVal,
                prazo_validade_meses: loteParaEditar.prazo_validade_meses || "",
                quantidade_lote: loteParaEditar.quantidade_lote || "",
                ativo: loteParaEditar.ativo ?? true
            });
        }
    }, [loteParaEditar]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const calcularPrazoValidade = (dataFab, dataVal) => {
        if (!dataFab || !dataVal) return 0;
        
        const fab = new Date(dataFab);
        const val = new Date(dataVal);
        
        const diffTime = val - fab;
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44)); // média de dias por mês
        
        return diffMonths > 0 ? diffMonths : 0;
    };

    useEffect(() => {
        if (formData.data_fabricacao && formData.data_validade) {
            const prazo = calcularPrazoValidade(formData.data_fabricacao, formData.data_validade);
            setFormData(prev => ({ ...prev, prazo_validade_meses: prazo }));
        }
    }, [formData.data_fabricacao, formData.data_validade]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const dadosParaAPI = {
                codigo_lote: formData.codigo_lote,
                data_fabricacao: new Date(formData.data_fabricacao).toISOString(),
                data_validade: new Date(formData.data_validade).toISOString(),
                prazo_validade_meses: parseInt(formData.prazo_validade_meses, 10),
                quantidade_lote: parseInt(formData.quantidade_lote, 10),
                ativo: formData.ativo,
                valor_lote: 0 // Será calculado no backend
            };

            if (isEditMode) {
                await updateLote(produto.codigo_lm, loteParaEditar.codigo_lote, dadosParaAPI);
                alert('Lote atualizado com sucesso!');
            } else {
                await createLote(produto.codigo_lm, dadosParaAPI);
                alert('Lote cadastrado com sucesso!');
            }

            onLoteCadastrado();
            setFormData(initialState);

        } catch (error) {
            console.error(error);
            alert(`Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} lote: ${error.message}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="cadastro-form">
            <h1>{isEditMode ? 'Editar Lote' : 'Adicionar Lote'}</h1>
            <p style={{ color: '#555', marginBottom: '20px' }}>
                Produto: <strong>{produto.nome_produto}</strong> (Cód. LM: {produto.codigo_lm})
            </p>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="codigo_lote">Código do Lote:</label>
                    <input 
                        className="caixa" 
                        id="codigo_lote" 
                        name="codigo_lote" 
                        type="text" 
                        onChange={handleChange} 
                        value={formData.codigo_lote} 
                        required 
                        disabled={isEditMode}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="quantidade_lote">Quantidade:</label>
                    <input 
                        className="caixa" 
                        id="quantidade_lote" 
                        name="quantidade_lote" 
                        type="number" 
                        onChange={handleChange} 
                        value={formData.quantidade_lote} 
                        required 
                        min="1"
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="data_fabricacao">Data de Fabricação:</label>
                    <input 
                        className="caixa" 
                        id="data_fabricacao" 
                        name="data_fabricacao" 
                        type="date" 
                        onChange={handleChange} 
                        value={formData.data_fabricacao} 
                        required 
                    />
                </div>
                <div className="campo">
                    <label htmlFor="data_validade">Data de Validade:</label>
                    <input 
                        className="caixa" 
                        id="data_validade" 
                        name="data_validade" 
                        type="date" 
                        onChange={handleChange} 
                        value={formData.data_validade} 
                        required 
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="prazo_validade_meses">Prazo de Validade (meses):</label>
                    <input 
                        className="caixa" 
                        id="prazo_validade_meses" 
                        name="prazo_validade_meses" 
                        type="number" 
                        value={formData.prazo_validade_meses} 
                        disabled
                        style={{ backgroundColor: '#e9ecef' }}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="ativo">
                        <input 
                            type="checkbox" 
                            id="ativo" 
                            name="ativo" 
                            onChange={handleChange} 
                            checked={formData.ativo} 
                        />
                        Lote Ativo
                    </label>
                </div>
            </div>

            <div className="linha">
                <button className="botao" type="submit">
                    {isEditMode ? 'Atualizar' : 'Adicionar'}
                </button>
                <button className="botao" type="button" onClick={onClose}>
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default CadastrarLote;