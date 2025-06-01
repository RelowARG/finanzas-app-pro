// Ruta: finanzas-app-pro/frontend/src/pages/AdminUsersPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import adminService from '../services/admin.service'; //
import { alertService } from '../utils/alert.service'; //
import './AdminUsersPage.css'; //

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit' // Opcional: añadir segundos si se desea más precisión
  });
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminService.getUsers();
      setUsers(data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar la lista de usuarios.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    alertService.showConfirmationDialog({
        title: 'Cambiar Rol',
        text: `¿Estás seguro de que quieres cambiar el rol de este usuario a "${newRole}"?`,
        confirmButtonText: 'Sí, cambiar rol',
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                setLoading(true); 
                await adminService.updateUserRole(userId, newRole);
                alertService.showSuccessToast('Rol Actualizado', 'El rol del usuario ha sido actualizado.');
                fetchUsers(); 
            } catch (err) {
                alertService.showErrorAlert('Error', err.message || 'No se pudo actualizar el rol.');
                setError(err.message);
                setLoading(false);
            }
        }
    });
  };

  const handleDeleteUser = async (userId, userName) => {
     alertService.showConfirmationDialog({
        title: 'Eliminar Usuario',
        text: `¿Estás seguro de que quieres eliminar al usuario "${userName}"? Esta acción no se puede deshacer y podría eliminar todos sus datos asociados.`,
        icon: 'error', 
        confirmButtonColor: '#d33',
        confirmButtonText: 'Sí, ¡eliminar usuario!',
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                setLoading(true);
                await adminService.deleteUserByAdmin(userId);
                alertService.showSuccessToast('Usuario Eliminado', `El usuario "${userName}" ha sido eliminado.`);
                fetchUsers(); 
            } catch (err) {
                alertService.showErrorAlert('Error al Eliminar', err.message || 'No se pudo eliminar el usuario.');
                setError(err.message);
                setLoading(false);
            }
        }
    });
  };


  if (loading && users.length === 0) {
    return (
      <div className="page-container admin-users-page">
        <h1>Administración de Usuarios</h1>
        <p className="loading-text">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="page-container admin-users-page">
      <div className="admin-page-header">
        <h1>Administración de Usuarios</h1>
      </div>

      {error && <p className="error-message main-error-message">{error}</p>}

      {users.length > 0 ? (
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Creado</th>
              <th>Últ. Login</th> {/* CAMBIADO DE "Últ. Actividad" */}
              <th>Cambiar Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>{user.role}</span>
                </td>
                <td>{formatDate(user.createdAt)}</td>
                <td>{formatDate(user.lastLoginAt)}</td> {/* USAR lastLoginAt */}
                <td>
                  {user.role === 'user' ? (
                    <button 
                      onClick={() => handleRoleChange(user.id, 'admin')}
                      className="button button-small button-promote"
                      disabled={loading}
                      title="Convertir en Administrador"
                    >
                      Hacer Admin
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleRoleChange(user.id, 'user')}
                      className="button button-small button-demote"
                      disabled={loading}
                      title="Convertir en Usuario estándar"
                    >
                      Hacer Usuario
                    </button>
                  )}
                </td>
                <td>
                  <button 
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="button button-small button-delete"
                    disabled={loading}
                    title="Eliminar Usuario"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && !error && <p>No hay usuarios para mostrar.</p>
      )}
    </div>
  );
};

export default AdminUsersPage;
