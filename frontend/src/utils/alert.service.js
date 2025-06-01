// Ruta: src/utils/alert.service.js
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const showSuccessToast = (title = '¡Éxito!', text = '') => {
  MySwal.fire({
    title,
    text,
    icon: 'success',
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer);
      toast.addEventListener('mouseleave', Swal.resumeTimer);
    }
  });
};

const showErrorAlert = (title = 'Error', text = 'Algo salió mal.') => {
  MySwal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: 'var(--danger-color, #d33)' // Usar variable CSS o color directo
  });
};

const showConfirmationDialog = (config = {}) => {
  const defaultConfig = {
    title: '¿Estás seguro?',
    text: "¡No podrás revertir esta acción!",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: 'var(--primary-color, #3085d6)',
    cancelButtonColor: 'var(--danger-color, #d33)',
    confirmButtonText: 'Sí, ¡confirmar!',
    cancelButtonText: 'Cancelar'
  };
  const finalConfig = { ...defaultConfig, ...config };
  return MySwal.fire(finalConfig); // Retorna la promesa
};

// Podrías añadir más helpers: showInfo, showWarning, etc.

export const alertService = {
  showSuccessToast,
  showErrorAlert,
  showConfirmationDialog
};
