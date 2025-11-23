export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      candidates: {
        Row: {
          id: string
          list_id: string
          name: string
          email: string | null
          student_id: string | null
          position: string
          bio: string | null
          image_url: string | null
          proposals: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          name: string
          email?: string | null
          student_id?: string | null
          position: string
          bio?: string | null
          image_url?: string | null
          proposals?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          name?: string
          email?: string | null
          student_id?: string | null
          position?: string
          bio?: string | null
          image_url?: string | null
          proposals?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_list_id_fkey",
            columns: ["list_id"],
            referencedRelation: "candidate_lists",
            referencedColumns: ["id"]
          }
        ]
      }
      candidate_lists: {
        Row: {
          id: string
          election_id: string
          name: string
          color: string | null
          description: string | null
          votes_count: number
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          name: string
          color?: string | null
          description?: string | null
          votes_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          name?: string
          color?: string | null
          description?: string | null
          votes_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_lists_election_id_fkey"
            columns: ["election_id"]
            referencedRelation: "elections"
            referencedColumns: ["id"]
          }
        ]
      }
      elections: {
        Row: {
          id: string
          title: string
          description: string | null
          campus: string
          career: string | null
          status: 'draft' | 'scheduled' | 'campaign' | 'voting_open' | 'paused' | 'voting_closed' | 'results_published'
          start_date: string | null
          end_date: string | null
          total_votes: number
          eligible_voters: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          campus?: string
          career?: string | null
          status?: 'draft' | 'scheduled' | 'campaign' | 'voting_open' | 'paused' | 'voting_closed' | 'results_published'
          start_date?: string | null
          end_date?: string | null
          total_votes?: number
          eligible_voters?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          campus?: string
          career?: string | null
          status?: 'draft' | 'scheduled' | 'campaign' | 'voting_open' | 'paused' | 'voting_closed' | 'results_published'
          start_date?: string | null
          end_date?: string | null
          total_votes?: number
          eligible_voters?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "elections_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      votes: {
        Row: {
          id: string
          election_id: string
          candidate_list_id: string
          user_id: string
          receipt_hash: string
          confirmed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          election_id: string
          candidate_list_id: string
          user_id: string
          receipt_hash?: string
          confirmed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          election_id?: string
          candidate_list_id?: string
          user_id?: string
          receipt_hash?: string
          confirmed?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_candidate_list_id_fkey"
            columns: ["candidate_list_id"]
            referencedRelation: "candidate_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_election_id_fkey"
            columns: ["election_id"]
            referencedRelation: "elections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_apply_simulation: {
        Args: {
          p_election_id: string
          p_distribution: Json
        }
        Returns: void
      }
      admin_reset_election_votes: {
        Args: {
          p_election_id: string
        }
        Returns: void
      }
      cast_vote: {
        Args: {
          p_election: string
          p_list: string
        }
        Returns: Database['public']['Tables']['votes']['Row']
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_committee: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      jwt_roles: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      make_receipt: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      election_status: 'draft' | 'scheduled' | 'campaign' | 'voting_open' | 'paused' | 'voting_closed' | 'results_published'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}