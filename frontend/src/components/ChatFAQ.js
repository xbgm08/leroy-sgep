import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaComments, FaTimes } from 'react-icons/fa';
import '../styles/ChatFAQ.css';

const ChatFAQ = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    const perguntasSugeridas = [
        "Qual o valor dos produtos com validade 'segura' em risco?",
        "Quais são as categorias de etiquetas disponíveis?",
        "O que significa os três pontos no documento?",
        "Como adicionar um novo produto?",
        "Como gerenciar lotes de produtos?"
    ];

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = (mensagem) => {
        if (!mensagem.trim()) return;

        const novaMensagem = {
            id: Date.now(),
            texto: mensagem,
            tipo: 'usuario',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, novaMensagem]);

        setTimeout(() => {
            const respostaBot = {
                id: Date.now() + 1,
                texto: gerarResposta(mensagem),
                tipo: 'bot',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, respostaBot]);
        }, 1000);

        setInputValue('');
    };

    const gerarResposta = (pergunta) => {
        const respostas = {
            "validade": "Os produtos com validade 'segura' são aqueles que vencem em mais de 90 dias. Você pode consultar o valor total no painel de estoque.",
            "etiquetas": "As categorias de etiquetas são: Verde (Seguro), Amarelo (Atenção), Laranja (Crítico), Vermelho (Vencido) e Preto (Sem Lotes).",
            "três pontos": "Os três pontos no documento indicam o menu de ações, onde você pode editar, excluir ou visualizar mais detalhes.",
            "adicionar produto": "Para adicionar um produto, clique no botão 'Cadastrar Produto' na página de Estoque e preencha o formulário.",
            "lotes": "Para gerenciar lotes, clique no ícone de lista na linha do produto. Lá você pode adicionar, editar ou excluir lotes."
        };

        const chave = Object.keys(respostas).find(key => 
            pergunta.toLowerCase().includes(key)
        );

        return chave 
            ? respostas[chave] 
            : "Desculpe, não entendi sua pergunta. Pode reformular ou escolher uma das perguntas sugeridas?";
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
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
                        Ajuda SGEP
                    </h2>
                    <button className="chat-close-btn" onClick={onClose}>
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
                            <div ref={messagesEndRef} />
                        </div>
                    ) : (
                        <div className="perguntas-sugeridas">
                            <h3>Perguntas Frequentes:</h3>
                            {perguntasSugeridas.map((pergunta, index) => (
                                <div 
                                    key={index} 
                                    className="pergunta-card"
                                    onClick={() => handleSendMessage(pergunta)}
                                >
                                    <p>{pergunta}</p>
                                    <button className="btn-enviar-sugestao">
                                        Enviar <FaPaperPlane className="icon-enviar" />
                                    </button>
                                </div>
                            ))}
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
                    />
                    <button 
                        className="btn-enviar"
                        onClick={() => handleSendMessage(inputValue)}
                        disabled={!inputValue.trim()}
                    >
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </>
    );
};

export default ChatFAQ;