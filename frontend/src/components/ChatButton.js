import React, { useState } from 'react';
import { FaComments } from 'react-icons/fa';
import ChatFAQ from './ChatFAQ';
import '../styles/ChatButton.css';

const ChatButton = () => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    return (
        <>
            <button 
                className="floating-chat-button" 
                onClick={toggleChat}
                title="Abrir Chat de Ajuda"
            >
                <FaComments className="floating-chat-icon" />
            </button>

            <ChatFAQ isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
        </>
    );
};

export default ChatButton;