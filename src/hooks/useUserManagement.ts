import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useUserManagement() {
  const [loading, setLoading] = useState(false);

  const updateUserRoles = async (
    userId: string, 
    roles: string[], 
    action: 'set' | 'add' | 'remove' = 'set'
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes estar autenticado');
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-user-roles`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            roles,
            action,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Error al actualizar roles');
        return false;
      }

      toast.success(result.message || 'Roles actualizados exitosamente');
      return true;
    } catch (error) {
      console.error('Error updating user roles:', error);
      toast.error('Error al actualizar roles');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const makeUserAdmin = async (userId: string): Promise<boolean> => {
    return updateUserRoles(userId, ['administrator'], 'add');
  };

  const removeAdminRole = async (userId: string): Promise<boolean> => {
    return updateUserRoles(userId, ['administrator'], 'remove');
  };

  const makeUserCommittee = async (userId: string): Promise<boolean> => {
    return updateUserRoles(userId, ['electoral_committee'], 'add');
  };

  const getAllUsers = async (): Promise<any[]> => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes estar autenticado para acceder a la gestión de usuarios');
        return [];
      }

      console.log('Obteniendo lista de usuarios...');
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Error en respuesta del servidor:', result);
        toast.error(result.error || `Error ${response.status}: No se pudieron cargar los usuarios`);
        return [];
      }

      console.log(`Usuarios cargados exitosamente: ${result.count} usuarios encontrados`);
      if (result.message) {
        toast.success(result.message);
      }
      
      return result.users || [];
    } catch (error) {
      console.error('Error getting users:', error);
      toast.error('Error de conexión al obtener usuarios');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateUserRolesViaAPI = async (userId: string, roles: string[]): Promise<boolean> => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Debes estar autenticado');
        return false;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'update_roles',
            userId,
            roles,
          }),
        }
      );
      
      const result = await response.json();
      
      if (!response.ok) {
        toast.error(result.error || 'Error al actualizar roles');
        return false;
      }
      
      toast.success(result.message || 'Roles actualizados exitosamente');
      return true;
    } catch (error) {
      console.error('Error updating user roles via API:', error);
      toast.error('Error de conexión al actualizar roles');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    updateUserRoles,
    updateUserRolesViaAPI,
    makeUserAdmin,
    removeAdminRole,
    makeUserCommittee,
    getAllUsers,
  };
}