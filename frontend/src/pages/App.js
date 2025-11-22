import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Estoque from './Estoque';
import Fornecedores from './Fornecedores';
import BaseConhecimento from './BaseConhecimento';
import ChatButton from '../components/ChatButton';
import '../styles/App.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <Routes>
          <Route path="/estoque" element={<Estoque />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/base-conhecimento" element={<BaseConhecimento />} />
        </Routes>
        <ChatButton />
      </main>
    </div>
  );
}

export default App;
