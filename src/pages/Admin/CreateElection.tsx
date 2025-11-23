import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Palette
} from 'lucide-react';
import { useElections } from '../../hooks/useElections';
import { DashboardLayout } from '../../components/Layout/DashboardLayout';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { electionSchema } from '../../utils/validation';
import { ELECTION_STATUSES } from '../../utils/constants';
import toast from 'react-hot-toast';

interface CandidateFormData {
  name: string;
  email: string;
  studentId: string;
  position: string;
  bio: string;
  proposals: string;
}

interface CandidateListFormData {
  name: string;
  description: string;
  color: string;
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

export function CreateElection() {
  const navigate = useNavigate();
  const { createElection } = useElections();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ElectionFormData>({
    resolver: yupResolver(electionSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      eligibleVoters: 1000,
      candidateLists: [
        {
          name: '',
          description: '',
          color: PRESET_COLORS[0],
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
        },
      ],
    },
  });

  const { fields: listFields, append: appendList, remove: removeList } = useFieldArray({
    control,
    name: 'candidateLists',
  });

  const onSubmit = async (data: ElectionFormData) => {
    setIsSubmitting(true);
    
    try {
      // Transform form data to match Election interface
      const electionData = {
        title: data.title,
        description: data.description,
        status: ELECTION_STATUSES.SCHEDULED,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        eligibleVoters: data.eligibleVoters,
        candidateLists: data.candidateLists.map((list, index) => ({
          id: `list-${Date.now()}-${index}`,
          name: list.name,
          description: list.description,
          color: list.color,
          votes: 0,
          candidates: list.candidates.map((candidate, candidateIndex) => ({
            id: `candidate-${Date.now()}-${index}-${candidateIndex}`,
            name: candidate.name,
            email: candidate.email,
            studentId: candidate.studentId,
            position: candidate.position,
            bio: candidate.bio,
            proposals: candidate.proposals,
          })),
        })),
        totalVotes: 0,
      };

      const success = await createElection(electionData);
      
      if (success) {
        toast.success('Elección creada exitosamente');
        navigate('/admin/elections');
      }
    } catch (error) {
      toast.error('Error al crear la elección');
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
          
          <h1 className="text-3xl font-bold text-white">Crear Nueva Elección</h1>
          <p className="text-gray-400 mt-2">
            Configura todos los detalles de la nueva elección
          </p>
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
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              
              <button
                type="button"
                onClick={addCandidateList}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-medium transition-colors duration-200 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar Lista
              </button>
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
                  canRemove={listFields.length > 1}
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
              {isSubmitting ? 'Creando...' : 'Crear Elección'}
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
}

function CandidateListForm({ 
  listIndex, 
  register, 
  control, 
  errors, 
  onRemove, 
  canRemove 
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
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={addCandidate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center"
          >
            <Plus className="w-3 h-3 mr-1" />
            Candidato
          </button>
          
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
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-12 h-10 bg-gray-600 border border-gray-500 rounded-lg cursor-pointer"
            />
            <select
              {...register(`candidateLists.${listIndex}.color`)}
              className="flex-1 px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              
              {candidateFields.length > 1 && (
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
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-3 py-2 bg-gray-500 border border-gray-400 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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