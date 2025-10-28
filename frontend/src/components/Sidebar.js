import React, { useState, useEffect } from 'react';
import '../styles/Sidebar.css';
import logoLeroy from '../assets/images/leroy.png';
import iconDashboard1 from '../assets/images/dashboard1.png';
import iconDashboard2 from '../assets/images/dashboard2.png';
import iconBoxes1 from '../assets/images/boxes1.png';
import iconBoxes2 from '../assets/images/boxes2.png';
import iconPeople1 from '../assets/images/people1.png';
import iconPeople2 from '../assets/images/people2.png';
import iconApi1 from '../assets/images/api1.png';
import iconApi2 from '../assets/images/api2.png';
import iconConfig1 from '../assets/images/config1.png';

const SidebarButton = ({ icon1, icon2, label, ...props }) => {
    const [currentIcon, setCurrentIcon] = useState(icon1);
    return (
        <div 
            className="botao"
            onMouseEnter={() => setCurrentIcon(icon2)}
            onMouseLeave={() => setCurrentIcon(icon1)}
            {...props}
        >
            <img className="img_buttao" src={currentIcon} alt={label} />
            <p>{label}</p>
        </div>
    );
};

const Sidebar = () => {
    const handleNavigation = (pageKey) => {
        console.log(`Navegando para a página: ${pageKey}`);
    };

    return (
        <div className="sidebar">
            <div className="titulos">
                <img src={logoLeroy} alt="Logo Leroy Merlin" />
                <h2>LOSS PREVENTION</h2>
            </div>

            <SidebarButton icon1={iconDashboard1} icon2={iconDashboard2} label="Dashboards" />
            <SidebarButton icon1={iconBoxes1} icon2={iconBoxes2} label="Estoque" />
            <SidebarButton icon1={iconPeople1} icon2={iconPeople2} label="Gerenciamento de Contas" />
            <SidebarButton icon1={iconApi1} icon2={iconApi2} label="API" />
            <SidebarButton icon1={iconConfig1} icon2={iconConfig1} label="Configurações da Conta" />

            <hr />
        </div>
    );
};

export default Sidebar;