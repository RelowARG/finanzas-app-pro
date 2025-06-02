// Ruta: finanzas-app-pro/frontend/src/pages/DashboardWrapper.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardData'; //
import LoadingScreen from '../components/Layout/LoadingScreen'; //
import { useAuth } from '../contexts/AuthContext'; //

const MIN_LOADING_DURATION_MS = 1000; // <--- CAMBIO AQUÍ: 3 segundos

const DashboardWrapper = () => {
  const { user } = useAuth(); //
  // El hook useDashboardData se encarga de llamar a fetchDashboardData cuando 'user' cambia.
  const { loadingStates, apiData, error: dataApiError, fetchDashboardData } = useDashboardData(); //

  const [isMinDurationElapsed, setIsMinDurationElapsed] = useState(false);
  const minDurationTimerRef = useRef(null);

  useEffect(() => {
    // Iniciar el temporizador para la duración mínima de la pantalla de carga
    setIsMinDurationElapsed(false); // Resetear al montar o si el usuario cambia
    
    // Limpiar cualquier temporizador anterior si el componente se remonta o 'user' cambia
    if (minDurationTimerRef.current) {
      clearTimeout(minDurationTimerRef.current);
    }

    minDurationTimerRef.current = setTimeout(() => {
      setIsMinDurationElapsed(true);
    }, MIN_LOADING_DURATION_MS);

    return () => {
      clearTimeout(minDurationTimerRef.current); // Limpiar el temporizador al desmontar
    };
  }, [user]); // Depender de 'user' para reiniciar el timer si el usuario cambia (ej. logout y login)

  // Determinar si se debe mostrar la pantalla de carga
  // Se muestra si:
  // 1. Los datos generales del dashboard aún están cargando (loadingStates.overall es true)
  // O
  // 2. No ha transcurrido la duración mínima de 3 segundos (isMinDurationElapsed es false)
  const shouldShowLoadingScreen = loadingStates.overall || !isMinDurationElapsed;

  if (shouldShowLoadingScreen) {
    return <LoadingScreen message="Preparando tu dashboard..." />; //
  }
  
  // Si hubo un error crítico general y no estamos mostrando la pantalla de carga por duración mínima
  if (dataApiError?.general && isMinDurationElapsed) {
     console.error("Error general del dashboard:", dataApiError.general);
     // Podrías tener una pantalla de error más elaborada aquí
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

  // Una vez que los datos están cargados Y ha pasado la duración mínima, renderiza el contenido.
  return <Outlet context={{ dashboardApiData: apiData, dashboardLoadingStates: loadingStates, dashboardApiError: dataApiError, fetchDashboardData }} />;
};

export default DashboardWrapper;