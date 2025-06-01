// Ruta: finanzas-app-pro/frontend/src/pages/HomePage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; //
import authService from '../services/auth.service'; //
import './HomePage.css'; //

// --- Iconos SVG (sin cambios) ---
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    <path d="M1 1h22v22H1z" fill="none"/>
  </svg>
);

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.33 12.09C19.33 9.63 21 8.23 21 8.23C20.94 8.15 19.27 7.24 18.13 7.24C16.43 7.24 15.63 8.26 14.82 8.26C14.02 8.26 13.41 7.71 12.27 7.68C10.87 7.62 9.91 8.12 9.16 8.12C8.36 8.12 7.51 7.39 6.26 7.41C4.28 7.47 2.92 8.89 2.92 11.47C2.92 15.11 5.56 17.52 7.13 17.52C7.91 17.52 8.31 16.97 9.56 16.97C10.81 16.97 11.13 17.52 11.97 17.52C13.46 17.52 14.13 16.41 14.84 16.41C15.56 16.41 16.09 16.94 16.92 16.94C17.73 16.94 18.17 16.38 18.91 16.38C19.61 16.38 20.33 17.52 21.03 17.52C21.03 17.52 21.04 15.05 19.33 15.03C19.32 15.02 17.52 14.91 17.52 13.2C17.52 11.52 19.11 11.15 19.22 11.14C19.22 11.14 19.33 11.44 19.33 12.09ZM13.6 5.09C14.27 4.31 14.69 3.26 14.58 2.23C13.54 2.34 12.58 2.93 11.93 3.72C11.35 4.41 10.86 5.52 11 6.54C12.14 6.54 13 5.77 13.6 5.09Z"/>
  </svg>
);

const HomePage = () => {
  const { user, login, loadingAuth } = useAuth(); //
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await authService.login(email, password); //
      login(userData); //
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loadingAuth && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loadingAuth, navigate]);

  if (loadingAuth || user) {
    return <div className="page-container loading-auth-home">Cargando...</div>;
  }

  return (
    <div className="homepage-layout">
      <div className="homepage-left-panel">
        <div className="panel-content-wrapper">
          <div className="hero-content">
            <h1>Tus Finanzas en Un Solo Lugar</h1>
            <p className="hero-subtitle">
              Sumérgete en tus datos, crea presupuestos, sincroniza con tus bancos (próximamente) y disfruta de la categorización automática.
            </p>
            {/* --- ENLACE A "CÓMO FUNCIONA" AÑADIDO AQUÍ --- */}
            <Link to="/como-funciona" className="learn-more-link">
              ✨ Descubre cómo funciona FinanzasApp Pro
            </Link>
            {/* --- FIN DEL ENLACE --- */}
            <div className="hero-image-container">
              <img 
                src="/img/dashboard-mockup.png" // Asumiendo que tienes una imagen de ejemplo
                alt="Finanzas App Pro en acción" 
                className="hero-image"
              />
              <p className="hero-image-caption">Finanzas App Pro en acción</p>
            </div>
            
            <div className="cafecito-button-container">
              <a href='https://cafecito.app/finanzasapp' rel='noopener noreferrer' target='_blank'>
                <img 
                  srcSet='https://cdn.cafecito.app/imgs/buttons/button_5.png 1x, https://cdn.cafecito.app/imgs/buttons/button_5_2x.png 2x, https://cdn.cafecito.app/imgs/buttons/button_5_3.75x.png 3.75x' 
                  src='https://cdn.cafecito.app/imgs/buttons/button_5.png' 
                  alt='Invitame un café en cafecito.app' 
                />
              </a>
            </div>
          </div>
        </div>
        <div className="app-branding">
          <span className="app-brand-icon">💰</span>
          <span className="app-brand-name">FinanzasApp Pro</span>
        </div>
      </div>

      <div className="homepage-right-panel">
        <div className="panel-content-wrapper">
          <div className="login-form-container-home">
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleLoginSubmit}>
              {error && <p className="error-message small-error">{error}</p>}
              <div className="form-group-home">
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@email.com" />
              </div>
              <div className="form-group-home">
                <label htmlFor="password">Contraseña:</label>
                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Tu contraseña" />
              </div>
              <button type="submit" className="button button-primary button-full-width" disabled={loading}>
                {loading ? 'Iniciando...' : 'Iniciar Sesión'}
              </button>
            </form>
            <div className="or-separator">
              <span>o continúa con</span>
            </div>
            <div className="social-login-buttons">
              <button className="button-social google" disabled>
                <span className="social-icon"><GoogleIcon /></span>
                Google
              </button>
              <button className="button-social apple" disabled>
                <span className="social-icon"><AppleIcon /></span>
                Apple
              </button>
            </div>
            <p className="signup-link-home">
              ¿No tienes una cuenta? <Link to="/register">Regístrate Aquí</Link>
            </p>
          </div>
        </div>
        <footer className="homepage-footer-text">
          Al registrarte o iniciar sesión, aceptas nuestros <Link to="/terms">Términos de Servicio</Link> y <Link to="/privacy">Política de Privacidad</Link>.
        </footer>
      </div>
    </div>
  );
};

export default HomePage;