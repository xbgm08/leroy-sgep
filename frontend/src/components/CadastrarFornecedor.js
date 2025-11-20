import React, { useState, useEffect } from 'react';
import { createFornecedor, updateFornecedor } from '../api/fornecedorAPI';
import '../styles/CadastroProduto.css';

const initialState = {
    cnpj: '',
    nome: '',
    contato: '',
    politica_devolucao: '',
    status_forn: true
};

const CadastrarFornecedor = ({ onSuccess, onClose, fornecedorToEdit = null }) => {
    const [formData, setFormData] = useState(initialState);

    const isEditMode = !!fornecedorToEdit;

    useEffect(() => {
        if (fornecedorToEdit) {
            setFormData({
                cnpj: fornecedorToEdit.cnpj || '',
                nome: fornecedorToEdit.nome || '',
                contato: fornecedorToEdit.contato || '',
                politica_devolucao: fornecedorToEdit.politica_devolucao || '',
                status_forn: fornecedorToEdit.status_forn ?? true
            });
        }
    }, [fornecedorToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        let newValue = value;
        
        // Limpa CNPJ mantendo apenas números
        if (name === 'cnpj') {
            newValue = value.replace(/\D/g, '').slice(0, 14);
        }
        
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : newValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const fornecedorData = {
                cnpj: formData.cnpj.replace(/\D/g, ''),
                nome: formData.nome,
                contato: formData.contato || null,
                politica_devolucao: parseInt(formData.politica_devolucao, 10),
                status_forn: formData.status_forn
            };

            if (isEditMode) {
                await updateFornecedor(fornecedorToEdit.cnpj, fornecedorData);
                alert('Fornecedor atualizado com sucesso!');
            } else {
                await createFornecedor(fornecedorData);
                alert('Fornecedor cadastrado com sucesso!');
            }

            onSuccess();
            setFormData(initialState);

        } catch (error) {
            console.error('Erro ao salvar fornecedor:', error);
            if (error.response?.data?.detail) {
                alert(error.response.data.detail);
            } else {
                alert(`Erro ao salvar fornecedor: ${error.message}`);
            }
        }
    };

    const formatarCNPJDisplay = (cnpj) => {
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length <= 2) return cleaned;
        if (cleaned.length <= 5) return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`;
        if (cleaned.length <= 8) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`;
        if (cleaned.length <= 12) return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`;
        return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
    };

    return (
        <form onSubmit={handleSubmit} className="cadastro-form">
            <h1>{isEditMode ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}</h1>
            
            <div className="linha">
                <div className="campo">
                    <label htmlFor="cnpj">CNPJ:</label>
                    <input 
                        className="caixa" 
                        id="cnpj" 
                        name="cnpj" 
                        type="text" 
                        onChange={handleChange} 
                        value={formatarCNPJDisplay(formData.cnpj)}
                        disabled={isEditMode}
                        placeholder="00.000.000/0000-00"
                        required 
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="nome">Nome:</label>
                    <input 
                        className="caixa" 
                        id="nome" 
                        name="nome" 
                        type="text" 
                        onChange={handleChange} 
                        value={formData.nome}
                        placeholder="Nome do fornecedor"
                        maxLength="100"
                        required 
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="contato">Contato:</label>
                    <input 
                        className="caixa" 
                        id="contato" 
                        name="contato" 
                        type="text" 
                        onChange={handleChange} 
                        value={formData.contato}
                        placeholder="Email ou telefone"
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="politica_devolucao">Política de Devolução (dias):</label>
                    <input 
                        className="caixa" 
                        id="politica_devolucao" 
                        name="politica_devolucao" 
                        type="number" 
                        onChange={handleChange} 
                        value={formData.politica_devolucao}
                        placeholder="Ex: 30"
                        min="0"
                        required 
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="status_forn">
                        <input 
                            type="checkbox" 
                            id="status_forn" 
                            name="status_forn" 
                            onChange={handleChange} 
                            checked={formData.status_forn} 
                        />
                        Fornecedor Ativo
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

export default CadastrarFornecedor;