// Ruta: src/components/Layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom'; // Importar NavLink
import { useAuth } from '../../contexts/AuthContext'; //
import './Navbar.css'; //

const Navbar = () => {
  const { user, logout } = useAuth(); //
  const navigate = useNavigate();
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); // Nuevo estado para el menú de usuario
  const addMenuRef = useRef(null);
  const userMenuRef = useRef(null); // Nueva ref para el menú de usuario

  // Para la demostración, el elemento "Configuración" en el menú de usuario estará "próximamente".
  // En una app real, esto podría venir de una configuración o feature flag.
  const isUserMenuConfigComingSoon = true; 

  const handleLogout = () => {
    logout(); //
    navigate('/'); 
  };

  const homeLinkPath = user ? "/dashboard" : "/";

  const toggleAddMenu = (event) => {
    event.stopPropagation();
    setShowAddMenu(prev => !prev);
    setShowUserMenu(false); // Cerrar menú de usuario si se abre este
  };

  const toggleUserMenu = (event) => { // Nueva función para el menú de usuario
    event.stopPropagation();
    setShowUserMenu(prev => !prev);
    setShowAddMenu(false); // Cerrar menú de añadir si se abre este
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) { // Manejar clic fuera del menú de usuario
        setShowUserMenu(false);
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
        
        {user ? (
          // Menú principal para usuarios logueados, alineado a la izquierda del centro
          <ul className="nav-menu main-nav-links">
            <li className="nav-item">
              <NavLink to="/dashboard" className={({ isActive }) => "nav-links" + (isActive ? " active" : "")}>Dashboard</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/accounts" className={({ isActive }) => "nav-links" + (isActive ? " active" : "")}>Cuentas</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/reports" className={({ isActive }) => "nav-links" + (isActive ? " active" : "")}>Informes</NavLink>
            </li>
            <li className="nav-item">
              {/* Enlace "Categorías" en la barra principal, siempre funcional */}
              <NavLink to="/settings/categories" className={({ isActive }) => "nav-links" + (isActive ? " active" : "")}>
                Categorías
              </NavLink>
            </li>
          </ul>
        ) : (
          // Menú para usuarios no logueados
          <ul className="nav-menu main-nav-links">
            <li className="nav-item">
              <Link to="/como-funciona" className="nav-links">¿Cómo funciona?</Link>
            </li>
            <li className="nav-item">
              <Link to="/como-usar" className="nav-links">¿Cómo usar?</Link> {/* Enlace a la guía de uso */}
            </li>
          </ul>
        )}

        <div className="nav-actions">
          {user ? (
            <>
              {/* Botón "+ Registros" */}
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

              {/* Menú de Usuario (similar a BudgetBakers) */}
              <div className="nav-item nav-item-user-menu" ref={userMenuRef}>
                <button onClick={toggleUserMenu} className="nav-user-button">
                  <span className="nav-user-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                  <span className="nav-user-name">{user.name}</span>
                  <span className="nav-user-arrow">▼</span>
                </button>
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <div className="user-menu-header">
                      <span className="user-menu-avatar">{user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
                      <div className="user-menu-info">
                        <span className="user-menu-name">{user.name}</span>
                        <span className="user-menu-email">{user.email}</span>
                      </div>
                    </div>
                    {/* Elemento "Configuración" en el menú de usuario, con tooltip "Próximamente" y no clickeable */}
                    {isUserMenuConfigComingSoon ? (
                      <span className="user-menu-item user-menu-item-coming-soon" title="Próximamente">
                        <span className="menu-item-icon">⚙️</span> Configuración
                      </span>
                    ) : (
                      <Link to="/settings/categories" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                        <span className="menu-item-icon">⚙️</span> Configuración
                      </Link>
                    )}
                    
                    <Link to="/como-usar" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                      <span className="menu-item-icon">❓</span> Ayuda
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin/users" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                        <span className="menu-item-icon">👑</span> Admin Panel
                      </Link>
                    )}
                    <div className="user-menu-separator"></div>
                    <button onClick={handleLogout} className="user-menu-item user-menu-logout-button">
                      <span className="menu-item-icon">🚪</span> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Botones de Login/Registro para usuarios no logueados
            <>
              <Link to="/" className="button button-secondary nav-button-action">
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