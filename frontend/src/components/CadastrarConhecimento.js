import React, { useState, useEffect } from 'react';
import { criarConhecimento, atualizarConhecimento } from '../api/conhecimentoAPI';
import '../styles/CadastrarConhecimento.css';

const initialState = {
    titulo: '',
    resposta: '',
    keywords: [],
    categoria: '',
    ativo: true
};

const CadastrarConhecimento = ({ onSuccess, onClose, conhecimentoToEdit = null }) => {
    const [formData, setFormData] = useState(initialState);
    const [keywordInput, setKeywordInput] = useState('');

    const isEditMode = !!conhecimentoToEdit;

    useEffect(() => {
        if (conhecimentoToEdit) {
            setFormData({
                titulo: conhecimentoToEdit.titulo || '',
                resposta: conhecimentoToEdit.resposta || '',
                keywords: conhecimentoToEdit.keywords || [],
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

    const handleKeywordInputChange = (e) => {
        setKeywordInput(e.target.value);
    };

    const handleKeywordKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addKeyword();
        }
    };

    const addKeyword = () => {
        const trimmedKeyword = keywordInput.trim().replace(/,/g, '');
        
        if (trimmedKeyword && !formData.keywords.includes(trimmedKeyword)) {
            setFormData(prevState => ({
                ...prevState,
                keywords: [...prevState.keywords, trimmedKeyword]
            }));
            setKeywordInput('');
        }
    };

    const removeKeyword = (indexToRemove) => {
        setFormData(prevState => ({
            ...prevState,
            keywords: prevState.keywords.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (formData.keywords.length === 0) {
                alert('Adicione pelo menos uma palavra-chave.');
                return;
            }

            const conhecimentoData = {
                titulo: formData.titulo.trim(),
                resposta: formData.resposta.trim(),
                keywords: formData.keywords,
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
            setKeywordInput('');

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
        <form onSubmit={handleSubmit} className="conhecimento-cadastro-form">
            <h1>{isEditMode ? 'Editar Conhecimento' : 'Cadastrar Conhecimento'}</h1>
            
            <div className="conhecimento-linha">
                <div className="conhecimento-campo">
                    <label htmlFor="titulo">Título (Pergunta):</label>
                    <input 
                        className="conhecimento-input" 
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

            <div className="conhecimento-linha">
                <div className="conhecimento-campo">
                    <label htmlFor="resposta">Resposta:</label>
                    <textarea 
                        className="conhecimento-input" 
                        id="resposta" 
                        name="resposta" 
                        onChange={handleChange} 
                        value={formData.resposta}
                        placeholder="Digite a resposta completa..."
                        maxLength="2000"
                        rows="6"
                        required 
                    />
                    <small className="conhecimento-helper-text">
                        {formData.resposta.length}/2000 caracteres
                    </small>
                </div>
            </div>

            <div className="conhecimento-linha">
                <div className="conhecimento-campo">
                    <label htmlFor="keywords">Palavras-chave:</label>
                    <div className="conhecimento-keywords-container">
                        <div className="conhecimento-keywords-tags">
                            {formData.keywords.map((keyword, index) => (
                                <span key={index} className="conhecimento-keyword-tag">
                                    {keyword}
                                    <button
                                        type="button"
                                        className="conhecimento-keyword-remove"
                                        onClick={() => removeKeyword(index)}
                                        aria-label={`Remover ${keyword}`}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                        <input 
                            className="conhecimento-input" 
                            id="keywords" 
                            type="text" 
                            value={keywordInput}
                            onChange={handleKeywordInputChange}
                            onKeyDown={handleKeywordKeyDown}
                            onBlur={addKeyword}
                            placeholder={formData.keywords.length === 0 ? "Digite e pressione Enter ou vírgula..." : "Adicionar mais..."}
                        />
                    </div>
                    <small className="conhecimento-helper-text">
                        Pressione Enter ou vírgula para adicionar. {formData.keywords.length} palavra(s)-chave adicionada(s).
                    </small>
                </div>
            </div>

            <div className="conhecimento-linha">
                <div className="conhecimento-campo">
                    <label htmlFor="categoria">Categoria (opcional):</label>
                    <input 
                        className="conhecimento-input" 
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

            <div className="conhecimento-linha">
                <div className="conhecimento-campo">
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

            <div className="conhecimento-btn-container">
                <button className="conhecimento-botao conhecimento-botao-submit" type="submit">
                    {isEditMode ? 'Atualizar' : 'Adicionar'}
                </button>
                <button className="conhecimento-botao conhecimento-botao-cancelar" type="button" onClick={onClose}>
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default CadastrarConhecimento;