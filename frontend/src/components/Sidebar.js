import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaChartLine, FaBoxes, FaTruck, FaCode, FaCog } from 'react-icons/fa';
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
                <h2>LOSS PREVENTION</h2>
            </div>

            <SidebarButton icon={FaChartLine} label="Dashboards" to="/" />
            <SidebarButton icon={FaBoxes} label="Estoque" to="/estoque" />
            <SidebarButton icon={FaTruck} label="Fornecedores" to="/fornecedores" />
            <SidebarButton icon={FaCode} label="API" to="/api" />
            <SidebarButton icon={FaCog} label="Configurações da Conta" to="/configuracoes" />

            <hr />
        </div>
    );
};

export default Sidebar;