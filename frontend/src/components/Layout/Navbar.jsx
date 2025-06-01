// Ruta: src/components/Layout/Navbar.jsx
import React, { useState } from 'react'; // Añadir useState
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css'; // Asegúrate de crear este archivo CSS o de que los estilos estén en App.css

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddMenu, setShowAddMenu] = useState(false); // Estado para el menú desplegable

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const homeLinkPath = user ? "/dashboard" : "/";

  const toggleAddMenu = () => {
    setShowAddMenu(prev => !prev);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to={homeLinkPath} className="nav-logo">FinanzasApp</Link>
        <ul className="nav-menu">
          {user ? (
            <>
              {/* <li className="nav-item">
                <Link to="/dashboard" className="nav-links">Dashboard</Link> // Redundante si el logo ya va al dashboard
              </li> */}
              <li className="nav-item nav-item-add-record"> {/* Contenedor para el botón y el menú */}
                <button onClick={toggleAddMenu} className="nav-links nav-button nav-button-add">
                  + Registros
                </button>
                {showAddMenu && (
                  <div className="add-menu-dropdown">
                    <Link to="/transactions/add?type=ingreso" className="add-menu-item" onClick={() => setShowAddMenu(false)}>
                      Registrar Ingreso
                    </Link>
                    <Link to="/transactions/add?type=egreso" className="add-menu-item" onClick={() => setShowAddMenu(false)}>
                      Registrar Gasto
                    </Link>
                    <Link to="/accounts/add" className="add-menu-item" onClick={() => setShowAddMenu(false)}>
                      Nueva Cuenta
                    </Link>
                    <Link to="/investments/add" className="add-menu-item" onClick={() => setShowAddMenu(false)}>
                      Nueva Inversión
                    </Link>
                    {/* Puedes añadir más acciones rápidas aquí */}
                  </div>
                )}
              </li>
              {/* Mantén otros enlaces si los necesitas, como el de "Cuentas" del target */}
              <li className="nav-item">
                <Link to="/accounts" className="nav-links">Cuentas</Link>
              </li>
               <li className="nav-item">
                <Link to="/reports" className="nav-links">Informes</Link>
              </li>
               <li className="nav-item">
                <Link to="/settings/categories" className="nav-links">Configurar</Link>
              </li>
              <li className="nav-item">
                <button onClick={handleLogout} className="nav-links nav-button nav-button-logout">Cerrar Sesión</button>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to={homeLinkPath} className="nav-links">Inicio</Link>
              </li>
              <li className="nav-item">
                <Link to="/login" className="nav-links">Login</Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-links">Registro</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;