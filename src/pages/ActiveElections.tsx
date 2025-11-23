import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Vote, 
  Calendar, 
  Users, 
  Clock, 
  Play, 
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Eye
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useElections } from '../hooks/useElections';
import { useVoting } from '../hooks/useVoting';
import { supabase } from '../lib/supabase';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Election } from '../types';
import { ELECTION_STATUSES, STATUS_COLORS } from '../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ActiveElections() {
  const { user } = useAuth();
  const { elections, loading: electionsLoading } = useElections();
  const navigate = useNavigate();
  
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [activeElectionsDataLoaded, setActiveElectionsDataLoaded] = useState(false);

  const checkVotedElections = React.useCallback(async () => {
    if (!user) return;
    
    try {
      console.log('Checking voted elections for user:', user.id);
      const voted = new Set<string>();
      
      // Check votes from database directly
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
      
      setVotedElections(voted);
    } catch (error) {
      console.error('Error checking voted elections:', error);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    // Only check voted elections once when elections are loaded
    if (electionsLoading || activeElectionsDataLoaded || elections.length === 0) return;
    
    const loadActiveElectionsData = async () => {
      checkVotedElections();
      setActiveElectionsDataLoaded(true);
    };

    loadActiveElectionsData();
  }, [elections, electionsLoading, activeElectionsDataLoaded, checkVotedElections]);

  // Reset data when user changes
  useEffect(() => {
    setActiveElectionsDataLoaded(false);
    setVotedElections(new Set());
  }, [user?.id]);

  if (!user) {
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

  // Filter for active elections (voting open or paused)
  const activeElections = elections.filter(election => 
    election.status === ELECTION_STATUSES.VOTING_OPEN || 
    election.status === ELECTION_STATUSES.PAUSED
  );

  const getStatusLabel = (status: string): string => {
    return status === ELECTION_STATUSES.VOTING_OPEN ? 'Votación Abierta' : 'Pausada';
  };

  const getStatusIcon = (status: string) => {
    return status === ELECTION_STATUSES.VOTING_OPEN ? 
      <Play className="w-4 h-4" /> : 
      <AlertCircle className="w-4 h-4" />;
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
          <h1 className="text-3xl font-bold text-white mb-4">Elecciones Activas</h1>
          <p className="text-gray-400">
            Participa en las elecciones que están actualmente abiertas para votación
          </p>
        </motion.div>

        {/* Active Elections Grid */}
        <div className="space-y-8">
          {activeElections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center py-16"
            >
              <Vote className="w-20 h-20 text-gray-600 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-400 mb-4">
                No hay elecciones activas
              </h3>
              <p className="text-gray-500 mb-8">
                No hay elecciones disponibles para votar en este momento
              </p>
              <Link
                to="/elections"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200 inline-flex items-center"
              >
                <Eye className="w-5 h-5 mr-2" />
                Ver Todas las Elecciones
              </Link>
            </motion.div>
          ) : (
            activeElections.map((election, index) => (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gray-800 rounded-3xl border border-gray-700 overflow-hidden"
              >
                {/* Election Header */}
                <div className="p-8 border-b border-gray-700">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-white mb-3">
                        {election.title}
                      </h2>
                      <p className="text-gray-400 text-lg mb-4">
                        {election.description}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-sm text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span className="hidden sm:inline">Cierra: </span>{format(new Date(election.endDate), 'dd MMM yyyy HH:mm', { locale: es })}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {election.totalVotes || 0} votos emitidos
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {election.eligibleVoters 
                            ? `${((election.totalVotes || 0) / election.eligibleVoters * 100).toFixed(1)}% participación`
                            : 'Participación en progreso'
                          }
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-3 sm:ml-6 flex flex-col items-end space-y-3 sm:space-y-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[election.status]}`}>
                        {getStatusIcon(election.status)}
                        <span className="ml-2">{getStatusLabel(election.status)}</span>
                      </span>
                      
                      {votedElections.has(election.id) ? (
                        <div className="flex items-center text-green-400 bg-green-900/20 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Ya votaste</span>
                        </div>
                      ) : election.status === ELECTION_STATUSES.VOTING_OPEN ? (
                        <Link
                          to={`/elections/${election.id}/vote`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-2xl font-medium transition-all duration-200 flex items-center group text-xs sm:text-sm whitespace-nowrap"
                        >
                          <Vote className="w-5 h-5 mr-2" />
                          Votar Ahora
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                        </Link>
                      ) : (
                        <div className="flex items-center text-yellow-400 bg-yellow-900/20 px-2 sm:px-3 py-2 rounded-xl text-xs sm:text-sm">
                          <AlertCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">Pausada</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Candidate Lists */}
                <div className="p-4 sm:p-8">
                  <h3 className="text-xl font-semibold text-white mb-6">
                    Listas de Candidatos ({election.candidateLists.length})
                  </h3>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {election.candidateLists.map((list) => (
                      <div
                        key={list.id}
                        className="bg-gray-700 rounded-2xl p-4 sm:p-6 border border-gray-600 hover:border-gray-500 transition-colors duration-200"
                      >
                        <div className="flex items-center mb-4">
                          <div
                            className="w-6 h-6 rounded-full mr-4"
                            style={{ backgroundColor: list.color }}
                          />
                          <div>
                            <h4 className="text-base sm:text-lg font-semibold text-white">{list.name}</h4>
                            <p className="text-gray-400 text-xs sm:text-sm">{list.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          {list.candidates.map((candidate) => (
                            <div key={candidate.id} className="bg-gray-600 rounded-xl p-3 sm:p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h5 className="font-medium text-white text-sm sm:text-base">{candidate.name}</h5>
                                  <p className="text-blue-400 text-xs sm:text-sm font-medium">{candidate.position}</p>
                                  <p className="text-gray-400 text-xs sm:text-sm break-all">{candidate.email}</p>
                                  {candidate.bio && (
                                    <p className="text-gray-300 text-xs sm:text-sm mt-2">{candidate.bio}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Vote count for this list */}
                        <div className="mt-4 pt-4 border-t border-gray-600">
                          <div className="flex items-center justify-between text-xs sm:text-sm">
                            <span className="text-gray-400">Votos actuales:</span>
                            <span className="text-white font-medium">
                              {list.votes || 0} votos
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        {activeElections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700"
          >
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">Resumen de Participación</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">
                  {activeElections.length}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">Elecciones Activas</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-400">
                  {activeElections.reduce((sum, e) => sum + (e.totalVotes || 0), 0)}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">Total Votos</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-400">
                  {votedElections.size}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">Tus Votos</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}