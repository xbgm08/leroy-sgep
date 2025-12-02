import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChartLine, FaBoxes, FaTruck, FaBrain, FaCode } from 'react-icons/fa';
import '../styles/Sidebar.css';
import logoLeroy from '../assets/images/leroy.png';

const SidebarButton = ({ icon: Icon, label, to }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            className={`botao ${isActive ? 'active' : ''}`}
        >
            <Icon className="icon-buttao" />
            <p>{label}</p>
        </Link>
    );
};

const Sidebar = () => {
    return (
        <div className="sidebar">
            <div className="titulos">
                <img src={logoLeroy} alt="Logo Leroy Merlin" />
                <h2>Sistema de Gestão do Estoque de Perecíveis</h2>
            </div>

            <SidebarButton icon={FaChartLine} label="Dashboards" to="/dashboard" />
            <SidebarButton icon={FaBoxes} label="Estoque" to="/estoque" />
            <SidebarButton icon={FaTruck} label="Fornecedores" to="/fornecedores" />
            <SidebarButton icon={FaBrain} label="Base de Conhecimento" to="/base-conhecimento" />
            <SidebarButton icon={FaCode} label="API Reference" to="/api-reference" />

            <hr />
        </div>
    );
};

export default Sidebar;