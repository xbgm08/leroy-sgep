import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const getFornecedores = async () => {
  try {
    const response = await axios.get(`${API_URL}/fornecedores`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    throw error;
  }
};