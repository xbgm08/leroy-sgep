import '../styles/App.css';
import Sidebar from '../components/Sidebar';

function App() {
  return (
    <div className="app-container">
      <Sidebar />

      <main className="main-content">
        <h1>Bem-vindo ao SGEP!</h1>
        <p>Selecione uma opção no menu para começar.</p>
      </main>
    </div>
  );
}

export default App;
