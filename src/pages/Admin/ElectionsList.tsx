import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Square,
  Eye,
  Calendar,
  Users,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useElections } from '../../hooks/useElections';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Election } from '../../types';
import { USER_ROLES, ELECTION_STATUSES, STATUS_COLORS, STATUS_TRANSITIONS } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

export function ElectionsList() {
  const { user } = useAuth();
  const { elections, loading: electionsLoading, changeElectionStatus, deleteElection } = useElections();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!user.roles.includes(USER_ROLES.ADMINISTRATOR)) {
      navigate('/dashboard');
      return;
    }
  }, [user, navigate]);

  if (!user || !user.roles.includes(USER_ROLES.ADMINISTRATOR)) {
    return null;
  }

  if (electionsLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      [ELECTION_STATUSES.DRAFT]: 'Borrador',
      [ELECTION_STATUSES.SCHEDULED]: 'Programada',
      [ELECTION_STATUSES.CAMPAIGN]: 'En Campaña',
      [ELECTION_STATUSES.VOTING_OPEN]: 'Votación Abierta',
      [ELECTION_STATUSES.PAUSED]: 'Pausada',
      [ELECTION_STATUSES.VOTING_CLOSED]: 'Cerrada',
      [ELECTION_STATUSES.RESULTS_PUBLISHED]: 'Resultados Publicados',
    };
    return statusLabels[status] || status;
  };

  const canPerformAction = (election: Election, action: string): boolean => {
    switch (action) {
      case 'start':
        return election.status === ELECTION_STATUSES.DRAFT || 
               election.status === ELECTION_STATUSES.SCHEDULED ||
               election.status === ELECTION_STATUSES.CAMPAIGN;
      case 'pause':
        return election.status === ELECTION_STATUSES.VOTING_OPEN;
      case 'resume':
        return election.status === ELECTION_STATUSES.PAUSED;
      case 'finish':
        return election.status === ELECTION_STATUSES.VOTING_OPEN || election.status === ELECTION_STATUSES.PAUSED;
      case 'publish':
        return election.status === ELECTION_STATUSES.VOTING_CLOSED;
      case 'edit':
        return election.status === ELECTION_STATUSES.DRAFT || 
               election.status === ELECTION_STATUSES.SCHEDULED ||
               election.status === ELECTION_STATUSES.CAMPAIGN;
      default:
        return false;
    }
  };

  const handleStatusChange = async (electionId: string, newStatus: string) => {
    console.log('Changing election status:', electionId, 'to:', newStatus);
    setActionLoading(electionId);
    const success = await changeElectionStatus(electionId, newStatus as any);
    setActionLoading(null);
    
    if (!success) {
      toast.error('Error al cambiar el estado de la elección');
    }
  };

  const handleDeleteElection = async (electionId: string) => {
    if (deleteConfirmText !== 'CONFIRMAR') {
      toast.error('Debes escribir "CONFIRMAR" para eliminar la elección');
      return;
    }
    
    console.log('Deleting election:', electionId);
    setActionLoading(electionId);
    const success = await deleteElection(electionId);
    setActionLoading(null);
    setShowDeleteModal(null);
    setDeleteConfirmText('');
    
    if (!success) {
      toast.error('Error al eliminar la elección');
    }
  };

  const filteredElections = elections.filter(election => {
    const matchesSearch = election.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         election.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || election.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Gestión de Elecciones</h1>
              <p className="text-gray-400 mt-2">
                Administra todas las elecciones del sistema
              </p>
            </div>
            
            <Link
              to="/admin/elections/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200 flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Nueva Elección
            </Link>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar elecciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-8 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Todos los estados</option>
                  <option value={ELECTION_STATUSES.DRAFT}>Borrador</option>
                  <option value={ELECTION_STATUSES.SCHEDULED}>Programada</option>
                  <option value={ELECTION_STATUSES.CAMPAIGN}>En Campaña</option>
                  <option value={ELECTION_STATUSES.VOTING_OPEN}>Votación Abierta</option>
                  <option value={ELECTION_STATUSES.PAUSED}>Pausada</option>
                  <option value={ELECTION_STATUSES.VOTING_CLOSED}>Cerrada</option>
                  <option value={ELECTION_STATUSES.RESULTS_PUBLISHED}>Resultados Publicados</option>
                </select>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Elections Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Elección</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Estado</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Fechas</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Participación</th>
                  <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredElections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">No se encontraron elecciones</p>
                        <p className="text-sm mt-1">
                          {searchTerm || statusFilter !== 'all' 
                            ? 'Intenta ajustar los filtros de búsqueda'
                            : 'Crea tu primera elección para comenzar'
                          }
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredElections.map((election, index) => (
                    <motion.tr
                      key={election.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="font-medium text-white">{election.title}</h3>
                          <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                            {election.description}
                          </p>
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Users className="w-3 h-3 mr-1" />
                            {election.candidateLists.length} lista{election.candidateLists.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[election.status]}`}>
                          {getStatusLabel(election.status)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-white">
                          {format(new Date(election.startDate), 'dd MMM', { locale: es })} - 
                          {format(new Date(election.endDate), 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {format(new Date(election.startDate), 'HH:mm', { locale: es })} - 
                          {format(new Date(election.endDate), 'HH:mm', { locale: es })}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="text-sm text-white font-medium">
                          {election.totalVotes || 0} votos
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {election.eligibleVoters 
                            ? `${((election.totalVotes || 0) / election.eligibleVoters * 100).toFixed(1)}% participación`
                            : 'Sin datos'
                          }
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          {/* Quick Actions */}
                          {canPerformAction(election, 'start') && (
                            <button
                              onClick={() => handleStatusChange(election.id, ELECTION_STATUSES.VOTING_OPEN)}
                              disabled={actionLoading === election.id}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                              title="Iniciar votación"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          
                          {canPerformAction(election, 'pause') && (
                            <button
                              onClick={() => handleStatusChange(election.id, ELECTION_STATUSES.PAUSED)}
                              disabled={actionLoading === election.id}
                              className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded-lg transition-colors duration-200"
                              title="Pausar votación"
                            >
                              <Pause className="w-4 h-4" />
                            </button>
                          )}
                          
                          {canPerformAction(election, 'resume') && (
                            <button
                              onClick={() => handleStatusChange(election.id, ELECTION_STATUSES.VOTING_OPEN)}
                              disabled={actionLoading === election.id}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded-lg transition-colors duration-200"
                              title="Reanudar votación"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          
                          {canPerformAction(election, 'finish') && (
                            <button
                              onClick={() => handleStatusChange(election.id, ELECTION_STATUSES.VOTING_CLOSED)}
                              disabled={actionLoading === election.id}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                              title="Finalizar votación"
                            >
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                          
                          {canPerformAction(election, 'publish') && (
                            <button
                              onClick={() => handleStatusChange(election.id, ELECTION_STATUSES.RESULTS_PUBLISHED)}
                              disabled={actionLoading === election.id}
                              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20 rounded-lg transition-colors duration-200"
                              title="Publicar resultados"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Edit */}
                          {canPerformAction(election, 'edit') ? (
                            <Link
                              to={`/admin/elections/${election.id}/edit`}
                              className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                              title="Editar elección"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                          ) : (
                            <button
                              disabled
                              className="p-2 text-gray-600 cursor-not-allowed rounded-lg"
                              title="No se puede editar en este estado"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {/* Delete */}
                          <button
                            onClick={() => setShowDeleteModal(election.id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                            title="Eliminar elección"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full border border-gray-700"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-900/20 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Confirmar Eliminación
                  </h3>
                  <p className="text-sm text-gray-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              
              {(() => {
                const election = elections.find(e => e.id === showDeleteModal);
                return election ? (
                  <div className="bg-gray-700 rounded-lg p-4 mb-4">
                    <h4 className="font-medium text-white mb-1">{election.title}</h4>
                    <p className="text-sm text-gray-400">{election.description}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-500">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full ${STATUS_COLORS[election.status]}`}>
                        {getStatusLabel(election.status)}
                      </span>
                      <span className="ml-2">• {election.totalVotes || 0} votos</span>
                    </div>
                  </div>
                ) : null;
              })()}
              
              <p className="text-gray-400 mb-6">
                Para confirmar la eliminación, escribe <strong className="text-white">CONFIRMAR</strong> en el campo de abajo:
              </p>
              
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="Escribe CONFIRMAR"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
                autoFocus
              />
              
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(null);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-xl font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDeleteElection(showDeleteModal)}
                  disabled={actionLoading === showDeleteModal || deleteConfirmText !== 'CONFIRMAR'}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center"
                >
                  {actionLoading === showDeleteModal ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar Definitivamente
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}