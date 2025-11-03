import React from 'react';
import '../styles/Estoque.css'; 

const Estoque = () => {
  return (
    <> 
      <div className="titulo"> 
        <h2>Estoque</h2>
        <h4>Aba dos Produtos</h4>
      </div>

      <button className="fora">Cadastrar Produto</button>

      <input type="text" placeholder="Pesquisar" />

      <div className="tabela">
        <table>
          <thead> 
            <tr>
              <th>N° do Lote</th>
              <th>Nome do Produto</th>
              <th>Seção / Subseção</th>
              <th>Total em Estoque</th>
              <th>Data de Validade</th>
              <th>Localização</th>
              <th> </th> 
              <th> </th> 
              <th>Etiqueta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>LOTE-EXEMPLO-01</td>
              <td>Argamassa ACIII Cinza</td>
              <td>Construção / Argamassas</td>
              <td>150</td>
              <td>2025-12-01</td>
              <td>Corredor 5, Prateleira 3</td>
              <td><button>Adicionar Lote</button></td>
              <td><button>Editar Lote</button></td>
              <td className="cor verde">Seguro</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Estoque;