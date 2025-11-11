const API_URL = process.env.REACT_APP_BACKEND_URL;

export const createProduto = async (produtoData) => {
    try {
        const response = await fetch(`${API_URL}/produtos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(produtoData),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Falha ao criar o produto');
        }
        
        return await response.json(); 
    } catch (error) {
        console.error("Erro em createProduto:", error);
        throw error; 
    }
};

export const getProdutos = async () => {
    try {
        const response = await fetch(`${API_URL}/produtos/`);
        if (!response.ok) {
            console.error('Erro ao buscar produtos da API:', response.statusText);
            throw new Error('Falha ao buscar produtos da API');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        return [];
    }
};

export const deleteProduto = async (codigo_lm) => {
    try {
        const response = await fetch(`${API_URL}/produtos/${codigo_lm}`, {
            method: 'DELETE',
        });
        
        return response.ok; 
    } catch (error) {
        console.error("Erro em deleteProduto:", error);
        return false; 
    }
};