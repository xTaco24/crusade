import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Trash2, 
  Save, 
  ArrowLeft, 
  Calendar,
  Users,
  FileText,
  Palette,
  AlertTriangle
} from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { electionSchema } from '../../utils/validation';
import { ELECTION_STATUSES } from '../../utils/constants';
import { Election } from '../../types';
import toast from 'react-hot-toast';

interface CandidateFormData {
  id?: string;
  name: string;
  email: string;
  studentId: string;
  position: string;
  bio: string;
  proposals: string;
}

interface CandidateListFormData {
  id?: string;
  name: string;
  description: string;
  color: string;
  votes?: number;
  candidates: CandidateFormData[];
}

interface ElectionFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  eligibleVoters: number;
  candidateLists: CandidateListFormData[];
}

const PRESET_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
];

export function EditElection() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getElectionById, updateElection } = useElections();
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ElectionFormData>({
    resolver: yupResolver(electionSchema),
  });

  const { fields: listFields, append: appendList, remove: removeList } = useFieldArray({
    control,
    name: 'candidateLists',
  });

  useEffect(() => {
    const loadElection = async () => {
      if (!id) {
        toast.error('ID de elección no válido');
        navigate('/admin/elections');
        return;
      }

      try {
        setLoading(true);
        console.log('Loading election for edit with ID:', id);
        const electionData = await getElectionById(id);
        if (!electionData) {
          console.error('Election not found for edit:', id);
          toast.error('Elección no encontrada');
          navigate('/admin/elections');
          return;
        }

        console.log('Election data loaded for edit:', electionData);
        setElection(electionData);
        
        // Format data for form
        const formData: ElectionFormData = {
          title: electionData.title,
          description: electionData.description,
          startDate: new Date(electionData.startDate).toISOString().slice(0, 16),
          endDate: new Date(electionData.endDate).toISOString().slice(0, 16),
          eligibleVoters: electionData.eligibleVoters || 1000,
          candidateLists: electionData.candidateLists.map(list => ({
            id: list.id,
            name: list.name,
            description: list.description,
            color: list.color,
            votes: list.votes,
            candidates: list.candidates.map(candidate => ({
              id: candidate.id,
              name: candidate.name,
              email: candidate.email,
              studentId: candidate.studentId,
              position: candidate.position,
              bio: candidate.bio || '',
              proposals: candidate.proposals || '',
            })),
          })),
        };

        reset(formData);
      } catch (error) {
        console.error('Error loading election:', error);
        toast.error('Error al cargar la elección');
        navigate('/admin/elections');
      } finally {
        setLoading(false);
      }
    };

    loadElection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: ElectionFormData) => {
    if (!election) return;
    
    setIsSubmitting(true);
    
    try {
      console.log('Submitting election update:', data);
      // Transform form data to match Election interface
      const updatedElectionData = {
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        eligibleVoters: data.eligibleVoters,
        candidateLists: data.candidateLists.map((list, index) => ({
          id: list.id || `list-${Date.now()}-${index}`,
          name: list.name,
          description: list.description,
          color: list.color,
          votes: list.votes || 0,
          candidates: list.candidates.map((candidate, candidateIndex) => ({
            id: candidate.id || `candidate-${Date.now()}-${index}-${candidateIndex}`,
            name: candidate.name,
            email: candidate.email,
            studentId: candidate.studentId,
            position: candidate.position,
            bio: candidate.bio,
            proposals: candidate.proposals,
          })),
        })),
      };

      const success = await updateElection(election.id, updatedElectionData);
      
      if (success) {
        toast.success('Elección actualizada exitosamente');
        navigate('/admin/elections');
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      toast.error('Error al actualizar la elección');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addCandidateList = () => {
    const colorIndex = listFields.length % PRESET_COLORS.length;
    appendList({
      name: '',
      description: '',
      color: PRESET_COLORS[colorIndex],
      votes: 0,
      candidates: [
        {
          name: '',
          email: '',
          studentId: '',
          position: 'Presidente',
          bio: '',
          proposals: '',
        },
      ],
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  if (!election) {
    return null;
  }

  const canEdit = election.status === ELECTION_STATUSES.DRAFT || 
                  election.status === ELECTION_STATUSES.SCHEDULED ||
                  election.status === ELECTION_STATUSES.CAMPAIGN ||
                  election.status === ELECTION_STATUSES.PAUSED;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/admin/elections')}
            className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a gestión de elecciones
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Editar Elección</h1>
              <p className="text-gray-400 mt-2">
                Modifica los detalles de la elección
              </p>
            </div>
            
            {!canEdit && (
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4">
                <div className="flex items-center text-yellow-400">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">
                    Edición limitada - La elección está en progreso
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center mb-6">
              <FileText className="w-6 h-6 text-blue-400 mr-3" />
              <h2 className="text-xl font-semibold text-white">Información Básica</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Título de la Elección *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Ej: Elección Centro de Estudiantes 2024"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-400">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Votantes Elegibles
                </label>
                <input
                  {...register('eligibleVoters', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000"
                />
                {errors.eligibleVoters && (
                  <p className="mt-1 text-sm text-red-400">{errors.eligibleVoters.message}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Descripción *
              </label>
              <textarea
                {...register('description')}
                rows={4}
                disabled={!canEdit}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Describe el propósito y alcance de esta elección..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  {...register('startDate')}
                  type="datetime-local"
                  disabled={!canEdit}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {errors.startDate && (
                  <p className="mt-1 text-sm text-red-400">{errors.startDate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Fecha y Hora de Fin *
                </label>
                <input
                  {...register('endDate')}
                  type="datetime-local"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.endDate && (
                  <p className="mt-1 text-sm text-red-400">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Candidate Lists */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-2xl p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <Users className="w-6 h-6 text-green-400 mr-3" />
                <h2 className="text-xl font-semibold text-white">Listas de Candidatos</h2>
              </div>
              
              {canEdit && (
                <button
                  type="button"
                  onClick={addCandidateList}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Lista
                </button>
              )}
            </div>

            <div className="space-y-8">
              {listFields.map((listField, listIndex) => (
                <CandidateListForm
                  key={listField.id}
                  listIndex={listIndex}
                  register={register}
                  control={control}
                  errors={errors}
                  onRemove={() => removeList(listIndex)}
                  canRemove={listFields.length > 1 && canEdit}
                  canEdit={canEdit}
                  votes={(listField as any).votes || 0}
                />
              ))}
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex justify-end space-x-4"
          >
            <button
              type="button"
              onClick={() => navigate('/admin/elections')}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-3 rounded-2xl font-medium transition-colors duration-200 flex items-center"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </motion.div>
        </form>
      </div>
    </DashboardLayout>
  );
}

// Candidate List Form Component
interface CandidateListFormProps {
  listIndex: number;
  register: any;
  control: any;
  errors: any;
  onRemove: () => void;
  canRemove: boolean;
  canEdit: boolean;
  votes: number;
}

function CandidateListForm({ 
  listIndex, 
  register, 
  control, 
  errors, 
  onRemove, 
  canRemove,
  canEdit,
  votes
}: CandidateListFormProps) {
  const { fields: candidateFields, append: appendCandidate, remove: removeCandidate } = useFieldArray({
    control,
    name: `candidateLists.${listIndex}.candidates`,
  });

  const addCandidate = () => {
    appendCandidate({
      name: '',
      email: '',
      studentId: '',
      position: 'Vicepresidente',
      bio: '',
      proposals: '',
    });
  };

  return (
    <div className="bg-gray-700 rounded-xl p-6 border border-gray-600">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Palette className="w-5 h-5 text-purple-400 mr-2" />
          <h3 className="text-lg font-semibold text-white">Lista #{listIndex + 1}</h3>
          {votes > 0 && (
            <span className="ml-3 bg-blue-600 text-white px-2 py-1 rounded-lg text-sm font-medium">
              {votes} votos
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              type="button"
              onClick={addCandidate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Candidato
            </button>
          )}
          
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Eliminar Lista
            </button>
          )}
        </div>
      </div>

      {/* List Basic Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Nombre de la Lista *
          </label>
          <input
            {...register(`candidateLists.${listIndex}.name`)}
            type="text"
            disabled={!canEdit}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ej: Lista Azul"
          />
          {errors.candidateLists?.[listIndex]?.name && (
            <p className="mt-1 text-sm text-red-400">
              {errors.candidateLists[listIndex].name.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              {...register(`candidateLists.${listIndex}.color`)}
              type="color"
              disabled={!canEdit}
              className="w-12 h-10 bg-gray-600 border border-gray-500 rounded-lg cursor-pointer disabled:cursor-not-allowed"
            />
            <select
              {...register(`candidateLists.${listIndex}.color`)}
              disabled={!canEdit}
              className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {PRESET_COLORS.map((color, index) => (
                <option key={color} value={color}>
                  Color {index + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Descripción *
          </label>
          <input
            {...register(`candidateLists.${listIndex}.description`)}
            type="text"
            disabled={!canEdit}
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Ej: Por una universidad inclusiva"
          />
          {errors.candidateLists?.[listIndex]?.description && (
            <p className="mt-1 text-sm text-red-400">
              {errors.candidateLists[listIndex].description.message}
            </p>
          )}
        </div>
      </div>

      {/* Candidates */}
      <div className="space-y-4">
        <h4 className="text-md font-medium text-gray-300">Candidatos</h4>
        
        {candidateFields.map((candidateField, candidateIndex) => (
          <div key={candidateField.id} className="bg-gray-600 rounded-lg p-4 border border-gray-500">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-sm font-medium text-white">
                Candidato #{candidateIndex + 1}
              </h5>
              
              {candidateFields.length > 1 && canEdit && (
                <button
                  type="button"
                  onClick={() => removeCandidate(candidateIndex)}
                  className="text-red-400 hover:text-red-300 p-1 rounded transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Nombre Completo *
                </label>
                <input
                  {...register(`candidateLists.${listIndex}.candidates.${candidateIndex}.name`)}
                  type="text"
                  disabled={!canEdit}
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Nombre del candidato"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Email *
                </label>
                <input
                  {...register(`candidateLists.${listIndex}.candidates.${candidateIndex}.email`)}
                  type="email"
                  disabled={!canEdit}
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="email@uandresbello.edu"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  RUT *
                </label>
                <input
                  {...register(`candidateLists.${listIndex}.candidates.${candidateIndex}.studentId`)}
                  type="text"
                  disabled={!canEdit}
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="12345678-9"
                />
                <p className="mt-1 text-xs text-gray-400">Formato: sin puntos y con guion</p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Cargo
                </label>
                <select
                  {...register(`candidateLists.${listIndex}.candidates.${candidateIndex}.position`)}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="Presidente">Presidente</option>
                  <option value="Vicepresidente">Vicepresidente</option>
                  <option value="Secretario">Secretario</option>
                  <option value="Tesorero">Tesorero</option>
                  <option value="Vocal">Vocal</option>
                  <option value="Representante">Representante</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Biografía
              </label>
              <textarea
                {...register(`candidateLists.${listIndex}.candidates.${candidateIndex}.bio`)}
                rows={2}
                disabled={!canEdit}
                className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Breve descripción del candidato..."
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-400 mb-1">
                Propuestas
              </label>
              <textarea
                {...register(`candidateLists.${listIndex}.candidates.${candidateIndex}.proposals`)}
                rows={3}
                className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Principales propuestas del candidato..."
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}