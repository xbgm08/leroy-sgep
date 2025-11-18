import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const createLote = async (codigo_lm, loteData) => {
    try {
        const response = await axios.post(`${API_URL}/produtos/${codigo_lm}/lotes`, loteData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error("Erro em createLote:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao criar o lote');
    }
};

export const updateLote = async (codigo_lm, codigo_lote, loteData) => {
    try {
        const response = await axios.put(`${API_URL}/produtos/${codigo_lm}/lotes/${codigo_lote}`, loteData, {
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.data;
    } catch (error) {
        console.error("Erro em updateLote:", error.response?.data || error.message);
        throw new Error(error.response?.data?.detail || 'Falha ao atualizar o lote');
    }
};

export const deleteLote = async (codigo_lm, codigo_lote) => {
    try {
        await axios.delete(`${API_URL}/produtos/${codigo_lm}/lotes/${codigo_lote}`);
        return true;
    } catch (error) {
        console.error("Erro em deleteLote:", error.response?.data || error.message);
        return false;
    }
};