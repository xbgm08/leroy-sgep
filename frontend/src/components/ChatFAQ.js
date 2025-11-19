import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaTimes, FaSpinner } from 'react-icons/fa';
import { getMelhorResposta, listarConhecimentos } from '../api/conhecimentoAPI';
import '../styles/ChatFAQ.css';

const ChatFAQ = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [perguntasSugeridas, setPerguntasSugeridas] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSugestoes, setIsLoadingSugestoes] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (isOpen && perguntasSugeridas.length === 0) {
            carregarPerguntasSugeridas();
        }
    }, [isOpen]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const carregarPerguntasSugeridas = async () => {
        setIsLoadingSugestoes(true);
        try {
            const conhecimentos = await listarConhecimentos(true);
            
            if (conhecimentos && conhecimentos.length > 0) {
                const sugestoes = conhecimentos
                    .sort((a, b) => (b.visualizacoes || 0) - (a.visualizacoes || 0))
                    .slice(0, 5)
                    .map(item => ({
                        titulo: item.titulo,
                        visualizacoes: item.visualizacoes || 0,
                        categoria: item.categoria
                    }));
                
                setPerguntasSugeridas(sugestoes);
            } else {
                setPerguntasSugeridas([
                    { titulo: "Como adicionar um novo produto?", visualizacoes: 0 },
                    { titulo: "Como gerenciar lotes de produtos?", visualizacoes: 0 }
                ]);
            }
        } catch (error) {
            console.error('Erro ao carregar perguntas:', error);
            setPerguntasSugeridas([
                { titulo: "Como adicionar um novo produto?", visualizacoes: 0 },
                { titulo: "Como gerenciar lotes de produtos?", visualizacoes: 0 }
            ]);
        } finally {
            setIsLoadingSugestoes(false);
        }
    };

    const handleSendMessage = async (mensagem) => {
        if (!mensagem.trim()) return;

        const novaMensagem = {
            id: Date.now(),
            texto: mensagem,
            tipo: 'usuario',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, novaMensagem]);
        setInputValue('');
        setIsLoading(true);

        try {
            const resultado = await getMelhorResposta(mensagem);

            let respostaTexto;
            if (resultado && resultado.conhecimento) {
                respostaTexto = resultado.conhecimento.resposta;
                
                if (resultado.score < 50) {
                    respostaTexto += `\n\n_Relevância: ${resultado.score.toFixed(0)}% - Tente reformular para obter uma resposta mais precisa._`;
                }
            } else {
                respostaTexto = "Desculpe, não encontrei uma resposta relevante para sua pergunta. Pode tentar reformular ou escolher uma das perguntas sugeridas?";
            }

            const respostaBot = {
                id: Date.now() + 1,
                texto: respostaTexto,
                tipo: 'bot',
                timestamp: new Date()
            };

            setTimeout(() => {
                setMessages(prev => [...prev, respostaBot]);
                setIsLoading(false);
            }, 500); 

        } catch (error) {
            console.error('Erro ao buscar resposta:', error);
            
            const respostaErro = {
                id: Date.now() + 1,
                texto: "Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.",
                tipo: 'bot',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, respostaErro]);
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(inputValue);
        }
    };

    const formatarHora = (data) => {
        return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="chat-overlay" onClick={onClose}></div>

            <div className={`chat-sidebar ${isOpen ? 'chat-sidebar-open' : ''}`}>
                <div className="chat-header">
                    <h2>
                        <FaComments className="chat-icon" />
                        Assistente Virtual
                    </h2>
                    <button 
                        className="chat-close-btn" 
                        onClick={onClose}
                        aria-label="Fechar chat"
                    >
                        <FaTimes />
                    </button>
                </div>

                <div className="chat-body">
                    {messages.length > 0 ? (
                        <div className="mensagens-area">
                            {messages.map(msg => (
                                <div 
                                    key={msg.id} 
                                    className={`mensagem ${msg.tipo}`}
                                >
                                    <p className="mensagem-texto">{msg.texto}</p>
                                    <span className="mensagem-hora">
                                        {formatarHora(msg.timestamp)}
                                    </span>
                                </div>
                            ))}
                            
                            {isLoading && (
                                <div className="mensagem bot loading">
                                    <FaSpinner className="spinner" />
                                    <span>Pensando...</span>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="perguntas-sugeridas">
                            <h3>📌 Perguntas Frequentes:</h3>
                            {isLoadingSugestoes ? (
                                <p className="loading-sugestoes">
                                    <FaSpinner className="spinner" /> Carregando sugestões...
                                </p>
                            ) : perguntasSugeridas.length > 0 ? (
                                perguntasSugeridas.map((pergunta, index) => (
                                    <div 
                                        key={index} 
                                        className="pergunta-card"
                                        onClick={() => handleSendMessage(pergunta.titulo)}
                                    >
                                        <div className="pergunta-content">
                                            <p>{pergunta.titulo}</p>
                                            {pergunta.visualizacoes > 0 && (
                                                <span className="badge-visualizacoes">
                                                    👁️ {pergunta.visualizacoes}
                                                </span>
                                            )}
                                        </div>
                                        {pergunta.categoria && (
                                            <span className="badge-categoria">{pergunta.categoria}</span>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p className="sem-sugestoes">Nenhuma sugestão disponível.</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="chat-input-container">
                    <input
                        type="text"
                        className="chat-input"
                        placeholder="Como posso ajudar?"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                    />
                    <button 
                        className="btn-enviar"
                        onClick={() => handleSendMessage(inputValue)}
                        disabled={!inputValue.trim() || isLoading}
                    >
                        {isLoading ? <FaSpinner className="spinner" /> : <FaPaperPlane />}
                    </button>
                </div>
            </div>
        </>
    );
};

export default ChatFAQ;