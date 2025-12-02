import React, { useState } from 'react';
import { importarProdutosUpload } from '../api/produtoAPI'; // ✅ Import da API
import '../styles/ImportarProdutos.css';

const ImportarProdutos = ({ onClose, onImportSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && !selectedFile.name.endsWith('.xlsx')) {
            setError('Apenas arquivos .xlsx são permitidos.');
            setFile(null);
            return;
        }
        setFile(selectedFile);
        setError(null);
        setResult(null);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Por favor, selecione um arquivo.');
            return;
        }

        setUploading(true);
        setError(null);
        setResult(null);

        try {
            const data = await importarProdutosUpload(file);
            
            setResult(data);
            setFile(null);
            
            if (onImportSuccess) {
                setTimeout(() => {
                    onImportSuccess();
                }, 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="importar-modal-overlay" onClick={onClose}>
            <div className="importar-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="importar-modal-header">
                    <h2>📤 Importar Produtos via Excel</h2>
                    <button className="importar-close-btn" onClick={onClose}>✖</button>
                </div>

                <div className="importar-modal-body">
                    <div className="importar-instrucoes">
                        <h3>📋 Instruções:</h3>
                        <ul>
                            <li>O arquivo deve estar no formato <strong>.xlsx</strong></li>
                            <li>Colunas obrigatórias: <code>Material</code>, <code>Qtd. Estoque</code>, <code>Seção</code>, <code>Subseção</code>, <code>Estoque Valor</code>, <code>Loja</code></li>
                            <li>Produtos existentes serão <strong>atualizados</strong></li>
                            <li>Produtos novos serão <strong>criados</strong> com dados parciais</li>
                        </ul>
                    </div>

                    <div className="importar-file-input-wrapper">
                        <input
                            type="file"
                            accept=".xlsx"
                            onChange={handleFileChange}
                            disabled={uploading}
                            id="file-upload"
                            className="importar-file-input"
                        />
                        <label htmlFor="file-upload" className="importar-file-label">
                            {file ? `📄 ${file.name}` : '📁 Escolher arquivo'}
                        </label>
                    </div>

                    {error && (
                        <div className="importar-error">
                            ❌ <strong>Erro:</strong> {error}
                        </div>
                    )}

                    {result && (
                        <div className="importar-success">
                            <h3>✅ Importação Concluída!</h3>
                            <p><strong>Arquivo:</strong> {result.detalhes.arquivo}</p>
                            <p><strong>Produtos criados:</strong> {result.detalhes.produtos_criados}</p>
                            <p><strong>Produtos atualizados:</strong> {result.detalhes.produtos_atualizados}</p>
                            <p><strong>Total processado:</strong> {result.detalhes.total_processados}</p>
                        </div>
                    )}
                </div>

                <div className="importar-modal-footer">
                    <button
                        className="importar-btn-upload"
                        onClick={handleUpload}
                        disabled={!file || uploading}
                    >
                        {uploading ? '⏳ Importando...' : '📤 Importar'}
                    </button>
                    <button className="importar-btn-cancel" onClick={onClose}>
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImportarProdutos;