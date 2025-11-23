import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  ArrowLeft, 
  Calendar,
  Award,
  Eye
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { useElections } from '../hooks/useElections';
import { DashboardLayout } from '../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';
import { Election, ElectionResult } from '../types';
import { ELECTION_STATUSES } from '../utils/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Results() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getElectionById, getElectionResults } = useElections();
  const navigate = useNavigate();

  const [election, setElection] = useState<Election | null>(null);
  const [results, setResults] = useState<ElectionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!id) {
      navigate('/elections');
      return;
    }

    const loadResults = async () => {
      try {
        const electionData = await getElectionById(id);
        if (!electionData) {
          navigate('/elections');
          return;
        }

        // Check if results are published
        if (electionData.status !== ELECTION_STATUSES.RESULTS_PUBLISHED) {
          navigate('/elections');
          return;
        }

        const resultsData = await getElectionResults(id);
        if (!resultsData) {
          navigate('/elections');
          return;
        }

        setElection(electionData);
        setResults(resultsData);
      } catch (error) {
        navigate('/elections');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [id, user, navigate, getElectionById, getElectionResults]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!election || !results) {
    return null;
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const chartData = results.candidateListResults.map((list, index) => ({
    name: list.listName,
    votes: list.votes,
    percentage: list.percentage,
    fill: COLORS[index % COLORS.length],
  }));

  const winner = results.candidateListResults.reduce((prev, current) => 
    prev.votes > current.votes ? prev : current
  );

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
            onClick={() => navigate('/elections')}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a elecciones
          </button>
          
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{election.title}</h1>
                <p className="text-gray-400 mb-4">{election.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {format(new Date(election.startDate), 'dd MMM', { locale: es })} - {format(new Date(election.endDate), 'dd MMM yyyy', { locale: es })}
                  </div>
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    Resultados publicados
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-900/20 border border-emerald-700 rounded-xl p-4 text-center">
                <Award className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm text-emerald-400 font-medium">Lista Ganadora</p>
                <p className="text-emerald-300 font-bold">{winner.listName}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-blue-900/20">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Total de Votos</p>
                <p className="text-2xl font-bold text-white">{results.totalVotes.toLocaleString()}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-green-900/20">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Participación</p>
                <p className="text-2xl font-bold text-white">{results.participationRate.toFixed(1)}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center">
              <div className="p-3 rounded-xl bg-purple-900/20">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-400">Listas Participantes</p>
                <p className="text-2xl font-bold text-white">{results.candidateListResults.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="mb-8">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700 max-w-3xl mx-auto"
          >
            <h3 className="text-xl font-semibold text-white mb-6 text-center">Distribución de Votos</h3>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={140}
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
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{ backgroundColor: '#374151', border: 'none', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Detailed Results Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">Resultados Detallados</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Posición</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Lista</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Votos</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-300">Porcentaje</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Candidatos</th>
                </tr>
              </thead>
              <tbody>
                {results.candidateListResults
                  .sort((a, b) => b.votes - a.votes)
                  .map((list, index) => (
                  <tr key={list.listId} className="border-t border-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {index === 0 && (
                          <Award className="w-5 h-5 text-yellow-400 mr-2" />
                        )}
                        <span className="text-white font-bold text-lg">
                          #{index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-3"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-white font-medium">{list.listName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-bold text-lg">
                        {list.votes.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-white font-bold text-lg">
                        {list.percentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {list.candidates.map((candidate) => (
                          <div key={candidate.candidateId} className="text-sm text-gray-400">
                            {candidate.name}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8 text-center"
        >
          <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
            <p className="text-gray-400 text-sm">
              Resultados oficiales publicados el {format(new Date(election.updatedAt), 'dd MMMM yyyy \'a las\' HH:mm', { locale: es })}
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Sistema de Votación Digital UNAB - Proceso Electoral Transparente y Seguro
            </p>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}