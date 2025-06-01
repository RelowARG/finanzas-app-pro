// Ruta: src/components/Layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext'; //
import './Navbar.css'; //

const Navbar = () => {
  const { user, logout } = useAuth(); //
  const navigate = useNavigate();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const addMenuRef = useRef(null);

  const handleLogout = () => {
    logout(); //
    navigate('/'); 
  };

  const homeLinkPath = user ? "/dashboard" : "/";

  const toggleAddMenu = (event) => {
    event.stopPropagation();
    setShowAddMenu(prev => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  return (
    <nav className="navbar new-style">
      <div className="nav-container">
        <Link to={homeLinkPath} className="nav-logo">
          FinanzasApp
        </Link>
        
        <ul className="nav-menu main-nav-links">
          {user ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-links">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link to="/accounts" className="nav-links">Cuentas</Link>
              </li>
               <li className="nav-item">
                <Link to="/reports" className="nav-links">Informes</Link>
              </li>
               <li className="nav-item">
                <Link to="/settings/categories" className="nav-links">Configurar</Link>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/como-funciona" className="nav-links">¿Cómo funciona?</Link>
              </li>
            </>
          )}
        </ul>

        <div className="nav-actions">
          {user ? (
            <>
              <div className="nav-item nav-item-add-record" ref={addMenuRef}>
                <button onClick={toggleAddMenu} className="button button-primary nav-button-action">
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
                  </div>
                )}
              </div>
              <button onClick={handleLogout} className="button button-secondary nav-button-action">Cerrar Sesión</button>
            </>
          ) : (
            <>
              {/* *** CAMBIO EN EL 'to' DEL LINK DE INICIAR SESIÓN *** */}
              <Link to="/" className="button button-secondary nav-button-action"> {/* CAMBIADO de /login a / */}
                Iniciar Sesión
              </Link>
              <Link to="/register" className="button button-primary nav-button-action">
                Regístrate
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;