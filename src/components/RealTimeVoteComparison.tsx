import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import { TrendingUp, RefreshCw, Wifi, WifiOff, AlertCircle, Activity } from 'lucide-react';
import { useElections } from '../hooks/useElections';
import { supabase } from '../lib/supabase';
import { Election } from '../types';
import { ELECTION_STATUSES } from '../utils/constants';
import { LoadingSpinner } from './UI/LoadingSpinner';

interface RealTimeVoteComparisonProps {
  electionId?: string;
  refreshInterval?: number;
  showTrend?: boolean;
}

interface VoteSnapshot {
  timestamp: string;
  time: string;
  [key: string]: string | number;
}

export function RealTimeVoteComparison({ 
  electionId, 
  refreshInterval = 30000,
  showTrend = true 
}: RealTimeVoteComparisonProps) {
  const { elections, getElectionById } = useElections();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [voteHistory, setVoteHistory] = useState<VoteSnapshot[]>([]);
  const [currentData, setCurrentData] = useState<any[]>([]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  const loadElectionData = useCallback(async () => {
    try {
      setError(null);
      setIsConnected(true);
      
      let targetElection: Election | null = null;
      
      if (electionId) {
        targetElection = await getElectionById(electionId);
      } else {
        // Find the most active election
        const activeElections = elections.filter(e => 
          e.status === ELECTION_STATUSES.VOTING_OPEN || 
          e.status === ELECTION_STATUSES.PAUSED ||
          e.status === ELECTION_STATUSES.RESULTS_PUBLISHED
        );
        
        if (activeElections.length > 0) {
          targetElection = activeElections.sort((a, b) => 
            (b.totalVotes || 0) - (a.totalVotes || 0)
          )[0];
        }
      }

      if (!targetElection) {
        setError('No hay elecciones disponibles para mostrar');
        return;
      }

      setElection(targetElection);

      // Prepare current vote data
      const voteData = targetElection.candidateLists.map((list, index) => ({
        name: list.name,
        votes: list.votes || 0,
        percentage: targetElection.totalVotes ? ((list.votes || 0) / targetElection.totalVotes) * 100 : 0,
        fill: COLORS[index % COLORS.length],
        color: list.color,
      }));

      setCurrentData(voteData);

      // Add to history for trend analysis
      // Get all unique candidate list names from current data and existing history
      const allCandidateNames = new Set<string>();
      voteData.forEach(item => allCandidateNames.add(item.name));
      voteHistory.forEach(snapshot => {
        Object.keys(snapshot).forEach(key => {
          if (key !== 'timestamp' && key !== 'time') {
            allCandidateNames.add(key);
          }
        });
      });

      // Ensure all snapshots have consistent keys
      const candidateNamesArray = Array.from(allCandidateNames);
      const now = new Date();
      const snapshot: VoteSnapshot = {
        timestamp: now.toISOString(),
        time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        ...voteData.reduce((acc, item) => ({ ...acc, [item.name]: item.votes }), {})
      };

      // Fill missing keys with 0 for the new snapshot
      candidateNamesArray.forEach(name => {
        if (!(name in snapshot)) {
          snapshot[name] = 0;
        }
      });

      setVoteHistory(prev => {
        // Ensure all previous snapshots have consistent keys
        const normalizedHistory = prev.map(prevSnapshot => {
          const normalized = { ...prevSnapshot };
          candidateNamesArray.forEach(name => {
            if (!(name in normalized)) {
              normalized[name] = 0;
            }
          });
          return normalized;
        });
        const newHistory = [...normalizedHistory, snapshot];
        return newHistory.slice(-20);
      });

      setLastUpdate(now);
    } catch (err) {
      setError('Error de conexión. Reintentando...');
      setIsConnected(false);
      console.error('Error loading real-time data:', err);
    } finally {
      setLoading(false);
    }
  }, [electionId, elections, getElectionById]);

  // Initial load
  useEffect(() => {
    loadElectionData();
  }, [loadElectionData]);

  // Auto-refresh interval
  useEffect(() => {
    if (!election) return;
    
    // No auto-refresh si los resultados ya están publicados
    if (election.status === ELECTION_STATUSES.RESULTS_PUBLISHED) return;
    
    const interval = setInterval(() => {
      loadElectionData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [loadElectionData, refreshInterval, election?.status]);

  // Realtime subscriptions
  useEffect(() => {
    if (!election) return;
    
    // No suscribirse si los resultados ya están publicados (datos finales)
    if (election.status === ELECTION_STATUSES.RESULTS_PUBLISHED) return;
    
    const channel = supabase
      .channel(`realtime-${election.id}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'candidate_lists',
          filter: `election_id=eq.${election.id}`
        },
        () => {
          loadElectionData();
        }
      )
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'votes',
          filter: `election_id=eq.${election.id}`
        },
        () => {
          loadElectionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [election?.id, election?.status, loadElectionData]);

  // Network connectivity handlers
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      loadElectionData();
    };
    
    const handleOffline = () => {
      setIsConnected(false);
      setError('Sin conexión a internet');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadElectionData]);

  if (loading && !election) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error && !election) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="text-center py-12">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error de Conexión</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadElectionData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center mx-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!election || currentData.length === 0) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-500">Esperando datos de votación en tiempo real...</p>
        </div>
      </div>
    );
  }

  const totalVotes = election.totalVotes || 0;
  const maxVotes = Math.max(...currentData.map(item => item.votes));

  return (
    <div className="space-y-6">
      {/* Header with connection status */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Activity className="w-6 h-6 mr-2 text-blue-400" />
              Comparación en Tiempo Real
            </h3>
            <p className="text-gray-400">{election.title}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className={`flex items-center ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? (
                <>
                  <Wifi className="w-4 h-4 mr-1" />
                  <span className="text-sm">Conectado</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 mr-1" />
                  <span className="text-sm">Desconectado</span>
                </>
              )}
            </div>
            
            {/* Live indicator */}
            <div className="flex items-center text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
              <span className="text-sm">EN VIVO</span>
            </div>
            
            {/* Manual refresh */}
            <button
              onClick={loadElectionData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50"
              title="Actualizar ahora"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-xl p-3">
            <div className="text-lg font-bold text-white">{totalVotes.toLocaleString()}</div>
            <div className="text-gray-400 text-xs">Total Votos</div>
          </div>
          <div className="bg-gray-700 rounded-xl p-3">
            <div className="text-lg font-bold text-blue-400">{currentData.length}</div>
            <div className="text-gray-400 text-xs">Listas Activas</div>
          </div>
          <div className="bg-gray-700 rounded-xl p-3">
            <div className="text-lg font-bold text-green-400">
              {maxVotes > 0 ? currentData.find(item => item.votes === maxVotes)?.name.slice(0, 8) + '...' : 'N/A'}
            </div>
            <div className="text-gray-400 text-xs">Líder Actual</div>
          </div>
          <div className="bg-gray-700 rounded-xl p-3">
            <div className="text-lg font-bold text-purple-400">{voteHistory.length}</div>
            <div className="text-gray-400 text-xs">Actualizaciones</div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 flex items-center justify-between">
          <span>Última actualización: {lastUpdate.toLocaleTimeString()}</span>
          <span>Próxima actualización en {Math.ceil(refreshInterval / 1000)}s</span>
        </div>
      </div>

      {/* Real-time Bar Chart */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">Comparación Actual</h4>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={currentData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis 
              dataKey="name" 
              stroke="#9CA3AF" 
              fontSize={12}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis stroke="#9CA3AF" fontSize={12} />
            <Tooltip 
              formatter={(value: any, name: string) => [
                `${value.toLocaleString()} votos`,
                'Votos'
              ]}
              labelFormatter={(label) => `Lista: ${label}`}
              contentStyle={{ 
                backgroundColor: '#374151', 
                border: 'none', 
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
              }}
            />
            <Bar 
              dataKey="votes" 
              radius={6}
              animationDuration={0}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trend Analysis */}
      {showTrend && voteHistory.length > 1 && (
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Tendencia de Votos
            </h4>
            <div className="text-sm text-gray-400">
              Últimas {voteHistory.length} actualizaciones
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={voteHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
              <XAxis 
                dataKey="time" 
                stroke="#9CA3AF" 
                fontSize={12}
              />
              <YAxis stroke="#9CA3AF" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#374151', 
                  border: 'none', 
                  borderRadius: '8px' 
                }}
              />
              {currentData.map((item, index) => (
                <Area
                  key={item.name}
                  type="monotone"
                  dataKey={item.name}
                  stackId="1"
                  stroke={item.fill}
                  fill={item.fill}
                  fillOpacity={0.6}
                  animationDuration={0}
                  isAnimationActive={false}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Live Comparison Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h4 className="text-lg font-semibold text-white">Ranking en Tiempo Real</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Posición</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Lista</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Votos</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">%</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Tendencia</th>
              </tr>
            </thead>
            <tbody>
              {currentData
                .sort((a, b) => b.votes - a.votes)
                .map((item, index) => {
                  const prevSnapshot = voteHistory[voteHistory.length - 2];
                  const prevVotes = prevSnapshot ? (prevSnapshot[item.name] as number) || 0 : 0;
                  const change = item.votes - prevVotes;
                  
                  return (
                    <tr
                      key={item.name}
                      className="border-t border-gray-700 hover:bg-gray-700/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-white">#{index + 1}</span>
                          {index === 0 && (
                            <div className="ml-2 w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div 
                            className="w-4 h-4 rounded mr-3"
                            style={{ backgroundColor: item.fill }}
                          />
                          <span className="text-white font-medium">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-bold text-lg">
                          {item.votes.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-white font-bold">
                          {item.percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          change > 0 ? 'text-green-400 bg-green-900/20' :
                          change < 0 ? 'text-red-400 bg-red-900/20' :
                          'text-gray-400 bg-gray-700'
                        }`}>
                          {change > 0 ? '+' : ''}{change}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}