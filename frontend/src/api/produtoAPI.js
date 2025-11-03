const API_URL = process.env.REACT_APP_BACKEND_URL;

export const getProdutos = async () => {
    try {
        const response = await fetch(`${API_URL}/produtos/`);
        if (!response.ok) {
            console.error('Erro ao buscar produtos da API:', response.statusText);
            throw new Error('Falha ao buscar produtos da API');
        }
        const data = await response.json();
        console.log('Produtos carregados:', data);
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
};