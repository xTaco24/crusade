import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Vote, User, Mail, Car as IdCard, CheckCircle, ArrowLeft, Clock, AlertTriangle, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useElections } from '../hooks/useElections';
import { useVoting } from '../hooks/useVoting';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Election, CandidateList } from '../types';
import { ELECTION_STATUSES } from '../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import toast from 'react-hot-toast';

type VotingStep = 'selection' | 'confirmation' | 'casting' | 'success';

export function ElectionVote() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getElectionById } = useElections();
  const { castVote, confirmVote, hasAlreadyVoted, clearVoteCache } = useVoting();
  const navigate = useNavigate();

  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [voteCheckLoading, setVoteCheckLoading] = useState(false);
  const [step, setStep] = useState<VotingStep>('selection');
  const [selectedList, setSelectedList] = useState<CandidateList | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [electionLoaded, setElectionLoaded] = useState(false);

  useEffect(() => {
    // Only run once when component mounts and we have user + id
    if (electionLoaded || !user || !id) return;
    
    const loadElection = async () => {
      try {
        setLoading(true);
        setElectionLoaded(true); // Set immediately to prevent multiple calls
        console.log('Loading election with ID:', id);
        const foundElection = await getElectionById(id);
        
        if (!foundElection) {
          console.error('Election not found for ID:', id);
          toast.error('Elección no encontrada');
          navigate('/elections');
          return;
        }

        console.log('Found election:', foundElection);
        // Check if election is available for voting
        if (foundElection.status !== ELECTION_STATUSES.VOTING_OPEN) {
          console.log('Election not open for voting. Status:', foundElection.status);
          toast.error('Esta elección no está disponible para votación');
          navigate('/elections');
          return;
        }

        setElection(foundElection);
        
        // Check if user already voted
        setVoteCheckLoading(true);
        const hasVoted = await hasAlreadyVoted(id, user.id);
        setVoteCheckLoading(false);
        
        if (hasVoted) {
          setAlreadyVoted(true);
          toast('Ya has votado en esta elección');
          navigate('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error loading election:', error);
        toast.error('Error al cargar la elección');
        navigate('/elections');
      } finally {
        setLoading(false);
      }
    };

    loadElection();
  }, [id, user?.id]); // Only depend on id and user.id to prevent re-runs

  // Separate effect for navigation checks
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      navigate('/elections');
      return;
    }
  }, [user, id, navigate]);

  const handleListSelection = (list: CandidateList) => {
    setSelectedList(list);
  };

  const handleConfirm = () => {
    if (!selectedList) return;
    setStep('confirmation');
  };

  const handleCastVote = async () => {
    if (!selectedList || !user || !election) return;

    setVotingLoading(true);
    setStep('casting');

    try {
      // Emitir voto usando Supabase
      const voteId = await castVote(election.id, selectedList.id, user.id);
      
      if (!voteId) {
        setStep('selection');
        return;
      }

      // Clear the vote cache for this user and election
      clearVoteCache(election.id, user.id);
      
      toast.success('¡Voto registrado exitosamente!');
      setStep('success');
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Error al procesar el voto');
      setStep('selection');
    } finally {
      setVotingLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setSelectedList(null);
    setStep('selection');
  };

  const handleFinish = () => {
    navigate('/dashboard');
  };

  if (!user) {
    return null;
  }

  if (loading || voteCheckLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
          <div className="ml-4">
            <p className="text-white">
              {loading ? 'Cargando elección...' : 'Verificando estado de votación...'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!election || alreadyVoted) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/elections')}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a elecciones
          </button>
          
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">{election.title}</h1>
            <p className="text-sm sm:text-base text-gray-400 mb-4">{election.description}</p>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-2 sm:space-y-0 text-xs sm:text-sm text-gray-400">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                Cierra: {format(new Date(election.endDate), 'dd MMM yyyy HH:mm', { locale: es })}
              </div>
              <div className="flex items-center">
                <Vote className="w-4 h-4 mr-1" />
                {election.totalVotes || 0} votos emitidos
              </div>
            </div>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4 sm:mb-8"
        >
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4 sm:mb-6 px-4 overflow-x-auto min-w-0">
            {[
              { step: 'selection', label: 'Selección', icon: Vote },
              { step: 'confirmation', label: 'Confirmación', icon: CheckCircle },
              { step: 'success', label: 'Completado', icon: Shield },
            ].map((stepInfo, index) => {
              const isCurrent = step === stepInfo.step;
              const isCompleted = 
                (step === 'confirmation' && stepInfo.step === 'selection') ||
                (step === 'casting' && (stepInfo.step === 'selection' || stepInfo.step === 'confirmation')) ||
                (step === 'success' && stepInfo.step !== 'success');
              
              return (
                <div key={stepInfo.step} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 flex-shrink-0 ${
                    isCurrent 
                      ? 'border-blue-500 bg-blue-500 text-white' 
                      : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-600 text-gray-400'
                  }`}>
                    <stepInfo.icon className="w-3 h-3 sm:w-5 sm:h-5" />
                  </div>
                  <div className={`ml-2 sm:ml-3 flex flex-col sm:flex-row sm:items-center ${
                    isCurrent ? 'text-blue-400' : isCompleted ? 'text-green-400' : 'text-gray-400'
                  }`}>
                    <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                      {stepInfo.label}
                    </span>
                    {isCurrent && (
                      <div className="w-2 h-2 bg-current rounded-full mt-1 sm:mt-0 sm:ml-2 animate-pulse" />
                    )}
                  </div>
                  {index < 2 && (
                    <div className={`w-4 sm:w-8 h-0.5 mx-2 sm:mx-4 flex-shrink-0 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Current Step Indicator for Mobile */}
          <div className="block sm:hidden text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-gray-700 border border-gray-600">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                step === 'selection' ? 'bg-blue-400' :
                step === 'confirmation' || step === 'casting' ? 'bg-yellow-400' :
                'bg-green-400'
              }`} />
              <span className="text-xs text-white font-medium">
                {step === 'selection' && 'Paso 1: Selecciona tu lista'}
                {step === 'confirmation' && 'Paso 2: Confirma tu voto'}
                {step === 'casting' && 'Procesando tu voto...'}
                {step === 'success' && 'Voto registrado exitosamente'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Step Content */}
        <div className="min-h-[300px] sm:min-h-[400px]">
          {step === 'selection' && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-6 sm:mb-8 px-4">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  Selecciona una lista de candidatos
                </h2>
                <p className="text-sm sm:text-base text-gray-400">
                  Elige cuidadosamente. Tu voto es secreto y no podrá ser modificado.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                {election.candidateLists.map((list) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`bg-gray-800 rounded-2xl p-4 sm:p-6 border-2 cursor-pointer transition-all duration-200 ${
                      selectedList?.id === list.id
                        ? 'border-blue-500 bg-blue-900/20'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                    onClick={() => handleListSelection(list)}
                  >
                    <div className="flex items-start space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedList?.id === list.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-400'
                          }`}
                        >
                          {selectedList?.id === list.id && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div
                            className="w-4 h-4 rounded mr-3"
                            style={{ backgroundColor: list.color }}
                          />
                          <h3 className="text-base sm:text-lg font-semibold text-white">{list.name}</h3>
                        </div>
                        
                        <p className="text-sm sm:text-base text-gray-400 mb-4">{list.description}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {list.candidates.map((candidate) => (
                            <div key={candidate.id} className="bg-gray-700 rounded-lg p-3 sm:p-4">
                              <div className="flex items-center mb-2">
                                <User className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="font-medium text-white text-sm sm:text-base">{candidate.name}</span>
                              </div>
                              <div className="flex items-center mb-2">
                                <IdCard className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-sm text-gray-400">{candidate.position}</span>
                              </div>
                              <div className="flex items-center mb-2">
                                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                                <span className="text-xs sm:text-sm text-gray-400 break-all">{candidate.email}</span>
                              </div>
                              {candidate.bio && (
                                <p className="text-sm text-gray-400 mt-2">{candidate.bio}</p>
                              )}
                              {candidate.proposals && (
                                <div className="mt-2">
                                  <p className="text-xs font-semibold text-blue-300">Propuestas</p>
                                  <p className="text-sm text-gray-300 whitespace-pre-line">{candidate.proposals}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="flex justify-end mt-6 sm:mt-8 px-4">
                <button
                  onClick={handleConfirm}
                  disabled={!selectedList}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 sm:px-8 py-3 rounded-2xl font-medium transition-colors duration-200 text-sm sm:text-base"
                >
                  Continuar
                </button>
              </div>
            </motion.div>
          )}

          {step === 'confirmation' && selectedList && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="max-w-2xl mx-auto px-4"
            >
              <div className="bg-gray-800 rounded-2xl p-4 sm:p-8 border border-gray-700">
                <div className="text-center mb-6 sm:mb-8">
                  <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
                    Confirma tu voto
                  </h2>
                  <p className="text-sm sm:text-base text-gray-400">
                    Una vez confirmado, tu voto no podrá ser modificado
                  </p>
                </div>

                <div className="bg-gray-700 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8">
                  <h3 className="font-semibold text-white mb-4 text-sm sm:text-base">Has seleccionado:</h3>
                  
                  <div className="flex items-center mb-4">
                    <div
                      className="w-6 h-6 rounded mr-3"
                      style={{ backgroundColor: selectedList.color }}
                    />
                    <span className="text-base sm:text-lg font-semibold text-white">{selectedList.name}</span>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-400 mb-4">{selectedList.description}</p>
                  
                  <div className="space-y-3">
                    {selectedList.candidates.map((candidate) => (
                      <div key={candidate.id} className="flex items-center justify-between">
                        <div>
                          <span className="text-white font-medium text-sm sm:text-base">{candidate.name}</span>
                          <span className="text-gray-400 ml-2 text-xs sm:text-sm">({candidate.position})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleBackToSelection}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-2xl font-medium transition-colors duration-200 text-sm sm:text-base"
                  >
                    Volver
                  </button>
                  <button
                    onClick={handleCastVote}
                    disabled={votingLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-2xl font-medium transition-colors duration-200 flex items-center justify-center text-sm sm:text-base"
                  >
                    {votingLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      'Confirmar Voto'
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'casting' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-12 sm:py-16 px-4"
            >
              <LoadingSpinner size="lg" className="mb-6" />
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-2 text-center">
                Procesando tu voto...
              </h2>
              <p className="text-sm sm:text-base text-gray-400 text-center">
                Por favor, espera mientras registramos tu voto de forma segura
              </p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl mx-auto px-4"
            >
              <div className="text-center mb-6 sm:mb-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  ¡Voto registrado exitosamente!
                </h2>
                <p className="text-sm sm:text-base text-gray-400">
                  Tu participación en el proceso democrático ha sido registrada
                </p>
              </div>

              <div className="bg-gray-800 rounded-2xl p-4 sm:p-8 border border-gray-700 mb-6 sm:mb-8">
                <h3 className="font-semibold text-white mb-4 sm:mb-6 text-center text-sm sm:text-base">
                  Comprobante de Votación
                </h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Elección:</span>
                    <span className="text-white text-right">{election.title}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Lista Seleccionada:</span>
                    <span className="text-white text-right">{selectedList?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-700">
                    <span className="text-gray-400">Fecha y Hora:</span>
                    <span className="text-white text-right">
                      {format(new Date(), 'dd MMM yyyy HH:mm:ss', { locale: es })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-400">Votante:</span>
                    <span className="text-white text-right">{user.fullName}</span>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-900/20 rounded-lg border border-blue-700">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-blue-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-medium mb-1 text-sm sm:text-base">Voto Verificado</p>
                      <p className="text-blue-300 text-sm">
                        Tu voto ha sido registrado de forma segura. 
                        Este comprobante confirma tu participación sin revelar tu elección.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={handleFinish}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-3 rounded-2xl font-medium transition-colors duration-200 text-sm sm:text-base"
                >
                  Volver al Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}