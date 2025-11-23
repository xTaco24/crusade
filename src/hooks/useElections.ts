import { useState, useEffect } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Election, ElectionResult } from '../types';
import { Database } from '../types/database';
import { ELECTION_STATUSES, ElectionStatus } from '../utils/constants';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type ElectionRow = Database['public']['Tables']['elections']['Row'];
type CandidateListRow = Database['public']['Tables']['candidate_lists']['Row'];

export function useElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  // Función para convertir datos de BD a nuestro tipo Election
  const mapElectionFromDB = (
    electionRow: ElectionRow,
    candidateLists: CandidateListRow[] = []
  ): Election => {
    return {
      id: electionRow.id,
      title: electionRow.title,
      description: electionRow.description || '',
      career: electionRow.career || undefined,
      status: electionRow.status as ElectionStatus,
      startDate: new Date(electionRow.start_date || ''),
      endDate: new Date(electionRow.end_date || ''),
      totalVotes: electionRow.total_votes,
      eligibleVoters: electionRow.eligible_voters || 0,
      candidateLists: candidateLists.map(list => ({
        id: list.id,
        name: list.name,
        description: list.description || '',
        color: list.color || '#3B82F6',
        votes: list.votes_count,
        candidates: [], // Las listas solo tienen info general, no candidatos individuales
      })),
      createdAt: new Date(electionRow.created_at),
      updatedAt: new Date(electionRow.updated_at),
    };
  };

  // Cargar elecciones desde Supabase
  const fetchElections = async (): Promise<Election[]> => {
    try {
      // Obtener elecciones
      const { data: electionsData, error: electionsError } = await supabase
        .from('elections')
        .select('*')
        .order('created_at', { ascending: false });

      if (electionsError) {
        throw electionsError;
      }

      // Obtener listas de candidatos para todas las elecciones
      const { data: listsData, error: listsError } = await supabase
        .from('candidate_lists')
        .select('*')
        .order('created_at');

      if (listsError) {
        throw listsError;
      }

      // Mapear elecciones con sus listas
      const mappedElections = electionsData.map(election => {
        const electionLists = listsData.filter(list => list.election_id === election.id);
        return mapElectionFromDB(election, electionLists);
      });

      // Actualizar estado interno para que los consumidores vean los cambios
      setElections(mappedElections);
      return mappedElections;
    } catch (error) {
      console.error('Error fetching elections:', error);
      toast.error('Error al cargar elecciones');
      return [];
    }
  };

  // Configurar Realtime subscriptions
  useEffect(() => {
    // Crear el canal y registrar listeners
    const channel = supabase
      .channel('elections-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'elections' },
        () => {
          // Recargar elecciones cuando hay cambios
          fetchElections();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidate_lists' },
        () => {
          // Recargar elecciones cuando hay cambios en listas
          fetchElections();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => {
          // Recargar elecciones cuando hay nuevos votos
          fetchElections();
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    // Limpiar usando la referencia local para evitar cierres obsoletos
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cargar elecciones inicialmente
  useEffect(() => {
    const loadElections = async () => {
      setLoading(true);
      await fetchElections();
      setLoading(false);
    };

    loadElections();
  }, []);

  const getElectionById = async (id: string): Promise<Election | null> => {
    try {
      const { data: electionData, error: electionError } = await supabase
        .from('elections')
        .select('*')
        .eq('id', id)
        .single();

      if (electionError || !electionData) {
        console.error('Error getting election:', electionError);
        return null;
      }

      const { data: listsData, error: listsError } = await supabase
        .from('candidate_lists')
        .select('*')
        .eq('election_id', id)
        .order('created_at');

      if (listsError) {
        console.error('Error getting candidate lists:', listsError);
        throw listsError;
      }

      // Map base election with empty candidates first
      const election = mapElectionFromDB(electionData, listsData || []);

      // Cargar candidatos para las listas
      if (listsData && listsData.length > 0) {
        const listIds = listsData.map(l => l.id);
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .in('list_id', listIds);

        if (candidatesError) {
          console.error('Error getting candidates:', candidatesError);
          throw candidatesError;
        }

        const candidatesByList: Record<string, Array<{
          id: string;
          name: string;
          email: string | null;
          student_id: string | null;
          position: string;
          bio: string | null;
          image_url: string | null;
          proposals: string | null;
        }>> = {};

        for (const c of candidatesData || []) {
          if (!candidatesByList[c.list_id]) candidatesByList[c.list_id] = [];
          candidatesByList[c.list_id].push(c as any);
        }

        election.candidateLists = election.candidateLists.map(list => ({
          ...list,
          candidates: (candidatesByList[list.id] || []).map(c => ({
            id: c.id,
            name: c.name,
            email: c.email || '',
            studentId: c.student_id || '',
            position: c.position,
            bio: c.bio || undefined,
            imageUrl: c.image_url || undefined,
            proposals: c.proposals || undefined,
          })),
        }));
      }

      return election;
    } catch (error) {
      console.error('Error getting election by ID:', error);
      return null;
    }
  };

  const getElectionResults = async (electionId: string): Promise<ElectionResult | null> => {
    try {
      const election = await getElectionById(electionId);
      if (!election) {
        return null;
      }

      const totalVotes = election.totalVotes || 0;
      const candidateListResults = election.candidateLists.map(list => ({
        listId: list.id,
        listName: list.name,
        votes: list.votes || 0,
        percentage: totalVotes > 0 ? ((list.votes || 0) / totalVotes) * 100 : 0,
        candidates: list.candidates.map(candidate => ({
          candidateId: candidate.id,
          name: candidate.name,
          votes: Math.floor((list.votes || 0) / list.candidates.length), // Distribución equitativa
        })),
      }));

      return {
        electionId,
        candidateListResults,
        totalVotes,
        participationRate: election.eligibleVoters ? (totalVotes / election.eligibleVoters) * 100 : 0,
      };
    } catch (error) {
      console.error('Error getting election results:', error);
      return null;
    }
  };

  const createElection = async (electionData: Omit<Election, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Debes estar autenticado para crear elecciones');
        return false;
      }

      // Crear elección
      const { data: electionResult, error: electionError } = await supabase
        .from('elections')
        .insert({
          title: electionData.title,
          description: electionData.description,
          career: electionData.career,
          status: electionData.status,
          start_date: electionData.startDate.toISOString(),
          end_date: electionData.endDate.toISOString(),
          eligible_voters: electionData.eligibleVoters,
          created_by: user.id,
        })
        .select()
        .single();

      if (electionError || !electionResult) {
        console.error('Error creating election:', electionError);
        throw electionError;
      }

      // Crear listas de candidatos
      if (electionData.candidateLists.length > 0) {
        const listsToInsert = electionData.candidateLists.map(list => ({
          election_id: electionResult.id,
          name: list.name,
          description: list.description,
          color: list.color,
        }));

        const { error: listsError } = await supabase
          .from('candidate_lists')
          .insert(listsToInsert);

        if (listsError) {
          console.error('Error creating candidate lists:', listsError);
          throw listsError;
        }

        // Obtener listas insertadas para mapear candidatos -> list_id
        const { data: insertedLists, error: fetchListsError } = await supabase
          .from('candidate_lists')
          .select('*')
          .eq('election_id', electionResult.id)
          .order('created_at');

        if (fetchListsError) {
          console.error('Error fetching inserted lists:', fetchListsError);
          throw fetchListsError;
        }

        // Crear un mapa para emparejar por combinación de nombre+color+description
        const available = [...(insertedLists || [])];
        const takeMatchingListId = (name: string, color?: string | null, description?: string | null) => {
          const idx = available.findIndex(l => l.name === name && (l.color || null) === (color || null) && (l.description || null) === (description || null));
          if (idx >= 0) {
            const [l] = available.splice(idx, 1);
            return l.id;
          }
          // Fallback al primero disponible
          return available.shift()?.id;
        };

        const candidatesToInsert: Array<Database['public']['Tables']['candidates']['Insert']> = [];
        for (const list of electionData.candidateLists) {
          const listId = takeMatchingListId(list.name, list.color, list.description);
          if (!listId) continue;
          for (const c of list.candidates) {
            candidatesToInsert.push({
              list_id: listId,
              name: c.name,
              email: c.email,
              student_id: c.studentId,
              position: c.position,
              bio: c.bio,
              image_url: c.imageUrl,
              proposals: c.proposals,
            });
          }
        }

        if (candidatesToInsert.length > 0) {
          const { error: candidatesInsertError } = await supabase
            .from('candidates')
            .insert(candidatesToInsert);
          if (candidatesInsertError) {
            console.error('Error inserting candidates:', candidatesInsertError);
            throw candidatesInsertError;
          }
        }
      }

      toast.success('Elección creada exitosamente');
      
      // Recargar elecciones
      await fetchElections();
      
      return true;
    } catch (error) {
      console.error('Error creating election:', error);
      toast.error('Error al crear la elección');
      return false;
    }
  };

  const updateElection = async (id: string, updates: Partial<Election>): Promise<boolean> => {
    try {
      const updateData: any = {};
      
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.career) updateData.career = updates.career;
      if (updates.status) updateData.status = updates.status;
      if (updates.startDate) updateData.start_date = updates.startDate.toISOString();
      if (updates.endDate) updateData.end_date = updates.endDate.toISOString();
      if (updates.eligibleVoters) updateData.eligible_voters = updates.eligibleVoters;
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('elections')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating election:', error);
        throw error;
      }

      // Actualizar listas si se proporcionan
      if (updates.candidateLists) {
        // Eliminar listas existentes
        const { error: deleteError } = await supabase
          .from('candidate_lists')
          .delete()
          .eq('election_id', id);

        if (deleteError) {
          console.error('Error deleting existing lists:', deleteError);
        }
        // Insertar nuevas listas
        const listsToInsert = updates.candidateLists.map(list => ({
          election_id: id,
          name: list.name,
          description: list.description,
          color: list.color,
          votes_count: list.votes || 0,
        }));

        const { error: listsError } = await supabase
          .from('candidate_lists')
          .insert(listsToInsert);

        if (listsError) {
          console.error('Error inserting new lists:', listsError);
          throw listsError;
        }

        // Obtener listas insertadas y reinsertar candidatos
        const { data: insertedLists, error: fetchListsError } = await supabase
          .from('candidate_lists')
          .select('*')
          .eq('election_id', id)
          .order('created_at');
        if (fetchListsError) {
          console.error('Error fetching re-inserted lists:', fetchListsError);
          throw fetchListsError;
        }

        const available = [...(insertedLists || [])];
        const takeMatchingListId = (name: string, color?: string | null, description?: string | null) => {
          const idx = available.findIndex(l => l.name === name && (l.color || null) === (color || null) && (l.description || null) === (description || null));
          if (idx >= 0) {
            const [l] = available.splice(idx, 1);
            return l.id;
          }
          return available.shift()?.id;
        };

        const candidatesToInsert: Array<Database['public']['Tables']['candidates']['Insert']> = [];
        for (const list of updates.candidateLists) {
          const listId = takeMatchingListId(list.name, list.color, list.description);
          if (!listId) continue;
          for (const c of list.candidates) {
            candidatesToInsert.push({
              list_id: listId,
              name: c.name,
              email: c.email,
              student_id: c.studentId,
              position: c.position,
              bio: c.bio,
              image_url: c.imageUrl,
              proposals: c.proposals,
            });
          }
        }

        if (candidatesToInsert.length > 0) {
          const { error: candidatesInsertError } = await supabase
            .from('candidates')
            .insert(candidatesToInsert);
          if (candidatesInsertError) {
            console.error('Error inserting candidates:', candidatesInsertError);
            throw candidatesInsertError;
          }
        }
      }

      // Solo mostrar mensaje si no es una actualización masiva (como simulación)
      if (!updates.candidateLists || Object.keys(updates).length > 2) {
        toast.success('Elección actualizada exitosamente');
      }

      // Recargar elecciones
      await fetchElections();

      return true;
    } catch (error) {
      console.error('Error updating election:', error);
      if (!updates.candidateLists || Object.keys(updates).length > 2) {
        toast.error('Error al actualizar la elección');
      }
      return false;
    }
  };

  const changeElectionStatus = async (id: string, newStatus: ElectionStatus): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('elections')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error changing election status:', error);
        throw error;
      }

      const statusMessages: Record<ElectionStatus, string> = {
        draft: 'Elección movida a borrador',
        scheduled: 'Elección programada',
        campaign: 'Período de campaña iniciado',
        voting_open: 'Votación abierta',
        paused: 'Votación pausada',
        voting_closed: 'Votación cerrada',
        results_published: 'Resultados publicados',
      };

      toast.success(statusMessages[newStatus]);

      // Recargar elecciones
      await fetchElections();

      return true;
    } catch (error) {
      console.error('Error changing election status:', error);
      toast.error('Error al cambiar el estado de la elección');
      return false;
    }
  };

  const deleteElection = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('elections')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting election:', error);
        throw error;
      }

      toast.success('Elección eliminada exitosamente');

      // Recargar elecciones
      await fetchElections();

      return true;
    } catch (error) {
      console.error('Error deleting election:', error);
      toast.error('Error al eliminar la elección');
      return false;
    }
  };

  return {
    elections,
    loading,
    fetchElections,
    getElectionById,
    getElectionResults,
    createElection,
    updateElection,
    changeElectionStatus,
    deleteElection,
  };
}