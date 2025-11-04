import React from 'react';
import '../styles/Modal.css'; 
import { FaExclamationTriangle } from 'react-icons/fa';

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header modal-header-danger">
                    <FaExclamationTriangle style={{ marginRight: '10px', color: '#dc3545' }} />
                    <h2>{title}</h2>
                </div>

                <div className="modal-body">
                    <p>{message}</p>
                </div>

                <div className="modal-footer">
                    <button className="btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="btn-confirm-delete" onClick={onConfirm}>
                        Confirmar Exclusão
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDeleteModal;