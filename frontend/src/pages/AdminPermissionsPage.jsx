// Ruta: finanzas-app-pro/frontend/src/pages/AdminPermissionsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import permissionsService from '../services/permissions.service';
import { alertService } from '../utils/alert.service'; //
import './AdminPermissionsPage.css';

const AdminPermissionsPage = () => {
  const [allPermissions, setAllPermissions] = useState([]);
  const [userRolePermissions, setUserRolePermissions] = useState(new Set());
  const [adminRolePermissions, setAdminRolePermissions] = useState(new Set());
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingRole, setSavingRole] = useState(null); // 'user' o 'admin' mientras se guarda

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [permissionsData, userPermsData, adminPermsData] = await Promise.all([
        permissionsService.getAllAvailablePermissions(),
        permissionsService.getPermissionsForRole('user'),
        permissionsService.getPermissionsForRole('admin'),
      ]);

      setAllPermissions(permissionsData || []);
      setUserRolePermissions(new Set((userPermsData || []).map(p => p.id)));
      setAdminRolePermissions(new Set((adminPermsData || []).map(p => p.id)));

    } catch (err) {
      setError(err.message || 'Error al cargar la configuración de permisos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePermissionToggle = (roleName, permissionId) => {
    if (roleName === 'user') {
      setUserRolePermissions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(permissionId)) {
          newSet.delete(permissionId);
        } else {
          newSet.add(permissionId);
        }
        return newSet;
      });
    } else if (roleName === 'admin') {
      setAdminRolePermissions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(permissionId)) {
          newSet.delete(permissionId);
        } else {
          newSet.add(permissionId);
        }
        return newSet;
      });
    }
  };

  const handleSaveChanges = async (roleName) => {
    setSavingRole(roleName);
    setError('');
    let permissionIdsToSave;
    if (roleName === 'user') {
      permissionIdsToSave = Array.from(userRolePermissions);
    } else if (roleName === 'admin') {
      permissionIdsToSave = Array.from(adminRolePermissions);
    } else {
      return; // Rol no válido
    }

    // Salvaguarda: El rol admin no puede perder 'admin_manage_user_roles' o 'admin_manage_permissions_config'
    if (roleName === 'admin') {
        const criticalPermissions = ['admin_manage_user_roles', 'admin_manage_permissions_config'];
        for (const permName of criticalPermissions) {
            const permObj = allPermissions.find(p => p.name === permName);
            if (permObj && !permissionIdsToSave.includes(permObj.id)) {
                alertService.showErrorAlert('Acción No Permitida', `El rol 'admin' no puede perder el permiso crítico: ${permName}.`);
                setSavingRole(null);
                // Opcional: revertir el cambio en el estado local si el usuario desmarcó este permiso
                // setAdminRolePermissions(prev => new Set(prev).add(permObj.id));
                return;
            }
        }
    }


    try {
      await permissionsService.updatePermissionsForRole(roleName, permissionIdsToSave);
      alertService.showSuccessToast('Guardado', `Permisos para el rol '${roleName}' actualizados.`);
      // Opcional: Recargar datos para asegurar consistencia, aunque el estado local ya está actualizado.
      // fetchData(); 
    } catch (err) {
      setError(err.message || `Error al guardar permisos para ${roleName}.`);
      alertService.showErrorAlert('Error', err.message || `No se pudieron guardar los permisos para ${roleName}.`);
      console.error(err);
      // Podrías revertir el estado local aquí si el guardado falla
    } finally {
      setSavingRole(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container admin-permissions-page">
        <h1>Gestión de Permisos por Rol</h1>
        <p className="loading-text">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="page-container admin-permissions-page">
      <div className="admin-page-header">
        <h1>Gestión de Permisos por Rol</h1>
      </div>

      {error && <p className="error-message main-error-message">{error}</p>}

      {allPermissions.length > 0 ? (
        <div className="permissions-table-container">
          <table className="permissions-table">
            <thead>
              <tr>
                <th>Permiso</th>
                <th>Descripción</th>
                <th className="role-col user-role-col">
                  Usuario (User)
                  <button 
                    onClick={() => handleSaveChanges('user')} 
                    disabled={savingRole === 'user'}
                    className="button button-small save-role-button"
                  >
                    {savingRole === 'user' ? 'Guardando...' : 'Guardar User'}
                  </button>
                </th>
                <th className="role-col admin-role-col">
                  Admin
                  <button 
                    onClick={() => handleSaveChanges('admin')} 
                    disabled={savingRole === 'admin'}
                    className="button button-small save-role-button"
                  >
                    {savingRole === 'admin' ? 'Guardando...' : 'Guardar Admin'}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {allPermissions.map(permission => (
                <tr key={permission.id}>
                  <td className="permission-name">{permission.name}</td>
                  <td className="permission-description">{permission.description}</td>
                  <td className="role-col user-role-col">
                    <input
                      type="checkbox"
                      checked={userRolePermissions.has(permission.id)}
                      onChange={() => handlePermissionToggle('user', permission.id)}
                      id={`user-perm-${permission.id}`}
                      className="permission-checkbox"
                    />
                    <label htmlFor={`user-perm-${permission.id}`} className="checkbox-label-sr-only">
                        Asignar {permission.name} a User
                    </label>
                  </td>
                  <td className="role-col admin-role-col">
                    <input
                      type="checkbox"
                      checked={adminRolePermissions.has(permission.id)}
                      onChange={() => handlePermissionToggle('admin', permission.id)}
                      id={`admin-perm-${permission.id}`}
                      className="permission-checkbox"
                    />
                     <label htmlFor={`admin-perm-${permission.id}`} className="checkbox-label-sr-only">
                        Asignar {permission.name} a Admin
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && !error && <p>No hay permisos definidos en el sistema.</p>
      )}
    </div>
  );
};

export default AdminPermissionsPage;