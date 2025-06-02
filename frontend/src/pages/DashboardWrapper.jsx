// Ruta: finanzas-app-pro/frontend/src/pages/DashboardWrapper.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // useLocation podría no ser necesaria ahora
import { useDashboardData } from '../hooks/useDashboardData'; //
import LoadingScreen from '../components/Layout/LoadingScreen'; //
import { useAuth } from '../contexts/AuthContext'; //

const MIN_LOADING_DURATION_MS = 1000; 

const DashboardWrapper = () => {
  const { user, isInitialLoadAfterLogin, clearInitialLoadAfterLoginFlag } = useAuth(); //
  const { loadingStates, apiData, error: dataApiError, fetchDashboardData } = useDashboardData(); //

  const [isMinDurationElapsed, setIsMinDurationElapsed] = useState(!isInitialLoadAfterLogin); // Si no es carga inicial, asumir duración cumplida
  const minDurationTimerRef = useRef(null);
  const initialLoadCompletedRef = useRef(false); // Para asegurar que clearInitialLoadAfterLoginFlag se llame una vez

  useEffect(() => {
    // Si es la carga inicial después del login, iniciar el temporizador de duración mínima
    if (isInitialLoadAfterLogin) {
      setIsMinDurationElapsed(false);
      initialLoadCompletedRef.current = false; // Resetear para la próxima vez
      
      if (minDurationTimerRef.current) {
        clearTimeout(minDurationTimerRef.current);
      }
      minDurationTimerRef.current = setTimeout(() => {
        setIsMinDurationElapsed(true);
      }, MIN_LOADING_DURATION_MS);
    } else {
        // Si no es la carga inicial post-login, no necesitamos la duración mínima forzada
        setIsMinDurationElapsed(true);
    }

    return () => {
      clearTimeout(minDurationTimerRef.current);
    };
  }, [isInitialLoadAfterLogin, user]); // Depender de user también por si cambia (logout/login)

  // Efecto para limpiar el flag después de que la carga inicial haya terminado
  useEffect(() => {
    if (isInitialLoadAfterLogin && !loadingStates.overall && isMinDurationElapsed && !initialLoadCompletedRef.current) {
      // console.log("DashboardWrapper: Carga inicial completada, limpiando flag.");
      clearInitialLoadAfterLoginFlag();
      initialLoadCompletedRef.current = true;
    }
  }, [loadingStates.overall, isMinDurationElapsed, isInitialLoadAfterLogin, clearInitialLoadAfterLoginFlag]);

  // Determinar si se debe mostrar la LoadingScreen específica de "Preparando tu dashboard..."
  const showWelcomeLoadingScreen = isInitialLoadAfterLogin && (loadingStates.overall || !isMinDurationElapsed);

  if (showWelcomeLoadingScreen) {
    return <LoadingScreen message="Preparando tu dashboard..." />; //
  }
  
  // Si hubo un error crítico general y no estamos mostrando la pantalla de carga de bienvenida
  if (dataApiError?.general) { // Ya no depende de isMinDurationElapsed aquí
     console.error("Error general del dashboard:", dataApiError.general);
     return (
        <div className="page-container error-page" style={{textAlign: 'center', padding: '50px'}}>
            <h2>Oops! Algo salió mal.</h2>
            <p>No pudimos cargar completamente tu dashboard: {typeof dataApiError.general === 'string' ? dataApiError.general : 'Error desconocido'}</p>
            <button onClick={() => fetchDashboardData(true)} className="button button-primary">
                Intentar de Nuevo
            </button>
        </div>
     );
  }

  // Si es una carga subsecuente (no la inicial post-login) y los datos aún están cargando
  // podrías mostrar un loader más sutil aquí, o dejar que los widgets manejen su propio estado de carga.
  // Por ahora, si no es el "welcome loading", directamente intentamos renderizar el Outlet.
  // El Outlet ya recibe 'dashboardLoadingStates' para que DashboardPage y sus hijos puedan reaccionar.
  // if (!isInitialLoadAfterLogin && loadingStates.overall) {
  // return <div className="page-container loading-auth-home">Actualizando dashboard...</div>; // O un spinner más pequeño
  // }

  return <Outlet context={{ dashboardApiData: apiData, dashboardLoadingStates: loadingStates, dashboardApiError: dataApiError, fetchDashboardData }} />;
};

export default DashboardWrapper;