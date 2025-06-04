// Ruta: src/components/Layout/Navbar.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, NavLink } from 'react-router-dom'; 
import { useAuth } from '../../contexts/AuthContext'; 
import { useModals, MODAL_TYPES } from '../../contexts/ModalContext';
import './Navbar.css'; 

const Navbar = () => {
  const { user, logout } = useAuth(); 
  const navigate = useNavigate();
  const { openModal } = useModals();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false); 
  const addMenuRef = useRef(null);
  const userMenuRef = useRef(null); 

  const isUserMenuConfigComingSoon = false; 

  const handleLogout = () => { 
    logout(); 
    navigate('/'); 
  };
  const homeLinkPath = user ? "/dashboard" : "/";
  
  const toggleAddMenu = (event) => { 
    event.stopPropagation();
    setShowAddMenu(prev => !prev);
    setShowUserMenu(false); 
  };
  
  const toggleUserMenu = (event) => { 
    event.stopPropagation();
    setShowUserMenu(prev => !prev);
    setShowAddMenu(false); 
  };
  
  useEffect(() => { 
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) { 
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleGenericModalClose = () => {
    console.log("Modal cerrado/creado desde Navbar.");
    // Podrías querer forzar una recarga de datos del dashboard aquí si es necesario.
    // Por ejemplo, si fetchDashboardData estuviera disponible vía contexto:
    // if (typeof fetchDashboardData === 'function') fetchDashboardData();
  };

  return (
    <nav className="navbar new-style">
      <div className="nav-container">
        <Link to={homeLinkPath} className="nav-logo">
          FinanzasApp
        </Link>
        
        {user ? (
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
          </ul>
        ) : (
          <ul className="nav-menu main-nav-links">
            <li className="nav-item">
              <Link to="/como-funciona" className="nav-links">¿Cómo funciona?</Link>
            </li>
            <li className="nav-item">
              <Link to="/como-usar" className="nav-links">¿Cómo usar?</Link>
            </li>
          </ul>
        )}

        <div className="nav-actions">
          {user ? (
            <>
              <div className="nav-item nav-item-add-record" ref={addMenuRef}>
                <button onClick={toggleAddMenu} className="button button-primary nav-button-action">
                  + Registros
                </button>
                {showAddMenu && (
                  <div className="add-menu-dropdown">
                    <button 
                        onClick={() => {
                            openModal(MODAL_TYPES.ADD_TRANSACTION, { 
                                onTransactionCreated: handleGenericModalClose, // O una función más específica
                                initialTypeFromButton: 'ingreso' 
                            });
                            setShowAddMenu(false);
                        }}
                        className="add-menu-item"
                    >
                      Registrar Ingreso
                    </button>
                    <button 
                        onClick={() => {
                            openModal(MODAL_TYPES.ADD_TRANSACTION, { 
                                onTransactionCreated: handleGenericModalClose,
                                initialTypeFromButton: 'egreso' 
                            });
                            setShowAddMenu(false);
                        }}
                        className="add-menu-item"
                    >
                      Registrar Gasto
                    </button>
                    <button 
                        onClick={() => {
                            openModal(MODAL_TYPES.ADD_ACCOUNT, { 
                                onAccountCreated: handleGenericModalClose 
                            });
                            setShowAddMenu(false);
                        }}
                        className="add-menu-item"
                    >
                      Nueva Cuenta
                    </button>
                    <Link to="/investments/add" className="add-menu-item" onClick={() => setShowAddMenu(false)}>
                      Nueva Inversión
                    </Link>
                    {/* *** BOTÓN DE NUEVO RECURRENTE MODIFICADO *** */}
                    <button 
                        onClick={() => {
                            openModal(MODAL_TYPES.ADD_RECURRING_TRANSACTION, { 
                                onRecurringTransactionCreated: handleGenericModalClose // O una func. específica
                            });
                            setShowAddMenu(false);
                        }}
                        className="add-menu-item"
                    >
                      Nuevo Recurrente
                    </button>
                  </div>
                )}
              </div>
              
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
                    {isUserMenuConfigComingSoon ? (
                      <span className="user-menu-item user-menu-item-coming-soon" title="Próximamente">
                        <span className="menu-item-icon">⚙️</span> Configuración
                      </span>
                    ) : (
                      <Link to="/settings" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                        <span className="menu-item-icon">⚙️</span> Configuración
                      </Link>
                    )}
                    
                    <Link to="/como-usar" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
                      <span className="menu-item-icon">❓</span> Ayuda
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="user-menu-item" onClick={() => setShowUserMenu(false)}>
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
            <>
              <Link to="/login" className="button button-secondary nav-button-action">
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