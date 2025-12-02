import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const getDashboardData = async () => {
    try {
        const response = await axios.get(`${API_URL}/dashboard/kpis`);
        return response.data;
    } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error);
        throw error;
    }
};