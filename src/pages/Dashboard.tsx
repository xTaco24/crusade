import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Vote, 
  Calendar, 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useElections } from '../hooks/useElections';
import { useVoting } from '../hooks/useVoting';
import { supabase } from '../lib/supabase';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { ELECTION_STATUSES, STATUS_COLORS, USER_ROLES } from '../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Dashboard() {
  const { user } = useAuth();
  const { elections, loading: electionsLoading } = useElections();
  const { getUserReceipts } = useVoting();
  const navigate = useNavigate();
  
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashboardDataLoaded, setDashboardDataLoaded] = useState(false);

  // Only check voted elections once when elections are loaded
  const checkVotedElections = React.useCallback(async (electionsToCheck: any[]) => {
    if (!user) return;
    
    try {
      console.log('Checking voted elections for user:', user.id);
      const voted = new Set<string>();
      
      // Check votes from database directly to avoid loops
      const { data: userVotes, error } = await supabase
        .from('votes')
        .select('election_id')
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error checking user votes:', error);
        return;
      }
      
      userVotes?.forEach(vote => {
        voted.add(vote.election_id);
      });
      
      console.log('User has voted in elections:', Array.from(voted));
      setVotedElections(voted);
    } catch (error) {
      console.error('Error checking voted elections:', error);
    }
  }, [user]);

  const loadUserReceipts = React.useCallback(async () => {
    if (!user) return;
    
    try {
      const userReceipts = await getUserReceipts(user.id);
      setReceipts(userReceipts);
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  }, [user, getUserReceipts]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    // Only load dashboard data once when elections are available and not already loaded
    if (electionsLoading || dashboardDataLoaded || elections.length === 0) return;
    
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          checkVotedElections(elections),
          loadUserReceipts()
        ]);
        setDashboardDataLoaded(true);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [elections, electionsLoading, dashboardDataLoaded, checkVotedElections, loadUserReceipts]);

  // Reset dashboard data when user changes
  useEffect(() => {
    setDashboardDataLoaded(false);
    setVotedElections(new Set());
    setReceipts([]);
  }, [user?.id]);

  // Auto-refresh eliminado: la UI se actualiza en tiempo real vía Supabase Realtime

  if (!user) {
    return null;
  }

  if (electionsLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = user.roles.includes(USER_ROLES.ADMINISTRATOR);
  const activeElections = elections.filter(e => 
    e.status === ELECTION_STATUSES.VOTING_OPEN || e.status === ELECTION_STATUSES.PAUSED
  );
  const upcomingElections = elections.filter(e => 
    e.status === ELECTION_STATUSES.SCHEDULED || e.status === ELECTION_STATUSES.CAMPAIGN
  );
  const finishedElections = elections.filter(e => 
    e.status === ELECTION_STATUSES.RESULTS_PUBLISHED
  );

  // Stats for cards
  const totalElections = elections.length;
  const totalVotes = elections.reduce((sum, e) => sum + (e.totalVotes || 0), 0);
  const avgParticipation = elections.length > 0 
    ? elections.reduce((sum, e) => {
        const rate = e.eligibleVoters && e.totalVotes 
          ? (e.totalVotes / e.eligibleVoters) * 100 
          : 0;
        return sum + rate;
      }, 0) / elections.length 
    : 0;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white">
              Bienvenido, {user.fullName}
            </h1>
            <p className="text-gray-400 mt-2">
              {isAdmin ? 'Panel de Administración' : 'Dashboard de Votación'}
            </p>
          </motion.div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {[
            {
              title: 'Total Elecciones',
              value: totalElections,
              icon: Vote,
              color: 'text-blue-400',
              bgColor: 'bg-blue-900/20',
            },
            {
              title: 'Votos Emitidos',
              value: totalVotes.toLocaleString(),
              icon: CheckCircle,
              color: 'text-green-400',
              bgColor: 'bg-green-900/20',
            },
            {
              title: 'Participación Promedio',
              value: `${avgParticipation.toFixed(1)}%`,
              icon: TrendingUp,
              color: 'text-purple-400',
              bgColor: 'bg-purple-900/20',
            },
            {
              title: 'Mis Votos',
              value: votedElections.size,
              icon: Users,
              color: 'text-orange-400',
              bgColor: 'bg-orange-900/20',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                </div>
                <div className="ml-4">
                  <p className="text-xs sm:text-sm text-gray-400">{stat.title}</p>
                  <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Active Elections */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700"
          >
            <div className="flex items-center mb-6">
              <Vote className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-white">Elecciones Activas</h2>
            </div>
            
            <div className="space-y-4">
              {activeElections.length === 0 ? (
                <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">
                  No hay elecciones activas en este momento
                </p>
              ) : (
                activeElections.map((election) => (
                  <div key={election.id} className="bg-gray-700 rounded-xl p-3 sm:p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">{election.title}</h3>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-400">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {format(new Date(election.endDate), 'dd MMM yyyy', { locale: es })}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {election.totalVotes || 0} votos
                          </div>
                        </div>
                        <div className="mt-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[election.status]}`}>
                            {election.status === ELECTION_STATUSES.VOTING_OPEN ? 'Votación Abierta' : 'Pausada'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 sm:ml-4 flex-shrink-0">
                        {votedElections.has(election.id) ? (
                          <div className="flex items-center text-green-400">
                            <CheckCircle className="w-5 h-5 mr-1" />
                            <span className="text-xs sm:text-sm">Votado</span>
                          </div>
                        ) : election.status === ELECTION_STATUSES.VOTING_OPEN ? (
                          <Link
                            to={`/active-elections`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200"
                          >
                            Votar
                          </Link>
                        ) : (
                          <div className="flex items-center text-yellow-400">
                            <AlertCircle className="w-5 h-5 mr-1" />
                            <span className="text-xs sm:text-sm">Pausada</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Upcoming Elections */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700"
          >
            <div className="flex items-center mb-6">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-white">Próximas Elecciones</h2>
            </div>
            
            <div className="space-y-4">
              {upcomingElections.length === 0 ? (
                <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">
                  No hay elecciones programadas
                </p>
              ) : (
                upcomingElections.map((election) => (
                  <div key={election.id} className="bg-gray-700 rounded-xl p-3 sm:p-4">
                    <h3 className="font-semibold text-white mb-2 text-sm sm:text-base">{election.title}</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 sm:space-x-4 text-xs sm:text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">Inicia: </span>{format(new Date(election.startDate), 'dd MMM yyyy', { locale: es })}
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[election.status]}`}>
                        {election.status === ELECTION_STATUSES.SCHEDULED ? 'Programada' : 'Campaña'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Vote Comparison Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700"
        >
          <div className="flex items-center mb-6">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mr-3" />
            <h2 className="text-lg sm:text-xl font-semibold text-white">Comparación de Votos</h2>
            {(() => {
              const mostRecentActiveElection = activeElections.length > 0 
                ? activeElections.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
                : null;
              
              return mostRecentActiveElection ? (
                <span className="ml-2 text-xs sm:text-sm text-gray-400 hidden sm:inline">- {mostRecentActiveElection.title}</span>
              ) : null;
            })()}
          </div>
          
          <div className="space-y-4">
            {(() => {
              // Get the most recent active election
              const mostRecentActiveElection = activeElections.length > 0 
                ? activeElections.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
                : null;
              
              if (!mostRecentActiveElection) {
                return (
                  <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">
                    No hay elecciones activas para mostrar
                  </p>
                );
              }
              
              // Get candidate lists from the most recent active election
              const candidateLists = mostRecentActiveElection.candidateLists
                .filter(list => (list.votes || 0) > 0)
                .sort((a, b) => (b.votes || 0) - (a.votes || 0));
              
              if (candidateLists.length === 0) {
                return (
                  <p className="text-gray-400 text-center py-6 sm:py-8 text-sm sm:text-base">
                    No hay votos registrados aún en esta elección
                  </p>
                );
              }
              
              // Calculate total votes for percentage calculation
              const totalVotes = mostRecentActiveElection.totalVotes || 0;
              
              return candidateLists.map((list, index) => {
                const votes = list.votes || 0;
                const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                
                return (
                  <div key={list.id} className="bg-gray-700 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-600 text-white text-xs sm:text-sm font-bold mr-2 sm:mr-3">
                          #{index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm sm:text-base">{list.name}</h3>
                          <p className="text-xs text-gray-400 hidden sm:block">{list.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm sm:text-lg font-bold text-white">
                          {votes.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-400">votos</div>
                      </div>
                    </div>
                    
                    {/* Visual progress bar */}
                    <div className="w-full bg-gray-600 rounded-full h-2 sm:h-3 mb-2">
                      <div
                        className="h-2 sm:h-3 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: list.color || '#3B82F6'
                        }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>{percentage.toFixed(1)}% del total</span>
                      <span className="hidden sm:inline">{list.candidates?.length || 0} candidato{(list.candidates?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </motion.div>

        {/* Admin Quick Actions */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-6 sm:mt-8 bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700"
          >
            <div className="flex items-center mb-6">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 mr-3" />
              <h2 className="text-lg sm:text-xl font-semibold text-white">Acciones Rápidas</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                to="/admin/elections/new"
                className="bg-blue-600 hover:bg-blue-700 text-white p-3 sm:p-4 rounded-xl text-center transition-colors duration-200"
              >
                <Vote className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                <span className="font-medium text-sm sm:text-base">Nueva Elección</span>
              </Link>
              <Link
                to="/admin/elections"
                className="bg-green-600 hover:bg-green-700 text-white p-3 sm:p-4 rounded-xl text-center transition-colors duration-200"
              >
                <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                <span className="font-medium text-sm sm:text-base">Gestionar Elecciones</span>
              </Link>
              <Link
                to="/elections"
                className="bg-purple-600 hover:bg-purple-700 text-white p-3 sm:p-4 rounded-xl text-center transition-colors duration-200 sm:col-span-2 lg:col-span-1"
              >
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" />
                <span className="font-medium text-sm sm:text-base">Ver Todas</span>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}