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

export const getProdutos = async () => {
    try {
        const response = await axios.get(`${API_URL}/produtos/`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar produtos da API:', error.response?.data || error.message);
        return [];
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