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
    const [modoCalculo, setModoCalculo] = useState('data');

    const isEditMode = !!loteParaEditar;

    useEffect(() => {
        if (loteParaEditar) {
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
        const diffMonths = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30.44));
        
        return diffMonths > 0 ? diffMonths : 0;
    };

    const calcularDataValidade = (dataFab, prazoMeses) => {
        if (!dataFab || !prazoMeses) return "";
        
        const fab = new Date(dataFab);
        const meses = parseInt(prazoMeses, 10);
        
        const val = new Date(fab);
        val.setMonth(val.getMonth() + meses);
        
        return val.toISOString().split('T')[0];
    };

    useEffect(() => {
        if (modoCalculo === 'data' && formData.data_fabricacao && formData.data_validade) {
            const prazo = calcularPrazoValidade(formData.data_fabricacao, formData.data_validade);
            if (prazo !== formData.prazo_validade_meses) {
                setFormData(prev => ({ ...prev, prazo_validade_meses: prazo }));
            }
        }
    }, [formData.data_fabricacao, formData.data_validade, modoCalculo]);

    useEffect(() => {
        if (modoCalculo === 'prazo' && formData.data_fabricacao && formData.prazo_validade_meses) {
            const dataCalculada = calcularDataValidade(formData.data_fabricacao, formData.prazo_validade_meses);
            if (dataCalculada && dataCalculada !== formData.data_validade) {
                setFormData(prev => ({ ...prev, data_validade: dataCalculada }));
            }
        }
    }, [formData.data_fabricacao, formData.prazo_validade_meses, modoCalculo]);

    const handleDataValidadeChange = (e) => {
        setModoCalculo('data'); 
        handleChange(e);
    };

    const handlePrazoValidadeChange = (e) => {
        setModoCalculo('prazo');
        handleChange(e);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (new Date(formData.data_validade) <= new Date(formData.data_fabricacao)) {
            alert('A data de validade deve ser posterior à data de fabricação.');
            return;
        }

        try {
            const dadosParaAPI = {
                codigo_lote: formData.codigo_lote,
                data_fabricacao: new Date(formData.data_fabricacao).toISOString(),
                data_validade: new Date(formData.data_validade).toISOString(),
                prazo_validade_meses: parseInt(formData.prazo_validade_meses, 10),
                quantidade_lote: parseInt(formData.quantidade_lote, 10),
                ativo: formData.ativo,
                valor_lote: 0
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
                    <label htmlFor="data_fabricacao">Data de Fabricação: *</label>
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
                    <label htmlFor="ativo" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '30px' }}>
                        <input 
                            type="checkbox" 
                            id="ativo" 
                            name="ativo" 
                            onChange={handleChange} 
                            checked={formData.ativo} 
                        />
                        <span>Lote Ativo</span>
                    </label>
                </div>
            </div>

            <div style={{ 
                borderTop: '2px solid #e0e0e0', 
                margin: '20px 0', 
                paddingTop: '20px' 
            }}>
                <p style={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    fontStyle: 'italic',
                    marginBottom: '15px'
                }}>
                    💡 <strong>Dica:</strong> Você pode informar a <strong>Data de Validade</strong> ou o <strong>Prazo de Validade</strong>. 
                    O sistema calcula automaticamente o outro campo!
                </p>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="data_validade">
                        Data de Validade:
                        {modoCalculo === 'prazo' && (
                            <span style={{ color: '#4CAF50', fontSize: '12px', marginLeft: '8px' }}>
                                ✓ Calculado automaticamente
                            </span>
                        )}
                    </label>
                    <input 
                        className="caixa" 
                        id="data_validade" 
                        name="data_validade" 
                        type="date" 
                        onChange={handleDataValidadeChange} 
                        value={formData.data_validade} 
                        required 
                        style={{
                            backgroundColor: modoCalculo === 'prazo' ? '#f0f8f0' : 'white',
                            borderColor: modoCalculo === 'prazo' ? '#4CAF50' : '#ccc'
                        }}
                    />
                </div>
                <div className="campo">
                    <label htmlFor="prazo_validade_meses">
                        Prazo de Validade (meses):
                        {modoCalculo === 'data' && (
                            <span style={{ color: '#2196F3', fontSize: '12px', marginLeft: '8px' }}>
                                ✓ Calculado automaticamente
                            </span>
                        )}
                    </label>
                    <input 
                        className="caixa" 
                        id="prazo_validade_meses" 
                        name="prazo_validade_meses" 
                        type="number" 
                        onChange={handlePrazoValidadeChange}
                        value={formData.prazo_validade_meses} 
                        min="1"
                        style={{
                            backgroundColor: modoCalculo === 'data' ? '#f0f4ff' : 'white',
                            borderColor: modoCalculo === 'data' ? '#2196F3' : '#ccc'
                        }}
                    />
                </div>
            </div>

            <div className="linha">
                <button className="botao" type="submit">
                    {isEditMode ? 'Atualizar' : 'Adicionar'}
                </button>
                <button className="botao" type="button" onClick={onClose} style={{ backgroundColor: '#999' }}>
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default CadastrarLote;