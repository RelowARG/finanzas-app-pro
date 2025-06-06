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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  
  const addMenuRef = useRef(null);
  const userMenuRef = useRef(null); 
  const moreMenuRef = useRef(null);

  const handleLogout = () => { 
    logout(); 
    navigate('/'); 
  };
  const homeLinkPath = user ? "/dashboard" : "/";
  
  const closeAllMenus = () => {
    setShowAddMenu(false);
    setShowUserMenu(false);
    setShowMoreMenu(false);
  };

  // *** INICIO: LÓGICA CORREGIDA PARA LOS TOGGLES ***
  const toggleAddMenu = (event) => { 
    event.stopPropagation();
    const isOpening = !showAddMenu;
    closeAllMenus();
    if (isOpening) setShowAddMenu(true);
  };
  
  const toggleUserMenu = (event) => { 
    event.stopPropagation();
    const isOpening = !showUserMenu;
    closeAllMenus();
    if (isOpening) setShowUserMenu(true);
  };

  const toggleMoreMenu = (event) => {
    event.stopPropagation();
    const isOpening = !showMoreMenu;
    closeAllMenus();
    if (isOpening) setShowMoreMenu(true);
  };
  // *** FIN: LÓGICA CORREGIDA PARA LOS TOGGLES ***
  
  useEffect(() => { 
    const handleClickOutside = (event) => {
      // El chequeo de los refs ya es correcto para cerrar los menús
      if (addMenuRef.current && !addMenuRef.current.contains(event.target)) {
        setShowAddMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) { 
        setShowUserMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleGenericModalClose = () => {
    // Lógica opcional tras cerrar un modal
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
              <NavLink to="/transactions" className={({ isActive }) => "nav-links" + (isActive ? " active" : "")}>Movimientos</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/reports" className={({ isActive }) => "nav-links" + (isActive ? " active" : "")}>Informes</NavLink>
            </li>
            <li className="nav-item nav-item-more" ref={moreMenuRef}>
                <button onClick={toggleMoreMenu} className="nav-links more-menu-button">
                    Más <span>▼</span>
                </button>
                {showMoreMenu && (
                    <div className="more-menu-dropdown">
                        <Link to="/investments" className="more-menu-item" onClick={closeAllMenus}>💹 Inversiones</Link>
                        <Link to="/budgets" className="more-menu-item" onClick={closeAllMenus}>🎯 Presupuestos</Link>
                        <Link to="/goals" className="more-menu-item" onClick={closeAllMenus}>🏆 Metas</Link>
                        <Link to="/debts-loans" className="more-menu-item" onClick={closeAllMenus}>🤝 Deudas y Préstamos</Link>
                    </div>
                )}
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
                    <button onClick={() => { openModal(MODAL_TYPES.ADD_TRANSACTION, { onTransactionCreated: handleGenericModalClose, initialTypeFromButton: 'ingreso' }); closeAllMenus(); }} className="add-menu-item">
                      Registrar Ingreso
                    </button>
                    <button onClick={() => { openModal(MODAL_TYPES.ADD_TRANSACTION, { onTransactionCreated: handleGenericModalClose, initialTypeFromButton: 'egreso' }); closeAllMenus(); }} className="add-menu-item">
                      Registrar Gasto
                    </button>
                    <button onClick={() => { openModal(MODAL_TYPES.ADD_ACCOUNT, { onAccountCreated: handleGenericModalClose }); closeAllMenus(); }} className="add-menu-item">
                      Nueva Cuenta
                    </button>
                    <Link to="/investments/add" className="add-menu-item" onClick={closeAllMenus}>
                      Nueva Inversión
                    </Link>
                    <button onClick={() => { openModal(MODAL_TYPES.ADD_RECURRING_TRANSACTION, { onRecurringTransactionCreated: handleGenericModalClose }); closeAllMenus(); }} className="add-menu-item">
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
                    <div className="user-menu-item with-submenu">
                      <span className="menu-item-icon">⚙️</span> Configuración
                      <div className="user-submenu">
                          <Link to="/settings/categories" className="user-submenu-item" onClick={closeAllMenus}>Categorías</Link>
                          <Link to="/settings/recurring-transactions" className="user-submenu-item" onClick={closeAllMenus}>Mov. Recurrentes</Link>
                          <Link to="/settings/exchange-rates" className="user-submenu-item" onClick={closeAllMenus}>Tasas de Cambio</Link>
                      </div>
                    </div>
                    <Link to="/como-usar" className="user-menu-item" onClick={closeAllMenus}>
                      <span className="menu-item-icon">❓</span> Ayuda
                    </Link>
                    {user.role === 'admin' && (
                      <Link to="/admin" className="user-menu-item" onClick={closeAllMenus}>
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