import { useState } from 'react';
import { useCallback, useMemo } from 'react';
import { Vote, VoteReceipt } from '../types';
import { Database } from '../types/database';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type VoteRow = Database['public']['Tables']['votes']['Row'];

export function useVoting() {
  const [loading, setLoading] = useState(false);
  const [voteCheckCache, setVoteCheckCache] = useState<Map<string, boolean>>(new Map());

  const checkEligibility = async (electionId: string, userId: string): Promise<boolean> => {
    try {
      // Verificar que la elección existe y está abierta
      const { data: election, error } = await supabase
        .from('elections')
        .select('status')
        .eq('id', electionId)
        .single();

      if (error || !election) {
        console.error('Error checking election eligibility:', error);
        return false;
      }

      return election.status === 'voting_open';
    } catch (error) {
      console.error('Error checking eligibility:', error);
      return false;
    }
  };

  const hasAlreadyVoted = useCallback(async (electionId: string, userId: string): Promise<boolean> => {
    const cacheKey = `${electionId}-${userId}`;
    
    // Check cache first to avoid unnecessary requests
    if (voteCheckCache.has(cacheKey)) {
      console.log('Using cached vote status for:', cacheKey, voteCheckCache.get(cacheKey));
      return voteCheckCache.get(cacheKey)!;
    }

    try {
      console.log('Checking if user has voted:', { electionId, userId });
      const { data: existingVote, error } = await supabase
        .from('votes')
        .select('id')
        .eq('election_id', electionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking if user has voted:', error);
        // Don't cache errors
        return false;
      }

      const hasVoted = !!existingVote;
      console.log('User has voted result:', hasVoted);
      
      // Cache the result
      setVoteCheckCache(prev => new Map(prev).set(cacheKey, hasVoted));
      
      return hasVoted;
    } catch (error) {
      console.error('Error checking if user has voted:', error);
      return false;
    }
  }, [voteCheckCache]);

  // Clear cache when a vote is cast
  const clearVoteCache = useCallback((electionId: string, userId: string) => {
    const cacheKey = `${electionId}-${userId}`;
    setVoteCheckCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
  }, []);

  const castVote = async (
    electionId: string,
    candidateListId: string,
    userId: string
  ): Promise<string | null> => {
    try {
      setLoading(true);

      // Verificar elegibilidad
      const isEligible = await checkEligibility(electionId, userId);
      if (!isEligible) {
        toast.error('Esta elección no está disponible para votación');
        return null;
      }

      // Verificar si ya votó
      const alreadyVoted = await hasAlreadyVoted(electionId, userId);
      if (alreadyVoted) {
        toast.error('Ya has votado en esta elección');
        return null;
      }

      // Usar RPC para votación atómica
      const { data: vote, error } = await supabase.rpc('cast_vote', {
        p_election: electionId,
        p_list: candidateListId
      });

      if (error) {
        console.error('Error casting vote:', error);
        if (error.code === '23505') {
          toast.error('Ya has votado en esta elección');
        } else {
          toast.error('Error al emitir el voto');
        }
        return null;
      }

      if (vote) {
        toast.success('¡Voto registrado exitosamente!');
        // Clear cache after successful vote
        clearVoteCache(electionId, userId);
        return vote.id;
      }

      return null;
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Error al emitir el voto');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const confirmVote = async (voteId: string, electionTitle: string): Promise<VoteReceipt | null> => {
    try {
      // Obtener el voto para generar el comprobante
      const { data: vote, error } = await supabase
        .from('votes')
        .select('*')
        .eq('id', voteId)
        .single();

      if (error || !vote) {
        console.error('Error getting vote for receipt:', error);
        return null;
      }

      const receipt: VoteReceipt = {
        id: vote.id,
        voteId: vote.id,
        hash: vote.receipt_hash,
        timestamp: new Date(vote.created_at),
        electionTitle,
      };

      return receipt;
    } catch (error) {
      console.error('Error confirming vote:', error);
      return null;
    }
  };

  const getUserReceipts = async (userId: string): Promise<VoteReceipt[]> => {
    try {
      const { data: votes, error } = await supabase
        .from('votes')
        .select(`
          *,
          elections!inner(title)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting user receipts:', error);
        return [];
      }

      return votes.map(vote => ({
        id: vote.id,
        voteId: vote.id,
        hash: vote.receipt_hash,
        timestamp: new Date(vote.created_at),
        electionTitle: (vote.elections as any).title,
      }));
    } catch (error) {
      console.error('Error getting user receipts:', error);
      return [];
    }
  };

  return {
    loading,
    checkEligibility,
    hasAlreadyVoted,
    clearVoteCache,
    castVote,
    confirmVote,
    getUserReceipts,
  };
}