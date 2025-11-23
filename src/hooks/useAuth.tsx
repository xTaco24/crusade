import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import { ALLOWED_DOMAINS } from '../utils/constants';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, fullName: string, studentId?: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para validar dominio UNAB
  const validateEmail = (email: string): boolean => {
    return ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
  };

  // Función para extraer roles del usuario
  const extractUserRoles = (supabaseUser: SupabaseUser): string[] => {
    const appRoles = supabaseUser.app_metadata?.roles || [];
    const userRoles = supabaseUser.user_metadata?.roles || [];
    const allRoles = [...appRoles, ...userRoles];
    
    // Si no tiene roles específicos, es estudiante por defecto
    if (allRoles.length === 0 || (!allRoles.includes('administrator') && !allRoles.includes('electoral_committee'))) {
      return ['student'];
    }
    
    return allRoles;
  };

  // Función para convertir usuario de Supabase a nuestro tipo
  const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
    const roles = extractUserRoles(supabaseUser);
    
    return {
      id: supabaseUser.id,
      email: supabaseUser.email!,
      fullName: supabaseUser.user_metadata?.full_name || supabaseUser.email!,
      studentId: supabaseUser.user_metadata?.student_id,
      roles: roles as any[],
      createdAt: new Date(supabaseUser.created_at),
    };
  };

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Validar dominio antes de intentar login
      if (!validateEmail(email)) {
        toast.error('Email debe ser de dominio @uandresbello.edu o @unab.cl');
        return false;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        const userData = mapSupabaseUser(data.user);
        toast.success(`Bienvenido, ${userData.fullName}!`);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error signing in:', error);
      toast.error('Error al iniciar sesión');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    studentId?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      // Validar dominio antes de registrar
      if (!validateEmail(email)) {
        toast.error('Email debe ser de dominio @uandresbello.edu o @unab.cl');
        return false;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            student_id: studentId,
            roles: [], // Estudiante por defecto (implícito)
          },
        },
      });

      if (error) {
        toast.error(error.message);
        return false;
      }

      if (data.user) {
        toast.success('Cuenta creada exitosamente!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error signing up:', error);
      toast.error('Error al crear cuenta');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast.error('Error al cerrar sesión');
      } else {
        toast.success('Sesión cerrada');
      }
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error al cerrar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}