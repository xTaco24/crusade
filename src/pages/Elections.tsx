import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Users, 
  Clock, 
  CheckCircle, 
  Play, 
  Pause, 
  Eye,
  Vote,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useElections } from '../hooks/useElections';
import { useVoting } from '../hooks/useVoting';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Election } from '../types';
import { ELECTION_STATUSES, STATUS_COLORS } from '../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Elections() {
  const { user } = useAuth();
  const { elections, loading: electionsLoading } = useElections();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  
  const [votedElections, setVotedElections] = useState<Set<string>>(new Set());
  const [electionsDataLoaded, setElectionsDataLoaded] = useState(false);

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
    if (electionsLoading || electionsDataLoaded || elections.length === 0) return;
    
    const loadElectionsData = async () => {
      checkVotedElections();
      setElectionsDataLoaded(true);
    };

    loadElectionsData();
  }, [elections, electionsLoading, electionsDataLoaded, checkVotedElections]);

  // Reset data when user changes
  useEffect(() => {
    setElectionsDataLoaded(false);
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

  const filteredElections = elections.filter(election => {
    switch (filter) {
      case 'active':
        return election.status === ELECTION_STATUSES.VOTING_OPEN || election.status === ELECTION_STATUSES.PAUSED;
      case 'upcoming':
        return election.status === ELECTION_STATUSES.SCHEDULED || election.status === ELECTION_STATUSES.CAMPAIGN;
      case 'finished':
        return election.status === ELECTION_STATUSES.VOTING_CLOSED || election.status === ELECTION_STATUSES.RESULTS_PUBLISHED;
      default:
        return true;
    }
  });

  const getActionButton = (election: Election) => {
    // Si los resultados están publicados, siempre permitir verlos
    if (election.status === ELECTION_STATUSES.RESULTS_PUBLISHED) {
      return (
        <Link
          to={`/results/${election.id}`}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap"
        >
          <Eye className="w-4 h-4 mr-1" />
          Resultados
        </Link>
      );
    }

    // Si ya votó y no hay resultados publicados aún, mostrar etiqueta
    if (votedElections.has(election.id)) {
      return (
        <div className="flex items-center text-green-400 text-sm">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">Ya votado</span>
        </div>
      );
    }

    switch (election.status) {
      case ELECTION_STATUSES.VOTING_OPEN:
        return (
          <Link
            to={`/elections/${election.id}/vote`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center whitespace-nowrap"
          >
            <Vote className="w-4 h-4 mr-1" />
            Votar
          </Link>
        );
      case ELECTION_STATUSES.PAUSED:
        return (
          <div className="flex items-center text-yellow-400 text-sm">
            <Pause className="w-4 h-4 mr-1" />
            <span className="text-sm">Pausada</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-gray-400 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            <span className="text-sm">Próximo</span>
          </div>
        );
    }
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
          <h1 className="text-3xl font-bold text-white mb-4">Elecciones</h1>
          <p className="text-gray-400">
            Participa en las elecciones estudiantiles y consulta los resultados
          </p>
        </motion.div>


        {/* Elections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {elections.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              to={`/elections/${election.id}/vote`}
              className="col-span-full text-center py-8 sm:py-12"
            >
              <Vote className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-400 mb-2">
                No hay elecciones disponibles
              </h3>
              <p className="text-sm sm:text-base text-gray-500 px-4">
                No se encontraron elecciones que coincidan con el filtro seleccionado
              </p>
            </motion.div>
          ) : (
            elections.map((election, index) => (
              <motion.div
                key={election.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gray-800 rounded-2xl p-4 sm:p-6 border border-gray-700 hover:border-gray-600 transition-colors duration-200"
              >
                {/* Election Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                      {election.title}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm line-clamp-2">
                      {election.description}
                    </p>
                  </div>
                  <div className="ml-2 sm:ml-4 flex-shrink-0">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[election.status]}`}>
                      {getStatusIcon(election.status)}
                      <span className="ml-1">{getStatusLabel(election.status)}</span>
                    </span>
                  </div>
                </div>

                {/* Election Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-gray-700 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center mb-1">
                      <Calendar className="w-4 h-4 text-blue-400 mr-2" />
                      <span className="text-xs text-gray-400">Período</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white font-medium">
                      {format(new Date(election.startDate), 'dd MMM', { locale: es })} - {format(new Date(election.endDate), 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-2 sm:p-3">
                    <div className="flex items-center mb-1">
                      <Users className="w-4 h-4 text-green-400 mr-2" />
                      <span className="text-xs text-gray-400">Participación</span>
                    </div>
                    <p className="text-xs sm:text-sm text-white font-medium">
                      {election.totalVotes || 0} / {election.eligibleVoters || 0} votos
                    </p>
                  </div>
                </div>

                {/* Candidate Lists Preview */}
                <div className="mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-gray-400 mb-2">
                    {election.candidateLists.length} lista{election.candidateLists.length !== 1 ? 's' : ''} de candidatos
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {election.candidateLists.slice(0, 3).map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center bg-gray-700 rounded-lg px-2 sm:px-3 py-1"
                      >
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: list.color }}
                        />
                        <span className="text-xs sm:text-sm text-white">{list.name}</span>
                      </div>
                    ))}
                    {election.candidateLists.length > 3 && (
                      <div className="bg-gray-700 rounded-lg px-2 sm:px-3 py-1">
                        <span className="text-xs sm:text-sm text-gray-400">
                          +{election.candidateLists.length - 3} más
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex justify-end mt-4">
                  {getActionButton(election)}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}