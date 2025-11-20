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

export const getFornecedorByCNPJ = async (cnpj) => {
  try {
    const response = await axios.get(`${API_URL}/fornecedores/${cnpj}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    throw error;
  }
};

export const createFornecedor = async (fornecedor) => {
  try {
    const response = await axios.post(`${API_URL}/fornecedores`, fornecedor);
    return response.data;
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    throw error;
  }
};

export const updateFornecedor = async (cnpj, fornecedor) => {
  try {
    const response = await axios.put(`${API_URL}/fornecedores/${cnpj}`, fornecedor);
    return response.data;
  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    throw error;
  }
};

export const deleteFornecedor = async (cnpj) => {
  try {
    await axios.delete(`${API_URL}/fornecedores/${cnpj}`);
    return true;
  } catch (error) {
    console.error('Erro ao deletar fornecedor:', error);
    throw error;
  }
};