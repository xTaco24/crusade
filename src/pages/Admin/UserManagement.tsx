import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserX, 
  Search,
  Crown,
  User,
  Mail,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUserManagement } from '../../hooks/useUserManagement';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { USER_ROLES } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  app_metadata: {
    roles?: string[];
  };
  user_metadata: {
    full_name?: string;
    student_id?: string;
    roles?: string[];
  };
}

export function UserManagement() {
  const { user } = useAuth();
  const { loading, makeUserAdmin, removeAdminRole, makeUserCommittee, getAllUsers, updateUserRolesViaAPI } = useUserManagement();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<SupabaseUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.roles.includes(USER_ROLES.ADMINISTRATOR)) {
      navigate('/dashboard');
      return;
    }

    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      console.log('Iniciando carga de usuarios...');
      const allUsers = await getAllUsers();
      console.log('Usuarios obtenidos:', allUsers.length);
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error crítico al cargar usuarios - Verifica tu conexión y permisos');
    } finally {
      setLoadingUsers(false);
    }
  };

  const getUserRoles = (user: SupabaseUser): string[] => {
    const appRoles = user.app_metadata?.roles || [];
    const userRoles = user.user_metadata?.roles || [];
    const allRoles = [...appRoles, ...userRoles];
    
    // Si no tiene roles específicos, es estudiante por defecto
    if (allRoles.length === 0 || (!allRoles.includes('administrator') && !allRoles.includes('electoral_committee'))) {
      return ['student'];
    }
    
    return allRoles;
  };

  const getRoleLabel = (role: string): string => {
    const roleLabels: Record<string, string> = {
      'administrator': 'Administrador',
      'electoral_committee': 'Comité Electoral',
      'student': 'Estudiante',
    };
    return roleLabels[role] || role;
  };

  const getRoleColor = (role: string): string => {
    const roleColors: Record<string, string> = {
      'administrator': 'text-red-400 bg-red-900/20',
      'electoral_committee': 'text-purple-400 bg-purple-900/20',
      'student': 'text-blue-400 bg-blue-900/20',
    };
    return roleColors[role] || 'text-gray-400 bg-gray-700';
  };

  const handleMakeAdmin = async (userId: string) => {
    console.log('Intentando hacer administrador al usuario:', userId);
    const success = await updateUserRolesViaAPI(userId, ['administrator']);
    if (success) {
      await loadUsers();
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    console.log('Intentando remover rol de administrador del usuario:', userId);
    const success = await updateUserRolesViaAPI(userId, []);
    if (success) {
      await loadUsers();
    }
  };

  const handleMakeCommittee = async (userId: string) => {
    console.log('Intentando agregar al comité electoral al usuario:', userId);
    const success = await updateUserRolesViaAPI(userId, ['electoral_committee']);
    if (success) {
      await loadUsers();
    }
  };

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.user_metadata?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user || !user.roles.includes(USER_ROLES.ADMINISTRATOR)) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al panel de administración
          </button>
          
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-400 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
              <p className="text-gray-400 mt-2">
                Administra roles y permisos de usuarios
              </p>
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar usuarios por email o nombre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              Usuarios Registrados ({filteredUsers.length})
            </h2>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-3 sm:px-6 py-4 text-left text-sm font-medium text-gray-300">Usuario</th>
                    <th className="px-3 sm:px-6 py-4 text-left text-sm font-medium text-gray-300 hidden sm:table-cell">Roles</th>
                    <th className="px-3 sm:px-6 py-4 text-right text-sm font-medium text-gray-300 hidden md:table-cell">Registro</th>
                    <th className="px-3 sm:px-6 py-4 text-center text-sm font-medium text-gray-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 sm:px-6 py-12 text-center">
                        <div className="text-gray-400">
                          <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p className="text-lg font-medium">No se encontraron usuarios</p>
                          <p className="text-sm mt-1">
                            {searchTerm 
                              ? 'Intenta ajustar el término de búsqueda'
                              : 'No hay usuarios registrados en el sistema'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u, index) => {
                      const userRoles = getUserRoles(u);
                      const isAdmin = userRoles.includes('administrator');
                      const isCommittee = userRoles.includes('electoral_committee');
                      const isCurrentUser = u.id === user.id;
                      
                      return (
                        <motion.tr
                          key={u.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors duration-200"
                        >
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-white text-sm sm:text-base truncate">
                                  {u.user_metadata?.full_name || u.email}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs text-blue-400">(Tú)</span>
                                  )}
                                </h3>
                                <div className="flex items-center text-xs sm:text-sm text-gray-400">
                                  <Mail className="w-3 h-3 mr-1" />
                                  <span className="truncate">{u.email}</span>
                                </div>
                                {u.user_metadata?.student_id && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    RUT: {u.user_metadata.student_id}
                                  </div>
                                )}
                                {/* Show roles on mobile */}
                                <div className="sm:hidden mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {userRoles.map(role => (
                                      <span
                                        key={role}
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                                      >
                                        {role === 'administrator' && <Crown className="w-3 h-3 mr-1" />}
                                        {role === 'electoral_committee' && <Shield className="w-3 h-3 mr-1" />}
                                        {role === 'student' && <User className="w-3 h-3 mr-1" />}
                                        {getRoleLabel(role)}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-3 sm:px-6 py-4 hidden sm:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {userRoles.map(role => (
                                <span
                                  key={role}
                                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role)}`}
                                >
                                  {role === 'administrator' && <Crown className="w-3 h-3 mr-1" />}
                                  {role === 'electoral_committee' && <Shield className="w-3 h-3 mr-1" />}
                                  {role === 'student' && <User className="w-3 h-3 mr-1" />}
                                  {getRoleLabel(role)}
                                </span>
                              ))}
                            </div>
                          </td>
                          
                          <td className="px-3 sm:px-6 py-4 text-right hidden md:table-cell">
                            <div className="text-sm text-white">
                              {format(new Date(u.created_at), 'dd MMM yyyy', { locale: es })}
                            </div>
                            <div className="text-xs text-gray-400">
                              {format(new Date(u.created_at), 'HH:mm', { locale: es })}
                            </div>
                          </td>
                          
                          <td className="px-3 sm:px-6 py-4">
                            <div className="flex items-center justify-center space-x-1 sm:space-x-2">
                              {!isCurrentUser && (
                                <>
                                  {!isAdmin ? (
                                    <button
                                      onClick={() => handleMakeAdmin(u.id)}
                                      disabled={loading}
                                      className="p-1 sm:p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                                      title="Hacer administrador"
                                    >
                                      <Crown className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRemoveAdmin(u.id)}
                                      disabled={loading}
                                      className="p-1 sm:p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                      title="Quitar rol de administrador"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}
                                  
                                  {!isCommittee ? (
                                    <button
                                      onClick={() => handleMakeCommittee(u.id)}
                                      disabled={loading}
                                      className="p-1 sm:p-2 text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 rounded-lg transition-colors duration-200"
                                      title="Agregar al comité electoral"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleRemoveAdmin(u.id)}
                                      disabled={loading}
                                      className="p-1 sm:p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors duration-200"
                                      title="Quitar del comité electoral"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </button>
                                  )}
                                </>
                              )}
                              
                              {isCurrentUser && (
                                <span className="text-xs text-gray-500 px-1 sm:px-2 py-1 bg-gray-700 rounded">
                                  Usuario actual
                                </span>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-blue-900/20 border border-blue-700 rounded-2xl p-6"
        >
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-blue-400 mr-3 mt-1" />
            <div>
              <h3 className="text-blue-400 font-medium mb-2">Instrucciones para Gestión de Roles</h3>
              <div className="text-blue-300 text-sm space-y-1">
                <p>• <strong>Administrador:</strong> Acceso completo al sistema, puede crear elecciones y gestionar usuarios</p>
                <p>• <strong>Comité Electoral:</strong> Puede supervisar elecciones y ver reportes detallados</p>
                <p>• <strong>Estudiante:</strong> Rol por defecto, puede votar y ver resultados</p>
                <p>• Los cambios de roles se aplican inmediatamente</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}