import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Estoque from './Estoque';
import '../styles/App.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <h1>Bem-vindo ao SGEP!</h1>
        <p>Selecione uma opção no menu para começar.</p>
        <Routes>
          <Route path="/estoque" element={<Estoque />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
