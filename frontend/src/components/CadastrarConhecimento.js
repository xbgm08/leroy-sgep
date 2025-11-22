import React, { useState, useEffect } from 'react';
import { criarConhecimento, atualizarConhecimento } from '../api/conhecimentoAPI';
import '../styles/CadastroProduto.css';

const initialState = {
    titulo: '',
    resposta: '',
    keywords: '',
    categoria: '',
    ativo: true
};

const CadastrarConhecimento = ({ onSuccess, onClose, conhecimentoToEdit = null }) => {
    const [formData, setFormData] = useState(initialState);

    const isEditMode = !!conhecimentoToEdit;

    useEffect(() => {
        if (conhecimentoToEdit) {
            setFormData({
                titulo: conhecimentoToEdit.titulo || '',
                resposta: conhecimentoToEdit.resposta || '',
                keywords: conhecimentoToEdit.keywords?.join(', ') || '',
                categoria: conhecimentoToEdit.categoria || '',
                ativo: conhecimentoToEdit.ativo ?? true
            });
        }
    }, [conhecimentoToEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Processa keywords: separa por vírgula e remove espaços extras
            const keywordsArray = formData.keywords
                .split(',')
                .map(k => k.trim())
                .filter(k => k.length > 0);

            if (keywordsArray.length === 0) {
                alert('Adicione pelo menos uma palavra-chave.');
                return;
            }

            const conhecimentoData = {
                titulo: formData.titulo.trim(),
                resposta: formData.resposta.trim(),
                keywords: keywordsArray,
                categoria: formData.categoria.trim() || null,
                ativo: formData.ativo,
                visualizacoes: conhecimentoToEdit?.visualizacoes || 0
            };

            if (isEditMode) {
                await atualizarConhecimento(conhecimentoToEdit.id, conhecimentoData);
                alert('Conhecimento atualizado com sucesso!');
            } else {
                await criarConhecimento(conhecimentoData);
                alert('Conhecimento cadastrado com sucesso!');
            }

            onSuccess();
            setFormData(initialState);

        } catch (error) {
            console.error('Erro ao salvar conhecimento:', error);
            if (error.response?.data?.detail) {
                alert(error.response.data.detail);
            } else {
                alert(`Erro ao salvar conhecimento: ${error.message}`);
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="cadastro-form">
            <h1>{isEditMode ? 'Editar Conhecimento' : 'Cadastrar Conhecimento'}</h1>
            
            <div className="linha">
                <div className="campo">
                    <label htmlFor="titulo">Título (Pergunta):</label>
                    <input 
                        className="caixa" 
                        id="titulo" 
                        name="titulo" 
                        type="text" 
                        onChange={handleChange} 
                        value={formData.titulo}
                        placeholder="Ex: Como adicionar um novo produto?"
                        maxLength="200"
                        required 
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="resposta">Resposta:</label>
                    <textarea 
                        className="caixa" 
                        id="resposta" 
                        name="resposta" 
                        onChange={handleChange} 
                        value={formData.resposta}
                        placeholder="Digite a resposta completa..."
                        maxLength="2000"
                        rows="6"
                        required 
                        style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                    <small style={{ color: '#666' }}>
                        {formData.resposta.length}/2000 caracteres
                    </small>
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="keywords">Palavras-chave (separadas por vírgula):</label>
                    <input 
                        className="caixa" 
                        id="keywords" 
                        name="keywords" 
                        type="text" 
                        onChange={handleChange} 
                        value={formData.keywords}
                        placeholder="Ex: produto, cadastrar, adicionar, novo"
                        required 
                    />
                    <small style={{ color: '#666' }}>
                        Use vírgulas para separar. Exemplo: produto, estoque, cadastro
                    </small>
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="categoria">Categoria (opcional):</label>
                    <input 
                        className="caixa" 
                        id="categoria" 
                        name="categoria" 
                        type="text" 
                        onChange={handleChange} 
                        value={formData.categoria}
                        placeholder="Ex: produtos, estoque, fornecedores, sistema"
                        maxLength="50"
                    />
                </div>
            </div>

            <div className="linha">
                <div className="campo">
                    <label htmlFor="ativo">
                        <input 
                            type="checkbox" 
                            id="ativo" 
                            name="ativo" 
                            onChange={handleChange} 
                            checked={formData.ativo} 
                        />
                        Item Ativo (visível no assistente virtual)
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

export default CadastrarConhecimento;