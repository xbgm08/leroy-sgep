import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.css';
import logoLeroy from '../assets/images/leroy.png';
import iconDashboard1 from '../assets/images/dashboard1.png';
import iconDashboard2 from '../assets/images/dashboard2.png';
import iconBoxes1 from '../assets/images/boxes1.png';
import iconBoxes2 from '../assets/images/boxes2.png';
import iconApi1 from '../assets/images/api1.png';
import iconApi2 from '../assets/images/api2.png';
import iconConfig1 from '../assets/images/config1.png';

const SidebarButton = ({ icon1, icon2, label, to }) => {
    const [currentIcon, setCurrentIcon] = useState(icon1);
    return (
       <Link 
            to={to} 
            className="botao"
            onMouseEnter={() => setCurrentIcon(icon2)}
            onMouseLeave={() => setCurrentIcon(icon1)}
        >
            <img className="img_buttao" src={currentIcon} alt={label} />
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

            <SidebarButton icon1={iconDashboard1} icon2={iconDashboard2} label="Dashboards" to="/" />
            <SidebarButton icon1={iconBoxes1} icon2={iconBoxes2} label="Estoque" to="/estoque" />
            <SidebarButton icon1={iconApi1} icon2={iconApi2} label="API" to="/api" />
            <SidebarButton icon1={iconConfig1} icon2={iconConfig1} label="Configurações da Conta" to="/configuracoes" />

            <hr />
        </div>
    );
};

export default Sidebar;