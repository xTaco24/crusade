import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Users, BarChart3, RefreshCw } from 'lucide-react';
import { useElections } from '../hooks/useElections';
import { supabase } from '../lib/supabase';
import { Election, ElectionResult } from '../types';
import { ELECTION_STATUSES } from '../utils/constants';
import { LoadingSpinner } from './UI/LoadingSpinner';

interface VoteDistributionProps {
  electionId?: string;
  showRealTime?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function VoteDistribution({ 
  electionId, 
  showRealTime = true, 
  autoRefresh = true,
  refreshInterval = 30000 
}: VoteDistributionProps) {
  const { elections, getElectionResults, getElectionById } = useElections();
  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

  const loadElectionData = async () => {
    try {
      setError(null);
      
      if (electionId) {
        // Load specific election
        const electionData = await getElectionById(electionId);
        if (!electionData) {
          setError('Elección no encontrada');
          return;
        }
        setElection(electionData);

        // Load results if available
        if (electionData.status === ELECTION_STATUSES.RESULTS_PUBLISHED || 
            electionData.status === ELECTION_STATUSES.VOTING_OPEN ||
            electionData.status === ELECTION_STATUSES.PAUSED) {
          const resultsData = await getElectionResults(electionData.id);
          setResults(resultsData);
        }
      } else {
        // Load all elections for overview
        const activeElections = elections.filter(e => 
          e.status === ELECTION_STATUSES.VOTING_OPEN || 
          e.status === ELECTION_STATUSES.PAUSED ||
          e.status === ELECTION_STATUSES.RESULTS_PUBLISHED
        );
        
        if (activeElections.length > 0) {
          // Use the most recent election
          const mostRecent = activeElections.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )[0];
          
          setElection(mostRecent);
          
          if (mostRecent.status === ELECTION_STATUSES.RESULTS_PUBLISHED ||
              mostRecent.status === ELECTION_STATUSES.VOTING_OPEN ||
              mostRecent.status === ELECTION_STATUSES.PAUSED) {
            const resultsData = await getElectionResults(mostRecent.id);
            setResults(resultsData);
          }
        }
      }
      
      setLastUpdate(new Date());
    } catch (err) {
      setError('Error al cargar los datos');
      console.error('Error loading election data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadElectionData();
  }, [electionId, elections]);

  useEffect(() => {
    if (!election || !showRealTime) return;
    
    // No suscribirse si los resultados ya están publicados (datos finales)
    if (election.status === ELECTION_STATUSES.RESULTS_PUBLISHED) return;
    
    const channel = supabase
      .channel(`election-${election.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
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
          event: 'UPDATE', 
          schema: 'public', 
          table: 'elections',
          filter: `id=eq.${election.id}`
        },
        () => {
          loadElectionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [election?.id, election?.status, showRealTime]);

  // Auto-refresh interval como fallback
  useEffect(() => {
    if (!autoRefresh || !showRealTime || !election) return;
    
    // No auto-refresh si los resultados ya están publicados
    if (election.status === ELECTION_STATUSES.RESULTS_PUBLISHED) return;

    const interval = setInterval(() => {
      loadElectionData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, showRealTime, refreshInterval, electionId, election?.status]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-400 mb-2">Error al cargar datos</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={loadElectionData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!election) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No hay datos disponibles</h3>
          <p className="text-gray-500">No se encontraron elecciones para mostrar</p>
        </div>
      </div>
    );
  }

  // Prepare chart data - memoized to prevent unnecessary re-renders
  const chartData = useMemo(() => {
    if (!election) return [];
    return election.candidateLists.map((list, index) => ({
      name: list.name,
      votes: list.votes || 0,
      percentage: election.totalVotes ? ((list.votes || 0) / election.totalVotes) * 100 : 0,
      fill: COLORS[index % COLORS.length],
      color: list.color,
    }));
  }, [election?.candidateLists, election?.totalVotes]);

  // Historical data simulation for real-time updates
  const historicalData = [
    { time: '10:00', ...chartData.reduce((acc, item) => ({ ...acc, [item.name]: Math.max(0, item.votes - Math.floor(Math.random() * 50)) }), {}) },
    { time: '11:00', ...chartData.reduce((acc, item) => ({ ...acc, [item.name]: Math.max(0, item.votes - Math.floor(Math.random() * 30)) }), {}) },
    { time: '12:00', ...chartData.reduce((acc, item) => ({ ...acc, [item.name]: Math.max(0, item.votes - Math.floor(Math.random() * 20)) }), {}) },
    { time: '13:00', ...chartData.reduce((acc, item) => ({ ...acc, [item.name]: Math.max(0, item.votes - Math.floor(Math.random() * 10)) }), {}) },
    { time: 'Ahora', ...chartData.reduce((acc, item) => ({ ...acc, [item.name]: item.votes }), {}) },
  ];

  const totalVotes = election.totalVotes || 0;
  const participationRate = election.eligibleVoters ? (totalVotes / election.eligibleVoters) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header with real-time indicator */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white">Distribución de Votos</h3>
            <p className="text-gray-400">{election.title}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {showRealTime && (
              <div className="flex items-center text-green-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
                <span className="text-sm">En vivo</span>
              </div>
            )}
            
            <button
              onClick={loadElectionData}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors duration-200"
              title="Actualizar datos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-xl p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">{totalVotes.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">Total Votos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-xl p-4">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">{participationRate.toFixed(1)}%</p>
                <p className="text-gray-400 text-sm">Participación</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-700 rounded-xl p-4">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-purple-400 mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">{election.candidateLists.length}</p>
                <p className="text-gray-400 text-sm">Listas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Última actualización: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Distribución por Porcentaje</h4>
          {totalVotes > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="votes"
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  labelLine={false}
                  animationDuration={0}
                  isAnimationActive={false}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value.toLocaleString(), 'Votos']}
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay votos registrados</p>
              </div>
            </div>
          )}
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Comparación de Votos</h4>
          {totalVotes > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis 
                  dataKey="name" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  interval="preserveStartEnd"
                  tick={{ fontSize: 12 }}
                  height={60}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  formatter={(value: any) => [value.toLocaleString(), 'Votos']}
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                />
                <Bar 
                  dataKey="votes" 
                  radius={4}
                  animationDuration={0}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay votos registrados</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Trend Chart */}
      {showRealTime && totalVotes > 0 && (
        <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">Tendencia en Tiempo Real</h4>
          {historicalData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                <XAxis 
                  dataKey="time" 
                  stroke="#9CA3AF" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                />
                {chartData.map((item, index) => (
                  <Line
                    key={`line-${item.name}-${index}`}
                    type="monotone"
                    dataKey={item.name}
                    stroke={item.fill}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    animationDuration={0}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Recopilando datos históricos...</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Results Table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h4 className="text-lg font-semibold text-white">Resultados Detallados</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Lista</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Votos</th>
                <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Porcentaje</th>
                <th className="px-6 py-4 text-center text-sm font-medium text-gray-300">Progreso</th>
              </tr>
            </thead>
            <tbody>
              {chartData
                .sort((a, b) => b.votes - a.votes)
                .map((item, index) => (
                <tr key={item.name} className="border-t border-gray-700">
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
                    <span className="text-white font-bold text-lg">
                      {item.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        key={`progress-${item.name}`}
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: item.fill
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}