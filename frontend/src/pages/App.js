import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Estoque from './Estoque';
import Fornecedores from './Fornecedores';
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
        </Routes>
        <ChatButton />
      </main>
    </div>
  );
}

export default App;
