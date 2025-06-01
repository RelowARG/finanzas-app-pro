// Ruta: finanzas-app-pro/frontend/src/hooks/useInactivityTimeout.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext'; //
import { useNavigate } from 'react-router-dom';

// --- TIEMPOS PARA PRUEBA ---
//const INACTIVITY_TIMEOUT_MS = 7 * 1000; // 7 segundos para mostrar advertencia
//const WARNING_DURATION_SECONDS = 5;    // 5 segundos de cuenta regresiva en el modal
// --- TIEMPOS PARA PRODUCCIÓN (ejemplo) ---
 const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos
 const WARNING_DURATION_SECONDS = 60; // 60 segundos

export const useInactivityTimeout = () => {
  const { user, logout } = useAuth(); //
  const navigate = useNavigate();
  
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION_SECONDS);

  const inactivityTimerIdRef = useRef(null);
  const warningCountdownTimerIdRef = useRef(null);
  const isModalOpenRef = useRef(false); // Usamos un ref para el estado del modal en los listeners

  // Actualizar el ref cuando el estado del modal cambie
  useEffect(() => {
    isModalOpenRef.current = isWarningModalOpen;
  }, [isWarningModalOpen]);

  const clearAllTimers = useCallback(() => {
    clearTimeout(inactivityTimerIdRef.current);
    inactivityTimerIdRef.current = null;
    clearInterval(warningCountdownTimerIdRef.current);
    warningCountdownTimerIdRef.current = null;
    // console.log('Hook: All timers cleared.');
  }, []);
  
  const performLogout = useCallback(() => {
    // console.log('Hook: Performing logout.');
    logout(); //
    setIsWarningModalOpen(false); 
    clearAllTimers();
    navigate('/');
  }, [logout, navigate, clearAllTimers, setIsWarningModalOpen]);

  const startWarningCountdown = useCallback(() => {
    // console.log('Hook: Starting warning countdown.');
    setIsWarningModalOpen(true);
    setCountdown(WARNING_DURATION_SECONDS);

    clearAllTimers(); // Limpiar timer principal, ya que ahora estamos en modo advertencia

    warningCountdownTimerIdRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          performLogout(); 
          return WARNING_DURATION_SECONDS; 
        }
        // console.log('Hook: Modal Countdown:', prev - 1);
        return prev - 1;
      });
    }, 1000);
  }, [performLogout, clearAllTimers, setIsWarningModalOpen, setCountdown]);

  const resetMainInactivityTimer = useCallback(() => {
    clearAllTimers(); // Limpiar todos los timers primero
    setIsWarningModalOpen(false); // Asegurar que el modal se cierre

    if (user) { 
      // console.log(`Hook: Starting main inactivity timer for ${INACTIVITY_TIMEOUT_MS / 1000}s.`);
      inactivityTimerIdRef.current = setTimeout(() => {
        // console.log('Hook: Main inactivity timer expired. Showing warning.');
        // Verificar de nuevo el usuario por si se deslogueó mientras el timer corría.
        if (user && !isModalOpenRef.current) { // No mostrar si ya está abierto por alguna razón
            startWarningCountdown();
        }
      }, INACTIVITY_TIMEOUT_MS);
    }
  }, [user, clearAllTimers, startWarningCountdown, setIsWarningModalOpen]);


  useEffect(() => {
    if (user) {
      // console.log('Hook Effect [user]: User detected. Initializing inactivity detection.');
      resetMainInactivityTimer(); // Iniciar el timer principal

      const activityHandler = () => {
        // Solo resetear si el modal de advertencia NO está abierto (usar el ref)
        if (!isModalOpenRef.current) {
          // console.log('Hook Effect [user]: Activity detected. Resetting main timer.');
          resetMainInactivityTimer();
        } else {
          // console.log('Hook Effect [user]: Activity detected, but warning modal is open. No reset.');
        }
      };
      
      const activityEvents = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
      activityEvents.forEach(event => window.addEventListener(event, activityHandler, { passive: true }));

      return () => {
        // console.log('Hook Effect [user]: Cleanup. Removing activity listeners and clearing timers.');
        activityEvents.forEach(event => window.removeEventListener(event, activityHandler));
        clearAllTimers(); // Limpiar todos los timers al desmontar o si 'user' cambia
      };
    } else {
      // Si no hay usuario (logout o nunca se logueó)
      // console.log('Hook Effect [user]: No user. Clearing timers and ensuring modal is closed.');
      clearAllTimers();
      setIsWarningModalOpen(false);
    }
  }, [user, resetMainInactivityTimer, clearAllTimers, setIsWarningModalOpen]); // Depender de user y las funciones memoizadas


  const handleStayLoggedIn = () => {
    // console.log('Hook: User clicked "Mantener Sesión".');
    resetMainInactivityTimer(); // Esto limpiará el timer de advertencia, cerrará el modal y reiniciará el timer principal
  };

  return { 
    isWarningModalOpen, 
    countdown, 
    handleStayLoggedIn 
  };
};