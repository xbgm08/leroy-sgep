import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const getMelhorResposta = async (mensagem) => {
    try {
        const response = await axios.get(`${API_URL}/base-conhecimento/resposta/melhor`, {
            params: { mensagem }
        });
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error;
    }
};

export const buscarRespostas = async (mensagem, minScore = 30.0, maxResultados = 3) => {
    try {
        const response = await axios.post(`${API_URL}/base-conhecimento/buscar`, null, {
            params: {
                mensagem,
                min_score: minScore,
                max_resultados: maxResultados
            }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar respostas:', error);
        return [];
    }
};

export const listarConhecimentos = async (apenasAtivos = true) => {
    try {
        const response = await axios.get(`${API_URL}/base-conhecimento/`, {
            params: { apenas_ativos: apenasAtivos }
        });
        return response.data;
    } catch (error) {
        console.error('Erro ao listar conhecimentos:', error);
        return [];
    }
};

export const criarConhecimento = async (conhecimento) => {
    try {
        const response = await axios.post(`${API_URL}/base-conhecimento`, conhecimento);
        return response.data;
    } catch (error) {
        console.error('Erro ao criar conhecimento:', error);
        throw error;
    }
};

export const atualizarConhecimento = async (id, conhecimento) => {
    try {
        const response = await axios.put(`${API_URL}/base-conhecimento/${id}`, conhecimento);
        return response.data;
    } catch (error) {
        console.error('Erro ao atualizar conhecimento:', error);
        throw error;
    }
};

export const deletarConhecimento = async (id) => {
    try {
        await axios.delete(`${API_URL}/base-conhecimento/${id}`);
        return true;
    } catch (error) {
        console.error('Erro ao deletar conhecimento:', error);
        throw error;
    }
};