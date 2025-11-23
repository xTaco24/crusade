import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Vote, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  Play,
  Pause,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import { useElections } from '../../hooks/useElections';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { USER_ROLES, ELECTION_STATUSES, STATUS_COLORS } from '../../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function AdminDashboard() {
  const { user } = useAuth();
  const { elections, loading: electionsLoading } = useElections();
  const navigate = useNavigate();

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

  // Statistics
  const totalElections = elections.length;
  const activeElections = elections.filter(e => 
    e.status === ELECTION_STATUSES.VOTING_OPEN || e.status === ELECTION_STATUSES.PAUSED
  ).length;
  const totalVotes = elections.reduce((sum, e) => sum + (e.totalVotes || 0), 0);
  const avgParticipation = elections.length > 0 
    ? elections.reduce((sum, e) => {
        const rate = e.eligibleVoters && e.totalVotes 
          ? (e.totalVotes / e.eligibleVoters) * 100 
          : 0;
        return sum + rate;
      }, 0) / elections.length 
    : 0;

  // Recent elections
  const recentElections = elections
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  // Mock participation data for chart
  const participationData = [
    { name: 'Ene', participation: 65 },
    { name: 'Feb', participation: 72 },
    { name: 'Mar', participation: 68 },
    { name: 'Apr', participation: 75 },
    { name: 'May', participation: 82 },
    { name: 'Jun', participation: 78 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ELECTION_STATUSES.VOTING_OPEN:
        return <Play className="w-4 h-4" />;
      case ELECTION_STATUSES.PAUSED:
        return <Pause className="w-4 h-4" />;
      case ELECTION_STATUSES.RESULTS_PUBLISHED:
        return <Eye className="w-4 h-4" />;
      case ELECTION_STATUSES.SCHEDULED:
      case ELECTION_STATUSES.CAMPAIGN:
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

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
              <h1 className="text-3xl font-bold text-white">Panel de Administración</h1>
              <p className="text-gray-400 mt-2">
                Gestiona elecciones y supervisa el proceso electoral
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Elecciones',
              value: totalElections,
              icon: Vote,
              color: 'text-blue-400',
              bgColor: 'bg-blue-900/20',
              change: '+12%',
            },
            {
              title: 'Elecciones Activas',
              value: activeElections,
              icon: Play,
              color: 'text-green-400',
              bgColor: 'bg-green-900/20',
              change: '+3',
            },
            {
              title: 'Total Votos',
              value: totalVotes.toLocaleString(),
              icon: Users,
              color: 'text-purple-400',
              bgColor: 'bg-purple-900/20',
              change: '+245',
            },
            {
              title: 'Participación Promedio',
              value: `${avgParticipation.toFixed(1)}%`,
              icon: BarChart3,
              color: 'text-orange-400',
              bgColor: 'bg-orange-900/20',
              change: '+5.2%',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className="text-green-400 text-sm font-medium">
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Elections */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-blue-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Elecciones Recientes</h2>
              </div>
              <Link
                to="/admin/elections"
                className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors duration-200"
              >
                Ver todas
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentElections.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No hay elecciones registradas
                </p>
              ) : (
                recentElections.map((election) => (
                  <div key={election.id} className="bg-gray-700 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2">{election.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(election.endDate), 'dd MMM yyyy', { locale: es })}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {election.totalVotes || 0} votos
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[election.status]}`}>
                          {getStatusIcon(election.status)}
                          <span className="ml-1">{getStatusLabel(election.status)}</span>
                        </span>
                        <Link
                          to={`/admin/elections/${election.id}/edit`}
                          className="text-gray-400 hover:text-white p-1 rounded transition-colors duration-200"
                        >
                          <Settings className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Participation Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center mb-6">
              <BarChart3 className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Tendencia de Participación</h2>
            </div>
            
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={participationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Participación']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="participation" 
                  stroke="#10B981" 
                  strokeWidth={3}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center mb-6">
            <Settings className="w-6 h-6 text-purple-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Acciones Rápidas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/admin/elections/new"
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl text-center transition-colors duration-200 group"
            >
              <Plus className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Crear Elección</span>
            </Link>
            
            <Link
              to="/admin/elections"
              className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl text-center transition-colors duration-200 group"
            >
              <Calendar className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Gestionar Elecciones</span>
            </Link>
            
            <Link
              to="/admin/vote-simulator"
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-4 rounded-xl text-center transition-colors duration-200 group"
            >
              <Zap className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Simulador de Votos</span>
            </Link>
            
            <Link
              to="/elections"
              className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-xl text-center transition-colors duration-200 group"
            >
              <Eye className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Ver Como Usuario</span>
            </Link>
            
            <Link
              to="/admin/users"
              className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl text-center transition-colors duration-200 group"
            >
              <Users className="w-8 h-8 mx-auto mb-2 group-hover:scale-110 transition-transform duration-200" />
              <span className="font-medium">Gestionar Usuarios</span>
            </Link>
          </div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-gray-800 rounded-2xl p-6 border border-gray-700"
        >
          <div className="flex items-center mb-6">
            <CheckCircle className="w-6 h-6 text-green-400 mr-3" />
            <h2 className="text-xl font-semibold text-white">Estado del Sistema</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Servidor de Votación',
                status: 'Operativo',
                statusColor: 'text-green-400',
                bgColor: 'bg-green-900/20',
                icon: CheckCircle,
              },
              {
                title: 'Base de Datos',
                status: 'Operativo',
                statusColor: 'text-green-400',
                bgColor: 'bg-green-900/20',
                icon: CheckCircle,
              },
              {
                title: 'Sistema de Seguridad',
                status: 'Operativo',
                statusColor: 'text-green-400',
                bgColor: 'bg-green-900/20',
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <div key={index} className={`rounded-xl p-4 ${item.bgColor}`}>
                <div className="flex items-center">
                  <item.icon className={`w-5 h-5 ${item.statusColor} mr-3`} />
                  <div>
                    <p className="text-white font-medium">{item.title}</p>
                    <p className={`text-sm ${item.statusColor}`}>{item.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}