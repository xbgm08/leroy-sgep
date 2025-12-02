import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const createProduto = async (produtoData) => {
    try {
        const response = await axios.post(`${API_URL}/produtos`, produtoData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error("Erro em createProduto:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao criar o produto');
    }
};

export const updateProduto = async (codigo_lm, produtoData) => {
    try {
        const response = await axios.put(`${API_URL}/produtos/${codigo_lm}`, produtoData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error("Erro em updateProduto:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao atualizar o produto');
    }
};

export const getProdutos = async (skip = 0, limit = 50, termo = '') => {
    try {
        const params = new URLSearchParams();
        params.append('skip', skip);
        params.append('limit', limit);
        if (termo) {
            params.append('termo', termo);
        }
        
        const response = await axios.get(`${API_URL}/produtos/?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw error;
    }
};

export const deleteProduto = async (codigo_lm) => {
    try {
        await axios.delete(`${API_URL}/produtos/${codigo_lm}`);
        return true;
    } catch (error) {
        console.error("Erro em deleteProduto:", error.response?.data || error.message);
        return false;
    }
};

export const importarProdutosUpload = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(
            `${API_URL}/produtos/importar-upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    } catch (error) {
        console.error("Erro em importarProdutosUpload:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Erro ao fazer upload do arquivo.');
    }
};