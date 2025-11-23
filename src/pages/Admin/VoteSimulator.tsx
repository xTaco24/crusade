import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowLeft, 
  Users, 
  TrendingUp,
  Zap,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Election } from '../../types';
import { ELECTION_STATUSES } from '../../utils/constants';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface SimulationSettings {
  electionId: string;
  totalVotes: number;
  duration: number; // in seconds
  votingPattern: 'random' | 'realistic' | 'competitive';
}

export function VoteSimulator() {
  const navigate = useNavigate();
  const { elections, updateElection } = useElections();
  const [activeElections, setActiveElections] = useState<Election[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [settings, setSettings] = useState<SimulationSettings>({
    electionId: '',
    totalVotes: 100,
    duration: 30,
    votingPattern: 'realistic',
  });

  useEffect(() => {
    // Filter elections that can be simulated
    const simulatableElections = elections.filter(e => 
      e.status === ELECTION_STATUSES.VOTING_OPEN || 
      e.status === ELECTION_STATUSES.PAUSED ||
      e.status === ELECTION_STATUSES.DRAFT
    );
    setActiveElections(simulatableElections);
    
    if (simulatableElections.length > 0 && !settings.electionId) {
      setSettings(prev => ({ ...prev, electionId: simulatableElections[0].id }));
    }
  }, [elections, settings.electionId]);

  const generateVoteDistribution = (election: Election, totalVotes: number, pattern: string) => {
    const lists = election.candidateLists;
    const distribution: { [key: string]: number } = {};
    
    switch (pattern) {
      case 'random':
        // Completely random distribution
        lists.forEach(list => {
          distribution[list.id] = Math.floor(Math.random() * (totalVotes / lists.length * 2));
        });
        break;
        
      case 'realistic':
        // More realistic with some lists getting more votes
        const weights = lists.map(() => Math.random() * 0.8 + 0.2); // 0.2 to 1.0
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        
        lists.forEach((list, index) => {
          distribution[list.id] = Math.floor((weights[index] / totalWeight) * totalVotes);
        });
        break;
        
      case 'competitive':
        // Close competition between top 2, others get fewer votes
        const sortedLists = [...lists].sort(() => Math.random() - 0.5);
        const remainingVotes = totalVotes;
        
        // Top 2 get 70% of votes
        const topTwoVotes = Math.floor(remainingVotes * 0.7);
        distribution[sortedLists[0].id] = Math.floor(topTwoVotes * (0.45 + Math.random() * 0.1));
        distribution[sortedLists[1].id] = topTwoVotes - distribution[sortedLists[0].id];
        
        // Remaining lists split the rest
        const remainingListsVotes = remainingVotes - topTwoVotes;
        for (let i = 2; i < sortedLists.length; i++) {
          distribution[sortedLists[i].id] = Math.floor(remainingListsVotes / (sortedLists.length - 2));
        }
        break;
    }
    
    // Ensure we don't exceed total votes
    const actualTotal = Object.values(distribution).reduce((sum, votes) => sum + votes, 0);
    if (actualTotal !== totalVotes) {
      const diff = totalVotes - actualTotal;
      const firstListId = lists[0].id;
      distribution[firstListId] = Math.max(0, distribution[firstListId] + diff);
    }
    
    return distribution;
  };

  const startSimulation = async () => {
    const election = elections.find(e => e.id === settings.electionId);
    if (!election) {
      toast.error('Elección no encontrada');
      return;
    }

    setIsSimulating(true);
    setSimulationProgress(0);
    
    try {
      // Generate vote distribution
      const voteDistribution = generateVoteDistribution(
        election, 
        settings.totalVotes, 
        settings.votingPattern
      );
      
      // Simulate gradual progress animation
      const steps = 20;
      const stepDuration = (settings.duration * 1000) / steps;
      
      for (let step = 0; step <= steps; step++) {
        const progress = step / steps;
        setSimulationProgress(progress * 100);
        
        // Apply simulation at the end using RPC function
        if (step === steps) {
          const { error } = await supabase.rpc('admin_apply_simulation', {
            p_election_id: election.id,
            p_distribution: voteDistribution
          });
          
          if (error) {
            console.error('Error applying simulation:', error);
            throw error;
          }
        }
        
        if (step < steps) {
          await new Promise(resolve => setTimeout(resolve, stepDuration));
        }
      }
      
      toast.success(`Simulación completada: ${settings.totalVotes} votos agregados`);
      
      // Refresh elections data to show updated counts
      window.location.reload();
    } catch (error) {
      console.error('Error during simulation:', error);
      toast.error('Error durante la simulación: ' + (error as Error).message);
    } finally {
      setIsSimulating(false);
      setSimulationProgress(0);
    }
  };

  const resetElectionVotes = async () => {
    const election = elections.find(e => e.id === settings.electionId);
    if (!election) return;
    
    try {
      console.log('Resetting votes for election:', election.id);
      
      // Use RPC function to reset votes
      const { error } = await supabase.rpc('admin_reset_election_votes', {
        p_election_id: election.id
      });
        
      if (error) {
        console.error('Error resetting election votes:', error);
        throw error;
      }
      
      toast.success('Votos reiniciados correctamente');
      
      // Refresh elections data to show updated counts
      window.location.reload();
    } catch (error) {
      console.error('Error resetting votes:', error);
      toast.error('Error al reiniciar votos: ' + (error as Error).message);
    }
  };

  const selectedElection = elections.find(e => e.id === settings.electionId);

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
            onClick={() => navigate('/admin')}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al panel de administración
          </button>
          
          <div className="flex items-center">
            <Zap className="w-8 h-8 text-yellow-400 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">Simulador de Votos</h1>
              <p className="text-gray-400 mt-2">
                Genera votos de prueba para testing y demostración
              </p>
            </div>
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 bg-yellow-900/20 border border-yellow-700 rounded-2xl p-4"
        >
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-yellow-400 font-medium mb-1">Herramienta de Testing</h3>
              <p className="text-yellow-300 text-sm">
                Esta herramienta es solo para pruebas y demostración. Los votos generados son ficticios 
                y se suman a los votos reales existentes.
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center mb-6">
              <Settings className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Configuración</h2>
            </div>

            <div className="space-y-6">
              {/* Election Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Elección a Simular
                </label>
                <select
                  value={settings.electionId}
                  onChange={(e) => setSettings(prev => ({ ...prev, electionId: e.target.value }))}
                  disabled={isSimulating}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {activeElections.length === 0 ? (
                    <option value="">No hay elecciones disponibles</option>
                  ) : (
                    activeElections.map(election => (
                      <option key={election.id} value={election.id}>
                        {election.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Vote Count */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cantidad de Votos a Generar
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.totalVotes}
                  onChange={(e) => setSettings(prev => ({ ...prev, totalVotes: parseInt(e.target.value) || 0 }))}
                  disabled={isSimulating}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Duración de la Simulación (segundos)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={settings.duration}
                  onChange={(e) => setSettings(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                  disabled={isSimulating}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {/* Voting Pattern */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Patrón de Votación
                </label>
                <select
                  value={settings.votingPattern}
                  onChange={(e) => setSettings(prev => ({ ...prev, votingPattern: e.target.value as any }))}
                  disabled={isSimulating}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  <option value="random">Aleatorio</option>
                  <option value="realistic">Realista</option>
                  <option value="competitive">Competitivo</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {settings.votingPattern === 'random' && 'Distribución completamente aleatoria'}
                  {settings.votingPattern === 'realistic' && 'Distribución más natural con variaciones'}
                  {settings.votingPattern === 'competitive' && 'Competencia cerrada entre las primeras listas'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4 mt-8">
              <button
                onClick={startSimulation}
                disabled={isSimulating || !settings.electionId || activeElections.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center justify-center"
              >
                {isSimulating ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Simulando...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Iniciar Simulación
                  </>
                )}
              </button>
              
              <button
                onClick={resetElectionVotes}
                disabled={isSimulating || !settings.electionId}
                className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-3 rounded-xl font-medium transition-colors duration-200 flex items-center"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            {isSimulating && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Progreso</span>
                  <span className="text-sm text-gray-300">{Math.round(simulationProgress)}%</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${simulationProgress}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center mb-6">
              <TrendingUp className="w-6 h-6 text-green-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Vista Previa</h2>
            </div>

            {selectedElection ? (
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-2">{selectedElection.title}</h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {selectedElection.totalVotes || 0} votos actuales
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {selectedElection.candidateLists.length} listas
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-300">Listas de Candidatos:</h4>
                  {selectedElection.candidateLists.map((list, index) => (
                    <div key={list.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded mr-3"
                            style={{ backgroundColor: list.color }}
                          />
                          <span className="text-white font-medium">{list.name}</span>
                        </div>
                        <span className="text-gray-400 text-sm">
                          {list.votes || 0} votos
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${selectedElection.totalVotes ? ((list.votes || 0) / selectedElection.totalVotes) * 100 : 0}%`,
                            backgroundColor: list.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 mt-4">
                  <p className="text-blue-300 text-sm">
                    <strong>Simulación:</strong> Se agregarán {settings.totalVotes} votos 
                    distribuidos según el patrón "{settings.votingPattern}\" durante {settings.duration} segundos.
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">
                  No hay elecciones disponibles
                </h3>
                <p className="text-gray-500">
                  Crea una elección primero para poder simular votos
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}